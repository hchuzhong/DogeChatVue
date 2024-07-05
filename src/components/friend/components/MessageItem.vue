<script lang="ts">
import type {PropType} from 'vue';
import {FriendMessageType} from '../../../global/GlobalType';
import dayjs from 'dayjs';
import {getMessageData, isMobileDevice, showFullScreenImage} from '../../../global/GlobalValue';
import {API} from '../../../request/api';
import VideoPlayer from '../../common/VideoPlayer.vue';
import {mapState} from 'pinia';
import {useGlobalStore} from '../../../store/module/global';

export default {
    components: {VideoPlayer},
    props: {
        message: {} as PropType<FriendMessageType>,
        isSelf: Boolean,
        hideIcon: Boolean,
    },
    computed: {
        ...mapState(useGlobalStore, ['messageItemWidth']),
        maxWidthStyle(): {maxWidth: string} {
            return {maxWidth: this.messageItemWidth + 'px'}
        }
    },
    methods: {
        parseTimeStamp(timeStamp: number) {
            return dayjs(new Date(timeStamp)).format('YYYY-MM-DD HH:mm:ss');
        },
        getImageSrc() {
            return API.getPictureUrl(this.message?.avatarUrl);
        },
        getMessageData: getMessageData,
        showFullScreenImage: showFullScreenImage,
        isMobileDevice: isMobileDevice
    },
};
</script>

<template>
    <div class="w-full flex items-center mb-2" :class="{'flex-row-reverse': isSelf, 'cannotselect': isMobileDevice()}">
        <div class="h-6 w-6">
            <img v-if="!hideIcon" class="rounded-full object-cover" :src="getImageSrc()" alt="avatar" />
        </div>
        <div class="flex flex-col mx-1">
            <div class="bg-gray-100 dark:bg-gray-700 rounded px-5 py-2 mt-2 text-gray-700 dark:text-gray-300 relative" :style="maxWidthStyle">
                <div class="flex justify-start items-center text-xs">
                    <span class="block text-left mr-2">{{ isSelf ? '我' : message?.messageSender }}</span>
                    <span class="text-gray-400 text-right"> {{ parseTimeStamp(message.timeStamp) }} </span>
                </div>
                {{ void (messageData = getMessageData(message)) }}
                <img v-if="messageData.isPicture" class="object-cover rounded cursor-pointer" :style="`${messageData.height && `height: ${messageData.height}px; width: ${messageData.width}px`}`" :src="messageData.content" alt="" @click="() => showFullScreenImage(messageData.content)" />
                <video v-else-if="messageData.isVideo" controls :style="`${messageData.height && `height: ${messageData.height}px; width: ${messageData.width}px`}`"><source :src="messageData.content" type="video/mp4" /></video>
                <span v-else v-html="messageData.content" class="block break-words whitespace-pre-line"></span>
                <div class="absolute top-0 right-0 w-8 h-full" @click="$emit('repeatMessage', message)">
                    <svg class="icon text-gray-400 dark:text-gray-200 h-3 w-3 absolute bottom-2 right-1" aria-hidden="true">
                        <use xlink:href="#icon-dog1"></use>
                    </svg>
                </div>
            </div>
            <div v-if="message?.referMessage" class="text-xs text-gray-400 flex items-center mt-1" :style="maxWidthStyle">
                {{ void (referMessageData = getMessageData(message.referMessage)) }}
                <svg class="icon h-3 w-3" aria-hidden="true">
                    <use xlink:href="#icon-yinyong"></use>
                </svg>
                <span class="block mx-1">{{ message?.referMessage?.messageSender }}:</span>
                <span v-if="referMessageData.isText" v-html="referMessageData.content" class="block break-words whitespace-pre-line flex-1 max-h-[16px] truncate"></span>
                <img v-if="referMessageData.isPicture" class="object-cover rounded max-w-[20px] max-h-[20px] cursor-pointer" :src="referMessageData.content" alt="" @click="() => showFullScreenImage(referMessageData.content)" />
                <VideoPlayer v-if="referMessageData.isVideo" :videoSource="referMessageData.content" />
            </div>
        </div>
    </div>
</template>
