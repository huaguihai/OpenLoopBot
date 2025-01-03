# OpenLoop 去中心化带宽共享

![banner](image.png)

## OpenLoop 网络是一个去中心化的无线网络，旨在提高互联网服务交付效率，使其对每个人来说都更高效、更易访问且更有回报。🤩

- 官网 [https://openloop.so/](https://openloop.so/)
- Twitter [@openloop_so](https://x.com/openloop_so)
- Telegram [@openloop_updates](https://t.me/openloop_updates)
- Discord [https://discord.com/invite/75qBRaUczN](https://discord.com/invite/75qBRaUczN)

## 更新
- **自动更新过期token**:
- 将邮箱和密码填入 `accounts.txt`
   ![accounts.txt](image-2.png)

## **功能特性**

- **注册账号**
- **加载已有Token**: 如果已有账号，可以加载已有token
- **自动Ping**
- **自动Reff**
- **支持多账号**
- **支持代理**

## **环境要求**

- **Node.js**: 确保已安装Node.js
- **npm**: 确保已安装npm

## **确保账号和代理数量一致**

如果已有账号，可以将`access-token`放入`token.txt`，

将代理信息放入`proxy.txt`，格式为`http://用户名:密码@ip:端口`

![intro](image-1.png)

## 安装步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/huaguihai/OpenLoopBot.git
   cd OpenLoopBot
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 设置账号并获取Token：
   ```bash
   npm run setup
   ```
4. 运行脚本：
   ```bash
   npm run start
   ```
5. 使用临时邮箱自动reff：
   ```bash
   npm run autoreff
   ```

## ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

本项目采用 [MIT 许可证](LICENSE)。
