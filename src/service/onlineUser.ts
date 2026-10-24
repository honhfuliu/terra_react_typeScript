import request from '@/utils/request.ts';

// 在线用户统计（对应后端 OnlineUserStatisticsVO）
export type OnlineUserStatistics = {
  onlineUserCount: number; // 在线用户数量：不同用户去重
  activeDeviceCount: number; // 在线会话数量，可作为在线设备数量的近似值
  expiringDeviceCount: number; // 即将过期的在线会话数量
};

// 在线用户统计
export const onlineStatistics = async () => {
  try {
    return await request.get<OnlineUserStatistics>('/system/monitor/online/statistics');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 在线用户列表行数据（对应后端在线会话记录）
export type OnlineUserRow = {
  username: string; // 账号
  nickname: string; // 昵称
  avatar: string; // 头像地址（相对路径，展示时拼接 /upload/ 前缀）
  ipAddress: string; // 登录 IP 地址
  loginLocation: string; // 登录地点
  browser: string; // 浏览器
  os: string; // 操作系统
  loginTime: string; // 登录时间（yyyy-MM-dd HH:mm:ss）
  tokenTimeout: number; // Token 剩余有效时长（秒），小于 30 分钟视为即将超时
  loginLogId: number; // 登录日志 ID（表格 row-key）
};

// 在线用户查询参数
export type OnlineUserSearchType = {
  username?: string; // 账号（模糊查询）
  ip?: string; // IP 地址（模糊查询）
  pageNum: number; // 当前页
  pageSize: number; // 每页条数
};

// 分页返回
export type OnlineUserPageResult = {
  rows: OnlineUserRow[];
  total: number;
};

// 在线用户分页列表
export const onlinePage = async (params: OnlineUserSearchType) => {
  try {
    return await request.get<OnlineUserPageResult>('/system/monitor/online/page', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 强制下线
export const forceLogout = async (loginLogId: number) => {
  try {
    return await request.post(`/system/monitor/online/forceLogout/${loginLogId}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
