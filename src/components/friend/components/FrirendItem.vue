<script lang="ts">
import {API} from '../../../request/api';
import {FriendInfoType, FriendMessageType, messageType, messageTypeToChinese} from '../../../global/GlobalType';
import type {PropType} from 'vue';
import {mapActions} from 'pinia';
import {useFriendStore} from '../../../store/module/friend';
import {EventBus, EventName} from '../../../global/GlobalValue';

type dataType = {
    isChoose: boolean;
    imageSrc: string;
    messageContent: string;
    unReadMessageList: FriendMessageType[];
    hadUnreadMessage: boolean;
    maxUnreadMessageNum: number;
};

export default {
    props: {
        friendItemInfo: {} as PropType<FriendInfoType>,
        chooseItemId: String
    },
    data(): dataType {
        return {
            isChoose: this.friendItemInfo?.userId === this.chooseItemId,
            imageSrc: API.getPictureUrl(this.friendItemInfo?.avatarUrl),
            messageContent: '',
            unReadMessageList: [],
            hadUnreadMessage: false,
            maxUnreadMessageNum: 99
        };
    },
    watch: {
        chooseItemId: function (chooseItemId: string, oldVal: string) {
            if (chooseItemId === oldVal) return;
            this.isChoose = this.friendItemInfo?.userId === this.chooseItemId;
            this.unReadMessageList = [];
            this.hadUnreadMessage = false;
            // TODO 还需要发送消息给服务端表示已读
        }
    },
    created() {
        if (this.friendItemInfo?.message?.messageContent) {
            const {type, messageContent} = this.friendItemInfo.message;
            this.messageContent = type === messageType.text ? messageContent : `[${messageTypeToChinese[type]}]`;
        }
        this.unReadMessageList = this.getFriendUnreadMessage(this.friendItemInfo?.userId as string) || [];
        EventBus().addEventListener(EventName.UnreadMessage, this.checkUnreadMessage);
    },
    unmounted() {
        EventBus().removeEventListener(EventName.UnreadMessage, this.checkUnreadMessage);
    },
    methods: {
        ...mapActions(useFriendStore, ['getFriendUnreadMessage']),
        checkUnreadMessage(friendId?: string) {
            if (friendId && friendId !== this.friendItemInfo?.userId) return;
            const newUnreadMessageList = this.getFriendUnreadMessage(this.friendItemInfo?.userId as string);
            this.hadUnreadMessage = newUnreadMessageList.length !== 0 && !this.isChoose;
            if (newUnreadMessageList.length === 0 || newUnreadMessageList.length === this.unReadMessageList.length) return;
            this.unReadMessageList = newUnreadMessageList;
            const {type, messageContent} = newUnreadMessageList[newUnreadMessageList.length - 1];
            this.messageContent = type === messageType.text ? messageContent : `[${messageTypeToChinese[type]}]`;
        }
    }
};
</script>

<template>
    <div>
        <a class="border-b border-gray-300 px-3 py-2 cursor-pointer flex items-center text-sm focus:outline-none focus:border-gray-300 transition duration-150 ease-in-out" :class="isChoose ? 'bg-gray-100' : 'hover:bg-gray-100'">
            <img class="h-10 w-10 rounded-full object-cover" :src="imageSrc" alt="avtar" />
            <div class="pb-2 w-48">
                <span class="block ml-2 font-semibold text-base text-gray-600"> {{ friendItemInfo.username }} </span>
                <span class="block ml-2 text-sm text-gray-600">{{ messageContent }}</span>
            </div>
            <div v-if="hadUnreadMessage" class="rounded-full h-5 w-5 bg-red-500 text-sm">{{ unReadMessageList.length > maxUnreadMessageNum ? maxUnreadMessageNum : unReadMessageList.length }}</div>
        </a>
    </div>
</template>
