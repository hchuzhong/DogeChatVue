<script lang="ts">
import {mapActions, mapState, mapStores} from 'pinia';
import {useFriendMessageStore} from '../../../store/module/friendMessage';
import {useFriendStore} from '../../../store/module/friend';
import {useAuthStore} from '../../../store/module/auth';
import MessageItem from './MessageItem.vue';
import {FriendInfoType, FriendMessageType} from '../../../global/GlobalType';
import {getHistoryMessages} from '../../../request/websocket';
import {API} from '../../../request/api';
import FriendChatInput from './FriendChatInput.vue';

type dataType = {
    oldChooseItemId: string;
    chooseItem: boolean;
    curChooseFriendInfo: undefined | FriendInfoType;
    messageRecords: undefined | FriendMessageType[];
    imageSrc: string;
};

export default {
    props: {
        chooseItemId: String
    },
    components: {MessageItem, FriendChatInput},
    computed: {
        ...mapStores(useFriendMessageStore),
        ...mapStores(useFriendStore),
        ...mapStores(useAuthStore),
        ...mapState(useFriendMessageStore, ['values']),
        ...mapState(useFriendStore, ['friendList']),
        ...mapState(useAuthStore, ['selfData'])
    },
    data(): dataType {
        return {
            oldChooseItemId: '',
            chooseItem: this.chooseItemId !== '',
            curChooseFriendInfo: undefined,
            messageRecords: undefined,
            imageSrc: ''
        };
    },
    watch: {
        chooseItemId: function (chooseItemId: string, oldVal: string) {
            console.log('friend chat 中的 chooseItemId 发生了变化 ==== ');
            console.log(`new: ${chooseItemId}, old: ${oldVal}`);
            this.chooseItem = chooseItemId !== '';
            if (this.chooseItem) {
                this.curChooseFriendInfo = this.friendList.find((friendInfo: FriendInfoType) => friendInfo.userId === chooseItemId);
                if (this.curChooseFriendInfo?.messageHistory) {
                    console.log('直接拿缓存的聊天数据，不同再发起请求 ==== ');
                    this.resetFriendMessage();
                    this.setFriendMessage(this.curChooseFriendInfo.messageHistory);
                } else {
                    chooseItemId !== this.oldChooseItemId && getHistoryMessages((this.curChooseFriendInfo as FriendInfoType).userId, 1, 10);
                }
                this.imageSrc = API.getPictureUrl((this.curChooseFriendInfo as FriendInfoType).avatarUrl);
            }
            this.oldChooseItemId = chooseItemId;
            console.log('check choose item info data 99999 ');
            console.log(this.curChooseFriendInfo?.messageHistory);
            console.log(this.curChooseFriendInfo);
            console.log(this.values.records);
            console.log('查看 friend list 中的数据 ==== ');
            console.log(this.friendList);
        },
        values: function () {
            console.log('监听到了数据变化 ==== ');
            console.log(this.values.records);
            this.messageRecords = this.values.records;
            this.scrollToBottom();
        }
    },
    created() {
        console.log('查看 created 时的顺序 ==== ');
        const friendMessageStore = useFriendMessageStore();
        friendMessageStore.$subscribe(
            () => {
                console.log('监听到了 friendMessageStore 变化');
                this.scrollToBottom();
            },
            {detached: true}
        );
    },
    methods: {
        ...mapActions(useFriendMessageStore, ['setFriendMessage']),
        ...mapActions(useFriendMessageStore, ['resetFriendMessage']),
        scrollToBottom() {
            setTimeout(() => {
                this.$nextTick(() => {
                    let msg = document.getElementById('chat');
                    msg && (msg.scrollTop = 9999);
                });
            }, 100);
        }
    }
};
</script>

<template>
    <div>
        <div v-if="chooseItem" class="w-full h-screen flex flex-col">
            <div class="flex items-center border-b border-gray-300 pl-3 py-3">
                <img class="h-10 w-10 rounded-full object-cover" :src="imageSrc" alt="message" />
                <span class="block ml-2 font-bold text-base text-gray-600"> {{ curChooseFriendInfo?.username }} </span>
            </div>
            <div v-if="!!messageRecords" id="chat" class="w-full h-screen overflow-y-auto p-10 relative">
                <ul>
                    <MessageItem v-for="message in messageRecords" :key="message.uuid" :isSelf="message.messageSenderId === selfData.userId" :message="message" />
                    <!-- <li class="clearfix2">{{ FriendMessageStore.values.records.map(message => <MessageItem key={message.uuid} isSelf={message.messageSenderId === selfData.userId} message={message} />) }}</li> -->
                </ul>
            </div>
            <div v-else>暂无数据</div>

            <div>
                <FriendChatInput :chooseFriendInfo="curChooseFriendInfo" />
            </div>
        </div>
    </div>
</template>
