<script lang="ts">
import {mapActions, mapState} from 'pinia';
import {useFriendStore} from '../../../store/module/friend';
import {useAuthStore} from '../../../store/module/auth';
import MessageItem from './MessageItem.vue';
import {FriendInfoType, FriendMessageType, GroupMemberType} from '../../../global/GlobalType';
import {getHistoryMessages, recallMessage} from '../../../request/websocket';
import {API} from '../../../request/api';
import FriendChatInput from './FriendChatInput.vue';
import {EventBus, EventName} from '../../../global/GlobalValue';
import {OnClickOutside} from '@vueuse/components';
import {useGlobalStore} from '../../../store/module/global';
import UserInfoItem from './UserInfoItem.vue';
import toast from '../../common/toast';

type DomRectType = {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
};

type PositionType = {x: number; y: number};

type TouchType = {
    isTouching: boolean;
    startPosition: PositionType;
}

type dataType = {
    oldChooseItemId: string;
    chooseItem: boolean;
    curChooseFriendInfo: undefined | FriendInfoType;
    messageRecords: undefined | FriendMessageType[];
    imageSrc: string;
    isLoading: boolean;
    currentScrollHeight: number;
    groupMembersData: GroupMemberType[];
    showContextMenu: boolean;
    showRecall: boolean;
    contextMenuX: number;
    contextMenuY: number;
    clickMessageInfo: undefined | FriendMessageType;
    isDragging: boolean;
    dragMessageInfo: undefined | FriendMessageType;
    offsetPosition: PositionType;
    currentPosition: PositionType;
    dragDomRect: null | DomRectType;
    chatDomRect: null | DomRectType;
    isBottom: boolean;
    touch: TouchType;
};

const pageSize = 20;

const outsideContextmenuFunction = [
    {text: '引用', command: 'quote'},
    {text: '撤回', command: 'recall'}
];

