<script lang="ts">
import {EmojiType, FriendInfoType, FriendMessageType, GroupMemberType, messageType} from '../../../global/GlobalType';
import {clientDecrypt, serverEncrypt, websocket} from '../../../request/websocket';
import {mapActions, mapState} from 'pinia';
import {useAuthStore} from '../../../store/module/auth';
import {v4 as uuidv4} from 'uuid';
import type {PropType} from 'vue';
import {API} from '../../../request/api';
import {useFriendStore} from '../../../store/module/friend';
import {EventBus, EventName, getImageInfo, getVideoInfo} from '../../../global/GlobalValue';
import {OnClickOutside} from '@vueuse/components';
import QuoteMessage from './QuoteMessage.vue';
import toast from '../../common/toast';
import UserInfoItem from './UserInfoItem.vue';
import EmojiList from './EmojiList.vue';

type dataType = {
    inputMessage: string;
    emojiVisible: boolean;
    groupMembersVisible: boolean;
    selectedGroupMemberIndex: number;
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
    components: {OnClickOutside, QuoteMessage, UserInfoItem, EmojiList},
    computed: {
        ...mapState(useAuthStore, ['selfData']),
        ...mapState(useFriendStore, ['publicEmojiArr', 'personalEmojiArr']),
        isGroup(): boolean {
            return this.chooseFriendInfo?.isGroup === '1';
        }
    },
    data(): dataType {
        return {
            inputMessage: '',
            emojiVisible: false,
            groupMembersVisible: false,
            selectedGroupMemberIndex: 0,
            notifiedArr: [],
            quoteMessage: null
        };
    },
    methods: {
        ...mapActions(useFriendStore, ['setPublicEmojiArr', 'setPersonalEmojiArr']),
        sendTextMessage() {
            if (!this.inputMessage) return toast('请输入信息');
            this.sendMessage(this.inputMessage);
            this.inputMessage = '';
        },
        sendEmojiMessage(url: string) {
            this.sendMessage(url, messageType.sticker);
        },
        sendPhotoAndVideoMessage(url: string, isVideo: boolean) {
            const type = isVideo ? messageType.video : messageType.photo;
            this.sendMessage(url, type);
        },
        sendMessage(content: string, type = messageType.text, sendQuoteMessage = true, repeatNotifiedParty = '') {
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
                    notifiedParty: repeatNotifiedParty ? repeatNotifiedParty : notifiedParty,
                    messageReceiver: this.chooseFriendInfo?.username,
                    isGroup: this.isGroup || false,
                    messageReceiverId: this.chooseFriendInfo?.userId,
                    uuid: uuidv4()
                }
            };
            // @ts-ignore
            sendQuoteMessage && this.quoteMessage && (messageData.message.referMessageUuid = this.quoteMessage.uuid);
            websocket.send(JSON.stringify(messageData));
            sendQuoteMessage && EventBus().dispatchEvent(EventName.QuoteMessage);
            this.$emit('sendMessage');
        },
        inputPaste(event: ClipboardEvent) {
            event.preventDefault();
            const items = event.clipboardData?.items;
            if (!items?.length) return;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const isFile = item.type.includes('image') || item.type.includes('video');
                if (!isFile) continue;
                const blob = item.getAsFile();
                return blob && this.beforeSend(blob);
            }
            this.inputMessage += event.clipboardData?.getData('text') ?? '';
        },
        onFileChange(event: Event) {
            const files = (event?.target as HTMLInputElement)?.files;
            if (!files?.length) return;
            this.beforeSend(files[0]);
        },
        beforeSend(file: File) {
            const isVideo = file.type.includes('video');
            const cb = async (infoStr: string, cbFile: File) => {
                const formData = new FormData();
                formData.append('upload', cbFile);
                const result = await API.uploadImg(formData);
                if (result.data?.status === 'fail') return toast(result.data?.message);
                const filePath = clientDecrypt(result.data.filePath);
                this.sendPhotoAndVideoMessage(`${filePath}?${infoStr}`, isVideo);
            };
            const fn = isVideo ? getVideoInfo: getImageInfo;
            fn(file, cb)
        },
        clickUploadImage() {
            const fileInput = this.$refs?.fileInput as HTMLInputElement;
            if (!fileInput) return;
            fileInput.value = '';
            fileInput.click();
        },
        getImageSrc(src: string) {
            return API.getPictureUrl(src);
        },
        atMember(memberInfo: GroupMemberType) {
            // 同一个人只能 @ 一次
            if (this.notifiedArr.find(item => item.username === memberInfo.username)) return;
            const name = memberInfo.nickName ? memberInfo.nickName : memberInfo.username;
            // @ts-ignore
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
        },
        clickKeyboardDown() {
            if (!(this.groupMembersVisible && this.isGroup)) return;
            if (!this.groupMembersData) return;
            if (this.selectedGroupMemberIndex < this.groupMembersData.length - 1) {
                this.selectedGroupMemberIndex += 1;
                // 计算当前展示的 item 的位置
                this.calculateCurrentItemPosition();
            }
        },
        clickKeyboardUp() {
            if (!(this.groupMembersVisible && this.isGroup)) return;
            if (this.selectedGroupMemberIndex > 0) {
                this.selectedGroupMemberIndex -= 1;
                this.calculateCurrentItemPosition();
            }
        },
        clickKeyboardEnter() {
            if (this.groupMembersVisible && this.isGroup && this.groupMembersData) {
                this.atMember(this.groupMembersData[this.selectedGroupMemberIndex]);
                this.selectedGroupMemberIndex = 0;
                this.calculateCurrentItemPosition();
            } else {
                this.sendTextMessage();
            }
        },
        calculateCurrentItemPosition() {
            const refGroupMembers = this.$refs.groupMembers as HTMLDivElement;
            // item height is 32, scroll when the selected item invisible
            refGroupMembers.scrollTop = (this.selectedGroupMemberIndex >= 5 ? this.selectedGroupMemberIndex : 0) * 32;
        },
        async removeSticker(starId: string) {
            const result = await API.removeStar(starId);
            if (result.data.status === "success") {
                this.getStar();
                return toast("表情已删除");
            }
            return toast("操作失败");
        },
        async getStar() {
            try {
                const data = await API.getStar();
                const publicEmojiArr = data?.data?.data.filter((item: EmojiType) => item.type === '');
                const personalEmojiArr = data?.data?.data.filter((item: EmojiType) => item.type === 'favorite');
                this.setPublicEmojiArr(publicEmojiArr);
                this.setPersonalEmojiArr(personalEmojiArr);
            } catch (error) {
                console.log(error);
            }
        }
    },
    async created() {
        if (!this.publicEmojiArr || (this.publicEmojiArr && this.publicEmojiArr.length === 0)) {
            this.getStar();
        }
    }
};
</script>

