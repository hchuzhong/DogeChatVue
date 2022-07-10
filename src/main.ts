import {createApp} from 'vue';
import App from './App.vue';
import './index.css';
import router from './router';
import piniaStore from './store';

createApp(App).use(router).use(piniaStore).mount('#app');
