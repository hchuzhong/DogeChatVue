import {API} from '../request/api';
import EventHub from './EventHub';
import {FriendMessageType, messageType, messageTypeToChinese} from './GlobalType';

export const wssBaseUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/webSocket';

export function getRsaKeys(callback: any) {
    return window.crypto.subtle
        .generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 1024, //can be 1024, 2048, or 4096
                publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                hash: {name: 'SHA-512'} //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
            },
            true, //whether the key is extractable (i.e. can be used in exportKey)
            ['encrypt', 'decrypt'] //must be ["encrypt", "decrypt"] or ["wrapKey", "unwrapKey"]
        )
        .then(function (key) {
            console.log('window.crypto.subtle.exportKey =====1', key);
            window.crypto.subtle
                .exportKey('pkcs8', key.privateKey)
                .then(function (keydata1) {
                    console.log('window.crypto.subtle.exportKey =====2', keydata1);
                    window.crypto.subtle
                        .exportKey('spki', key.publicKey)
                        .then(function (keydata2) {
                            console.log('window.crypto.subtle.exportKey =====3', keydata2);
                            const privateKey = RSA2text(keydata1);
                            const publicKey = RSA2text(keydata2);
                            console.log(privateKey);
                            console.log(publicKey);
                            callback(privateKey, publicKey);
                        })
                        .catch(function (err) {
                            console.error(err);
                        });
                })
                .catch(function (err) {
                    console.error(err);
                });
        })
        .catch(function (err) {
            console.error(err);
        });
}

export function RSA2text(buffer: any) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    // eslint-disable-next-line
        return base64.replace(/[^\x00-\xff]/g, "$&\x01").replace(/.{64}\x01?/g, "$&\n");
}

export function getImageInfo(file: File, cb: Function) {
    const imgSrc = window.URL.createObjectURL(file);
    const img = new Image();
    img.src = imgSrc;
    document.body.appendChild(img);
    img.onload = () => {
        const width = img.offsetWidth;
        const height = img.offsetHeight;
        document.body.removeChild(img);
        const infoStr = `width=${width}&height=${height}`;
        cb?.(infoStr);
    };
}

// export function encrpypt(params: any) {}

let eventBus: EventHub | null = null;
export function EventBus(): EventHub {
    if (!eventBus) eventBus = new EventHub();
    return eventBus;
}

export const EventName = {
    UnreadMessage: 'UnreadMessage',
    UpdateMessageHistory: 'UpdateMessageHistory',
    UpdateOneMessage: 'UpdateOneMessage',
    QuoteMessage: 'QuoteMessage'
};

export const deviceType = 6;

const PictureArr = [messageType.image, messageType.livePhoto, messageType.draw, messageType.sticker, messageType.photo];
export function getMessageData(message?: FriendMessageType) {
    if (!message) return '';
    const isText = message.type === messageType.text;
    const isPicture = PictureArr.includes(message.type);
    let content = '';
    if (isPicture) {
        switch (message?.type) {
            case messageType.sticker:
            case messageType.photo:
            case messageType.image:
                content = API.getPictureUrl(message.messageContent);
                break;
            case messageType.draw:
                content = API.getPictureUrl(message.drawImage);
                break;
        }
    } else if (isText) {
        content = (message as FriendMessageType).messageContent;
    } else {
        content = `暂不支持 【${messageTypeToChinese[message.type]}】 类型数据`;
    }
    return {content, isText, isPicture};
}

export const mobileMaxWidth = 768;
