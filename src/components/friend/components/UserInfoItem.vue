<script lang="ts">
import {API} from '../../../request/api';
import type {PropType} from 'vue';
import Loading from '../../common/Loading.vue';

type UserInfoItemType = {
    username: string;
    avatarUrl: string;
};

type NotificationConfigType = {
    show: boolean;
    muted: boolean;
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
        },
        notificationConfig: {} as PropType<NotificationConfigType>,
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
    },
};
</script>

<template>
    <div class="flex items-center">
        <Loading v-if="isLoading && showLoading" class="my-1" />
        <img v-else class="rounded-full object-cover" :class="getImageStyle()" :src="getImageSrc()" alt="avatar" />
        <div class="flex flex-col ml-2">
            <div class="flex items-center">
                <span class="block text-gray-800 dark:text-gray-300" :class="getTextStyle()"> {{ isLoading && showLoading ? '加载数据中' : userInfo?.username }} </span>
                <div v-if="notificationConfig?.show" class="ml-2">
                    <div v-if="notificationConfig?.muted">
                        <svg class="icon text-gray-400" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor">
                            <use xlink:href="#icon-tongzhi-guanbi"></use>
                        </svg>
                    </div>
                </div>
            </div>
            <slot name="content" />
        </div>
    </div>
</template>
