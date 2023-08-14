<script lang="ts">
import {API} from '../../../request/api';
import type {PropType} from 'vue';
import Loading from '../../common/Loading.vue';

type UserInfoItemType = {
    username: string;
    avatarUrl: string;
};

export default {
    props: {
        userInfo: {} as PropType<UserInfoItemType>,
        isLoading: {
            type: Boolean,
            default: false
        },
        showLoading: {
            type: Boolean,
            default: false
        },
        needBold: {
            type: Boolean,
            default: true
        }
    },
    components: {Loading},
    methods: {
        getImageSrc() {
            return API.getPictureUrl(this.userInfo?.avatarUrl);
        }
    }
};
</script>

<template>
    <div class="flex items-center">
        <Loading v-if="isLoading && showLoading" class="my-1" />
        <img v-else class="h-10 w-10 rounded-full object-cover" :src="getImageSrc()" alt="message" />
        <div class="flex flex-col ml-2">
            <span class="block text-base text-gray-800" :class="{'font-bold': needBold}"> {{ isLoading && showLoading ? '加载数据中' : userInfo?.username }} </span>
            <slot name="content" />
        </div>
    </div>
</template>
