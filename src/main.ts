import {createApp} from 'vue';
import App from './App.vue';
import './index.css';
import router from './router';
import piniaStore from './store';
import VueLazyload from 'vue-lazyload';
import { EventBus, EventName } from './global/GlobalValue';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(error => {
        console.log('ServiceWorker registration failed: ', error);
    });

    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.action === 'notification-clicked') {
            EventBus().dispatchEvent(EventName.ChooseFriendId, event.data.friendId)
        }
    });
}

createApp(App).use(router).use(piniaStore).use(VueLazyload).mount('#app');
