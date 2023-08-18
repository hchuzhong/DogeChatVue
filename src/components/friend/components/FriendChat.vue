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
    clickMessageElement: null | EventTarget;
    isDragging: boolean;
    dragMessageInfo: undefined | FriendMessageType;
    offsetPosition: PositionType;
    currentPosition: PositionType;
    dragDomRect: null | DomRectType;
    chatDomRect: null | DomRectType;
};

const pageSize = 10;

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
            clickMessageElement: null,
            isDragging: false,
            dragMessageInfo: undefined,
            offsetPosition: {x: 0, y: 0},
            currentPosition: {x: 0, y: 0},
            dragDomRect: null,
            chatDomRect: null
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
                }, delayTime);
            });
        },
        updateMessageHistory() {
            this.isLoading = false;
            this.messageRecords = this.getFriendMessageHistory(this.chooseItemId as string);
            const chat = this.$refs.chat as HTMLDivElement;
            if (chat) {
                // 请求数据后滚动到原来的位置而不是最上方
                setTimeout(() => {
                    this.$nextTick(() => {
                        chat.scrollTo(0, chat.scrollHeight - this.currentScrollHeight);
                    });
                }, 0);
            }
        },
        scrollChat(e: any) {
            let el = e.target;
            if (el.scrollTop <= 0) {
                // 请求上一页聊天消息的数据
                this.getHistoryMessages();
                const chat = this.$refs.chat as HTMLDivElement;
                this.currentScrollHeight = chat.scrollHeight;
            }
        },
        getHistoryMessages(isFirst = false) {
            this.isLoading = true;
            const curChooseFriendInfo = this.curChooseFriendInfo as FriendInfoType;
            const page = isFirst ? 1 : this.getFriendMessagePage(this.chooseItemId as string) + 1;
            getHistoryMessages(curChooseFriendInfo.userId, page, pageSize);
        },
        showSelfContextMenu(event: MouseEvent, messageInfo: FriendMessageType) {
            event.preventDefault();
            this.showContextMenu = messageInfo.messageStatus !== -1;
            this.showRecall = this.isSelf(messageInfo.messageSenderId);
            const chat = this.$refs.chat as HTMLDivElement;
            // 320 为左侧列表的宽度
            this.contextMenuX = event.clientX - (this.isMobile ? 0 : 320);
            this.contextMenuY = event.clientY + chat.scrollTop - 60;
            this.clickMessageInfo = messageInfo;
            this.clickMessageElement = event.target;
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
        mouseMove(event: MouseEvent) {
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
        mouseUp(event: MouseEvent) {
            if (!this.dragDomRect || !this.chatDomRect) return;
            const {clientX, clientY} = event;
            if (clientX < this.chatDomRect.x || clientX > this.chatDomRect.x + this.chatDomRect.width || clientY < this.chatDomRect.y || clientY > this.chatDomRect.y + this.chatDomRect.height) {
                this.resetDragAbout();
                return console.error('超出了聊天框的范围');
            }
            if (clientY < this.dragDomRect.y + this.dragDomRect.height && clientY > this.dragDomRect.y) {
                this.resetDragAbout();
                return console.error('在原来消息的范围中');
            }
            (this.$refs.friendChatInput as typeof FriendChatInput).sendMessage(this.dragMessageInfo?.messageContent, this.dragMessageInfo?.type);
            this.resetDragAbout();
        },
        resetDragAbout() {
            this.isDragging = false;
            this.dragMessageInfo = undefined;
            this.dragDomRect = null;
            this.chatDomRect = null;
            this.dragMessageInfo = undefined;
            this.offsetPosition = {x: 0, y: 0};
            this.currentPosition = {x: 0, y: 0};
        }
    }
};
</script>

<template>
    <div class="w-full overflow-hidden">
        <div v-if="chooseItem" class="w-full h-screen overflow-hidden flex flex-col">
            <UserInfoItem :isLoading="isLoading" :showLoading="true" :userInfo="curChooseFriendInfo" class="justify-center border-b border-gray-300 py-2" />
            <div v-if="!!messageRecords" id="chat" ref="chat" class="w-full h-screen overflow-y-auto py-2 px-6 relative" @scroll="scrollChat">
                <ul>
                    <MessageItem v-for="(message, index) in messageRecords" :id="`message${index}`" :key="message.uuid" :isSelf="isSelf(message.messageSenderId)" :message="message" @contextmenu="event => showSelfContextMenu(event, message)" @mousedown="event => mouseDown(event, message, index)" />
                </ul>
                <OnClickOutside @trigger="showContextMenu = false">
                    <div v-if="showContextMenu" class="absolute z-10 w-20 max-h-40 border-2 rounded-lg p-2 border-solid shadow bg-white/[0.8] overflow-y-auto" :style="`top: ${contextMenuY}px; left: ${contextMenuX}px;`">
                        <div v-for="func in contextmenuFunction" :key="func.command" class="block ml-2 text-sm text-gray-700 cursor-pointer py-[2px]" @click="commandFor(func.command)">{{ func.text }}</div>
                    </div>
                </OnClickOutside>
            </div>
            <div v-else class="h-screen m-auto text-center">暂无数据</div>

            <div class="absolute z-20" :style="{top: `${currentPosition.y}px`, left: `${currentPosition.x}px`, width: `${dragDomRect?.width ?? 10}px`, height: `${dragDomRect?.height ?? 10}px`}" @mouseup="mouseUp" @mousemove="mouseMove">
                <MessageItem v-if="dragMessageInfo && isDragging" class="cursor-move" :isSelf="isSelf(dragMessageInfo.messageSenderId)" :message="dragMessageInfo" />
            </div>

            <div class="sticky bottom-0">
                <FriendChatInput ref="friendChatInput" :chooseFriendInfo="curChooseFriendInfo" :groupMembersData="groupMembersData" :chooseItemId="chooseItemId" />
            </div>
        </div>
    </div>
</template>
