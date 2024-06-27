import {defineStore} from 'pinia';
import {mobileMaxWidth} from '../../global/GlobalValue';
import {useToggle} from '@vueuse/core';

export const useGlobalStore = defineStore('global', {
    state: () => {
        return {
            clientWidth: 0,
            isMobile: false,
            isDarkMode: false,
            pageVisible: false
        };
    },
    actions: {
        setClientWidth(clientWidth: number) {
            this.clientWidth = clientWidth;
            this.setIsMobile(clientWidth < mobileMaxWidth);
        },
        setIsMobile(isMobile: boolean) {
            this.isMobile = isMobile;
        },
        setDarkMode(isDarkMode: boolean) {
            this.isDarkMode = isDarkMode;
            useToggle(this.isDarkMode);
        },
        setPageVisible(pageVisible: boolean) {
            this.pageVisible = pageVisible;
            console.log('pageVisible', this.pageVisible);
        }
    }
});
