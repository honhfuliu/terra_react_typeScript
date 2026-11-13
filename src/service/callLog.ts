import request from '@/utils/request.ts';

// 全局调用统计
export interface CallLogStats {
  totalCalls: number;
  totalTokens: number;
  successCalls: number;
  failCalls: number;
}

// 获取全局调用统计
export const getCallLogStats = async () => {
  try {
    return await request.get<CallLogStats>('/ai/call/log/stats');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 模型消耗统计行
export interface ModelStatsItem {
  modelName: string;
  providerName: string;
  totalTokens: number;
  callCount: number;
  promptTokens: number;
  completionTokens: number;
}

// 获取模型消耗统计（仅成功调用的有效 Token，按消耗量降序）
export const getCallLogModelStats = async () => {
  try {
    return await request.get<ModelStatsItem[]>('/ai/call/log/stats/model');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 调用日志列表行
export interface CallLogRow {
  id: number;
  nickname: string;
  providerName: string;
  modelName: string;
  callType: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  duration: number; // 调用耗时（毫秒）
  status: string; // 调用状态码，见 AiCallStatusEnum
  createTime: string;
  sessionId: number | null;
  messageId: number | null;
  updateTime: string | null;
  errorMessage: string | null;
}

// 调用日志分页查询参数
export type CallLogPageParams = {
  pageNum: number;
  pageSize: number;
  providerId?: number;
  modelId?: number;
  status?: string;
  callType?: string;
  beginTime?: string;
  endTime?: string;
};

// 调用日志分页返回
export type CallLogPageResult = {
  total: number;
  rows: CallLogRow[];
};

// 调用日志分页列表
export const getCallLogPage = async (params: CallLogPageParams) => {
  try {
    return await request.get<CallLogPageResult>('/ai/call/log/page', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};
