import {defineStore} from 'pinia';
import {mobileMaxWidth} from '../../global/GlobalValue';

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
            this.setIsMobile(clientWidth < mobileMaxWidth);
        },
        setIsMobile(isMobile: boolean) {
            this.isMobile = isMobile;
        }
    }
});
