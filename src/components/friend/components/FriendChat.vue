<script lang="ts">
import {mapActions, mapState} from 'pinia';
import {useFriendStore} from '../../../store/module/friend';
import {useAuthStore} from '../../../store/module/auth';
import MessageItem from './MessageItem.vue';
import {FriendInfoType, FriendMessageType, GroupMemberType, messageType, SaveStarDataType} from '../../../global/GlobalType';
import {getHistoryMessages, recallMessage, serverEncrypt} from '../../../request/websocket';
import {API} from '../../../request/api';
import FriendChatInput from './FriendChatInput.vue';
import {EventBus, EventName, messageItemDefaultMaxWidth} from '../../../global/GlobalValue';
import {OnClickOutside} from '@vueuse/components';
import {useGlobalStore} from '../../../store/module/global';
import UserInfoItem from './UserInfoItem.vue';
import toast from '../../common/toast';
import FriendInfo from './FriendInfo.vue';

type PositionType = {x: number; y: number};

type TouchType = {
    isTouching: boolean;
    startPosition: PositionType;
}

type dataType = {
    oldChooseItemId: string;
    chooseItem: boolean;
    messageRecords: undefined | FriendMessageType[];
    imageSrc: string;
    isLoading: boolean;
    currentScrollHeight: number;
    groupMembersData: GroupMemberType[];
    atGroupMembersData: GroupMemberType[];
    showContextMenu: boolean;
    contextMenuX: number;
    contextMenuY: number;
    clickMessageInfo: undefined | FriendMessageType;
    isBottom: boolean;
    messageItemTouch: TouchType;
    isDelaying: boolean;
    showFriendInfo: boolean;
    friendChatTouch: TouchType;
};

const pageSize = 20;