<template>
    <div>
        <OnClickOutside @trigger="groupMembersVisible = false">
            <div v-show="groupMembersVisible && isGroup" ref="groupMembers" class="absolute bottom-[56px] left-20 w-40 max-h-40 z-10 border rounded-lg border-solid shadow bg-white dark:bg-gray-800 overflow-y-auto">
                <UserInfoItem v-for="(member, memberIndex) in groupMembersData" :key="member.userId" class="px-2 py-1 cursor-pointer rounded-lg" :class="{'bg-gray-400': memberIndex === selectedGroupMemberIndex}" :userInfo="{username: `${member.username}${member.nickName ? '(' + member.nickName + ')' : ''}`, avatarUrl: member.avatarUrl}" size="small" :needBold="false" @click="atMember(member)" />
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
                <input ref="fileInput" class="hidden" type="file" accept="image/*, video/*" :multiple="false" @change="onFileChange" />
            </button>

            <input ref="messageInput" v-model="inputMessage" aria-placeholder="想说点啥" placeholder="想说点啥" class="py-2 mx-3 px-5 block w-full rounded-full bg-gray-100 outline-none focus:text-gray-700" type="text" name="message" autocomplete="off" required @keypress.enter="clickKeyboardEnter" @keyup.down="clickKeyboardDown" @keyup.up="clickKeyboardUp" @paste="inputPaste" @input="checkForAtSymbol" />

            <button class="outline-none focus:outline-none" type="submit" @click="sendTextMessage">
                <svg class="icon text-gray-400 h-7 w-7 origin-center transform rotate-90" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </div>
        <OnClickOutside @trigger="emojiVisible = false">
            <div v-show="emojiVisible" class="w-full h-52 overflow-y-auto flex flex-wrap justify-center cannotselect">
                <emoji-list :publicEmojiArr="publicEmojiArr" :personalEmojiArr="personalEmojiArr" @sendEmojiMessage="sendEmojiMessage" @removeSticker="removeSticker" />
            </div>
        </OnClickOutside>
    </div>
</template>
