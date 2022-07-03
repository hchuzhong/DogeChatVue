<script lang="ts">
import {API} from '../../../request/api';
import {FriendInfoType, messageType, messageTypeToChinese} from '../../../global/GlobalType';
import type {PropType} from 'vue';

export default {
    // props: ['chooseItemId', 'friendItemInfo'],
    props: {
        friendItemInfo: {} as PropType<FriendInfoType>,
        chooseItemId: String
    },
    data() {
        return {
            isChoose: this.friendItemInfo?.userId === this.chooseItemId,
            imageSrc: API.getPictureUrl(this.friendItemInfo?.avatarUrl),
            messageContent: ''
        };
    },
    watch: {
        chooseItemId: function (chooseItemId: string, oldVal: string) {
            if (chooseItemId === oldVal) return;
            this.isChoose = this.friendItemInfo?.userId === this.chooseItemId;
        }
    },
    created() {
        if (this.friendItemInfo?.message?.messageContent) {
            const {type, messageContent} = this.friendItemInfo.message;
            this.messageContent = type === messageType.text ? messageContent : `[${messageTypeToChinese[type]}]`;
        }
    }
};
</script>

<template>
    <div>
        <a v-if="isChoose" class="bg-gray-100 border-b border-gray-300 px-3 py-2 cursor-pointer flex items-center text-sm focus:outline-none focus:border-gray-300 transition duration-150 ease-in-out">
            <img class="h-10 w-10 rounded-full object-cover" :src="imageSrc" alt="avtar" />
            <div class="w-full pb-2">
                <span class="block ml-2 font-semibold text-base text-gray-600"> {{ friendItemInfo.username }} </span>
                <span class="block ml-2 text-sm text-gray-600">{{ messageContent }}</span>
            </div>
        </a>
        <a v-else class="hover:bg-gray-100 border-b border-gray-300 px-3 py-2 cursor-pointer flex items-center text-sm focus:outline-none focus:border-gray-300 transition duration-150 ease-in-out">
            <img class="h-10 w-10 rounded-full object-cover" :src="imageSrc" alt="avtar" />
            <div class="w-full pb-2">
                <span class="block ml-2 font-semibold text-base text-gray-600"> {{ friendItemInfo.username }} </span>
                <span class="block ml-2 text-sm text-gray-600">{{ messageContent }}</span>
            </div>
        </a>
    </div>
</template>
