import fetch from 'node-fetch';
import fs from 'fs';
import chalk from 'chalk';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { banner } from './utils/banner.js';
import { logger } from './utils/logger.js';
import getToken from './getToken.js';

// 获取60到99之间的随机质量分数
const getRandomQuality = () => {
    return Math.floor(Math.random() * (99 - 60 + 1)) + 60;
};

// 从proxy.txt读取代理列表
const getProxies = () => {
    return fs.readFileSync('proxy.txt', 'utf8').split('\n').map(line => line.trim()).filter(Boolean);
};

// 从token.txt读取token列表
const getTokens = () => {
    return fs.readFileSync('token.txt', 'utf8').split('\n').map(line => line.trim()).filter(Boolean);
};

// 分享带宽
const shareBandwidth = async (token, proxy) => {
    const quality = getRandomQuality();
    const proxyAgent = new HttpsProxyAgent(proxy);
    const maxRetries = 5;  // 最大重试次数
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await fetch('https://api.openloop.so/bandwidth/share', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quality }),
                agent: proxyAgent,
            });

            if (!response.ok) {
                throw new Error(`分享带宽失败! 状态: ${response.statusText}`);
            }

            const data = await response.json();

            // 记录带宽分享响应
            const logBandwidthShareResponse = (response) => {
                if (response && response.data && response.data.balances) {
                    const balance = response.data.balances.POINT;
                    logger(
                        `带宽分享信息: ${chalk.yellow(response.message)} | 分数: ${chalk.yellow(quality)} | 总收益: ${chalk.yellow(balance)}`
                    );
                }
            };

            logBandwidthShareResponse(data);
            return;
        } catch (error) {
            attempt++;
            if (attempt >= maxRetries) {
                logger(`达到最大重试次数。跳过。`, 'error');
            } else {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
    }
};

let intervalId;

// 检查任务状态
const checkMissions = async (token, proxy) => {
    try {
        const proxyAgent = new HttpsProxyAgent(proxy);

        const response = await fetch('https://api.openloop.so/missions', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            agent: proxyAgent,
        });

        if (response.status === 401) {
            logger('Token已过期。正在尝试获取新token...', 'warn');
            clearInterval(intervalId);

            await getToken();
            restartInterval();
            return null;
        } else if (!response.ok) {
            throw new Error(`获取任务失败! 状态: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;

    } catch (error) {
        logger('获取任务时出错!', 'error', error);
    }
};

// 重启定时器
const restartInterval = () => {
    intervalId = setInterval(shareBandwidthForAllTokens, 60 * 1000);
};

// 为所有token分享带宽
const shareBandwidthForAllTokens = async () => {
    const tokens = getTokens();
    const proxies = getProxies();

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const proxy = proxies[i % proxies.length];
        try {
            const response = await checkMissions(token, proxy);
            if (response && Array.isArray(response.missions)) {
                const availableMissionIds = response.missions
                    .filter(mission => mission.status === 'available')
                    .map(mission => mission.missionId);

                logger('可用任务:', 'info', availableMissionIds.length);
                for (const missionId of availableMissionIds) {
                    logger(`执行并完成任务ID: ${missionId}`, 'info');
                    const completeMission = await doMissions(missionId, token, proxy);
                    logger(`任务ID: ${missionId} 完成: ${completeMission.message}`);
                }
            }
        } catch (error) {
            logger('检查任务时出错:', 'error', error);
        }

        try {
            await shareBandwidth(token, proxy);
        } catch (error) {
            logger(`处理token时出错: ${token}, 错误: ${error.message}`, 'error');
        }
    }
};

// 执行任务
const doMissions = async (missionId, token, proxy) => {
    try {
        const proxyAgent = new HttpsProxyAgent(proxy);

        const response = await fetch(`https://api.openloop.so/missions/${missionId}/complete`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            agent: proxyAgent,
        });

        if (!response.ok) {
            throw new Error(`完成任务失败! 状态: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        logger('完成任务时出错!', 'error', error);
    }
};

// 主函数
const main = () => {
    logger(banner, 'debug');
    logger('开始每分钟分享带宽...');
    shareBandwidthForAllTokens();

    intervalId = setInterval(shareBandwidthForAllTokens, 60 * 1000);
};

main();
