<script lang="ts">
import {mapActions, mapState, mapStores} from 'pinia';
import {useFriendStore} from '../../../store/module/friend';
import {useAuthStore} from '../../../store/module/auth';
import MessageItem from './MessageItem.vue';
import {FriendInfoType, FriendMessageType} from '../../../global/GlobalType';
import {getHistoryMessages} from '../../../request/websocket';
import {API} from '../../../request/api';
import FriendChatInput from './FriendChatInput.vue';
import {EventBus, EventName} from '../../../global/GlobalValue';

type dataType = {
    oldChooseItemId: string;
    chooseItem: boolean;
    curChooseFriendInfo: undefined | FriendInfoType;
    messageRecords: undefined | FriendMessageType[];
    imageSrc: string;
    isLoading: boolean;
    currentScrollHeight: number;
};

const pageSize = 10;

export default {
    props: {
        chooseItemId: String
    },
    components: {MessageItem, FriendChatInput},
    computed: {
        ...mapStores(useFriendStore),
        ...mapStores(useAuthStore),
        ...mapState(useFriendStore, ['friendList']),
        ...mapState(useAuthStore, ['selfData'])
    },
    data(): dataType {
        return {
            oldChooseItemId: '',
            chooseItem: this.chooseItemId !== '',
            curChooseFriendInfo: undefined,
            messageRecords: undefined,
            imageSrc: '',
            isLoading: false,
            currentScrollHeight: 0
        };
    },
    watch: {
        chooseItemId: function (chooseItemId: string, oldVal: string) {
            console.log('friend chat 中的 chooseItemId 发生了变化 ==== ');
            console.log(`new: ${chooseItemId}, old: ${oldVal}`);
            this.chooseItem = chooseItemId !== '';
            if (this.chooseItem) {
                this.curChooseFriendInfo = this.friendList.find((friendInfo: FriendInfoType) => friendInfo.userId === chooseItemId);
                if (!this.curChooseFriendInfo?.messageHistory && chooseItemId !== this.oldChooseItemId) {
                    this.getHistoryMessages(true);
                } else {
                    this.messageRecords = this.getFriendMessageHistory(this.chooseItemId as string);
                }
                this.imageSrc = API.getPictureUrl((this.curChooseFriendInfo as FriendInfoType).avatarUrl);
            }
            this.oldChooseItemId = chooseItemId;
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
    mounted() {
        this.scrollToBottom(2000);
    },
    methods: {
        ...mapActions(useAuthStore, ['isSelf']),
        ...mapActions(useFriendStore, ['getFriendMessageHistory']),
        ...mapActions(useFriendStore, ['getFriendMessagePage']),
        scrollToBottom(delayTime = 0) {
            setTimeout(() => {
                this.$nextTick(() => {
                    let msg = document.getElementById('chat');
                    msg && msg.scrollTo(0, (msg?.scrollHeight || 0) + 9999);
                });
            }, delayTime);
        },
        updateMessageHistory(eventData?: {friendId?: string; needScroll?: boolean}) {
            if (eventData && eventData.friendId && eventData.friendId !== this.chooseItemId) return;
            this.isLoading = false;
            this.messageRecords = this.getFriendMessageHistory(this.chooseItemId as string);
            const chat = this.$refs.chat as HTMLDivElement;
            if (chat) {
                const {scrollTop, clientHeight, scrollHeight} = chat;
                if (eventData && eventData.needScroll && scrollHeight - scrollTop - 100 < clientHeight) this.scrollToBottom();
                if (!eventData) {
                    // 请求数据后滚动到原来的位置而不是最上方
                    setTimeout(() => {
                        this.$nextTick(() => {
                            chat.scrollTo(0, chat.scrollHeight - this.currentScrollHeight);
                        });
                    }, 0);
                }
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
        }
    }
};
</script>

<template>
    <div class="w-full">
        <div v-if="chooseItem" class="w-full h-screen overflow-hidden flex flex-col">
            <div class="flex justify-center items-center border-b border-gray-300 py-2">
                <img class="h-10 w-10 rounded-full object-cover" :src="imageSrc" alt="message" />
                <span class="block ml-2 font-bold text-base text-gray-600"> {{ isLoading ? '加载数据中' : curChooseFriendInfo?.username }} </span>
            </div>
            <div v-if="!!messageRecords" id="chat" ref="chat" class="w-full h-screen overflow-y-auto p-10 relative" @scroll="scrollChat">
                <ul>
                    <MessageItem v-for="message in messageRecords" :key="message.uuid" :isSelf="isSelf(message.messageSenderId)" :message="message" />
                </ul>
            </div>
            <div v-else class="h-screen m-auto text-center">暂无数据</div>

            <div class="sticky bottom-0">
                <FriendChatInput :chooseFriendInfo="curChooseFriendInfo" />
            </div>
        </div>
    </div>
</template>
