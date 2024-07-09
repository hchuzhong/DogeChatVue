<script lang="ts">
import { PropType } from 'vue';
import UserInfoItem from './UserInfoItem.vue';
import { FriendInfoType, GroupMemberType, MutedFriendNotificationType } from '../../../global/GlobalType';
import { API } from '../../../request/api';
import toast from '../../common/toast';
import { mapActions, mapState } from 'pinia';
import { useFriendStore } from '../../../store/module/friend';
import { useAuthStore } from '../../../store/module/auth';

export default {
    components: { UserInfoItem },
    props: {
        friendInfo: {} as PropType<FriendInfoType>,
        groupMembersData: Array as PropType<GroupMemberType[]>,
    },
    computed: {
        ...mapState(useAuthStore, ['selfData']),
        isGroup(): boolean {
            return this.friendInfo?.isGroup === '1';
        },
        isMuted(): boolean {
            return this.friendInfo?.isMuted === '1';
        },
        userId(): string {
            return this.selfData?.userId ?? '';
        }
    },
    data() {
        return {};
    },
    mounted() {
    },
    methods: {
        ...mapActions(useFriendStore, ['setFriend']),
        removeUser(member: GroupMemberType) {
            console.log(member);
        },
        async changeMutedState(event: Event) {
            // @ts-ignore
            const isMuted = (event.target?.checked ?? false) ? '1' : '0';
            const data: MutedFriendNotificationType = {
                friend: this.friendInfo?.userId ?? '',
                isGroup: this.friendInfo?.isGroup ?? '0',
                isMuted: isMuted,
                userId: this.friendInfo?.userId ?? '',
            }
            const response = await API.mutedFriendNotification(data);
            const success = response.data.message === 'success';
            toast(success ? '操作成功' : '操作失败')
            success && this.getFriend();
        },
        async getFriend() {
            const response = await API.getFriend(this.friendInfo?.userId ?? '');
            const success = response.data.status === 'success';
            if (!success) return;
            this.setFriend(response.data.data);
        }
    },
};
</script>

<template>
    <div class="relative">
        <button class="absolute w-[50px] h-[50px] flex justify-center items-center" @click="$emit('returnFriendChat')">
            <svg class="icon text-gray-400 dark:text-gray-200 h-5 w-5" aria-hidden="true">
                <use xlink:href="#icon-xiangzuojiantou"></use>
            </svg>
        </button>
        <UserInfoItem :userInfo="friendInfo" class="justify-center border-b-[0.2px] border-gray-400 py-2 cursor-pointer" />
        <div v-show="isGroup" ref="groupMembers" class="p-2">
            <div>群组成员</div>
            <UserInfoItem v-for="member in groupMembersData" :key="member.userId" class="p-1 cursor-pointer" :userInfo="{username: `${member.username}${member.nickName ? '(' + member.nickName + ')' : ''}`, avatarUrl: member.avatarUrl}" :needBold="false" size="middle" @click="removeUser(member)" />
        </div>
        <div class="flex p-1">
            <span class="pr-2">关闭通知</span>
            <input type="checkbox" class="cursor-pointer" :checked="isMuted" @change="changeMutedState" />
        </div>
    </div>
</template>
