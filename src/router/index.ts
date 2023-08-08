import {createRouter, createWebHashHistory} from 'vue-router';
import Login from '../components/Login.vue';
import Register from '../components/Register.vue';
import FriendList from '../components/friend/FriendList.vue';

const routes = [
    {path: '/', component: Login},
    {path: '/login', component: Login},
    {path: '/register', component: Register},
    {path: '/forget-passport', component: Register},
    {path: '/friend-list', component: FriendList}
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;
