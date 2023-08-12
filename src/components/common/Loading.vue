<template>
    <div class="loading spinning"></div>
</template>

<script>
export default {};
</script>

<style>
.loading {
    width: 30px;
    height: 30px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top: 2px solid rgb(59 130 246);
    border-radius: 100%;
}

.spinning {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
