<script lang="ts">
import {PropType} from 'vue-demi';
import {FriendMessageType, messageType} from '../../../global/GlobalType';
import {API} from '../../../request/api';
import dayjs from 'dayjs';

const PictureArr = [messageType.image, messageType.livePhoto, messageType.draw, messageType.sticker];

export default {
    props: {
        message: {} as PropType<FriendMessageType>,
        isSelf: Boolean
    },
    data() {
        return {
            isText: this.message?.type === messageType.text,
            isPicture: PictureArr.includes((this.message as FriendMessageType).type),
            referMessage: ''
        };
    },
    methods: {
        parseTimeStamp(timeStamp: number) {
            return dayjs(new Date(timeStamp)).format('YYYY-MM-DD HH:mm:ss');
        },
        getMessageData(message?: FriendMessageType) {
            if (!message) return '';
            const isText = message.type === messageType.text;
            const isPicture = PictureArr.includes(message.type);
            let content = '';
            if (isPicture) {
                switch (message?.type) {
                    case messageType.sticker:
                    case messageType.image:
                        content = API.getPictureUrl(message.messageContent);
                        break;
                    case messageType.draw:
                        content = API.getPictureUrl(message.drawImage);
                        break;
                }
            }
            if (isText) {
                content = (message as FriendMessageType).messageContent;
            }
            return {content, isText, isPicture};
        }
    }
};
</script>

<template>
    <div class="w-full flex flex-col mb-2" :class="isSelf ? 'items-end' : 'items-start'">
        <div class="bg-gray-100 rounded px-5 py-2 mt-2 text-gray-700 relative max-w-[300px]">
            <div class="flex justify-center items-center text-xs">
                <span class="block text-left mr-2">{{ isSelf ? '我' : message?.messageSender }}</span>
                <span class="block text-right"> {{ parseTimeStamp(message.timeStamp) }} </span>
            </div>
            {{ void (messageData = getMessageData(message)) }}
            <span v-if="messageData.isText" class="block break-words whitespace-pre-line">{{ messageData.content }}</span>
            <img v-if="messageData.isPicture" class="object-cover rounded" :src="messageData.content" alt="" />
        </div>
        <div v-if="message?.referMessage" class="text-xs text-gray-500 flex items-center max-w-[300px] mt-1">
            {{ void (referMessageData = getMessageData(message.referMessage)) }}
            <svg class="icon text-gray-400 h-3 w-3" aria-hidden="true">
                <use xlink:href="#icon-yinyong"></use>
            </svg>
            <span class="block mx-1">{{ message?.referMessage?.messageSender }}:</span>
            <span v-if="referMessageData.isText" class="block break-words whitespace-pre-line">{{ referMessageData.content }}</span>
            <img v-if="referMessageData.isPicture" class="object-cover rounded max-w-[10px] max-h-[10px]" :src="referMessageData.content" alt="" />
        </div>
    </div>
</template>
