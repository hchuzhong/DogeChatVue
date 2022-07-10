// eslint-disable-next-line
module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true
    },
    extends: ['eslint:recommended', 'plugin:vue/essential', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        parser: '@typescript-eslint/parser',
        sourceType: 'module'
    },
    parser: 'vue-eslint-parser',
    plugins: ['vue', '@typescript-eslint'],
    rules: {
        'prettier/prettier': [
            'error',
            // prettier 规则配置
            {
                printWidth: 100000000, // 一行代码超过这个值换行
                tabWidth: 4,
                singleQuote: true, // 启动单引号
                useTabs: false,
                bracketSpacing: false,
                jsxBracketSameLine: true,
                trailingComma: 'none', // 对象/数组最后一个属性不添加逗号
                arrowParens: 'avoid' // 箭头函数参数不加()
            }
        ],
        'vue/attributes-order': 'error',
        'vue/require-v-for-key': 'off',
        'vue/no-unused-vars': 'off',
        'vue/no-parsing-error': 'off',
        'no-unused-vars': ['error', {varsIgnorePattern: '^that$', args: 'none'}],
        'no-regex-spaces': 'off',
        'no-useless-escape': 'off',
        'no-extra-boolean-cast': 'off',
        'no-redeclare': 'off',
        'no-empty': 'off',
        'no-irregular-whitespace': 'off',
        'generator-star-spacing': 'off',
        'require-atomic-updates': 'off',
        'no-debugger': 'off',
        'no-undef': 'error',
        'vue/multi-word-component-names': 'off',
        '@typescript-eslint/no-namespace': 'off',

        // 下面这些属性是因为插件不支持，先关闭
        'no-dupe-else-if': 'off',
        'no-import-assign': 'off',
        'no-setter-return': 'off'
    }
};
