<script lang="ts">
import {useFriendStore} from '../../store/module/friend';
import FrirendItem from './components/FrirendItem.vue';
import FriendChat from './components/FriendChat.vue';
import {API} from '../../request/api';
import {initWebSocket, sendPageVisible, websocket} from '../../request/websocket';
import {useAuthStore} from '../../store/module/auth';
import {mapActions, mapState} from 'pinia';
import {FriendRequestHistoryType} from '../../global/GlobalType';
import {useGlobalStore} from '../../store/module/global';
import Loading from '../common/Loading.vue';
import UserInfoItem from './components/UserInfoItem.vue';
import FriendRequest from './components/FriendRequest.vue';
import Setting from '../Setting.vue';
import {EventBus, EventName, isMobileDevice} from '../../global/GlobalValue';

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
        ...mapState(useGlobalStore, ['isMobile', 'pageVisible']),
        ...mapState(useAuthStore, ['selfData']),
        ...mapState(useFriendStore, ['friendList']),
        hadChooseItem(): boolean {
            return this.chooseItemId !== '';
        },
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
        ...mapActions(useGlobalStore, ['setClientWidth', 'setPageVisible']),
        ...mapActions(useAuthStore, ['setSelfData', 'isSelf']),
        actionChoose(chooseItemId: string = '') {
            this.chooseItemId = chooseItemId;
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
                this.friendRequestHistory.length && (this.hadNewRequest = !this.friendRequestHistory[0].friendRequestStatus);
            } catch (error) {
                console.log(error);
            }
        }
    },
    async created() {
        this.initData();
        EventBus().addEventListener(EventName.ChooseFriendId, this.actionChoose);
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
        document.addEventListener("visibilitychange", async () => {
            const visible = document.visibilityState === 'visible';
            this.setPageVisible(visible);
            sendPageVisible(visible);
            if (isMobileDevice() && this.pageVisible) {
                const chooseItemId = this.chooseItemId;
                this.actionChoose();
                await this.initData();
                this.actionChoose(chooseItemId);
            }
        });
        if (this.$route.query?.userId) {
            if (websocket && websocket.readyState === 1 && this.friendList.length) this.actionChoose(this.$route.query?.userId as string);
            else {
                let choose = false;
                const timer = setInterval(() => {
                    if (choose) return clearInterval(timer);
                    if (websocket && websocket.readyState === 1 && this.friendList.length) {
                        this.actionChoose(this.$route.query?.userId as string);
                        choose = true;
                    }
                }, 1000)
            }
        }
    },
    unmounted() {
        EventBus().removeEventListener(EventName.ChooseFriendId, this.actionChoose);
    }
};
</script>

<template>
    <div class="w-screen h-self-screen overflow-hidden">
        <div class="flex min-w-full rounded min-h-[80%] max-h-full">
            <div v-show="!isMobile || !hadChooseItem" class="col-span-1 bg-white dark:bg-gray-800 border-r-[0.2px] border-gray-400 h-self-screen overflow-y-auto" :class="isMobile ? 'w-full' : 'w-80 '">
                <div v-if="!(showFriendRequestVisible || showSetting)" class="border-b-[0.2px] py-2 px-4 flex items-center justify-between">
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
                <!-- init vConsole visible -->
                <Setting v-show="false" @returnFriendList="showSetting = false" />
            </div>
            <!-- {/* 聊天界面 */} -->
            <div v-show="!isMobile || hadChooseItem" class="flex-1 h-self-screen col-span-2 bg-white dark:bg-gray-800">
                <FriendChat :chooseItemId="chooseItemId" @resetChooseItemId="actionChoose()" />
            </div>
        </div>
    </div>
</template>
