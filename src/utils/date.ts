// 日期工具

// 将剩余秒数格式化为「x小时x分」
export const formatTimeout = (seconds: number) => {
  if (!seconds || seconds <= 0) return '已超时';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}小时${minutes}分` : `${hours}小时`;
  }
  return `${minutes}分钟`;
};

// 将运行毫秒数格式化为「x天 x小时」/「x小时x分」
/**
 * 将运行毫秒数格式化为「x天 x小时」/「x小时x分」
 * @param milliseconds 运行毫秒数
 * @returns 格式化后的字符串
 */
export const formatDuration = (milliseconds?: number) => {
  if (!milliseconds || milliseconds <= 0) return '-';
  const seconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return minutes > 0 ? `${hours}小时${minutes}分` : `${hours}小时`;
  return `${minutes}分钟`;
};
