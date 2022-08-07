import {defineStore} from 'pinia';
import {FriendStoreType, FriendInfoType, FriendMessageType, FriendMessageHistoryType, EmojiType} from '../../global/GlobalType';
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
            unreadMessageObj: {},
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
                if (!unreadMessageObj[message.messageSenderId]) unreadMessageObj[message.messageSenderId] = [];
                message.messageContent = clientDecrypt(message.messageContent);
                unreadMessageObj[message.messageSenderId].push(message);
            }
            console.log('check unread message object 11111 ');
            console.log(unreadMessageObj);
            for (const friendId in unreadMessageObj) {
                if (!this.friendListObj[friendId]) return console.log(`userId: ${friendId} donest exit in friend list`);
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
                messageHistory.records.forEach(message => (message.messageContent = clientDecrypt(message.messageContent)));
                messageHistory.userId = friendId;
            }
            this.friendListObj[friendId].messageHistory = messageHistory;
            EventBus().dispatchEvent(EventName.UpdateMessageHistory);
        },
        getFriendMessageHistory(friendId: string) {
            console.log('获取好友历史消息的地方');
            return this.friendListObj[friendId]?.messageHistory?.records || [];
        },
        pushOneFriendMessage(data: FriendMessageType) {
            console.log('更新单条消息 ------', data);
            const AuthStore = useAuthStore();
            const isSelf = AuthStore.isSelf(data.messageReceiverId);
            const friendId = isSelf ? data.messageSenderId : data.messageReceiverId;
            data.messageContent = clientDecrypt(data.messageContent);
            this.pushOneUnreadMessage(friendId, data);
            if (!this.friendListObj[friendId].messageHistory) return;
            this.friendListObj[friendId].messageHistory.records.push(data);
            EventBus().dispatchEvent(EventName.UpdateMessageHistory, friendId);
        },
        pushOneUnreadMessage(friendId: string, data: FriendMessageType) {
            if (!this.friendListObj[friendId].unreadMessageHistory) this.friendListObj[friendId].unreadMessageHistory = [];
            this.friendListObj[friendId].unreadMessageHistory.push(data);
            EventBus().dispatchEvent(EventName.UnreadMessage, friendId);
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
            this.unreadMessageObj = {};
        },
        reset() {
            this.resetFriendList();
            this.resetUnreadMessage();
        },
        setEmojiArr(data: EmojiType[]) {
            if (data && data.length !== 0) {
                data.forEach(item => (item.content = API.getPictureUrl(clientDecrypt(item.content))));
            }
            this.emojiArr = data || [];
        }
    }
});
