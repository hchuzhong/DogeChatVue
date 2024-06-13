<script lang="ts">
import {FriendInfoType, FriendMessageType, GroupMemberType, messageType} from '../../../global/GlobalType';
import {clientDecrypt, serverEncrypt, websocket} from '../../../request/websocket';
import {mapActions, mapState} from 'pinia';
import {useAuthStore} from '../../../store/module/auth';
import {v4 as uuidv4} from 'uuid';
import type {PropType} from 'vue';
import {API} from '../../../request/api';
import {useFriendStore} from '../../../store/module/friend';
import {EventBus, EventName, getImageInfo} from '../../../global/GlobalValue';
import {OnClickOutside} from '@vueuse/components';
import QuoteMessage from './QuoteMessage.vue';
import toast from '../../common/toast';
import UserInfoItem from './UserInfoItem.vue';

type dataType = {
    inputMessage: string;
    emojiVisible: boolean;
    groupMembersVisible: boolean;
    notifiedArr: {userId: string; location: number; length: number; username: string; nickName: string}[];
    quoteMessage: null | FriendMessageType;
};

const at = '@';

export default {
    props: {
        chooseFriendInfo: {} as PropType<FriendInfoType>,
        groupMembersData: Array as PropType<GroupMemberType[]>,
        chooseItemId: String
    },
    components: {OnClickOutside, QuoteMessage, UserInfoItem},
    computed: {
        ...mapState(useAuthStore, ['selfData']),
        ...mapState(useFriendStore, ['emojiArr']),
        isGroup(): boolean {
            return this.chooseFriendInfo?.isGroup === '1';
        }
    },
    data(): dataType {
        return {
            inputMessage: '',
            emojiVisible: false,
            groupMembersVisible: false,
            notifiedArr: [],
            quoteMessage: null
        };
    },
    methods: {
        ...mapActions(useFriendStore, ['setEmojiArr']),
        sendTextMessage() {
            if (!this.inputMessage) return toast('请输入信息');
            this.sendMessage(this.inputMessage);
            this.inputMessage = '';
        },
        sendEmojiMessage(url: string) {
            this.sendMessage(url, messageType.sticker);
        },
        sendPhotoMessage(url: string) {
            this.sendMessage(url, messageType.photo);
        },
        sendMessage(content: string, type = messageType.text) {
            const selfData = this.selfData;
            const msg = serverEncrypt(encodeURIComponent(content));
            const notifiedParty: any[] = [];
            this.notifiedArr.forEach(notifyMember => {
                const {location, username, nickName, userId, length} = notifyMember;
                if (content[location - 1] === at) {
                    const name = content.slice(location, location + length);
                    if (name !== username && name !== nickName) return;
                    notifiedParty.push({[`${userId}`]: `location=${location}&length=${length}`});
                }
            });
            this.notifiedArr = [];
            const messageData = {
                method: this.isGroup ? 'PublicNewMessage' : 'PersonalNewMessage',
                message: {
                    type,
                    messageSenderId: selfData.userId,
                    // 只有 messageContent 需要加密
                    messageContent: msg,
                    messageSender: selfData.username,
                    notifiedParty,
                    messageReceiver: this.chooseFriendInfo?.username,
                    isGroup: this.isGroup || false,
                    messageReceiverId: this.chooseFriendInfo?.userId,
                    uuid: uuidv4()
                }
            };
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.quoteMessage && (messageData.message.referMessageUuid = this.quoteMessage.uuid);
            websocket.send(JSON.stringify(messageData));
            EventBus().dispatchEvent(EventName.QuoteMessage);
            this.$emit('sendMessage')
        },
        inputPaste(event: ClipboardEvent) {
            event.preventDefault();
            const items = event.clipboardData?.items;
            if (!items?.length) return;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const isFile = item.type.includes('image');
                if (!isFile) continue;
                const blob = item.getAsFile();
                return blob && this.beforeSendPhoto(blob);
            }
            this.inputMessage += event.clipboardData?.getData('text') ?? '';
        },
        onFileChange(event: Event) {
            const files = (event?.target as HTMLInputElement)?.files;
            if (!files?.length) return;
            this.beforeSendPhoto(files[0]);
        },
        beforeSendPhoto(file: File) {
            const maxSize = 5 * 1024 * 1024; // 图片大小限制 5M
            if (file.size > maxSize) {
                toast('图片大小不能超过 5MB');
                this.$refs.fileInput.value = '';
                return;
            }
            const cb = async (infoStr: string) => {
                const formData = new FormData();
                formData.append('upload', file);
                const result = await API.uploadImg(formData);
                const filePath = clientDecrypt(result.data.filePath);
                this.sendPhotoMessage(`${filePath}?${infoStr}`);
            };
            getImageInfo(file, cb);
        },
        clickUploadImage() {
            const fileInput = this.$refs?.fileInput as HTMLInputElement;
            if (!fileInput) return;
            fileInput.value = null;
            fileInput.click();
        },
        getImageSrc(src: string) {
            return API.getPictureUrl(src);
        },
        atMember(memberInfo: GroupMemberType) {
            // 同一个人只能 @ 一次
            if (this.notifiedArr.find(item => item.username === memberInfo.username)) return;
            const name = memberInfo.nickName ? memberInfo.nickName : memberInfo.username;
            this.notifiedArr.push({...memberInfo, location: this.inputMessage.length, length: name.length});
            this.inputMessage += name;
            this.groupMembersVisible = false;
            (this.$refs?.messageInput as HTMLInputElement).focus();
        },
        checkForAtSymbol() {
            this.groupMembersVisible = this.inputMessage[this.inputMessage.length - 1] === at;
            if (!this.inputMessage.includes(at)) return (this.notifiedArr = []);
            this.notifiedArr = this.notifiedArr.filter(notifiedMember => {
                const index = this.inputMessage.indexOf(`${at}${notifiedMember.nickName ? notifiedMember.nickName : notifiedMember.username}`);
                if (index === -1) return false;
                notifiedMember.location = index + 1;
                return true;
            });
        },
        getQuoteMessage(messageInfo: FriendMessageType) {
            this.quoteMessage = messageInfo;
            messageInfo && (this.$refs?.messageInput as HTMLInputElement).focus();
        },
        atQuoteMember() {
            const memberInfo = this.groupMembersData?.find(memberInfo => memberInfo.userId === this.quoteMessage?.messageSenderId);
            if (!memberInfo) return;
            this.inputMessage += '@';
            this.atMember(memberInfo);
        },
        showEmoji() {
            this.emojiVisible = true;
            this.$emit('showEmoji');
        }
    },
    async created() {
        if (!this.emojiArr || (this.emojiArr && this.emojiArr.length === 0)) {
            try {
                const data = await API.getStar();
                this.setEmojiArr(data?.data?.data);
            } catch (error) {
                console.log(error);
            }
        }
    }
};
</script>

