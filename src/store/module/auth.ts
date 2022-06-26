import {defineStore} from 'pinia';
import {API} from '../../request/api';
import {GlobalType} from '../../global/GlobalType';
import {useFriendStore} from './friend';
import {initWebSocket, websocket} from '../../request/websocket';

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
            localStorage.setItem('dogeChatUserName', username);
        },

        setPassword(password: string) {
            this.password = password;
            localStorage.setItem('dogeChatPassword', password);
        },

        setClientKey(privateKey: string, publicKey: string) {
            this.clientPrivateKey = privateKey;
            this.clientPubliKey = publicKey;
        },

        setServerPubliKey(publicKey: string) {
            this.serverPubliKey = publicKey;
        },

        setSelfData(data: GlobalType.SelfDataType) {
            this.selfData = data;
        },

        login(callback: any) {
            return new Promise((resolve, reject) => {
                API.login({username: this.username, password: this.password})
                    .then(data => {
                        console.log('axios return data');
                        console.log(data);
                        this.setSelfData(data?.data?.userInfo);
                        // 请求好友列表，然后跳转到好友列表界面
                        API.getFriendList().then(data => {
                            const friendStore = useFriendStore();
                            friendStore.setFriendList(data?.data?.friends);
                            console.log('getFriendList result');
                            console.log(data);
                            console.log('check websocket state');
                            if (!websocket) {
                                initWebSocket(this, friendStore, null);
                            }
                            callback();
                            resolve(data);
                        });
                    })
                    .catch(err => {
                        reject(err);
                    });
            });
        },

        register() {
            // return new Promise((resolve, reject) => {
            //   Auth.register(this.values.username, this.values.password)
            //     .then(user => {
            //       UserStore.pullUser()
            //       resolve(user)
            //     }).catch(error => {
            //     UserStore.resetUser()
            //     message.error('注册失败')
            //     reject(error)
            //   })
            // })
        },

        logout() {
            // Auth.logout()
            // UserStore.resetUser()
            // HistoryStore.reset()
            // ImageStore.reset()
        }
    }
});
