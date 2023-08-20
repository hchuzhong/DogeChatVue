<script lang="ts">
import {mapActions} from 'pinia';
import {useGlobalStore} from './store/module/global';
import {useDark} from '@vueuse/core';

export default {
    methods: {
        ...mapActions(useGlobalStore, ['setDarkMode'])
    },
    mounted() {
        const isDark = useDark();
        this.setDarkMode(isDark);

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) return;
        const resetVh = () => {
            const vh = window.innerHeight;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        resetVh();
        window.addEventListener('resize', resetVh);
    }
};
</script>

<template>
    <div>
        <router-view />
    </div>
</template>

<style>
.icon {
    width: 1em;
    height: 1em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
}
.h-self-screen {
    height: 100vh;
    height: calc(var(--vh, 100vh));
}
</style>
