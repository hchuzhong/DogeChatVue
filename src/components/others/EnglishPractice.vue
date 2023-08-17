<template>
    <div class="flex flex-col justify-center items-center mt-20">
        <div class="mb-10 text-xl text-gray-500">Total Left Time: {{ allTime }}</div>
        <div class="text-bold text-2xl">Current Task: {{ currentConfig.text }}</div>
        <div class="mt-2">Current Task Left Time: {{ leftTime }}</div>
        <div>
            <button class="border-2 px-2 py-1 mt-4 rounded-xl" @click="changeState">{{ isStop ? '继续' : '暂停' }}</button>
            <button class="border-2 px-2 py-1 mt-4 rounded-xl ml-4" @click="reset">reset</button>
        </div>
    </div>
</template>

<script lang="ts">
const timeConfig = {
    halfMinute: 30,
    minute: 60,
    oneAndAHalfMinute: 90,
    towMinutes: 120
};

export default {
    computed: {
        currentConfig(): {text: string; time: number} {
            return this.config[this.currentStep];
        }
    },
    data() {
        return {
            allTime: timeConfig.halfMinute * 7 + timeConfig.minute * 3 + timeConfig.oneAndAHalfMinute * 3 + timeConfig.towMinutes * 2,
            leftTime: timeConfig.minute,
            config: [
                {text: 'talk about yourself', time: timeConfig.minute},
                {text: 'Pause', time: timeConfig.halfMinute},
                {text: 'talk about friend', time: timeConfig.minute},
                {text: 'Pause', time: timeConfig.halfMinute},
                {text: 'talk about something in your room while you look it at', time: timeConfig.minute},
                {text: 'Pause', time: timeConfig.halfMinute},
                {text: 'talk about something you ate', time: timeConfig.oneAndAHalfMinute},
                {text: 'Pause', time: timeConfig.halfMinute},
                {text: 'talk about your parents', time: timeConfig.oneAndAHalfMinute},
                {text: 'Pause', time: timeConfig.halfMinute},
                {text: 'talk about a celebrity', time: timeConfig.oneAndAHalfMinute},
                {text: 'Pause', time: timeConfig.halfMinute},
                {text: 'talk about something you are wearing', time: timeConfig.towMinutes},
                {text: 'Pause', time: timeConfig.halfMinute},
                {text: 'talk about one of your goals', time: timeConfig.towMinutes}
            ],
            currentStep: 0,
            isStop: false
        };
    },
    mounted() {
        this.countDown();
    },
    methods: {
        countDown() {
            if (this.isStop) return;
            if (!this.allTime) return;
            if (!this.leftTime) {
                this.currentStep++;
                this.leftTime = this.currentConfig.time;
                this.countDown();
                return;
            }
            this.leftTime--;
            this.allTime--;
            setTimeout(this.countDown, 1000);
        },
        changeState() {
            this.isStop = !this.isStop;
            !this.isStop && this.countDown();
        },
        reset() {
            const pastTime = this.currentConfig.time - this.leftTime;
            this.leftTime = this.currentConfig.time;
            this.allTime += pastTime;
        }
    }
};
</script>
