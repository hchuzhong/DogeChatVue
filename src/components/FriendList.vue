<script lang="ts">
import {mapActions, mapState, mapStores} from 'pinia';
import {useCounterStore} from '../store/module/counter';

export default {
    computed: {
        ...mapStores(useCounterStore),
        ...mapState(useCounterStore, ['count'])
    },
    methods: {
        ...mapActions(useCounterStore, ['increment']),
        actionAdd() {
            this.increment();
        }
    }
};
</script>

<template>
    <div>
        这里是好友列表页面
        <span>this is a login page</span>
        <div>{{ count }}</div>
        <button @click="increment()">add 1</button>
    </div>
</template>
