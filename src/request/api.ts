import axios from 'axios';
import {FriendRequestPostType, MutedFriendNotificationType, SaveStarDataType, userInfoType} from '../global/GlobalType';
import {deviceType, getRsaKeys, settingItem} from '../global/GlobalValue';

// 添加响应拦截器
axios.interceptors.request.use(
    function (config) {
        (config as any).headers.deviceInfo = `deviceType=${deviceType}`;
        return config;
    },
    function (error) {
        console.log('request error =====', error);
        return Promise.reject(error);
    }
);
axios.interceptors.response.use(
    function (response) {
        return response;
    },
    function (error) {
        // 超出 2xx 范围的状态码都会触发该函数。
        // 对响应错误做点什么
        console.log('response error ==== ', error);
        if (error.response.status === 401) {
            window.location.href = '/';
            return console.log('重定向到登陆页面');
        } else if (error.response.status >= 500) {
            console.log('服务端报错 ==== ', error);
        }
        return Promise.reject(error);
    }
);

export namespace API {
    axios.defaults.withCredentials = true;
    const baseUrl = '/api';

    export function login(data: userInfoType) {
        return axios.post(`${baseUrl}/auth/login`, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function logout() {
        return axios.post(`${baseUrl}/auth/logout`, null, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function register(data: userInfoType) {
        const postData = {
            email: data.email,
            username: data.username,
            password: data.password,
            repeatPassword: data.confirmPassword,
            validationCode: data.validateCode
        };
        return axios.post(`${baseUrl}/auth/signup`, postData, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function resetPassword(data: userInfoType) {
        const postData = {
            email: data.email,
            username: data.username,
            newPassword: data.password,
            repeatNewPassword: data.confirmPassword,
            validationCode: data.validateCode
        };
        return axios.post(`${baseUrl}/auth/resetPassword`, postData, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    // sendFor: 注册 1, 忘记密码 2
    export function sendValidateCode(email: string, isRegister: boolean) {
        const data = {email, sendFor: isRegister ? 1 : 2};
        return axios.post(`${baseUrl}/auth/sendCode`, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function getFriendList() {
        return axios.get(`${baseUrl}/friendship/getAllFriends`, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function getFriend(friendId: string) {
        return axios.get(`${baseUrl}/friendship/getFriend/${friendId}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function mutedFriendNotification(data: MutedFriendNotificationType) {
        return axios.post(`${baseUrl}/friendship/doNotDisturb`, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function getStar() {
        return axios.get(`${baseUrl}/star/getStar`, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function saveStar(data: SaveStarDataType) {
        return axios.post(`${baseUrl}/star/saveStar`, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true,
        });
    }

    export function removeStar(starId: string) {
        return axios.post(`${baseUrl}/star/delStar`, {starId}, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true,
        });
    }

    export function getGroupMembers(groupId: string) {
        return axios.get(`${baseUrl}/group/getMembers/${groupId}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function getSearchResult(name: string) {
        return axios.get(`${baseUrl}/user/search/${name}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function getFriendRequest() {
        return axios.get(`${baseUrl}/friendRequest/query/-1`, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function sendFriendRequest(data: FriendRequestPostType) {
        return axios.post(`${baseUrl}/friendRequest/request`, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export function acceptFriendRequest(requestId: number) {
        return axios.post(`${baseUrl}/friendRequest/accept/${requestId}`, null, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    }

    export async function postGetPublicKey(callback: any) {
        return await getRsaKeys((privateKey: string, publicKey: string) => {
            callback(privateKey, publicKey);
        });
    }

    export function getPictureUrl(url?: string) {
        const openTextMode = JSON.parse(localStorage.getItem(settingItem) ?? '{}')?.openTextMode ?? false;
        if (!url || openTextMode) return '';
        const strArr = url.split('/');
        return `/api/star/fileDownload/${strArr[strArr.length - 1]}`;
    }

    export async function uploadImg(data: FormData) {
        return axios.post(`${baseUrl}/message/uploadImg`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            withCredentials: true
        });
    }
}
