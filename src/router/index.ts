import {createRouter, createWebHashHistory} from "vue-router";
import Login from "../components/Login.vue";
import Test from "../components/Test.vue";

const routes = [
    {path: "/", component: Login},
    {path: "/test", component: Test}
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;
