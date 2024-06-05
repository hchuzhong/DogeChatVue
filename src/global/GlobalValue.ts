import {API} from '../request/api';
import EventHub from './EventHub';
import {FriendMessageType, messageType, messageTypeToChinese} from './GlobalType';

export const wssBaseUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/webSocket';

export const EventName = {
    UnreadMessage: 'UnreadMessage',
    UpdateMessageHistory: 'UpdateMessageHistory',
    UpdateOneMessage: 'UpdateOneMessage',
    QuoteMessage: 'QuoteMessage'
};

export const deviceType = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 7 : 6; // 6 for PC, 7 for mobile

export const mobileMaxWidth = 768;

export const autoLoginItem = 'autoLoginItem';

export const textModeItem = 'textModeItem';

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
            window.crypto.subtle
                .exportKey('pkcs8', key.privateKey)
                .then(function (keydata1) {
                    window.crypto.subtle
                        .exportKey('spki', key.publicKey)
                        .then(function (keydata2) {
                            const privateKey = RSA2text(keydata1);
                            const publicKey = RSA2text(keydata2);
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

let eventBus: EventHub | null = null;
export function EventBus(): EventHub {
    if (!eventBus) eventBus = new EventHub();
    return eventBus;
}

const PictureArr = [messageType.image, messageType.livePhoto, messageType.draw, messageType.sticker, messageType.photo];
export function getMessageData(message?: FriendMessageType) {
    if (!message) return '';
    const isText = message.type === messageType.text;
    const isPicture = PictureArr.includes(message.type);
    let content = '';
    let width = 0, height = 0;
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
        // get width and height
        if (content.includes('+')) {
            const info = content.split('.')[0].split('+');
            width = Number(info[1] ?? 0);
            height = Number(info[2] ?? 0);
        } else {
            const params = new URLSearchParams(`?${content.split('?')[1]}`);
            width = Number(params.get('width') ?? 0);
            height = Number(params.get('height') ?? 0);
        }
        width > 300 && (height = height * 300 / width);
    } else if (isText) {
        content = (message as FriendMessageType).messageContent;
    } else {
        content = `暂不支持 【${messageTypeToChinese[message.type]}】 类型数据`;
    }
    return {content, isText, isPicture, width, height};
}

export function showFullScreenImage(imageUrl: string) {
    const image = new Image()
    image.src = imageUrl
    image.onload = () => {
        //创建弹出层
        const previewContatiner = document.createElement('div');
        previewContatiner.style.position = 'fixed';
        previewContatiner.style.top = 0;
        previewContatiner.style.bottom = 0;
        previewContatiner.style.left = 0;
        previewContatiner.style.right = 0;
        previewContatiner.style.zIndex = 9999;
        previewContatiner.style.backgroundColor = 'rgba(0,0,0,0.8)';
        previewContatiner.style.display = 'flex';
        previewContatiner.style.justifyContent = 'center';
        previewContatiner.style.alignItems = 'center';
        document.body.appendChild(previewContatiner);
        //在弹出层增加图片
        const previewImage = document.createElement('img');
        previewImage.src = imageUrl;
        previewImage.style.maxWidth = '90%';
        previewImage.style.maxHeight = '90%';
        previewImage.style.zIndex = 9999;
        previewContatiner.appendChild(previewImage);
        //点击弹出层，关闭预览
        previewContatiner.addEventListener('click', () => {
            document.body.removeChild(previewContatiner);
            window.removeEventListener("keydown", clickEscape);
        })
        const clickEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                document.body.removeChild(previewContatiner);
                window.removeEventListener("keydown", clickEscape);
            }
        }
        window.addEventListener("keydown", clickEscape);
    }
    image.onerror = function () {
        console.log('图片加载失败');
    }
}