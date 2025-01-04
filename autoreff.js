// 依赖导入
import fetch from 'node-fetch'; // 用于HTTP请求
import readline from 'readline'; // 用于命令行交互
import fs from 'fs'; // 文件系统操作
import { logger } from './utils/logger.js'; // 日志记录工具
import { banner } from './utils/banner.js'; // 启动横幅
import Mailjs from '@cemalgnlts/mailjs'; // 临时邮箱服务

// 初始化命令行交互接口
const rl = readline.createInterface({
    input: process.stdin,  // 标准输入
    output: process.stdout // 标准输出
});

/**
 * 异步提问函数
 * @param {string} query - 提示信息
 * @returns {Promise<string>} 用户输入
 */
const askQuestion = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
};

/**
 * 注册新用户
 * @param {string} name - 用户名
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @param {string} inviteCode - 邀请码
 */
const registerUser = async (name, email, password, inviteCode) => {
    try {
        const registrationPayload = { name, username: email, password, inviteCode };
        const registerResponse = await fetch('https://api.openloop.so/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationPayload),
        });

        if (!registerResponse.ok) {
            logger(`Registration failed! Status: ${registerResponse.status}`, 'error');
        }

        const registerData = await registerResponse.json();
        logger('Registration:', 'success', registerData.message);

        await loginUser(email, password);
    } catch (error) {
        logger('Error during registration:', 'error', error.message);
    }
};

/**
 * 用户登录并保存token
 * @param {string} email - 登录邮箱
 * @param {string} password - 登录密码
 */
const loginUser = async (email, password) => {
    try {
        const loginPayload = { username: email, password };

        const loginResponse = await fetch('https://api.openloop.so/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginPayload),
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed! Status: ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();
        logger('Login successful get token:', 'success', loginData.data.accessToken);

        const accessToken = loginData.data.accessToken;

        fs.appendFileSync('token.txt', accessToken + '\n', 'utf8');
        logger('Access token saved to token.txt');
    } catch (error) {
        logger('Error during login:', 'error', error.message);
    }
};

// 初始化邮件服务实例
const mailjs = new Mailjs();

/**
 * 主函数 - 管理邮箱注册流程
 * 1. 创建指定数量的临时邮箱
 * 2. 使用推荐码注册账号
 * 3. 保存账号信息和token
 */
async function manageMailAndRegister() {
    try {
        logger(banner, 'debug');

        // 获取要创建的账号数量
        const input = await askQuestion('How many reff to create: ');
        const accountCount = parseInt(input, 10);
        if (isNaN(accountCount) || accountCount <= 0) throw new Error('Invalid account count.');

        // 处理推荐码
        const ref = await askQuestion('Use my referral code: (y/N): ');
        const referralCode = ref.toLowerCase() === 'n'
            ? await askQuestion('Enter referral code: ') // 用户自定义推荐码
            : 'ol5f44b5b8'; // 默认推荐码

        // 记录使用的推荐码
        logger(`Register Using Referral code: ${referralCode}`, 'info');

        // 批量创建账号
        for (let i = 0; i < accountCount; i++) {
            try {
                // 创建临时邮箱账号
                const account = await mailjs.createOneAccount();
                const email = account.data.username; // 获取邮箱地址
                const password = account.data.password; // 获取随机密码
                const name = email; // 使用邮箱作为用户名
                if (email === undefined) {
                    i--; // 如果创建失败，重试当前计数
                    continue;
                }
                logger(`Creating account #${i + 1} - Email: ${email}`, 'debug');

                // 使用推荐码注册账号
                await registerUser(name, email, password, referralCode);

                // 保存账号信息到文件
                fs.appendFileSync('accounts.txt', `Email: ${email}, Password: ${password}` + '\n', 'utf8');
                await new Promise(resolve => setTimeout(resolve, 1000)); // 防止请求过快
            } catch (error) {
                logger(`Error with account #${i + 1}: ${error.message}`, 'error');
                await new Promise(resolve => setTimeout(resolve, 1000)); 
            }
            
        }
    } catch (error) {
        logger(`Error: ${error.message}`, 'error');
    } finally {
        rl.close();
    }
}

manageMailAndRegister();
