<template>
    <div
        ref="swipeContainer"
        class="w-full overflow-hidden relative"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown="onMouseDown"
    >
        <div class="flex transition" :style="{ transform: `translateX(${offset}px)` }">
            <div class="min-w-full h-52 overflow-y-auto flex flex-wrap justify-center cannotselect" v-for="(content, index) in contents" :key="index">
                <span v-for="item in content" :key="item.starId" class="w-24 h-24 flex justify-center items-center cursor-pointer relative" >
                    <img :id="item.starId" v-lazy="item.content" alt="表情" class="max-w-[80px] max-h-20" @click="$emit('sendEmojiMessage', item.content)" />
                    <button class="outline-none focus:outline-none absolute right-0 top-0 opacity-30" @click="$emit('removeSticker', item.starId)">
                        <svg class="icon text-gray-400 dark:text-white h-5 w-5" aria-hidden="true" stroke="currentColor">
                            <use xlink:href="#icon-cancel"></use>
                        </svg>
                    </button>
                </span>
                <div v-if="!publicEmojiArr.length">暂无表情包</div>
            </div>
        </div>
        <div class="absolute top-0 left-1/2 translate-x-[-50%] flex gap-2 bg-white dark:bg-gray-800 rounded-full">
            <span
                v-for="(content, index) in contents"
                :key="index"
                :class="{'w-2 h-2 rounded-full bg-gray-800  dark:bg-white': true, '!bg-cyan-500': currentIndex === index}"
            ></span>
        </div>
    </div>
</template>

<script lang="ts">
import { useFriendStore } from '../../../store/module/friend';
import { mapState } from 'pinia';
import { EmojiType } from '../../../global/GlobalType';

type dataType = {
    startX: number;
    currentX: number;
    offset: number;
    currentIndex: number;
    isDragging: boolean;
}

export default {
    computed: {
        ...mapState(useFriendStore, ['publicEmojiArr', 'personalEmojiArr']),
        contents(): EmojiType[][] {
            return [this.publicEmojiArr, this.personalEmojiArr]
        }
    },
    data(): dataType {
        return {
            startX: 0,
            currentX: 0,
            offset: 0,
            currentIndex: 0,
            isDragging: false,
        }
    },
    mounted() {
    },
    unmounted() {
    },
    methods: {
        onTouchStart(event: TouchEvent) {
            this.startX = event.touches[0].clientX;
            this.currentX = this.startX;
        },
        onTouchMove(event: TouchEvent) {
            if (!this.isDragging) {
                this.currentX = event.touches[0].clientX;
            }
        },
        onTouchEnd () {
            this.handleSwipeEnd();
        },
        onMouseDown(event: MouseEvent) {
            this.startX = event.clientX;
            this.currentX = this.startX;
            this.isDragging = true;
            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('mouseup', this.onMouseUp);
        },
        onMouseMove(event: MouseEvent) {
            if (this.isDragging) {
                this.currentX = event.clientX;
            }
        },
        onMouseUp() {
            this.isDragging = false;
            document.removeEventListener('mousemove', this.onMouseMove);
            document.removeEventListener('mouseup', this.onMouseUp);
            this.handleSwipeEnd();
        },
        handleSwipeEnd() {
            const diffX = this.currentX - this.startX;
            if (Math.abs(diffX) > 50) {
                if (diffX < 0 && this.currentIndex < this.contents.length - 1) {
                    this.currentIndex += 1;
                } else if (diffX > 0 && this.currentIndex > 0) {
                    this.currentIndex -= 1;
                }
            }
            // @ts-ignore
            this.offset = -this.currentIndex * (this.$refs?.swipeContainer?.clientWidth ?? 0);
        }
    }
};
</script>

<style scoped>
.transition {
    transition: transform 0.3s ease;
}
</style>