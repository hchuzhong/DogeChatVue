<script lang="ts">
import {API} from '../../../request/api';
import type {PropType} from 'vue';
import Loading from '../../common/Loading.vue';

type UserInfoItemType = {
    username: string;
    avatarUrl: string;
};

enum size {
    normal = 'normal',
    middle = 'middle',
    small = 'small'
}

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
        },
        size: {
            type: String,
            default: 'normal'
        }
    },
    components: {Loading},
    methods: {
        getImageSrc() {
            return API.getPictureUrl(this.userInfo?.avatarUrl);
        },
        getImageStyle() {
            const styleObj = {
                normal: 'h-10 w-10',
                middle: 'h-8 w-8',
                small: 'h-6 w-6'
            };
            return styleObj[(this.size as 'normal' | 'middle' | 'small') ?? 'normal'];
        },
        getTextStyle() {
            const styleObj = {
                normal: 'text-base',
                small: 'text-sm'
            };
            return styleObj[(this.size as 'normal' | 'small') ?? 'normal'] + (this.needBold ? 'font-bold' : '');
        }
    }
};
</script>

<template>
    <div class="flex items-center">
        <Loading v-if="isLoading && showLoading" class="my-1" />
        <img v-else class="rounded-full object-cover" :class="getImageStyle()" :src="getImageSrc()" alt="avatar" />
        <div class="flex flex-col ml-2">
            <span class="block text-gray-800" :class="getTextStyle()"> {{ isLoading && showLoading ? '加载数据中' : userInfo?.username }} </span>
            <slot name="content" />
        </div>
    </div>
</template>
