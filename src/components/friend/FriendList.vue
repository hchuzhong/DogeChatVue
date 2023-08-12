<script lang="ts">
import {useFriendStore} from '../../store/module/friend';
import FrirendItem from './components/FrirendItem.vue';
import FriendChat from './components/FriendChat.vue';
import {API} from '../../request/api';
import {initWebSocket, websocket} from '../../request/websocket';
import {useAuthStore} from '../../store/module/auth';
import {mapActions, mapState} from 'pinia';
import {FriendInfoType} from '../../global/GlobalType';
import {useGlobalStore} from '../../store/module/global';
import Loading from '../common/Loading.vue';

interface dataType {
    chooseItemId: string;
    friendList: FriendInfoType[];
    resizeTimer: null | ReturnType<typeof setTimeout>;
    isLoading: boolean;
}

export default {
    components: {FrirendItem, FriendChat, Loading},
    computed: {
        ...mapState(useGlobalStore, ['isMobile'])
    },
    data(): dataType {
        return {
            chooseItemId: '',
            friendList: [],
            resizeTimer: null,
            isLoading: false
        };
    },
    methods: {
        ...mapActions(useFriendStore, ['setFriendList']),
        ...mapActions(useGlobalStore, ['setClientWidth']),
        actionChoose(chooseItemId: string) {
            console.log('item had been clicked', chooseItemId);
            this.chooseItemId = chooseItemId;
        },
        hadChooseItem() {
            return this.chooseItemId !== '';
        }
    },
    async created() {
        try {
            this.isLoading = true;
            const data = await API.getFriendList();
            // 检查有无自身数据
            const authStore = useAuthStore();
            if (!authStore.selfData.userId) {
                authStore.setSelfData(JSON.parse(localStorage.getItem('selfData') as string));
            }
            this.setFriendList(data?.data?.friends ?? []);
            this.friendList = data?.data?.friends ?? [];
            this.isLoading = false;
            if (!websocket) {
                initWebSocket();
            }
        } catch (error) {
            console.log(error);
        }
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
    <div class="w-screen h-screen overflow-hidden">
        <div class="flex min-w-full border rounded min-h-[80%] max-h-full">
            <div v-show="!isMobile || !hadChooseItem()" class="col-span-1 bg-white border-r border-gray-300 h-screen overflow-y-auto" :class="isMobile ? 'w-full' : 'w-80 '">
                <!-- {/* 搜索框 */} -->
                <div class="my-3 mx-3">
                    <div class="relative text-gray-600 focus-within:text-gray-400">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-2">
                            <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" class="w-6 h-6 text-gray-500">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </span>
                        <input aria-placeholder="目前还不能搜索" placeholder="目前还不能搜索" class="py-2 pl-10 block w-full rounded bg-gray-100 outline-none focus:text-gray-700" type="search" name="search" required autoComplete="search" />
                    </div>
                </div>
                <Loading v-if="isLoading" class="mx-auto" />
                <!-- {/* 好友列表 */} -->
                <ul v-else-if="friendList.length">
                    <FrirendItem v-for="item in friendList" :key="item.userId" :chooseItemId="chooseItemId" :friendItemInfo="item" @click="actionChoose(item.userId)" />
                </ul>
                <div v-else class="text-center">暂无好友</div>
            </div>
            <!-- {/* 聊天界面 */} -->
            <div v-show="!isMobile || hadChooseItem()" class="flex-1 h-screen col-span-2 bg-white">
                <button v-if="isMobile" class="cursor-pointer absolute left-2 top-4" @click="chooseItemId = ''">
                    <svg class="icon text-gray-400 h-5 w-5" aria-hidden="true">
                        <use xlink:href="#icon-xiangzuojiantou"></use>
                    </svg>
                </button>
                <FriendChat :chooseItemId="chooseItemId" />
            </div>
        </div>
    </div>
</template>
