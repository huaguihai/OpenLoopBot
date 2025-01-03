import chalk from 'chalk';

// 日志记录函数
export function logger(message, level = 'info', value = "") {
    const now = new Date().toISOString();
    // 定义不同日志级别的颜色
    const colors = {
        info: chalk.green,
        warn: chalk.yellow,
        error: chalk.red,
        success: chalk.blue,
        debug: chalk.magenta,
    };
    const color = colors[level] || chalk.white;
    // 输出带时间戳和颜色的日志
    console.log(color(`[${now}] [${level.toUpperCase()}]: ${message}`), chalk.yellow(value));
}
