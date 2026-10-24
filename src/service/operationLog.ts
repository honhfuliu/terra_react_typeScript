import * as React from 'react';
import request from '@/utils/request.ts';
import { Dayjs } from 'dayjs';

// 操作日志列表行数据（对应后端 system_operation_log）
export type OperationLogRow = {
  id: number; // 主键
  username: string; // 操作账号
  module: string; // 业务模块
  operation: string; // 操作类型
  targetType: string | null; // 操作对象类型
  targetId: string | null; // 操作对象 ID
  targetName: string | null; // 操作对象名称
  requestMethod: string; // 请求方法：GET/POST/PUT/DELETE
  requestUrl: string; // 请求地址
  requestParams: string | null; // 请求参数（JSON 字符串）
  requestIp: string; // 请求 IP 地址
  requestLocation: string | null; // 请求归属地
  status: string; // 操作状态：1 成功 0 失败
  errorMessage: string | null; // 错误信息
  costTime: number; // 耗时（毫秒）
  createTime: string; // 创建时间（yyyy-MM-dd HH:mm:ss）
  beforeData: string | null; // 操作前数据（JSON 字符串）
  afterData: string | null; // 操作后数据（JSON 字符串）
};

// 操作日志查询参数
export type OperationLogSearchType = {
  username?: string; // 操作账号（模糊查询）
  module?: string; // 业务模块
  operation?: string; // 操作类型
  status?: number; // 操作状态：1 成功 0 失败
  requestIp?: string; // 请求 IP（模糊查询）
  operationTime?: [Dayjs, Dayjs]; // 表单中的操作时间范围（提交时转换为 startTime/endTime）
  startTime?: string; // 操作时间-开始（yyyy-MM-dd HH:mm:ss）
  endTime?: string; // 操作时间-结束（yyyy-MM-dd HH:mm:ss）
  pageNum: number; // 当前页
  pageSize: number; // 每页条数
};

// 分页返回
export type OperationLogPageResult = {
  rows: OperationLogRow[];
  total: number;
};

// 操作日志列表
export const operationLogList = async (params: OperationLogSearchType) => {
  try {
    return await request.get<OperationLogPageResult>('/system/operationLog/list', {
      params,
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 清空操作日志
export const operationLogClear = async () => {
  try {
    return await request.post<void>('/system/operationLog/clear');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 批量删除操作日志（ids 通过 URL 查询参数传递：?ids=1,2,3）
export const operationLogDelete = async (ids: React.Key[]) => {
  try {
    return await request.post<void>('/system/operationLog/delete', null, {
      params: { ids: ids.join(',') },
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};
