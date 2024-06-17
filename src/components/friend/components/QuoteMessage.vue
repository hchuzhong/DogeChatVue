<script lang="ts">
import {mapActions} from 'pinia';
import {FriendMessageType} from '../../../global/GlobalType';
import {EventBus, EventName, getMessageData, showFullScreenImage} from '../../../global/GlobalValue';
import {useAuthStore} from '../../../store/module/auth';

type dataType = {
    quoteMessage: undefined | FriendMessageType;
    showAt: boolean;
};

export default {
    created() {
        EventBus().addEventListener(EventName.QuoteMessage, this.getQuoteMessage);
    },
    unmounted() {
        EventBus().removeEventListener(EventName.QuoteMessage, this.getQuoteMessage);
    },
    data(): dataType {
        return {
            quoteMessage: undefined,
            showAt: true
        };
    },
    methods: {
        ...mapActions(useAuthStore, ['isSelf']),
        getQuoteMessage(messageInfo?: FriendMessageType) {
            this.quoteMessage = messageInfo;
            messageInfo && (this.showAt = !this.isSelf(messageInfo.messageSenderId) && messageInfo.isGroup === '1');
            this.$emit('quoteMessage', messageInfo);
        },
        atQuoteMember() {
            this.$emit('atQuoteMember');
        },
        getMessageData: getMessageData,
        showFullScreenImage: showFullScreenImage
    }
};
</script>

<template>
    <div v-show="quoteMessage" class="flex items-center text-gray-800 dark:text-gray-400 text-sm border-t-[0.2px] border-gray-300 py-1 px-3 max-h-[32px]">
        {{ void (messageData = getMessageData(quoteMessage)) }}
        <button class="outline-none focus:outline-none" @click="getQuoteMessage()">
            <svg class="icon text-cyan-500 h-6 w-6" aria-hidden="true">
                <use xlink:href="#icon-cancel"></use>
            </svg>
        </button>
        <span class="block text-left ml-1">{{ quoteMessage?.messageSender }}</span>
        <span v-if="showAt" class="text-cyan-500 cursor-pointer" @click="atQuoteMember">(点击@ta)</span>
        <span class="block text-left mr-2 ml-1">:</span>
        <img v-if="messageData.isPicture" class="object-cover max-w-[24px] max-h-[24px] cursor-pointer" :src="messageData.content" alt="" @click="() => showFullScreenImage(messageData.content)"  />
        <span v-else v-html="messageData.content" class="block break-words whitespace-pre-line truncate flex-1 max-h-[24px]"></span>
    </div>
</template>
