<script lang="ts">
import {PropType} from 'vue-demi';
import {FriendMessageType, messageType} from '../../../global/GlobalType';
import {clientDecrypt} from '../../../request/websocket';
import {API} from '../../../request/api';
import dayjs from 'dayjs';

const PictureArr = [messageType.image, messageType.livePhoto, messageType.draw];

export default {
    props: {
        message: {} as PropType<FriendMessageType>,
        isSelf: Boolean
    },
    data() {
        return {
            isText: this.message?.type === messageType.text,
            isPicture: PictureArr.includes((this.message as FriendMessageType).type),
            content: ''
        };
    },
    methods: {
        parseTimeStamp(timeStamp: number) {
            return dayjs(new Date(timeStamp)).format('YYYY-MM-DD HH:mm:ss');
        }
    },
    created() {
        if (this.isPicture) {
            switch (this.message?.type) {
                case messageType.image:
                    this.content = API.getPictureUrl(clientDecrypt(this.message.messageContent));
                    break;
                case messageType.draw:
                    this.content = API.getPictureUrl(this.message.drawImage as string);
                    break;
            }
        }
        if (this.isText) {
            this.content = clientDecrypt((this.message as FriendMessageType).messageContent);
        }
    }
};
</script>

<template>
    <div class="w-full flex" :class="isSelf ? 'justify-end' : 'justify-start'">
        <div class="bg-gray-100 rounded px-5 py-2 my-2 text-gray-700 relative max-w-[300px]">
            <span v-if="!isSelf" class="block text-xs text-gray-700 text-left">{{ message.messageSender }}</span>
            <span v-if="isText" class="block">{{ content }}</span>
            <img v-if="isPicture" class="object-cover" :src="content" alt="" />
            <span class="block text-xs text-right"> {{ parseTimeStamp(message.timeStamp) }} </span>
        </div>
    </div>
</template>
