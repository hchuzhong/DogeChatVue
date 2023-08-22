import {createRouter, createWebHashHistory} from 'vue-router';
import Login from '../components/Login.vue';
import Register from '../components/Register.vue';
import FriendList from '../components/friend/FriendList.vue';
import EnglishPractice from '../components/others/EnglishPractice.vue';
import {useAuthStore} from '../store/module/auth';

const routes = [
    {path: '/', component: Login},
    {path: '/login', component: Login},
    {path: '/register', component: Register},
    {path: '/forget-passport', component: Register},
    {path: '/friend-list', component: FriendList},
    {path: '/english-practice', component: EnglishPractice}
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    if (to.path === '/' || to.path === '/login') return next();
    if (!useAuthStore()?.selfData?.userId) return next('/login');
    next();
});

export default router;
