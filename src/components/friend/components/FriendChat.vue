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
            // 320 为左侧列表的宽度, 60 为头部的高度; 40 为 contextmenu 的宽度的一半, 20 为移动端留下的冗余高度，这样点击的时候才能看到 contextmenu
            const target = fromContextmenuEvent ? (event as MouseEvent) : (event as TouchEvent).touches[0];
            this.contextMenuX = target.clientX - (this.isMobile ? 40 : 320);
            this.contextMenuY = target.clientY + chat.scrollTop - 60 - (this.isMobile ? 20 : 0);
            this.clickMessageInfo = messageInfo;
        },
        async commandFor(command: string) {
            this.showContextMenu = false;
            if (command === 'quote') EventBus().dispatchEvent(EventName.QuoteMessage, this.clickMessageInfo);
            if (command === 'recall') recallMessage(this.clickMessageInfo);
        },
        repeatMessage(messafeInfo: FriendMessageType) {
            (this.$refs.friendChatInput as typeof FriendChatInput).sendMessage(messafeInfo?.messageContent, messafeInfo?.type, false);
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
            <UserInfoItem :isLoading="isLoading" :showLoading="true" :userInfo="curChooseFriendInfo" class="justify-center border-b-[0.2px] border-gray-400 py-2" />
            <div v-if="!!messageRecords" id="chat" ref="chat" class="w-full h-self-screen overflow-y-auto py-2 px-4 relative" @scroll="scrollChat">
                <ul>
                    <MessageItem v-for="(message, index) in messageRecords" :id="`message${index}`" :key="message.uuid" :isSelf="isSelf(message.messageSenderId)" :message="message" :hideIcon="index > 0 && messageRecords[index - 1].messageSenderId === message.messageSenderId" @contextmenu="event => showSelfContextMenu(event, message, true)" @touchstart="event => touchStart(event, message)" @touchend="() => (touch.isTouching = false)" @touchmove="touchMove" @repeatMessage="repeatMessage"/>
                </ul>
                <OnClickOutside @trigger="showContextMenu = false">
                    <div v-if="showContextMenu" class="absolute z-10 w-20 max-h-40 border dark:border-gray-300 rounded-lg p-2 border-solid shadow bg-white/[0.8] dark:bg-gray-800/[0.8] overflow-y-auto" :class="{'cannotselect': isMobile}" :style="`top: ${contextMenuY}px; left: ${contextMenuX}px;`">
                        <div v-for="func in contextmenuFunction" :key="func.command" class="block ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer py-[2px]" @click="commandFor(func.command)">{{ func.text }}</div>
                    </div>
                </OnClickOutside>
                <div v-show="!isBottom" class="sticky flex justify-end bottom-10 cursor-pointer" @click="() => scrollToBottom()">
                    <svg class="icon text-gray-400 dark:text-gray-200 h-5 w-5 absolute" aria-hidden="true">
                        <use xlink:href="#icon-bottom02"></use>
                    </svg>
                </div>
            </div>
            <div v-else class="h-self-screen m-auto text-center text-gray-600 dark:text-gray-400">暂无数据</div>

            <div class="sticky bottom-0">
                <FriendChatInput ref="friendChatInput" :chooseFriendInfo="curChooseFriendInfo" :groupMembersData="groupMembersData" :chooseItemId="chooseItemId" @showEmoji="updateScrollPosition" @sendMessage="scrollToBottom" />
            </div>
        </div>
    </div>
</template>
