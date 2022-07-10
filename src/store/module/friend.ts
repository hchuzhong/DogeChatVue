import {defineStore} from 'pinia';
import {FriendStoreType, FriendInfoType, FriendMessageType, FriendMessageHistoryType} from '../../global/GlobalType';
import {useAuthStore} from './auth';

export const useFriendStore = defineStore('friend', {
    state: (): FriendStoreType => {
        return {
            // 同时维护数组和对象
            // friendList and unreadMessage should use object, the key is friend id
            friendList: [],
            unreadMessage: [],
            friendListObj: {},
            unreadMessageObj: {}
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
            // TODO 未读相关的逻辑还没做
            // this.unreadMessage = unreadMessage;
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
                messageHistory.userId = friendId;
            }
            this.friendListObj[friendId].messageHistory = messageHistory;
        },
        getFriendMessageHistory(friendId: string) {
            console.log('获取数据的地方');
            return this.friendListObj[friendId].messageHistory.records;
        },
        pushOneFriendMessage(data: FriendMessageType) {
            console.log('更新单条消息 ------', data);
            const AuthStore = useAuthStore();
            const isSelf = AuthStore.isSelf(data.messageReceiverId);
            const friendId = isSelf ? data.messageSenderId : data.messageReceiverId;
            if (!this.friendListObj[friendId].messageHistory) return;
            this.friendListObj[friendId].messageHistory.records.push(data);
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
        }
    }
});
