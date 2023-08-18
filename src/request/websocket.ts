import JSEncrypt from 'encryptlong';
import {FriendMessageType} from '../global/GlobalType';
import {deviceType, wssBaseUrl} from '../global/GlobalValue';
import {useAuthStore} from '../store/module/auth';
import {useFriendStore} from '../store/module/friend';
import {API} from './api';

export let websocket: WebSocket;
export let clientEncryptor: JSEncrypt;
export let serverEncryptor: JSEncrypt;
let pingTimer: number | null = null;
let gotPong = false;
let retryTime = 0;
const delayTime = 5000;
const maxRetryTime = 10;

export function initWebSocket() {
    retryTime++;
    if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
    }
    if (retryTime >= maxRetryTime) {
        window.location.href = '/';
        return console.error('重连超过十次，请重新登陆');
    }

    const AuthStore = useAuthStore();
    const FriendStore = useFriendStore();

    clientEncryptor = new JSEncrypt(); // 新建JSEncrypt对象
    serverEncryptor = new JSEncrypt();

    websocket = new WebSocket(`${wssBaseUrl}?deviceType=${deviceType}`);
    // Connection opened
    websocket.addEventListener('open', function (event) {
        startPingTimer();
        websocket.send('ping');
        API.postGetPublicKey((privateKey: string, publicKey: string) => {
            // 自己的公钥和私钥也要存起来
            AuthStore.setClientKey(privateKey, publicKey);

            send({method: 'publicKey', key: publicKey});
            send({method: 'getPublicUnreadMessage', id: 0});
            clientEncryptor.setPublicKey(publicKey); // 设置公钥
            clientEncryptor.setPrivateKey(privateKey);
        });
    });

    // Listen for messages
    websocket.addEventListener('message', function (event) {
        if (event.data === 'pong') {
            gotPong = true;
            return;
        }
        const json = JSON.parse(event.data);
        const method = json?.method;
        const data = json?.data;
        let hadRecords = false;

        if (method) {
            switch (method) {
                case 'publicKey':
                    AuthStore.setServerPubliKey(data);
                    serverEncryptor.setPublicKey(data);
                    break;
                case 'getPublicUnreadMessage':
                    FriendStore.setUnreadMessage((data as FriendMessageType[]).filter(item => item.messageStatus === 0));
                    break;
                case 'getHistory':
                    hadRecords = data?.records?.length > 0;
                    if (!hadRecords) {
                        console.log('当前用户无聊天信息');
                    } else {
                        FriendStore.setFriendMessageHistory(data);
                    }
                    break;
                case 'PublicNewMessage':
                case 'PersonalNewMessage':
                    FriendStore.pushOneFriendMessage(data[0]);
                    break;
                case 'sendPersonalMessageSuccess':
                case 'sendToAllSuccess':
                    FriendStore.pushOneFriendMessage(data);
                    break;
                case 'readMessage':
                    FriendStore.removeUnreadMessage(json);
                    break;
                case 'revokeMessageSuccess':
                    FriendStore.revokeOneMessage(json);
                    break;
            }
        }
    });

    // Listen fo error
    websocket.addEventListener('error', function (event) {
        console.log('check websocket error', event);
    });
}

export function getHistoryMessages(friendUserId: string, pageNum: number, pageSize?: number, uuid?: string, type?: string, beginDate?: string, keyWord?: string) {
    const paras: any = {method: 'getHistory', friend: friendUserId, pageNum: pageNum};
    if (pageSize) {
        paras['pageSize'] = pageSize;
    }
    if (uuid) {
        paras['uuid'] = uuid;
    }
    if (type) {
        paras['type'] = type;
    }
    if (beginDate) {
        paras['beginDate'] = beginDate;
    }
    if (keyWord) {
        paras['keyWord'] = keyWord;
    }
    send(paras);
}

export function readMessage(userId: string, readId: number) {
    if (!userId || !readId) return;
    send({method: 'readMessage', userId, readId});
}

export function recallMessage(messageInfo?: FriendMessageType) {
    if (!messageInfo) return;
    const {messageId, messageReceiverId, messageSenderId} = messageInfo;
    send({method: 'revokeMessage', id: messageId, receiverId: messageReceiverId, senderId: messageSenderId});
}

function send(data: any) {
    if (!websocket) {
        // 目前先返回登陆页面，后面再看看要不要自动登录
        return console.error('请先登陆');
    }
    websocket.send(JSON.stringify(data));
}

export function clientDecrypt(data: string) {
    const a = clientEncryptor.decryptLong(data);
    return decodeURIComponent(a as string);
}

export function serverEncrypt(data: string) {
    return serverEncryptor.encryptLong(data);
}

function startPingTimer() {
    gotPong = false;
    if (!pingTimer) {
        pingTimer = setInterval(() => {
            console.warn('check websocket state', websocket.readyState, pingTimer);
            if (websocket.readyState === WebSocket.OPEN && gotPong) {
                gotPong = false;
                websocket.send('ping');
            } else {
                console.log('重新连接中 ==== ');
                initWebSocket();
            }
        }, delayTime);
    }
}

export function stopWebsocket() {
    pingTimer && clearInterval(pingTimer);
    websocket.close();
}
