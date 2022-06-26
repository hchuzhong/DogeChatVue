import {defineStore} from 'pinia';
import {FriendMessageHistoryType, FriendMessageType} from '../../global/GlobalType';

export const useFriendMessageStore = defineStore('friendMessage', {
    state: (): {values: FriendMessageHistoryType} => {
        return {
            values: {
                current: 0,
                pages: 0,
                records: [],
                size: 0,
                total: 0,
                userId: ''
            }
        };
    },

    actions: {
        setFriendMessage(data: FriendMessageHistoryType) {
            if (data.records.length !== 0) {
                data.records.reverse();
                this.values.userId = data.records[0].messageReceiverId;
            }
            this.values = data;
        },

        updateFriendMessage(data: FriendMessageHistoryType) {
            if (this.values.current !== data.current) {
                const newRecords = data.records.reverse();
                this.values.records.concat(newRecords);
            }
        },

        pushOneFriendMessage(data: FriendMessageType) {
            console.log('更新单条消息 ------', data);
            this.values.records.push(data);
        },

        resetFriendMessage() {
            this.values = {current: 0, pages: 0, records: [], size: 0, total: 0, userId: ''};
        }
    }
});
