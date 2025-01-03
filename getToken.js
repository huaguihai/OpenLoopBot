import fs from 'fs';
import fetch from 'node-fetch';
import { logger } from './utils/logger.js';

// 账号文件和token文件路径
const filePath = './accounts.txt';
const tokenFilePath = './token.txt';

// 读取并解析账号信息
function readAccounts(filePath) {
    const accounts = [];
    const data = fs.readFileSync(filePath, 'utf-8');

    data.split('\n').forEach((line) => {
        const match = line.match(/Email:\s*(.+?),\s*Password:\s*(.+)/);
        if (match) {
            const email = match[1];
            const password = match[2];
            accounts.push({ email, password });
        }
    });

    return accounts;
}

// 获取token
async function getToken() {
    // 如果token文件已存在则删除
    if (fs.existsSync(tokenFilePath)) {
        fs.unlinkSync(tokenFilePath);
        logger('已删除现有的token.txt。');
    }

    const accounts = readAccounts(filePath);

    // 遍历所有账号获取token
    for (const { email, password } of accounts) {
        logger(`邮箱: ${email}, 密码: ${password}`);
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
                throw new Error(`登录失败! 状态: ${loginResponse.status}`);
            }

            const loginData = await loginResponse.json();
            const accessToken = loginData.data.accessToken;
            logger('登录成功, Token:', 'success', accessToken);

            // 将token保存到文件
            fs.appendFileSync(tokenFilePath, accessToken + '\n', 'utf8');
            logger('Access token已保存到token.txt');
        } catch (error) {
            logger('登录时出错:', 'error', error.message);
        }
    }
}

export default getToken;
