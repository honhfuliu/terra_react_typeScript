import request from '@/utils/request.ts';
import { Dayjs } from 'dayjs';

// 登录日志列表行数据（对应后端 system_login_log）
export type LoginLogRow = {
  id: number; // 主键（表格 row-key）
  username: string; // 登录账号
  ipAddress: string; // IP 地址
  loginLocation: string; // 登录位置
  browser: string; // 浏览器
  os: string; // 操作系统
  status: string; // 登录状态：1 成功 0 失败（CHAR(1)）
  message: string; // 操作信息
  loginTime: string; // 登录时间（yyyy-MM-dd HH:mm:ss）
};

// 登录日志查询参数
export type LoginLogSearchType = {
  username?: string; // 登录账号（模糊查询）
  status?: string; // 登录状态：1 成功 0 失败
  loginTime?: [Dayjs, Dayjs]; // 表单中的登录时间范围（提交时转换为 startTime/endTime）
  startTime?: string; // 登录时间-开始（yyyy-MM-dd HH:mm:ss）
  endTime?: string; // 登录时间-结束（yyyy-MM-dd HH:mm:ss）
  pageNum: number; // 当前页
  pageSize: number; // 每页条数
};

// 分页返回
export type LoginLogPageResult = {
  rows: LoginLogRow[];
  total: number;
};

// 登录日志列表
export const loginLogList = async (params: LoginLogSearchType) => {
  try {
    return await request.get<LoginLogPageResult>('/system/loginLog/list', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};
