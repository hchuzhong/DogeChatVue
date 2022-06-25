<script lang="ts">
import {mapActions, mapStores} from 'pinia';
import {useAuthStore} from '../store/module/auth';

// TODO 重置密码和创建账号页面还没搞
export default {
    data() {
        return {
            form: {
                username: '',
                password: '',
                confirmPassword: ''
            }
        };
    },
    computed: {
        ...mapStores(useAuthStore)
    },
    methods: {
        ...mapActions(useAuthStore, ['setUsername']),
        ...mapActions(useAuthStore, ['setPassword']),
        ...mapActions(useAuthStore, ['login']),
        submit() {
            console.log('登陆按钮被点击了 ==== ');
            if (this.form.username === '') {
                return alert('请输入用户名');
            }
            if (this.form.password === '') {
                return alert('请输入密码');
            }
            this.setUsername(this.form.username);
            this.setPassword(this.form.password);
            const callback = () => {
                console.log('查看路由跳转 ==== ');
                this.$router.push({path: '/friendlist'});
            };
            this.login(callback);
        }
    }
};
</script>

<template>
    <div>
        <div class="h-screen bg-indigo-100 flex justify-center items-center">
            <div class="lg:w-2/5 md:w-1/2 w-2/3">
                <form class="bg-white p-10 rounded-lg shadow-lg min-w-full">
                    <h1 class="text-center text-2xl mb-6 text-gray-600 font-bold font-sans">登录</h1>
                    <div>
                        <label class="text-gray-800 font-semibold block my-3 text-md" htmlFor="username"> Username </label>
                        <input id="username" v-model="form.username" class="w-full bg-gray-100 px-4 py-2 rounded-lg focus:outline-none" type="text" name="username" placeholder="用户名" />
                    </div>
                    <div>
                        <label class="text-gray-800 font-semibold block my-3 text-md" htmlFor="password"> Password </label>
                        <input id="password" v-model="form.password" class="w-full bg-gray-100 px-4 py-2 rounded-lg focus:outline-none" type="password" name="password" placeholder="密码" />
                    </div>
                    <button type="submit" class="w-full mt-6 bg-indigo-600 rounded-lg px-4 py-2 text-lg text-white tracking-wide font-semibold font-sans" @click.prevent="submit">登录</button>
                    <span class="text-sm ml-2 hover:text-blue-500 cursor-pointer" @click="forget"> Forgot Password ? </span>
                    <div class="text-center mt-12">
                        <span>Don't have an account?</span>
                        <a href="#" class="text-md text-indigo-600 underline font-semibold hover:text-indigo-800"> Create One </a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
