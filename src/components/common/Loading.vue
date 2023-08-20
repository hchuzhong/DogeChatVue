<template>
    <div class="loading spinning border-2 border-solid border-gray-100 border-t-cyan-600"></div>
</template>

<style>
.loading {
    width: 30px;
    height: 30px;
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
