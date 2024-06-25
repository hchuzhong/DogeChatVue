<script lang="ts">
import { defineComponent, ref, defineProps } from 'vue';

export default {
    props: {
        videoSource: String
    },
    data() {
        return {
            showVideo: false
        }
    },
    methods: {
    }
}
</script>

<template>
    <div class="flex justify-center items-center h-full cursor-pointer">
        <div @click="showVideo = true">视频</div>
        <div v-if="showVideo" class="fixed top-0 bottom-0 left-0 right-0 z-[9999] bg-[rgba(0,0,0,0.8)] flex justify-center items-center" @click="showVideo=false">
            <video ref="videoPlayer" controls style="max-width: 90%; max-height: 90%;">
                <source :src="videoSource" type="video/mp4" />
            </video>
        </div>
    </div>
</template>
