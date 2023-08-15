<script lang="ts">
import {mapActions, mapState} from 'pinia';
import {useAuthStore} from '../store/module/auth';
import {stopWebsocket} from '../request/websocket';
import {API} from '../request/api';
import toast from './common/toast';
// import {useDark, useToggle} from '@vueuse/core';

export default {
    data() {
        return {
            openDarkMode: false
        };
    },
    computed: {
        ...mapState(useAuthStore, ['selfData'])
    },
    methods: {
        ...mapActions(useAuthStore, ['reset']),
        async logout() {
            const reuslt = await API.logout();
            toast(reuslt.data.message);
            this.reset();
            stopWebsocket();
            this.$router.push('/');
        },
        watchCheckbox(event: Event) {
            // this.openDarkMode = event.target?.checked ?? false;
            // const isDark = useDark();
            // this.openDarkMode = isDark;
            // const toggleDark = useToggle(this.openDarkMode);
            // console.log('check dark');
            // console.log(isDark);
            // console.log(toggleDark);
        }
    }
};
</script>

<template>
    <div class="flex flex-col p-2">
        <!-- header -->
        <div class="flex items-center justify-between w-full">
            <button class="flex items-center" @click="$emit('returnFriendList')">
                <svg class="icon text-gray-400 h-4 w-4" aria-hidden="true">
                    <use xlink:href="#icon-xiangzuojiantou"></use>
                </svg>
                <span class="text-gray-400 pl-1">{{ selfData.username }}</span>
            </button>
            <span class="mr-20 text-xl text-gray-900">设置</span>
            <span></span>
        </div>
        <!-- body -->
        <div class="flex flex-col mt-2 text-gray-600 px-2">
            <div class="flex justify-between">
                暗黑模式 {{ openDarkMode }}
                <input type="checkbox" class="cursor-pointer" @change="watchCheckbox" />
            </div>
            <div class="cursor-pointer mt-1" @click="logout">退出</div>
        </div>
    </div>
</template>
