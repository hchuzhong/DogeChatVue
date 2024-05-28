<script lang="ts">
import type {PropType} from 'vue';
import {FriendMessageType} from '../../../global/GlobalType';
import dayjs from 'dayjs';
import {getMessageData} from '../../../global/GlobalValue';
import {API} from '../../../request/api';

type TouchType = {
    isTouching: boolean;
    startPosition: {x: number; y: number};
    touchStartTime: number;
}

export default {
    props: {
        message: {} as PropType<FriendMessageType>,
        isSelf: Boolean,
        hideIcon: Boolean,
        isMobile: Boolean,
    },
    data(): TouchType {
        return {
            isTouching: false,
            startPosition: {x: 0, y: 0},
            touchStartTime: 0
        };
    },
    methods: {
        parseTimeStamp(timeStamp: number) {
            return dayjs(new Date(timeStamp)).format('YYYY-MM-DD HH:mm:ss');
        },
        getImageSrc() {
            return API.getPictureUrl(this.message?.avatarUrl);
        },
        getMessageData: getMessageData,
        touchStart(event: TouchEvent) {
            if (!this.isMobile) return;
            this.isTouching = true;
            this.startPosition = {x: event.touches[0].clientX, y: event.touches[0].clientY};
            this.touchStartTime = new Date().getTime();
        },
        touchMove(event: TouchEvent) {
            if (!this.isTouching) return;
            const curPosition = event.touches[0];
            const cache = 10;
            const {x, y} = this.startPosition;
            if (Math.abs(curPosition.clientX - x) > cache || Math.abs(curPosition.clientY - y) > cache) {
                this.isTouching = false;
            }
        },
        touchEnd(event: TouchEvent) {
            if (!this.isTouching) return;
            this.isTouching = false;
            const now = new Date().getTime();
            const clickTime = 300;
            if (now - this.touchStartTime > clickTime) return;
            this.$emit('repeatMessage', this.message);
        }
    },
};
</script>

<template>
    <div class="w-full flex items-center mb-2" :class="isSelf && ' flex-row-reverse'">
        <div class="h-6 w-6">
            <img v-if="!hideIcon" class="rounded-full object-cover" :src="getImageSrc()" alt="avatar" />
        </div>
        <div class="flex flex-col mx-1">
            <div class="bg-gray-100 dark:bg-gray-700 rounded px-5 py-2 mt-2 text-gray-700 dark:text-gray-300 relative max-w-[300px]">
                <div class="flex justify-start items-center text-xs">
                    <span class="block text-left mr-2">{{ isSelf ? '我' : message?.messageSender }}</span>
                    <span class="text-gray-400 text-right"> {{ parseTimeStamp(message.timeStamp) }} </span>
                </div>
                {{ void (messageData = getMessageData(message)) }}
                <img v-if="messageData.isPicture" class="object-cover rounded" :style="`${messageData.height && `height: ${messageData.height}px; width: ${messageData.width}px`}`" :src="messageData.content" alt="" />
                <span v-else class="block break-words whitespace-pre-line">{{ messageData.content }}</span>
                <div v-if="isMobile" class="absolute top-0 right-0 w-8 h-full" @touchstart="event => touchStart(event, message)" @touchend="touchEnd" @touchmove="touchMove">
                    <svg class="icon text-gray-400 dark:text-gray-200 h-3 w-3 absolute bottom-2 right-1" aria-hidden="true">
                        <use xlink:href="#icon-birds"></use>
                    </svg>
                </div>
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
    </div>
</template>
