// utils.js - 工具函数模块

/**
 * 根据URL获取服务类型
 * @param {string} url - 需要识别的URL
 * @returns {string} - 服务类型
 */
const getServiceTypeFromUrl = (url) => {
    const urlServiceTypes = {
        "t.me": "Telegram",
        "kakao": "kaka",
        "line.me": "LINE"
    };
    return Object.entries(urlServiceTypes).find(([key,]) => url.includes(key))?.[1] || "未知";
};

/**
 * 计算自某个日期以来的时间
 * @param {Date} date - 起始日期
 * @returns {string} - 描述自该日期以来过去的时间的字符串
 */
const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "刚刚";
    const intervals = { 年: 31536000, 月: 2592000, 天: 86400, 小时: 3600, 分钟: 60 };
    for (let [unit, sec] of Object.entries(intervals)) {
        const value = Math.floor(seconds / sec);
        if (value) return `${value}${unit}前`;
    }
};

module.exports = { getServiceTypeFromUrl, timeSince };