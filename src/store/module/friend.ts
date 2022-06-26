import {defineStore} from 'pinia';
import {FriendInfoType, FriendMessageType} from '../../global/GlobalType';

type FriendStoreType = {
    friendList: FriendInfoType[];
    unreadMessage: FriendMessageType[];
};

export const useFriendStore = defineStore('friend', {
    state: (): FriendStoreType => {
        return {
            friendList: [],
            unreadMessage: []
        };
    },
    actions: {
        setFriendList(friendList: FriendInfoType[]) {
            // 考虑在这里遍历一下然后把 content 给解密
            this.friendList = friendList;
        },
        setUnreadMessage(unreadMessage: FriendMessageType[]) {
            this.unreadMessage = unreadMessage;
        },
        // 切换好友和最开始获取好友消息的时候使用这个逻辑，后面如果再点击这个好友的时候就检查有无数据同时数据的长度大于 1
        // 有的话就不需要重复请求了
        setFriendMessageHistory(friendId: string, messageHistory: any) {
            for (const friendInfo of this.friendList) {
                if (friendInfo.userId === friendId) {
                    friendInfo.messageHistory = messageHistory;
                    break;
                }
            }
        },
        resetFriendList() {
            this.friendList = [];
        },
        resetUnreadMessage() {
            this.unreadMessage = [];
        },
        reset() {
            this.friendList = [];
            this.unreadMessage = [];
        }
    }
});
