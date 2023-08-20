<script lang="ts">
import {useFriendStore} from '../../store/module/friend';
import FrirendItem from './components/FrirendItem.vue';
import FriendChat from './components/FriendChat.vue';
import {API} from '../../request/api';
import {initWebSocket, websocket} from '../../request/websocket';
import {useAuthStore} from '../../store/module/auth';
import {mapActions, mapState} from 'pinia';
import {FriendRequestHistoryType} from '../../global/GlobalType';
import {useGlobalStore} from '../../store/module/global';
import Loading from '../common/Loading.vue';
import UserInfoItem from './components/UserInfoItem.vue';
import FriendRequest from './components/FriendRequest.vue';
import Setting from '../Setting.vue';

interface dataType {
    chooseItemId: string;
    resizeTimer: null | ReturnType<typeof setTimeout>;
    isLoading: boolean;
    friendRequestHistory: FriendRequestHistoryType[];
    hadNewRequest: boolean;
    showFriendRequestVisible: boolean;
    showSetting: boolean;
}

export default {
    components: {FrirendItem, FriendChat, Loading, UserInfoItem, FriendRequest, Setting},
    computed: {
        ...mapState(useGlobalStore, ['isMobile']),
        ...mapState(useAuthStore, ['selfData']),
        ...mapState(useFriendStore, ['friendList'])
    },
    data(): dataType {
        return {
            chooseItemId: '',
            resizeTimer: null,
            isLoading: false,
            friendRequestHistory: [],
            hadNewRequest: false,
            showFriendRequestVisible: false,
            showSetting: false
        };
    },
    methods: {
        ...mapActions(useFriendStore, ['setFriendList']),
        ...mapActions(useGlobalStore, ['setClientWidth']),
        ...mapActions(useAuthStore, ['setSelfData', 'isSelf']),
        actionChoose(chooseItemId: string) {
            this.chooseItemId = chooseItemId;
        },
        hadChooseItem() {
            return this.chooseItemId !== '';
        },
        getImageSrc(src: string) {
            return API.getPictureUrl(src);
        },
        checkAddFriendMessage() {
            this.showFriendRequestVisible = true;
            this.hadNewRequest = false;
        },
        async initData() {
            try {
                this.isLoading = true;
                const data = await API.getFriendList();
                // 检查有无自身数据
                if (!this.selfData.userId) {
                    this.setSelfData(JSON.parse(localStorage.getItem('selfData') as string));
                }
                this.setFriendList(data?.data?.friends ?? []);
                this.isLoading = false;
                if (!websocket || (websocket && websocket.readyState !== 1)) {
                    initWebSocket();
                }
                const friendRequestData = await API.getFriendRequest();
                this.friendRequestHistory = friendRequestData?.data ?? [];
                this.friendRequestHistory.reverse();
                this.friendRequestHistory && (this.hadNewRequest = !this.friendRequestHistory[0].friendRequestStatus);
            } catch (error) {
                console.log(error);
            }
        }
    },
    async created() {
        this.initData();
    },
    mounted() {
        this.setClientWidth(document.body.clientWidth);
        window.addEventListener('resize', () => {
            if (this.resizeTimer) clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                this.setClientWidth(document.body.clientWidth);
                this.resizeTimer = null;
            }, 100);
        });
    }
};
</script>

<template>
    <div class="w-screen h-self-screen overflow-hidden">
        <div class="flex min-w-full border rounded min-h-[80%] max-h-full">
            <div v-show="!isMobile || !hadChooseItem()" class="col-span-1 bg-white dark:bg-gray-800 border-r border-gray-400 h-self-screen overflow-y-auto" :class="isMobile ? 'w-full' : 'w-80 '">
                <div v-if="!(showFriendRequestVisible || showSetting)" class="border-b-2 py-2 px-4 flex items-center justify-between">
                    <button class="flex" @click="showSetting = true">
                        <svg class="icon text-gray-400 dark:text-gray-200 h-5 w-5" aria-hidden="true">
                            <use xlink:href="#icon-setting"></use>
                        </svg>
                    </button>
                    <UserInfoItem :userInfo="selfData" />
                    <button class="flex" @click="checkAddFriendMessage">
                        <svg class="icon text-gray-400 dark:text-gray-200 h-5 w-5" aria-hidden="true">
                            <use xlink:href="#icon-friend"></use>
                        </svg>
                        <div v-if="hadNewRequest" class="w-1 h-1 rounded bg-red-600"></div>
                    </button>
                </div>
                <FriendRequest v-if="showFriendRequestVisible" :friendRequestHistory="friendRequestHistory" @returnFriendList="showFriendRequestVisible = false" @updateFriendAbout="initData" />
                <Setting v-else-if="showSetting" @returnFriendList="showSetting = false" />
                <Loading v-else-if="isLoading" class="mx-auto" />
                <!-- {/* 好友列表 */} -->
                <ul v-else-if="friendList.length">
                    <FrirendItem v-for="item in friendList" :key="item.userId" :chooseItemId="chooseItemId" :friendItemInfo="item" @click="actionChoose(item.userId)" />
                </ul>
                <div v-else class="text-center text-gray-600 dark:text-gray-400">暂无好友</div>
            </div>
            <!-- {/* 聊天界面 */} -->
            <div v-show="!isMobile || hadChooseItem()" class="flex-1 h-self-screen col-span-2 bg-white dark:bg-gray-800">
                <button v-if="isMobile" class="absolute left-2 top-4" @click="chooseItemId = ''">
                    <svg class="icon text-gray-400 dark:text-gray-200 h-5 w-5" aria-hidden="true">
                        <use xlink:href="#icon-xiangzuojiantou"></use>
                    </svg>
                </button>
                <FriendChat :chooseItemId="chooseItemId" />
            </div>
        </div>
    </div>
</template>
