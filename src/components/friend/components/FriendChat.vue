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
import Loading from '../../common/Loading.vue';

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
    components: {MessageItem, FriendChatInput, OnClickOutside, Loading},
    computed: {
        ...mapState(useFriendStore, ['friendList']),
        ...mapState(useAuthStore, ['selfData']),
        ...mapState(useGlobalStore, ['isMobile']),
        contextmenuFunction(): {text: string; command: string}[] {
            return this.showRecall ? outsideContextmenuFunction : outsideContextmenuFunction.filter(item => item.command !== 'recall');
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
            clickMessageElement: null
        };
    },
    watch: {
        chooseItemId: async function (chooseItemId: string, oldVal: string) {
            console.log('friend chat 中的 chooseItemId 发生了变化 ==== ');
            console.log(`new: ${chooseItemId}, old: ${oldVal}`);
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
            this.scrollToBottom(500);
            console.log('check choose item info data 99999 ', this.chooseItem);
            console.log(this.curChooseFriendInfo?.messageHistory);
            console.log(this.curChooseFriendInfo);
            console.log('查看 friend list 中的数据 ==== ');
            console.log(this.friendList);
        }
    },
    created() {
        EventBus().addEventListener(EventName.UpdateMessageHistory, this.updateMessageHistory);
        EventBus().addEventListener(EventName.UpdateOneMessage, this.updateMessageHistory);
    },
    methods: {
        ...mapActions(useAuthStore, ['isSelf']),
        ...mapActions(useFriendStore, ['getFriendMessageHistory', 'getFriendMessagePage']),
        scrollToBottom(delayTime = 0) {
            this.$nextTick(() => {
                setTimeout(() => {
                    let msg = document.getElementById('chat');
                    msg &&
                        msg.scrollTo({
                            left: 0,
                            top: (msg?.scrollHeight || 0) + 99999,
                            behavior: 'smooth'
                        });
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
        },
        async commandFor(command: string) {
            this.showContextMenu = false;
            if (command === 'quote') EventBus().dispatchEvent(EventName.QuoteMessage, this.clickMessageInfo);
            if (command === 'recall') recallMessage(this.clickMessageInfo);
        }
    }
};
</script>

<template>
    <div class="w-full">
        <div v-if="chooseItem" class="w-full h-screen overflow-hidden flex flex-col">
            <div class="flex justify-center items-center border-b border-gray-300 py-2">
                <Loading v-if="isLoading" class="my-1" />
                <img v-else class="h-10 w-10 rounded-full object-cover" :src="imageSrc" alt="message" />
                <span class="block ml-2 font-bold text-base text-gray-600"> {{ isLoading ? '加载数据中' : curChooseFriendInfo?.username }} </span>
            </div>
            <div v-if="!!messageRecords" id="chat" ref="chat" class="w-full h-screen overflow-y-auto p-10 relative" @scroll="scrollChat">
                <ul>
                    <MessageItem v-for="message in messageRecords" :key="message.uuid" :isSelf="isSelf(message.messageSenderId)" :message="message" @contextmenu="event => showSelfContextMenu(event, message)" />
                </ul>
                <OnClickOutside @trigger="showContextMenu = false">
                    <div v-if="showContextMenu" class="absolute z-10 w-20 max-h-40 border-2 rounded-lg p-2 border-solid shadow bg-white/[0.8] overflow-y-auto" :style="`top: ${contextMenuY}px; left: ${contextMenuX}px;`">
                        <div v-for="func in contextmenuFunction" :key="func.command" class="block ml-2 text-sm text-gray-700 cursor-pointer py-[2px]" @click="commandFor(func.command)">{{ func.text }}</div>
                    </div>
                </OnClickOutside>
            </div>
            <div v-else class="h-screen m-auto text-center">暂无数据</div>

            <div class="sticky bottom-0">
                <FriendChatInput ref="friendChatInput" :chooseFriendInfo="curChooseFriendInfo" :groupMembersData="groupMembersData" :chooseItemId="chooseItemId" />
            </div>
        </div>
    </div>
</template>