export default {
    props: {
        chooseItemId: String
    },
    components: {MessageItem, FriendChatInput, OnClickOutside, UserInfoItem},
    computed: {
        ...mapState(useFriendStore, ['friendList']),
        ...mapState(useAuthStore, ['selfData']),
        ...mapState(useGlobalStore, ['isMobile']),
        contextmenuFunction(): {text: string; command: string}[] {
            return this.showRecall ? outsideContextmenuFunction : outsideContextmenuFunction.filter(item => item.command !== 'recall');
        },
        draggingElement(): HTMLDivElement {
            return this.$refs.chat as HTMLDivElement;
        }
    },
    data(): dataType {
        return {
            oldChooseItemId: '',
            chooseItem: this.chooseItemId !== '',
            curChooseFriendInfo: undefined,
            messageRecords: undefined,
            imageSrc: '',
            isLoading: false,
            currentScrollHeight: 0,
            groupMembersData: [],
            showContextMenu: false,
            showRecall: false,
            contextMenuX: 0,
            contextMenuY: 0,
            clickMessageInfo: undefined,
            isDragging: false,
            dragMessageInfo: undefined,
            offsetPosition: {x: 0, y: 0},
            currentPosition: {x: 0, y: 0},
            dragDomRect: null,
            chatDomRect: null,
            isBottom: true,
            touch: {isTouching: false, startPosition: {x: 0, y: 0}}
        };
    },
    watch: {
        chooseItemId: async function (chooseItemId: string, oldVal: string) {
            this.chooseItem = chooseItemId !== '';
            if (this.chooseItem) {
                this.curChooseFriendInfo = this.friendList.find((friendInfo: FriendInfoType) => friendInfo.userId === chooseItemId);
                if (!this.curChooseFriendInfo?.messageHistory && chooseItemId !== this.oldChooseItemId) {
                    await this.getHistoryMessages(true);
                } else {
                    this.messageRecords = this.getFriendMessageHistory(this.chooseItemId as string);
                }
                this.imageSrc = await API.getPictureUrl((this.curChooseFriendInfo as FriendInfoType).avatarUrl);
                if (this.curChooseFriendInfo?.isGroup === '1') {
                    const membersResponse = await API.getGroupMembers(this.chooseItemId as string);
                    this.groupMembersData = membersResponse?.data ?? [];
                    this.groupMembersData.unshift({username: '所有人', avatarUrl: this.curChooseFriendInfo.avatarUrl, userId: this.curChooseFriendInfo.userId});
                }
            }
            this.oldChooseItemId = chooseItemId;
            this.scrollToBottom(200);
            EventBus().dispatchEvent(EventName.QuoteMessage);
        }
    },
    created() {
        EventBus().addEventListener(EventName.UpdateMessageHistory, this.updateMessageHistory);
        EventBus().addEventListener(EventName.UpdateOneMessage, this.updateMessageHistory);
    },
    unmounted() {
        EventBus().removeEventListener(EventName.UpdateMessageHistory, this.updateMessageHistory);
        EventBus().removeEventListener(EventName.UpdateOneMessage, this.updateMessageHistory);
    },
    methods: {
        ...mapActions(useAuthStore, ['isSelf']),
        ...mapActions(useFriendStore, ['getFriendMessageHistory', 'getFriendMessagePage']),
        scrollToBottom(delayTime = 0) {
            this.$nextTick(() => {
                setTimeout(() => {
                    let msg = document.getElementById('chat');
                    msg && (msg.scrollTop = (msg.scrollHeight || 0) + 99999);
                    // 滚动完后自动聚焦到输入框上
                    (this.$refs.friendChatInput as typeof FriendChatInput)?.$refs?.messageInput?.focus();
                    this.isBottom = true;
                }, delayTime);
            });
        },
        updateScrollPosition() {
            this.isBottom && this.scrollToBottom();
        },
        updateMessageHistory() {
            this.messageRecords = this.getFriendMessageHistory(this.chooseItemId as string);
            const chat = this.$refs.chat as HTMLDivElement;
            // 请求数据后滚动到原来的位置而不是最上方
            if (chat && this.isLoading) {
                setTimeout(() => {
                    this.$nextTick(() => {
                        chat.scrollTo(0, chat.scrollHeight - this.currentScrollHeight);
                    });
                }, 0);
            }
            this.updateScrollPosition();
            this.isLoading = false;
        },
        scrollChat(event: any) {
            let el = event.target;
            if (el.scrollTop <= 0) {
                // 请求上一页聊天消息的数据
                this.getHistoryMessages();
                const chat = this.$refs.chat as HTMLDivElement;
                this.currentScrollHeight = chat.scrollHeight;
            }
            const {scrollTop, scrollHeight, clientHeight} = el;
            const cache = 10;
            this.isBottom = scrollHeight - scrollTop - cache <= clientHeight;
        },
        getHistoryMessages(isFirst = false) {
            this.isLoading = true;
            const curChooseFriendInfo = this.curChooseFriendInfo as FriendInfoType;
            const page = isFirst ? 1 : this.getFriendMessagePage(this.chooseItemId as string) + 1;
            getHistoryMessages(curChooseFriendInfo.userId, page, pageSize);
        },
        showSelfContextMenu(event: MouseEvent | TouchEvent, messageInfo: FriendMessageType, fromContextmenuEvent = false) {
            event.preventDefault();
            this.showContextMenu = messageInfo.messageStatus !== -1;
            this.showRecall = this.isSelf(messageInfo.messageSenderId);
            const chat = this.$refs.chat as HTMLDivElement;
            // 320 为左侧列表的宽度, 60 为头部的高度
            const target = fromContextmenuEvent ? (event as MouseEvent) : (event as TouchEvent).touches[0];
            this.contextMenuX = target.clientX - (this.isMobile ? 0 : 320);
            this.contextMenuY = target.clientY + chat.scrollTop - 60;
            this.clickMessageInfo = messageInfo;
            this.isDragging = false;
        },
        async commandFor(command: string) {
            this.showContextMenu = false;
            if (command === 'quote') EventBus().dispatchEvent(EventName.QuoteMessage, this.clickMessageInfo);
            if (command === 'recall') recallMessage(this.clickMessageInfo);
        },
        mouseDown(event: MouseEvent, dragMessageInfo: FriendMessageType, index: number) {
            event.preventDefault();
            // 点击右键或者 contextmenu 展示时直接返回
            if (event.button === 2 || this.showContextMenu) return;
            const messageEl = document.getElementById(`message${index}`);
            const chatEl = document.getElementById('chat');
            if (!messageEl || !chatEl) return console.warn('can not find messafe item', index, ' or chat element');
            this.dragDomRect = messageEl.getBoundingClientRect();
            this.chatDomRect = chatEl.getBoundingClientRect();

            const offsetX = event.clientX - this.dragDomRect.x;
            const offsetY = event.clientY - this.dragDomRect.y;

            this.dragMessageInfo = dragMessageInfo;
            this.offsetPosition = {x: offsetX, y: offsetY};
            this.currentPosition = {x: event.clientX, y: event.clientY};
        },
        mouseMoveDragMessage(event: MouseEvent) {
            if (!this.chatDomRect) return;
            const {clientX, clientY} = event;

            if (!this.isDragging) {
                const initX = this.currentPosition.x + this.offsetPosition.x;
                const initY = this.currentPosition.y + this.offsetPosition.y;
                const minimumDistance = 20;
                if (Math.max(Math.abs(clientX - initX), Math.abs(clientY - initY)) < minimumDistance) return;
                this.isDragging = true;
            }
            const {x, y, width, height} = this.chatDomRect;
            if (clientX < x || clientX > x + width || clientY < y || clientY > y + height) {
                this.resetDragAbout();
                return toast('拖拽范围仅限于消息列表范围内');
            }
            this.currentPosition = {x: event.clientX - this.offsetPosition.x, y: event.clientY - this.offsetPosition.y};
        },
        mouseUpDragMessage(event: MouseEvent) {
            if (!this.dragDomRect || !this.chatDomRect || !this.dragMessageInfo) return;
            const {clientX, clientY} = event;
            if (clientX < this.chatDomRect.x || clientX > this.chatDomRect.x + this.chatDomRect.width || clientY < this.chatDomRect.y || clientY > this.chatDomRect.y + this.chatDomRect.height) return this.resetDragAbout();
            if (clientY < this.dragDomRect.y + this.dragDomRect.height && clientY > this.dragDomRect.y) return this.resetDragAbout();
            this.repeatMessage(this.dragMessageInfo);
            this.resetDragAbout();
        },
        repeatMessage(messafeInfo: FriendMessageType) {
            (this.$refs.friendChatInput as typeof FriendChatInput).sendMessage(messafeInfo?.messageContent, messafeInfo?.type);
        },
        resetDragAbout() {
            this.isDragging = false;
            this.dragMessageInfo = undefined;
            this.dragDomRect = null;
            this.chatDomRect = null;
            this.dragMessageInfo = undefined;
            this.offsetPosition = {x: 0, y: 0};
            this.currentPosition = {x: 0, y: 0};
        },
        touchStart(event: TouchEvent, messageInfo: FriendMessageType) {
            if (!this.isMobile || this.showContextMenu) return;
            this.touch.isTouching = true;
            this.touch.startPosition = {x: event.touches[0].clientX, y: event.touches[0].clientY};
            setTimeout(() => {
                if (!this.touch.isTouching) return;
                this.showSelfContextMenu(event, messageInfo);
                this.touch.isTouching = false;
            }, 500);
        },
        touchMove(event: TouchEvent) {
            if (!this.touch.isTouching) return;
            const curPosition = event.touches[0];
            const cache = 10;
            const {x, y} = this.touch.startPosition;
            if (Math.abs(curPosition.clientX - x) > cache || Math.abs(curPosition.clientY - y) > cache) {
                this.touch.isTouching = false;
            }
        },
    }
};
</script>

