<script lang="ts">
import {mapActions} from 'pinia';
import {useAuthStore} from '../store/module/auth';
import toast from './common/toast';

export default {
    data() {
        return {
            form: {
                username: '',
                password: ''
            }
        };
    },
    methods: {
        ...mapActions(useAuthStore, ['login']),
        submit() {
            if (this.form.username === '') {
                return toast('请输入用户名');
            }
            if (this.form.password === '') {
                return toast('请输入密码');
            }
            this.login(this.form.username, this.form.password, this.$router);
        }
    }
};
</script>

<template>
    <div>
        <div class="h-screen bg-blue-100 flex justify-center items-center">
            <div class="lg:w-2/5 md:w-1/2 w-2/3">
                <form class="bg-white p-10 rounded-lg shadow-lg min-w-full">
                    <h1 class="text-center text-2xl mb-6 text-gray-600 font-bold font-sans">登录</h1>
                    <div>
                        <label class="text-gray-800 font-semibold block my-3 text-md" htmlFor="username"> 用户名 </label>
                        <input id="username" v-model="form.username" class="w-full bg-gray-100 px-4 py-2 rounded-lg focus:outline-none" type="text" name="username" placeholder="请输入用户名" />
                    </div>
                    <div>
                        <label class="text-gray-800 font-semibold block my-3 text-md" htmlFor="password"> 密码 </label>
                        <input id="password" v-model="form.password" class="w-full bg-gray-100 px-4 py-2 rounded-lg focus:outline-none" type="password" name="password" placeholder="请输入密码" />
                    </div>
                    <button type="submit" class="w-full mt-6 bg-blue-600 rounded-lg px-4 py-2 text-lg text-white tracking-wide font-semibold font-sans" @click.prevent="submit">登录</button>
                    <router-link class="text-sm ml-2 hover:text-blue-500 cursor-pointer" to="/forget-passport"> 忘记密码 ? </router-link>
                    <div class="text-center mt-12">
                        <span>还未拥有账号?</span>
                        <router-link class="text-md text-blue-600 underline font-semibold hover:text-blue-800" to="/register"> 创建一个 </router-link>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
