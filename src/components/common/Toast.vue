<script lang="ts">
export default {
    props: {
        message: String,
        duration: {
            type: Number,
            default: 1500 // 默认显示时间（毫秒）
        },
        close: Function
    },
    data() {
        return {
            show: false
        };
    },
    watch: {
        message: {
            immediate: true,
            handler() {
                this.showToast();
            }
        }
    },
    methods: {
        showToast() {
            this.show = true;
            setTimeout(() => {
                this.show = false;
                this.close?.();
            }, this.duration);
        }
    }
};
</script>

<template>
    <div v-if="show" class="toast-container">
        <div class="toast">{{ message }}</div>
    </div>
</template>

<style scoped>
.toast-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    animation: spin 1.5s linear;
}

@keyframes spin {
    0% {
        transform: translate(-50%, 40px);
        opacity: 0.5;
    }
    30% {
        transform: translate(-50%, 0);
        opacity: 1;
    }
    60% {
        opacity: 1;
    }
    100% {
        transform: translateX(-50%);
        opacity: 0;
    }
}

.toast {
    background-color: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 10px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
