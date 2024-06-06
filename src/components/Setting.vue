<script lang="ts">
import {mapActions, mapState} from 'pinia';
import {useAuthStore} from '../store/module/auth';
import {useGlobalStore} from '../store/module/global';
import {textModeItem} from '../global/GlobalValue';
import VConsole from 'vconsole';

interface dataType {
    openDarkMode: boolean;
    openTextMode: boolean;
    openVConsole: boolean;
    VConsole: VConsole | null;
}

export default {
    data(): dataType {
        return {
            openDarkMode: false,
            openTextMode: false,
            openVConsole: false,
            VConsole: null
        };
    },
    computed: {
        ...mapState(useAuthStore, ['selfData']),
        ...mapState(useGlobalStore, ['isDarkMode'])
    },
    mounted() {
        this.openTextMode = JSON.parse(localStorage.getItem(textModeItem) ?? '{}')?.openTextMode;
    },
    methods: {
        ...mapActions(useAuthStore, ['logout']),
        ...mapActions(useGlobalStore, ['setDarkMode']),
        async logoutAccount() {
            this.logout(this.$router);
        },
        changeDarkMode(event: Event) {
            this.setDarkMode(event.target?.checked ?? false);
        },
        changeTextMode(event: Event) {
            this.openTextMode = event.target?.checked ?? false;
            localStorage.setItem(textModeItem, JSON.stringify({openTextMode: this.openTextMode}));
        },
        changeVConsole(event: Event) {
            console.log('change v console');
            this.openVConsole = event.target?.checked ?? false;
            this.openVConsole && (this.VConsole = new VConsole({theme: this.isDarkMode ? 'dark' : 'light'}));
            !this.openVConsole && this.VConsole?.destroy();
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
                <input type="checkbox" class="cursor-pointer" :checked="isDarkMode" @change="changeDarkMode" />
            </div>
            <div class="flex justify-between mt-1">
                纯文本模式
                <input type="checkbox" class="cursor-pointer" :checked="openTextMode" @change="changeTextMode" />
            </div>
            <div class="flex justify-between mt-1">
                VConsole
                <input type="checkbox" class="cursor-pointer" :checked="openVConsole" @change="changeVConsole" />
            </div>
            <div class="cursor-pointer mt-1" @click="logoutAccount">退出</div>
        </div>
    </div>
</template>
