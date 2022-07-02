<script lang="ts">
// import {PropType} from 'vue-demi';
// import {API} from '../../../request/api';
// import dayjs from 'dayjs';
import {FriendInfoType} from '../../../global/GlobalType';
import {websocket} from '../../../request/websocket';
import {mapState, mapStores} from 'pinia';
import {useAuthStore} from '../../../store/module/auth';
import JSEncrypt from 'jsencrypt';
import {v4 as uuidv4} from 'uuid';
import {PropType} from 'vue-demi';

export default {
    props: {
        chooseFriendInfo: {} as PropType<FriendInfoType>
    },
    computed: {
        ...mapStores(useAuthStore),
        ...mapState(useAuthStore, ['serverPubliKey']),
        ...mapState(useAuthStore, ['selfData'])
    },
    data() {
        return {
            inputMessage: ''
        };
    },
    methods: {
        sendMessage() {
            if (!this.inputMessage) return alert('请输入信息');
            // Public/PersonalNewMessage
            console.log('click send message button');
            const selfData = this.selfData;
            console.log(selfData);
            console.log(this.chooseFriendInfo);

            const encryptor = new JSEncrypt();
            encryptor.setPublicKey(this.serverPubliKey);
            const msg = encryptor.encrypt(this.inputMessage);

            const messageData = {
                method: this.chooseFriendInfo?.isGroup === '1' ? 'PublicNewMessage' : 'PersonalNewMessage',
                message: {
                    type: 'text',
                    messageSenderId: selfData.userId,
                    // 只有 messageContent 需要加密
                    messageContent: msg,
                    messageSender: selfData.username,
                    notifiedParty: [],
                    messageReceiver: this.chooseFriendInfo?.username,
                    isGroup: true,
                    messageReceiverId: this.chooseFriendInfo?.userId,
                    uuid: uuidv4()
                }
            };
            console.log('fakeData');
            console.log(messageData);
            websocket.send(JSON.stringify(messageData));
            this.inputMessage = '';
        }
    }
    // created() {}
};
</script>

<template>
    <div class="w-full py-3 px-3 flex items-center justify-between border-t border-gray-300">
        <button class="outline-none focus:outline-none">
            <svg class="text-gray-400 h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </button>
        <button class="outline-none focus:outline-none ml-1">
            <svg class="text-gray-400 h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
        </button>

        <input v-model="inputMessage" aria-placeholder="想说点啥" placeholder="想说点啥" class="py-2 mx-3 pl-5 block w-full rounded-full bg-gray-100 outline-none focus:text-gray-700" type="text" name="message" required />

        <button class="outline-none focus:outline-none" type="submit" @click="sendMessage">
            <svg class="text-gray-400 h-7 w-7 origin-center transform rotate-90" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
        </button>
    </div>
</template>
