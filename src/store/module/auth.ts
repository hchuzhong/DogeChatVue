import {defineStore} from 'pinia';
import {API} from '../../request/api';
import {SelfDataType} from '../../global/GlobalType';
import {Router} from 'vue-router';

export const useAuthStore = defineStore('auth', {
    state: () => {
        return {
            username: '',
            password: '',
            clientPrivateKey: '',
            clientPubliKey: '',
            serverPubliKey: '',
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
    // could also be defined as
    // state: () => ({ count: 0 })
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

        login(username: string, password: string, router: Router) {
            this.setUsername(username);
            this.setPassword(password);
            return new Promise((resolve, reject) => {
                API.login({username, password})
                    .then(data => {
                        const loginSuccess = !!data?.data?.userInfo;
                        if (loginSuccess) {
                            this.setSelfData(data?.data?.userInfo);
                            localStorage.setItem('selfData', JSON.stringify(data?.data?.userInfo));
                            router.push('/friend-list');
                        }
                        resolve(data);
                    })
                    .catch(err => {
                        reject(err);
                    });
            });
        },

        logout() {
            // Auth.logout()
            // UserStore.resetUser()
            // HistoryStore.reset()
            // ImageStore.reset()
        },

        isSelf(id: string) {
            return id === this.selfData.userId;
        }
    }
});