<template>
    <div>
        <OnClickOutside @trigger="groupMembersVisible = false">
            <div v-show="groupMembersVisible && isGroup" class="absolute bottom-[56px] left-20 w-40 max-h-40 z-10 border rounded-lg p-2 border-solid shadow bg-white dark:bg-gray-800 overflow-y-auto">
                <UserInfoItem v-for="member in groupMembersData" :key="member.userId" class="py-1 cursor-pointer" :userInfo="{username: `${member.username}${member.nickName ? '(' + member.nickName + ')' : ''}`, avatarUrl: member.avatarUrl}" size="small" :needBold="false" @click="atMember(member)" />
            </div>
        </OnClickOutside>
        <QuoteMessage @quoteMessage="getQuoteMessage" @atQuoteMember="atQuoteMember" />
        <div class="w-full py-3 px-3 flex items-center justify-between border-t-[0.2px] border-gray-400">
            <button class="outline-none focus:outline-none" @click="showEmoji">
                <svg class="icon text-gray-400 h-6 w-6" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor">
                    <use xlink:href="#icon-biaoqing"></use>
                </svg>
            </button>
            <button class="outline-none focus:outline-none ml-1" @click="clickUploadImage">
                <svg class="icon text-gray-400 h-6 w-6" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor">
                    <use xlink:href="#icon-tupianshangchuan"></use>
                </svg>
                <input ref="fileInput" class="hidden" type="file" accept="image/*" :multiple="false" @change="onFileChange" />
            </button>

            <input ref="messageInput" v-model="inputMessage" aria-placeholder="想说点啥" placeholder="想说点啥" class="py-2 mx-3 px-5 block w-full rounded-full bg-gray-100 outline-none focus:text-gray-700" type="text" name="message" autocomplete="off" required @keypress.enter="sendTextMessage" @paste="inputPaste" @input="checkForAtSymbol" />

            <button class="outline-none focus:outline-none" type="submit" @click="sendTextMessage">
                <svg class="icon text-gray-400 h-7 w-7 origin-center transform rotate-90" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </div>
        <OnClickOutside @trigger="emojiVisible = false">
            <div v-show="emojiVisible" class="w-full h-52 overflow-y-auto flex flex-wrap justify-center">
                <span v-for="item in emojiArr" :key="item.starId" class="w-24 h-24 flex justify-center items-center cursor-pointer" @click="sendEmojiMessage(item.content)">
                    <img :id="item.starId" v-lazy="item.content" alt="表情" class="max-w-[80px] max-h-20" />
                </span>
                <div v-if="!emojiArr.length">暂无表情包</div>
            </div>
        </OnClickOutside>
    </div>
</template>
