<script lang="ts">
import type {PropType} from 'vue';
import {FriendMessageType} from '../../../global/GlobalType';
import dayjs from 'dayjs';
import {getMessageData} from '../../../global/GlobalValue';
import {API} from '../../../request/api';

export default {
    props: {
        message: {} as PropType<FriendMessageType>,
        isSelf: Boolean,
        hideIcon: Boolean,
    },
    data() {
        return {
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
        imgShow(imageUrl: string) {
            const image = new Image()
            image.src = imageUrl
            image.onload = () => {
                //创建弹出层
                const previewContatiner = document.createElement('div');
                previewContatiner.style.position = 'fixed';
                previewContatiner.style.top = 0;
                previewContatiner.style.bottom = 0;
                previewContatiner.style.left = 0;
                previewContatiner.style.right = 0;
                previewContatiner.style.zIndex = 9999;
                previewContatiner.style.backgroundColor = 'rgba(0,0,0,0.8)';
                previewContatiner.style.display = 'flex';
                previewContatiner.style.justifyContent = 'center';
                previewContatiner.style.alignItems = 'center';
                document.body.appendChild(previewContatiner);
                //在弹出层增加图片
                const previewImage = document.createElement('img');
                previewImage.src = imageUrl;
                previewImage.style.maxWidth = '90%';
                previewImage.style.maxHeight = '90%';
                previewImage.style.zIndex = 9999;
                previewContatiner.appendChild(previewImage);
                //点击弹出层，关闭预览
                previewContatiner.addEventListener('click', () => {
                    document.body.removeChild(previewContatiner);
                })
            }
            image.onerror = function () {
                console.log('图片加载失败');
            }
        },
    },
};
</script>

<template>
    <div class="w-full flex items-center mb-2" :class="{'flex-row-reverse': isSelf, 'cannotselect': true}">
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
                <img v-if="messageData.isPicture" class="object-cover rounded" :style="`${messageData.height && `height: ${messageData.height}px; width: ${messageData.width}px`}`" :src="messageData.content" alt="" @click="() => imgShow(messageData.content)" />
                <span v-else class="block break-words whitespace-pre-line">{{ messageData.content }}</span>
                <div class="absolute top-0 right-0 w-8 h-full" @click="$emit('repeatMessage', message)">
                    <svg class="icon text-gray-400 dark:text-gray-200 h-3 w-3 absolute bottom-2 right-1" aria-hidden="true">
                        <use xlink:href="#icon-dog1"></use>
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
