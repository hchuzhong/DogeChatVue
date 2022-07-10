import {defineStore} from 'pinia';
import {API} from '../../request/api';
import {SelfDataType} from '../../global/GlobalType';

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

        setSelfData(data: SelfDataType) {
            this.selfData = data;
        },

        login(callback: any) {
            return new Promise((resolve, reject) => {
                API.login({username: this.username, password: this.password})
                    .then(data => {
                        console.log('axios return data');
                        console.log(data);
                        this.setSelfData(data?.data?.userInfo);
                        localStorage.setItem('selfData', JSON.stringify(data?.data?.userInfo));
                        callback();
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
        },

        isSelf(id: string) {
            return id === this.selfData.userId;
        }
    }
});
