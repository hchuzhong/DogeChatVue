<script lang="ts">
import {mapActions} from 'pinia';
import {useAuthStore} from '../store/module/auth';
import {API} from '../request/api';
import toast from './common/toast';

export default {
    data() {
        return {
            // 注册和忘记密码共用一个页面
            isRegister: true,
            form: {
                username: '',
                password: '',
                confirmPassword: '',
                email: '',
                validateCode: ''
            }
        };
    },
    methods: {
        ...mapActions(useAuthStore, ['login']),
        async submit() {
            if (!this.form.username) return toast('请输入用户名');
            if (!this.form.password) return toast('请输入密码');
            if (!this.form.confirmPassword) return toast('请输入确认密码');
            if (!this.form.email) return toast('请输入邮箱');
            if (!this.form.validateCode) return toast('请输入验证码');
            if (this.form.password !== this.form.confirmPassword) return toast('密码与确认密码不一致');
            if (!this.checkIsEmail()) return toast('邮箱格式有误');
            const method = this.isRegister ? API.register : API.resetPassword;
            try {
                const data = await method(this.form);
                const {status, message} = data.data;
                if (status === 'success') this.login(this.form.username, this.form.password, this.$router, this.$route);
                else toast(message);
            } catch (error) {
                console.log(error);
            }
        },
        async sendValidateCode() {
            if (!this.checkIsEmail()) return toast('邮箱格式有误');
            try {
                const data = await API.sendValidateCode(this.form.email, this.isRegister);
                toast(data.data.message);
            } catch (error) {
                console.log(error);
            }
        },
        checkIsEmail() {
            const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
            return emailPattern.test(this.form.email);
        }
    },
    created() {
        this.isRegister = this.$route.path.includes('register');
    }
};
</script>

<template>
    <div>
        <div class="h-self-screen bg-cyan-100 dark:bg-cyan-900 flex justify-center items-center">
            <div class="lg:w-2/5 md:w-1/2 w-2/3">
                <form class="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg min-w-full">
                    <h1 class="text-center text-2xl mb-6 text-gray-600 dark:text-gray-300 font-bold font-sans">{{ isRegister ? '注册' : '忘记密码' }}</h1>
                    <div>
                        <label class="text-gray-800 dark:text-gray-200 font-semibold block my-3 text-md" htmlFor="username"> 用户名 </label>
                        <input id="username" v-model="form.username" class="w-full bg-gray-100 px-4 py-2 rounded-lg focus:outline-none" type="text" name="username" placeholder="请输入用户名" />
                    </div>
                    <div>
                        <label class="text-gray-800 dark:text-gray-200 font-semibold block my-3 text-md" htmlFor="password"> 密码 </label>
                        <input id="password" v-model="form.password" class="w-full bg-gray-100 px-4 py-2 rounded-lg focus:outline-none" type="password" name="password" placeholder="请输入密码" />
                    </div>
                    <div>
                        <label class="text-gray-800 dark:text-gray-200 font-semibold block my-3 text-md" htmlFor="confirmPassword"> 确认密码 </label>
                        <input id="confirmPassword" v-model="form.confirmPassword" class="w-full bg-gray-100 px-4 py-2 rounded-lg focus:outline-none" type="password" name="confirmPassword" placeholder="请再次输入密码" />
                    </div>
                    <div>
                        <label class="text-gray-800 dark:text-gray-200 font-semibold block my-3 text-md" htmlFor="email"> 邮箱 </label>
                        <div class="flex justify-center align-items">
                            <input id="email" v-model="form.email" class="w-full bg-gray-100 px-4 py-2 rounded-lg focus:outline-none" type="text" name="email" placeholder="请输入邮箱" />
                            <button class="ml-2 bg-cyan-600 rounded-lg px-4 text-white tracking-wide font-semibold font-sans min-w-[66px]" @click.prevent="sendValidateCode">发送</button>
                        </div>
                    </div>
                    <div>
                        <label class="text-gray-800 dark:text-gray-200 font-semibold block my-3 text-md" htmlFor="validateCode"> 验证码 </label>
                        <input id="validateCode" v-model="form.validateCode" class="w-full bg-gray-100 px-4 py-2 rounded-lg focus:outline-none" type="text" name="validateCode" placeholder="请输入验证码" />
                    </div>
                    <button type="submit" class="w-full mt-6 bg-cyan-600 rounded-lg px-4 py-2 text-lg text-white tracking-wide font-semibold font-sans" @click.prevent="submit">确认</button>
                </form>
            </div>
        </div>
    </div>
</template>