export default {
    props: {
        chooseItemId: String
    },
    components: {MessageItem, FriendChatInput, OnClickOutside, UserInfoItem, FriendInfo},
    computed: {
        ...mapState(useFriendStore, ['friendListObj']),
        ...mapState(useGlobalStore, ['isMobile']),
        contextmenuFunction(): {text: string; command: string}[] {
            const contextmenuFunction = [{text: '引用', command: 'quote'}];
            const showRecall = this.isSelf(this.clickMessageInfo?.messageSenderId ?? '')
            showRecall && contextmenuFunction.push({text: '撤回', command: 'recall'});
            const showCopy = this.clickMessageInfo?.type === messageType.text;
            showCopy && contextmenuFunction.push({text: '复制', command: 'copy'});
            const canSave = this.clickMessageInfo?.type && [messageType.image, messageType.livePhoto, messageType.draw, messageType.photo].includes(this.clickMessageInfo?.type);
            canSave && contextmenuFunction.push({text: '收藏', command: 'save'});
            return contextmenuFunction;
        },
        draggingElement(): HTMLDivElement {
            return this.$refs.chat as HTMLDivElement;
        },
        curChooseFriendInfo(): undefined | FriendInfoType {
            return this.friendListObj[this.chooseItemId ?? ''];
        }
    },
    data(): dataType {
        return {
            oldChooseItemId: '',
            chooseItem: this.chooseItemId !== '',
            messageRecords: undefined,
            imageSrc: '',
            isLoading: false,
            currentScrollHeight: 0,
            groupMembersData: [],
            atGroupMembersData: [],
            showContextMenu: false,
            contextMenuX: 0,
            contextMenuY: 0,
            clickMessageInfo: undefined,
            isBottom: true,
            messageItemTouch: {isTouching: false, startPosition: {x: 0, y: 0}},
            isDelaying: false,
            showFriendInfo: false,
            friendChatTouch: {isTouching: false, startPosition: {x: 0, y: 0}},
        };
    },
    watch: {
        chooseItemId: async function (chooseItemId: string, oldVal: string) {
            this.showFriendInfo = false;
            this.chooseItem = chooseItemId !== '';
            if (this.chooseItem) {
                if (!this.curChooseFriendInfo?.messageHistory && chooseItemId !== this.oldChooseItemId) {
                    await this.getHistoryMessages(true);
                } else {
                    this.messageRecords = this.getFriendMessageHistory(this.chooseItemId as string);
                }
                this.imageSrc = await API.getPictureUrl((this.curChooseFriendInfo as FriendInfoType).avatarUrl);
                if (this.curChooseFriendInfo?.isGroup === '1') {
                    const membersResponse = await API.getGroupMembers(this.chooseItemId as string);
                    this.groupMembersData = membersResponse?.data ?? [];
                    this.atGroupMembersData = [];
                    this.atGroupMembersData.push({username: '所有人', avatarUrl: this.curChooseFriendInfo.avatarUrl, userId: this.curChooseFriendInfo.userId});
                    this.atGroupMembersData = this.atGroupMembersData.concat(membersResponse?.data ?? []);
                }
            }
            this.oldChooseItemId = chooseItemId;
            this.scrollToBottom(200);
            this.calculateMessageItemMaxWidth();
            EventBus().dispatchEvent(EventName.QuoteMessage);
        }
    },
    mounted() {
        EventBus().addEventListener(EventName.UpdateMessageHistory, this.updateMessageHistory);
        EventBus().addEventListener(EventName.UpdateOneMessage, this.updateMessageHistory);
        window.addEventListener('resize', this.calculateMessageItemMaxWidth);
    },
    unmounted() {
        EventBus().removeEventListener(EventName.UpdateMessageHistory, this.updateMessageHistory);
        EventBus().removeEventListener(EventName.UpdateOneMessage, this.updateMessageHistory);
        window.removeEventListener('resize', this.calculateMessageItemMaxWidth);
    },
    methods: {
        ...mapActions(useAuthStore, ['isSelf']),
        ...mapActions(useGlobalStore, ['setMessageItemWidth']),
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
            if (el.scrollTop <= 0 && !this.isLoading) {
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
            if (command === 'copy') this.copyText();
            if (command === 'save') this.saveImageToSticker();
        },
        async saveImageToSticker() {
            if (!this.clickMessageInfo) return;
            const {messageContent, messageSenderId, messageSender} = this.clickMessageInfo;
            const content = serverEncrypt(messageContent);
            if (!content) return;
            const data: SaveStarDataType = {
                content,
                starTime: new Date().toISOString(),
                starType: 'file',
                type: '0',
                userId: messageSenderId,
                username: messageSender,
            }
            const result = await API.saveStar(data);
            if (result.data.status === 'success') {
                (this.$refs.friendChatInput as typeof FriendChatInput).getStar();
                return toast('表情收藏成功');
            }
            toast('操作失败');
        },
        async copyText() {
            const getSelectedText = () => {
                let selectedText = '';
                if (window.getSelection) {
                    selectedText = window?.getSelection()?.toString() ?? '';
                    // @ts-ignore
                } else if (document?.selection && document?.selection.type !== 'Control') {
                    // @ts-ignore
                    selectedText = document.selection.createRange().text;
                }
                return selectedText;
            }
            try {
                await navigator.clipboard.writeText((getSelectedText() || this.clickMessageInfo?.messageContent) ?? '');
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        },
        repeatMessage(messafeInfo: FriendMessageType) {
            if (this.isDelaying) return;
            (this.$refs.friendChatInput as typeof FriendChatInput).sendMessage(messafeInfo?.messageContent, messafeInfo?.type, false, messafeInfo?.notifiedParty);
            this.isDelaying = true;
            setTimeout(() => {
                this.isDelaying = false;
            }, 300);
        },
        touchStartMessageItem(event: TouchEvent, messageInfo: FriendMessageType) {
            if (!this.isMobile || this.showContextMenu) return;
            this.messageItemTouch.isTouching = true;
            this.messageItemTouch.startPosition = {x: event.touches[0].clientX, y: event.touches[0].clientY};
            setTimeout(() => {
                if (!this.messageItemTouch.isTouching) return;
                this.showSelfContextMenu(event, messageInfo);
                this.messageItemTouch.isTouching = false;
            }, 500);
        },
        touchMoveMessageItem(event: TouchEvent) {
            if (!this.messageItemTouch.isTouching) return;
            const curPosition = event.touches[0];
            const cache = 10;
            const {x, y} = this.messageItemTouch.startPosition;
            if (Math.abs(curPosition.clientX - x) > cache || Math.abs(curPosition.clientY - y) > cache) {
                this.messageItemTouch.isTouching = false;
            }
        },
        handleDragOver(event: DragEvent) {
            event.preventDefault();
            event.stopPropagation();
        },
        handleDragLeave(event: DragEvent) {
            event.preventDefault();
            event.stopPropagation();
        },
        handleDrop(event: DragEvent) {
            event.preventDefault();
            event.stopPropagation();

            const files = event?.dataTransfer?.files;
            if (files && files.length > 0) {
                this.handleFiles(files);
            }
        },
        handleFiles(files: FileList) {
            const file = files[0];
            const isImageOrVideo = file.type.includes('video') || file.type.includes('image')
            if (!isImageOrVideo) return toast("拖拽发送只支持图片或视频");
            (this.$refs.friendChatInput as typeof FriendChatInput).beforeSend(files[0]);
        },
        calculateMessageItemMaxWidth() {
            const messageItemMaxWidth = Math.floor((this.$refs.chatWrapper as HTMLDivElement)?.clientWidth * 0.75) ?? 0;
            const maxWidth = Math.max(messageItemMaxWidth, messageItemDefaultMaxWidth);
            this.setMessageItemWidth(maxWidth);
        },
        returnToChat() {
            this.showFriendInfo = false;
            this.scrollToBottom();
        },
        touchStartFriendChat(event: TouchEvent) {
            if (!this.isMobile) return;
            this.friendChatTouch.isTouching = true;
            this.friendChatTouch.startPosition = {x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY};
        },
        touchEndFriendChat(event: TouchEvent) {
            // event.preventDefault();
            if (!this.isMobile || !this.friendChatTouch.isTouching) return;
            this.friendChatTouch.isTouching = false;
            const limitDistance = 50;
            const endPosition = {x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY};
            if (Math.abs(this.friendChatTouch.startPosition.y - endPosition.y) > limitDistance) return;
            if (this.friendChatTouch.startPosition.x < endPosition.x - limitDistance) {
                this.$emit('resetChooseItemId');
            }
        },
    }
};
</script>

<template>
    <div class="w-full overflow-hidden" ref="chatWrapper" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
        <div v-if="chooseItem && !showFriendInfo" class="w-full h-self-screen overflow-hidden flex flex-col">
            <button v-if="isMobile" class="absolute w-[50px] h-[50px] flex justify-center items-center" @click="$emit('resetChooseItemId')">
                <svg class="icon text-gray-400 dark:text-gray-200 h-5 w-5" aria-hidden="true">
                    <use xlink:href="#icon-xiangzuojiantou"></use>
                </svg>
            </button>
            <UserInfoItem :isLoading="isLoading" :showLoading="true" :userInfo="curChooseFriendInfo" :notificationConfig="{show: true, muted: curChooseFriendInfo?.isMuted === '1'}" class="justify-center border-b-[0.2px] border-gray-400 py-2 cursor-pointer" @click="showFriendInfo = true" />
            <div v-if="!!(messageRecords && messageRecords.length)" id="chat" ref="chat" class="w-full h-self-screen overflow-y-auto py-2 px-4 relative" @scroll="scrollChat" @touchstart="touchStartFriendChat" @touchend="touchEndFriendChat">
                <ul>
                    <MessageItem v-for="(message, index) in messageRecords" :id="`message${index}`" :key="message.uuid" :isSelf="isSelf(message.messageSenderId)" :message="message" :hideIcon="index > 0 && messageRecords[index - 1].messageSenderId === message.messageSenderId" @contextmenu="event => showSelfContextMenu(event, message, true)" @touchstart="event => touchStartMessageItem(event, message)" @touchend="() => (messageItemTouch.isTouching = false)" @touchmove="touchMoveMessageItem" @repeatMessage="repeatMessage"/>
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
                <FriendChatInput ref="friendChatInput" :chooseFriendInfo="curChooseFriendInfo" :groupMembersData="atGroupMembersData" :chooseItemId="chooseItemId" @showEmoji="updateScrollPosition" @sendMessage="scrollToBottom" />
            </div>
        </div>
        <friendInfo v-if="showFriendInfo" :chooseItemId="chooseItemId"  :groupMembersData="groupMembersData" @returnFriendChat="returnToChat" />
    </div>
</template>
