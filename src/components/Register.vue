<script lang="ts">
import {mapActions, mapState} from 'pinia';
import {useCounterStore} from '../store/module/counter';

export default {
    computed: {
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
        <span>this is a login page</span>
        <div>{{ count }}</div>
        <button @click="increment()">add 1</button>
    </div>
</template>
