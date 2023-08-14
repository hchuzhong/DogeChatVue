import {defineStore} from 'pinia';
import {FriendStoreType, FriendInfoType, FriendMessageType, FriendMessageHistoryType, EmojiType, RemoveMessageType} from '../../global/GlobalType';
import {EventBus, EventName} from '../../global/GlobalValue';
import {API} from '../../request/api';
import {clientDecrypt} from '../../request/websocket';
import {useAuthStore} from './auth';

export const useFriendStore = defineStore('friend', {
    state: (): FriendStoreType => {
        return {
            // 同时维护数组和对象
            // friendList and unreadMessage should use object, the key is friend id
            friendList: [],
            unreadMessage: [],
            friendListObj: {},
            emojiArr: []
        };
    },
    actions: {
        setFriendList(friendList: FriendInfoType[]) {
            this.friendList = friendList;
            friendList.forEach(friendInfo => {
                this.friendListObj[friendInfo.userId] = friendInfo;
            });
        },
        setUnreadMessage(unreadMessage: FriendMessageType[]) {
            const unreadMessageObj: {[key: string]: FriendMessageType[]} = {};
            for (const message of unreadMessage) {
                const AuthStore = useAuthStore();
                const isSelf = AuthStore.isSelf(message.messageReceiverId);
                const friendId = isSelf ? message.messageSenderId : message.messageReceiverId;
                if (!unreadMessageObj[friendId]) unreadMessageObj[friendId] = [];
                this.decryptMessageContent(message);
                unreadMessageObj[friendId].push(message);
            }
            console.log('check unread message object 11111 ');
            console.log(unreadMessageObj);
            for (const friendId in unreadMessageObj) {
                if (!this.friendListObj[friendId]) return console.log(`userId: ${friendId} dones't exit in friend list`);
                unreadMessageObj[friendId].sort((a, b) => a.timeStamp - b.timeStamp);
                this.friendListObj[friendId].unreadMessageHistory = unreadMessageObj[friendId];
            }
            EventBus().dispatchEvent(EventName.UnreadMessage);
        },
        setFriendMessageHistory(messageHistory: FriendMessageHistoryType) {
            // messageHistory 只在 friendListObj 中维护
            const records = messageHistory?.records;
            if (!records || records.length === 0) return;
            const AuthStore = useAuthStore();
            const isSelf = AuthStore.isSelf(records[0].messageReceiverId);
            const friendId = isSelf ? records[0].messageSenderId : records[0].messageReceiverId;
            if (messageHistory.records.length !== 0) {
                messageHistory.records.sort((a, b) => a.timeStamp - b.timeStamp);
                messageHistory.records.forEach(message => this.decryptMessageContent(message));
                messageHistory.userId = friendId;
            }
            if (!this.friendListObj[friendId].messageHistory) this.friendListObj[friendId].messageHistory = messageHistory;
            else {
                const oldRecords = this.friendListObj[friendId].messageHistory.records;
                this.friendListObj[friendId].messageHistory = messageHistory;
                this.friendListObj[friendId].messageHistory.records = messageHistory.records.concat(oldRecords);
            }
            EventBus().dispatchEvent(EventName.UpdateMessageHistory);
        },
        getFriendMessageHistory(friendId: string) {
            console.log('获取好友历史消息的地方');
            return this.friendListObj[friendId]?.messageHistory?.records || [];
        },
        getFriendMessagePage(friendId: string) {
            return this.friendListObj[friendId]?.messageHistory?.current || 1;
        },
        pushOneFriendMessage(data: FriendMessageType) {
            console.log('更新单条消息 ------', data);
            const AuthStore = useAuthStore();
            const isSelf = AuthStore.isSelf(data.messageReceiverId);
            const friendId = isSelf ? data.messageSenderId : data.messageReceiverId;
            this.decryptMessageContent(data);
            console.log('查看解密后的 data', data);
            this.pushOneUnreadMessage(friendId, data);
            if (!this.friendListObj[friendId].messageHistory) return;
            this.friendListObj[friendId].messageHistory.records.push(data);
            const eventData = {friendId, needScroll: true};
            EventBus().dispatchEvent(EventName.UpdateOneMessage, eventData);
        },
        pushOneUnreadMessage(friendId: string, data: FriendMessageType) {
            if (!this.friendListObj[friendId].unreadMessageHistory) this.friendListObj[friendId].unreadMessageHistory = [];
            this.friendListObj[friendId].unreadMessageHistory.push(data);
            this.friendListObj[friendId].message = data;
            this.friendList.sort((a, b) => {
                if (!a?.message?.timeStamp && !b?.message?.timeStamp) return 0;
                if (!a?.message?.timeStamp) return 1;
                if (!b?.message?.timeStamp) return -1;
                return b.message.timeStamp - a.message.timeStamp;
            });
            EventBus().dispatchEvent(EventName.UnreadMessage, friendId);
        },
        revokeOneMessage(removeMessage: RemoveMessageType) {
            const recallMessage = this.friendListObj[removeMessage.messageReceiverId]?.messageHistory?.records.find(message => message.messageId === removeMessage.id);
            if (!recallMessage) return;
            recallMessage.messageStatus = -1;
            recallMessage.messageContent = `该消息已被撤回`;
        },
        getFriendUnreadMessage(friendId: string) {
            console.log('获取好友未读消息的地方');
            return this.friendListObj[friendId]?.unreadMessageHistory || [];
        },
        resetFriendList() {
            this.friendList = [];
            this.friendListObj = {};
        },
        resetUnreadMessage() {
            this.unreadMessage = [];
        },
        reset() {
            this.resetFriendList();
            this.resetUnreadMessage();
        },
        setEmojiArr(data: EmojiType[]) {
            if (!data || !data?.length) return (this.emojiArr = []);
            this.emojiArr = [];
            let start = 0;
            const dataNum = data.length;
            const delayFn = () => {
                setTimeout(() => {
                    for (let i = start; i < Math.min(start + 100, dataNum); i++) {
                        data[i].content = API.getPictureUrl(clientDecrypt(data[i].content));
                        this.emojiArr.push(data[i]);
                    }
                    if (start + 100 < dataNum) {
                        start += 100;
                        delayFn();
                    }
                }, 1000);
            };
            delayFn();
        },
        decryptMessageContent(message: FriendMessageType) {
            message.messageContent = clientDecrypt(message.messageContent);
            message?.referMessage && (message.referMessage.messageContent = clientDecrypt(message.referMessage.messageContent as string));
        },
        removeUnreadMessage(data: {userId: string}) {
            this.friendListObj[data.userId].unreadMessageHistory = [];
            EventBus().dispatchEvent(EventName.UnreadMessage);
        }
    }
});
