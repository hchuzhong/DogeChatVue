<script lang="ts">
import type {PropType} from 'vue';
import {FriendMessageType} from '../../../global/GlobalType';
import dayjs from 'dayjs';
import {getMessageData} from '../../../global/GlobalValue';

export default {
    props: {
        message: {} as PropType<FriendMessageType>,
        isSelf: Boolean
    },
    data() {
        return {};
    },
    methods: {
        parseTimeStamp(timeStamp: number) {
            return dayjs(new Date(timeStamp)).format('YYYY-MM-DD HH:mm:ss');
        },
        getMessageData: getMessageData
    }
};
</script>

<template>
    <div class="w-full flex flex-col mb-2" :class="isSelf ? 'items-end' : 'items-start'">
        <div class="bg-gray-100 dark:bg-gray-700 rounded px-5 py-2 mt-2 text-gray-700 dark:text-gray-300 relative max-w-[300px]">
            <div class="flex justify-start items-center text-xs">
                <span class="block text-left mr-2">{{ isSelf ? '我' : message?.messageSender }}</span>
                <span class="block text-right"> {{ parseTimeStamp(message.timeStamp) }} </span>
            </div>
            {{ void (messageData = getMessageData(message)) }}
            <img v-if="messageData.isPicture" class="object-cover rounded" :src="messageData.content" alt="" />
            <span v-else class="block break-words whitespace-pre-line">{{ messageData.content }}</span>
        </div>
        <div v-if="message?.referMessage" class="text-xs text-gray-400 flex items-center max-w-[300px] mt-1">
            {{ void (referMessageData = getMessageData(message.referMessage)) }}
            <svg class="icon h-3 w-3" aria-hidden="true">
                <use xlink:href="#icon-yinyong"></use>
            </svg>
            <span class="block mx-1">{{ message?.referMessage?.messageSender }}:</span>
            <span v-if="referMessageData.isText" class="block break-words whitespace-pre-line flex-1 max-h-[16px] truncate">{{ referMessageData.content }}</span>
            <img v-if="referMessageData.isPicture" class="object-cover rounded max-w-[20px] max-h-[20px]" :src="referMessageData.content" alt="" />
        </div>
    </div>
</template>