<template>
    <div class="w-full overflow-hidden">
        <div v-if="chooseItem" class="w-full h-self-screen overflow-hidden flex flex-col">
            <UserInfoItem :isLoading="isLoading" :showLoading="true" :userInfo="curChooseFriendInfo" class="justify-center border-b border-gray-400 py-2" />
            <div v-if="!!messageRecords" id="chat" ref="chat" class="w-full h-self-screen overflow-y-auto py-2 px-4 relative" @scroll="scrollChat">
                <ul>
                    <MessageItem v-for="(message, index) in messageRecords" :id="`message${index}`" :key="message.uuid" :isSelf="isSelf(message.messageSenderId)" :message="message" :hideIcon="index > 0 && messageRecords[index - 1].messageSenderId === message.messageSenderId" :isMobile="isMobile" @contextmenu="event => showSelfContextMenu(event, message, true)" @mousedown="event => mouseDown(event, message, index)" @touchstart="event => touchStart(event, message)" @touchend="() => (touch.isTouching = false)" @touchmove="touchMove" @repeatMessage="repeatMessage"/>
                </ul>
                <OnClickOutside @trigger="showContextMenu = false">
                    <div v-if="showContextMenu" class="absolute z-10 w-20 max-h-40 border-2 dark:border-gray-300 rounded-lg p-2 border-solid shadow bg-white/[0.8] dark:bg-gray-800/[0.8] overflow-y-auto" :style="`top: ${contextMenuY}px; left: ${contextMenuX}px;`">
                        <div v-for="func in contextmenuFunction" :key="func.command" class="block ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer py-[2px]" @click="commandFor(func.command)">{{ func.text }}</div>
                    </div>
                </OnClickOutside>
            </div>
            <div v-else class="h-self-screen m-auto text-center text-gray-600 dark:text-gray-400">暂无数据</div>

            <div class="absolute z-20" :style="{top: `${currentPosition.y}px`, left: `${currentPosition.x}px`, width: `${dragDomRect?.width ?? 10}px`, height: `${dragDomRect?.height ?? 10}px`}" @mouseup="mouseUpDragMessage" @mousemove="mouseMoveDragMessage">
                <MessageItem v-if="dragMessageInfo && isDragging" class="cursor-move" :isSelf="isSelf(dragMessageInfo.messageSenderId)" :message="dragMessageInfo" />
            </div>

            <div class="sticky bottom-0">
                <FriendChatInput ref="friendChatInput" :chooseFriendInfo="curChooseFriendInfo" :groupMembersData="groupMembersData" :chooseItemId="chooseItemId" @showEmoji="updateScrollPosition" />
            </div>
        </div>
    </div>
</template>
