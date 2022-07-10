<script lang="ts">
import {mapState, mapStores} from 'pinia';
import {useFriendStore} from '../../store/module/friend';
import FrirendItem from './components/FrirendItem.vue';
import FriendChat from './components/FriendChat.vue';

export default {
    components: {FrirendItem, FriendChat},
    computed: {
        ...mapStores(useFriendStore),
        ...mapState(useFriendStore, ['friendList'])
    },
    data() {
        return {
            chooseItemId: ''
        };
    },
    methods: {
        actionChoose(chooseItemId: string) {
            console.log('item had been clicked', chooseItemId);
            this.chooseItemId = chooseItemId;
        }
    }
};
</script>

<template>
    <div class="w-screen h-screen">
        <div class="grid grid-cols-3 min-w-full border rounded min-h-[80vh] max-h-[100vh]">
            <div class="col-span-1 bg-white border-r border-gray-300">
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

                <!-- {/* 好友列表 */} -->
                <ul class="overflow-auto">
                    <!-- <div v-for="item in friendList" :key="item.userId" @click="actionChoose(item.userId)"> -->
                    <FrirendItem v-for="item in friendList" :key="item.userId" :chooseItemId="chooseItemId" :friendItemInfo="item" @click="actionChoose(item.userId)" />
                    <!-- </div> -->
                </ul>
            </div>
            <!-- {/* 聊天界面 */} -->
            <div class="h-screen col-span-2 bg-white">
                <FriendChat :chooseItemId="chooseItemId" />
            </div>
        </div>
    </div>
</template>