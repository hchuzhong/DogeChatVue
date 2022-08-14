import {createApp} from 'vue';
import App from './App.vue';
import './index.css';
import router from './router';
import piniaStore from './store';
import VueLazyload from 'vue-lazyload';

createApp(App).use(router).use(piniaStore).use(VueLazyload).mount('#app');
