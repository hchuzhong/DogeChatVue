import {defineStore} from 'pinia';
import {API} from '../../request/api';
import {SelfDataType} from '../../global/GlobalType';
import {RouteLocation, Router} from 'vue-router';
import {useFriendStore} from './friend';
import {autoLoginItem} from '../../global/GlobalValue';
import toast from '../../components/common/toast';
import {stopWebsocket} from '../../request/websocket';

export const useAuthStore = defineStore('auth', {
    state: () => {
        return {
            username: '',
            password: '',
            clientPrivateKey: '',
            clientPubliKey: '',
            serverPubliKey: '',
            fromLogout: false,
            selfData: {
                avatarUrl: '',
                createdTime: '',
                data: '',
                email: '',
                online: false,
                track: '',
                userId: '',
                username: ''
            }
        };
    },
    actions: {
        setUsername(username: string) {
            this.username = username;
        },

        setPassword(password: string) {
            this.password = password;
        },

        setClientKey(privateKey: string, publicKey: string) {
            this.clientPrivateKey = privateKey;
            this.clientPubliKey = publicKey;
        },

        setServerPubliKey(publicKey: string) {
            this.serverPubliKey = publicKey;
        },

        setSelfData(data: SelfDataType) {
            this.selfData = data;
        },

        login(username: string, password: string, router: Router, route: RouteLocation) {
            this.setUsername(username);
            this.setPassword(password);
            return new Promise((resolve, reject) => {
                API.login({username, password})
                    .then(data => {
                        const loginSuccess = !!data?.data?.userInfo;
                        if (loginSuccess) {
                            localStorage.setItem(autoLoginItem, JSON.stringify({username, password}));
                            this.fromLogout = false;
                            this.setSelfData(data?.data?.userInfo);
                            localStorage.setItem('selfData', JSON.stringify(data?.data?.userInfo));
                            router.push(route.query?.userId ? `/friend-list?userId=${route.query?.userId}` : '/friend-list');
                        }
                        resolve(data);
                    })
                    .catch(err => {
                        reject(err);
                    });
            });
        },

        async logout(router: Router) {
            const reuslt = await API.logout();
            localStorage.removeItem(autoLoginItem);
            this.fromLogout = true;
            toast(reuslt.data.message);
            this.reset();
            stopWebsocket();
            router.push('/');
        },

        reset() {
            useFriendStore().reset();
            this.resetData();
        },

        resetData() {
            this.username = '';
            this.password = '';
            this.clientPrivateKey = '';
            this.clientPubliKey = '';
            this.serverPubliKey = '';
            this.fromLogout = false;
            this.selfData = {
                avatarUrl: '',
                createdTime: '',
                data: '',
                email: '',
                online: false,
                track: '',
                userId: '',
                username: ''
            };
        },

        isSelf(id: string) {
            return id === this.selfData.userId;
        }
    }
});
