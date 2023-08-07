import {defineStore} from 'pinia';

export const useGlobalStore = defineStore('global', {
    state: () => {
        return {
            clientWidth: 0,
            isMobile: false
        };
    },
    actions: {
        setClientWidth(clientWidth: number) {
            this.clientWidth = clientWidth;
            this.setIsMobile(clientWidth < 768);
        },
        setIsMobile(isMobile: boolean) {
            this.isMobile = isMobile;
        }
    }
});
