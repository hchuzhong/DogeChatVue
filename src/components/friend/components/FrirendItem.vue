<script lang="ts">
import {API} from '../../../request/api';
import {FriendInfoType, FriendMessageType, messageType, messageTypeToChinese} from '../../../global/GlobalType';
import type {PropType} from 'vue';
import {mapActions, mapState} from 'pinia';
import {useFriendStore} from '../../../store/module/friend';
import {EventBus, EventName} from '../../../global/GlobalValue';
import {useGlobalStore} from '../../../store/module/global';
import {readMessage} from '../../../request/websocket';
import {useAuthStore} from '../../../store/module/auth';

type dataType = {
    isChoose: boolean;
    imageSrc: string;
    messageContent: string;
    unReadMessageList: FriendMessageType[];
    hadUnreadMessage: boolean;
    maxUnreadMessageNum: number;
    someoneAtYou: boolean;
};

export default {
    props: {
        friendItemInfo: {} as PropType<FriendInfoType>,
        chooseItemId: String
    },
    computed: {
        ...mapState(useGlobalStore, ['isMobile', 'clientWidth']),
        maxMessageWidth(): number {
            return this.isMobile ? Math.max(this.clientWidth - 90, 0) : 200;
        }
    },
    data(): dataType {
        return {
            isChoose: this.friendItemInfo?.userId === this.chooseItemId,
            imageSrc: API.getPictureUrl(this.friendItemInfo?.avatarUrl),
            messageContent: '',
            unReadMessageList: [],
            hadUnreadMessage: false,
            maxUnreadMessageNum: 99,
            someoneAtYou: false
        };
    },
    watch: {
        chooseItemId: function (chooseItemId: string, oldVal: string) {
            if (chooseItemId === oldVal) return;
            this.isChoose = this.friendItemInfo?.userId === this.chooseItemId;
            if (!this.isChoose || !this.unReadMessageList?.length) return;
            readMessage(chooseItemId, this.unReadMessageList[this.unReadMessageList.length - 1]);
        }
    },
    created() {
        if (this.friendItemInfo?.message?.messageContent) {
            this.getMessageContent(this.friendItemInfo?.message);
        }
        this.checkUnreadMessage(this.friendItemInfo?.userId);
        EventBus().addEventListener(EventName.UnreadMessage, this.checkUnreadMessage);
    },
    unmounted() {
        EventBus().removeEventListener(EventName.UnreadMessage, this.checkUnreadMessage);
    },
    methods: {
        ...mapActions(useFriendStore, ['getFriendUnreadMessage']),
        ...mapActions(useAuthStore, ['isSelf']),
        checkUnreadMessage(friendId?: string) {
            if (friendId && friendId !== this.friendItemInfo?.userId) return;
            const newUnreadMessageList = this.getFriendUnreadMessage(this.friendItemInfo?.userId as string);
            this.hadUnreadMessage = newUnreadMessageList.length !== 0;
            if (!this.hadUnreadMessage) return;
            this.unReadMessageList = JSON.parse(JSON.stringify(newUnreadMessageList));
            this.getMessageContent(newUnreadMessageList[newUnreadMessageList.length - 1])
            this.someoneAtYou = false;
            for (const unReadMessage of this.unReadMessageList) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                for (const notifiedMember of JSON.parse(unReadMessage.notifiedParty)) {
                    if (this.isSelf(Object.keys(notifiedMember)[0])) {
                        this.someoneAtYou = true;
                        break;
                    }
                }
            }
            readMessage(this.chooseItemId as string, this.unReadMessageList[this.unReadMessageList.length - 1]);
        },
        getMessageContent(message: FriendMessageType) {
            const {type, messageContent, isGroup, messageSender} = message;
            this.messageContent = type === messageType.text ? messageContent : `[${messageTypeToChinese[type]}]`;
            if (isGroup === '1') {
                this.messageContent = `${messageSender}: ${this.messageContent}`;
            }
        }
    }
};
</script>

<template>
    <div>
        <a class="max-h-20 px-3 py-2 cursor-pointer flex items-center text-sm focus:outline-none focus:border-gray-500 transition duration-150 ease-in-out" :class="{'bg-gray-100 dark:bg-gray-600': isChoose, 'hover:bg-gray-100 dark:hover:bg-gray-600': !isChoose}">
            <img class="h-10 w-10 rounded-full object-cover" :src="imageSrc" alt="avatar" />
            <div class="flex-1" :style="`max-width: ${maxMessageWidth}px`">
                <div class="flex items-center">
                    <span class="block ml-2 font-semibold text-base text-gray-600 dark:text-gray-400"> {{ friendItemInfo?.nickName || friendItemInfo?.username }} </span>
                    <div class="ml-2">
                        <div v-if="friendItemInfo?.isMuted === '1'">
                            <svg class="icon text-gray-400" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor">
                                <use xlink:href="#icon-tongzhi-guanbi"></use>
                            </svg>
                        </div>
                    </div>
                </div>
                <span class="block ml-2 text-sm text-gray-600 dark:text-gray-400 truncate">
                    <span v-if="hadUnreadMessage && someoneAtYou" class="text-rose-600">[有人@你]</span>
                    {{ messageContent }}
                </span>
            </div>
            <div v-if="hadUnreadMessage && !isChoose" class="rounded-full h-5 w-5 bg-red-500 text-sm text-center text-white">{{ Math.min(unReadMessageList.length, maxUnreadMessageNum) }}</div>
        </a>
    </div>
</template>
