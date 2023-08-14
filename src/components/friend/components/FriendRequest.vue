<script lang="ts">
import {API} from '../../../request/api';
import {FriendRequestHistoryType, GroupMemberType} from '../../../global/GlobalType';
import {useAuthStore} from '../../../store/module/auth';
import {mapActions, mapState} from 'pinia';
import {useFriendStore} from '../../../store/module/friend';
import {PropType} from 'vue';
import UserInfoItem from './UserInfoItem.vue';
import {OnClickOutside} from '@vueuse/components';
import toast from '../../common/toast';

interface dataType {
    inputName: string;
    searchResult: GroupMemberType[];
    showSearchResult: boolean;
}

export default {
    components: {UserInfoItem, OnClickOutside},
    props: {
        friendRequestHistory: [] as PropType<FriendRequestHistoryType[]>
    },
    data(): dataType {
        return {
            inputName: '',
            searchResult: [],
            showSearchResult: false
        };
    },
    computed: {
        ...mapState(useFriendStore, ['friendList']),
        ...mapState(useAuthStore, ['selfData'])
    },
    methods: {
        ...mapActions(useAuthStore, ['isSelf']),
        async searchFriend() {
            if (!this.inputName) return;
            const result = await API.getSearchResult(this.inputName);
            this.showSearchResult = true;
            this.searchResult = result?.data ?? [];
        },
        async requestToBeFriend(requestFriendInfo: GroupMemberType) {
            if (this.isSelf(requestFriendInfo.userId)) return toast('无法添加自己为好友');
            const checkFriendExist = this.friendList.find(friendInfo => friendInfo.userId === requestFriendInfo.userId);
            if (checkFriendExist) return toast('该用户已是你的好友');
            const data = {
                requesterId: this.selfData.userId,
                requester: this.selfData.username,
                requestedId: requestFriendInfo.userId,
                requested: requestFriendInfo.username
            };
            const result = await API.sendFriendRequest(data);
            toast(result?.data?.message ?? '添加不成功，请稍后重试');
            this.showSearchResult = false;
            this.inputName = '';
        },
        getImageSrc(src: string) {
            return API.getPictureUrl(src);
        },
        async acceptRequest(friendRequestId: number) {
            const acceptResult = await API.acceptFriendRequest(friendRequestId);
            toast(acceptResult?.data?.message);
            if (acceptResult?.data?.status === 'success') {
                this.$emit('updateFriendAbout');
            }
        }
    }
};
</script>

<template>
    <div class="flex flex-col">
        <!-- header -->
        <div class="flex items-center w-full p-2 border-b-2">
            <button class="flex items-center" @click="$emit('returnFriendList')">
                <svg class="icon text-gray-400 h-4 w-4" aria-hidden="true">
                    <use xlink:href="#icon-xiangzuojiantou"></use>
                </svg>
                <span class="text-gray-400 pl-1">{{ selfData.username }}</span>
            </button>
            <div class="relative text-gray-600 focus-within:text-gray-400 pl-2 flex-1">
                <span class="absolute inset-y-0 left-1 flex items-center pl-2">
                    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" class="w-6 h-6 text-gray-500">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </span>
                <input v-model="inputName" aria-placeholder="搜索好友" placeholder="搜索好友" class="py-2 pl-10 pr-2 block w-full rounded bg-gray-100 outline-none focus:text-gray-700" type="search" name="search" required autoComplete="search" @keypress.enter="searchFriend" />
            </div>
        </div>
        <div>
            <div v-for="friendRequest in friendRequestHistory" :key="friendRequest.friendRequestId" class="border-b p-2 flex justify-between items-center">
                <UserInfoItem :userInfo="{username: friendRequest.friendRequester, avatarUrl: friendRequest.friendRequestedAvatarUrl}" :needBold="false">
                    <template v-slot:content>
                        <span class="text-gray-400 text-sm">{{ friendRequest.requestTime }}</span>
                    </template>
                </UserInfoItem>
                <div v-if="friendRequest.friendRequestStatus" class="text-gray-400">已添加</div>
                <button v-else class="border border-slate-400 rounded py-1 px-2" @click="acceptRequest(friendRequest.friendRequestId)">加为好友</button>
            </div>
        </div>
        <OnClickOutside @trigger="showSearchResult = false">
            <div v-if="showSearchResult" class="absolute max-w-full h-60 top-14 left-24 border-2 rounded-lg py-2 px-4 border-solid shadow bg-white overflow-y-auto">
                <div class="font-semibold text-base text-gray-600 pb-1">搜索结果如下：</div>
                <div v-if="searchResult.length">
                    <div v-for="friendInfo in searchResult" :key="friendInfo.userId + 'search'" class="flex items-center py-1 cursor-pointer" @click="requestToBeFriend(friendInfo)">
                        <img class="h-8 w-8 rounded-full object-cover" :src="getImageSrc(friendInfo.avatarUrl)" alt="avtar" />
                        <span class="block ml-2 text-m text-gray-600"> {{ friendInfo.username }} </span>
                    </div>
                </div>
                <div v-else class="text-sm text-gray-600">查询不到名称为"{{ inputName }}"的用户</div>
            </div>
        </OnClickOutside>
    </div>
</template>