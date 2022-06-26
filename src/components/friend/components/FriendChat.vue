<script lang="ts">
import {mapState, mapStores} from 'pinia';
import {useFriendMessageStore} from '../../../store/module/friendMessage';
import {useFriendStore} from '../../../store/module/friend';
import {useAuthStore} from '../../../store/module/auth';
import MessageItem from './MessageItem.vue';
import {FriendInfoType} from '../../../global/GlobalType';
import {getHistoryMessages} from '../../../request/websocket';
import {API} from '../../../request/api';

type dataType = {
    oldChooseItemId: string;
    chooseItem: boolean;
    curChooseFriendInfo: undefined | FriendInfoType;
    imageSrc: string;
};

export default {
    props: {
        chooseItemId: String
    },
    components: {MessageItem},
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
                chooseItemId !== this.oldChooseItemId && getHistoryMessages((this.curChooseFriendInfo as FriendInfoType).userId, 1, 10);
                this.imageSrc = API.getPictureUrl((this.curChooseFriendInfo as FriendInfoType).avatarUrl);
            }
            this.oldChooseItemId = chooseItemId;
        }
    }
    // created() {
    //     if (this.chooseItem) {
    //         this.curChooseFriendInfo = this.friendList.find((friendInfo: FriendInfoType) => friendInfo.userId === this.chooseItemId);
    //         this.chooseItemId !== this.oldChooseItemId && getHistoryMessages((this.curChooseFriendInfo as FriendInfoType).userId, 1, 10);
    //         this.imageSrc = API.getPictureUrl((this.curChooseFriendInfo as FriendInfoType).avatarUrl);
    //     }
    //     this.oldChooseItemId = this.chooseItemId as string;
    //     console.log('check data in friedn chat ==== ');
    //     console.log(this.chooseItem);
    // }
};
</script>

<template>
    <div>
        <div v-if="chooseItem" class="w-full h-screen flex flex-col">
            <div class="flex items-center border-b border-gray-300 pl-3 py-3">
                <img class="h-10 w-10 rounded-full object-cover" :src="imageSrc" alt="message" />
                <span class="block ml-2 font-bold text-base text-gray-600"> {{ curChooseFriendInfo?.username }} </span>
            </div>
            <div id="chat" class="w-full h-screen overflow-y-auto p-10 relative">
                <ul>
                    <MessageItem v-for="message in [values.records]" :key="message.uuid" :isSelf="message.messageSenderId === selfData.userId" :message="message" />
                    <!-- <li class="clearfix2">{{ FriendMessageStore.values.records.map(message => <MessageItem key={message.uuid} isSelf={message.messageSenderId === selfData.userId} message={message} />) }}</li> -->
                </ul>
            </div>

            <div>
                <!-- <FriendChatInput chooseFriendInfo="{curChooseFriendInfo}" /> -->
            </div>
        </div>
    </div>
</template>
