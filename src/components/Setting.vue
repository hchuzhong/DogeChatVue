<script lang="ts">
import {mapActions, mapState} from 'pinia';
import {useAuthStore} from '../store/module/auth';
import {stopWebsocket} from '../request/websocket';
import {API} from '../request/api';
import toast from './common/toast';
import {useGlobalStore} from '../store/module/global';

export default {
    data() {
        return {
            openDarkMode: false
        };
    },
    computed: {
        ...mapState(useAuthStore, ['selfData']),
        ...mapState(useGlobalStore, ['isDarkMode'])
    },
    methods: {
        ...mapActions(useAuthStore, ['reset']),
        ...mapActions(useGlobalStore, ['setDarkMode']),
        async logout() {
            const reuslt = await API.logout();
            toast(reuslt.data.message);
            this.reset();
            stopWebsocket();
            this.$router.push('/');
        },
        watchCheckbox(event: Event) {
            this.setDarkMode(event.target?.checked ?? false);
        }
    }
};
</script>

<template>
    <div class="flex flex-col p-2">
        <!-- header -->
        <div class="flex items-center justify-between w-full">
            <button class="flex items-center" @click="$emit('returnFriendList')">
                <svg class="icon text-gray-400 dark:text-gray-300 h-4 w-4" aria-hidden="true">
                    <use xlink:href="#icon-xiangzuojiantou"></use>
                </svg>
                <span class="text-gray-400 dark:text-gray-300 pl-1">{{ selfData.username }}</span>
            </button>
            <span class="mr-20 text-xl text-gray-900 dark:text-gray-100">设置</span>
            <span></span>
        </div>
        <!-- body -->
        <div class="flex flex-col mt-2 text-gray-600 dark:text-gray-400 px-2">
            <div class="flex justify-between">
                暗黑模式
                <input type="checkbox" class="cursor-pointer" :checked="isDarkMode" @change="watchCheckbox" />
            </div>
            <div class="cursor-pointer mt-1" @click="logout">退出</div>
        </div>
    </div>
</template>
