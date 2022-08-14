<script lang="ts">
import {FriendInfoType, messageType} from '../../../global/GlobalType';
import {serverEncrypt, websocket} from '../../../request/websocket';
import {mapActions, mapState, mapStores} from 'pinia';
import {useAuthStore} from '../../../store/module/auth';
import {v4 as uuidv4} from 'uuid';
import {PropType} from 'vue-demi';
import {API} from '../../../request/api';
import {useFriendStore} from '../../../store/module/friend';

export default {
    props: {
        chooseFriendInfo: {} as PropType<FriendInfoType>
    },
    computed: {
        ...mapStores(useAuthStore),
        ...mapState(useAuthStore, ['serverPubliKey']),
        ...mapState(useAuthStore, ['selfData']),
        ...mapState(useFriendStore, ['emojiArr'])
    },
    data() {
        return {
            inputMessage: '',
            showEmoji: false
        };
    },
    methods: {
        ...mapActions(useFriendStore, ['setEmojiArr']),
        sendTextMessage() {
            if (!this.inputMessage) return alert('请输入信息');
            this.sendMessage(this.inputMessage);
            this.inputMessage = '';
        },
        sendEmojiMessage(url: string) {
            this.sendMessage(url.replaceAll('%2B', '+'), messageType.image);
        },
        sendMessage(content: string, type = messageType.text) {
            const selfData = this.selfData;
            const msg = serverEncrypt(content);
            const messageData = {
                method: this.chooseFriendInfo?.isGroup === '1' ? 'PublicNewMessage' : 'PersonalNewMessage',
                message: {
                    type,
                    messageSenderId: selfData.userId,
                    // 只有 messageContent 需要加密
                    messageContent: msg,
                    messageSender: selfData.username,
                    notifiedParty: [],
                    messageReceiver: this.chooseFriendInfo?.username,
                    isGroup: this.chooseFriendInfo?.isGroup || false,
                    messageReceiverId: this.chooseFriendInfo?.userId,
                    uuid: uuidv4()
                }
            };
            console.log('send data');
            console.log(messageData);
            websocket.send(JSON.stringify(messageData));
        }
    },
    created() {
        console.error('获取表情包的地方');
        console.log(this.emojiArr);
        if (!this.emojiArr || (this.emojiArr && this.emojiArr.length === 0)) {
            API.getStar().then(data => {
                console.log('获取表情包数据 ==== ');
                console.log(data);
                this.setEmojiArr(data?.data?.data);
                console.log(this.emojiArr);
            });
        }
    }
};
</script>

<template>
    <div>
        <div class="w-full py-3 px-3 flex items-center justify-between border-t border-gray-300">
            <button class="outline-none focus:outline-none" @click="showEmoji = !showEmoji">
                <svg class="text-gray-400 h-6 w-6" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor">
                    <use xlink:href="#icon-biaoqing"></use>
                </svg>
            </button>

            <input v-model="inputMessage" aria-placeholder="想说点啥" placeholder="想说点啥" class="py-2 mx-3 pl-5 block w-full rounded-full bg-gray-100 outline-none focus:text-gray-700" type="text" name="message" required @keypress.enter="sendTextMessage" />

            <button class="outline-none focus:outline-none" type="submit" @click="sendTextMessage">
                <svg class="text-gray-400 h-7 w-7 origin-center transform rotate-90" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </div>
        <div v-show="showEmoji" class="w-full h-52 overflow-y-auto flex flex-wrap justify-center">
            <span v-for="item in emojiArr" :key="item.starId" class="w-24 h-24 flex justify-center items-center cursor-pointer" @click="sendEmojiMessage(item.content)">
                <img :id="item.starId" v-lazy="item.content" alt="表情" class="max-w-[80px] max-h-20" />
            </span>
        </div>
    </div>
</template>
