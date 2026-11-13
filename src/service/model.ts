import request from '@/utils/request.ts';
import { DictDataOption } from '@/service/dict.ts';
import { ChatMessageDto } from '@/service/chat.ts';

// 获取模型类型列表
export const getModelTypeOptions = async () => {
  try {
    return await request.get<DictDataOption[]>('/ai/options/model-types');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 新增/修改模型入参（id 为 null 时新增，有值则修改）
export type SaveModelParams = {
  id: number | null;
  providerId: number;
  modelType: string;
  modelCode: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  remark?: string;
  enabled: string;
  isDefault: string; // 1 默认，0 非默认
};

// 新增/修改模型
export const saveModel = async (data: SaveModelParams) => {
  try {
    return await request.post<number | null>('/ai/model', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 模型列表行（对应后端返回）
export type ModelRow = {
  id: number;
  modelName: string;
  modelCode: string;
  providerName: string;
  modelType: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  enabled: string; // 1 启用，0 停用
  remark: string | null;
  isDefault: string; // 1 默认，0 非默认
};

// 模型分页查询参数
export type ModelPageParams = {
  keyword?: string; // 关键字（模糊匹配模型名称或模型编码）
  modelType?: string; // 模型类型（精确匹配）
  enabled?: string; // 状态 0 停用，1 启用（精确匹配）
  pageNum: number;
  pageSize: number;
};

// 分页返回
export type ModelPageResult = {
  rows: ModelRow[];
  total: number;
};

// 模型分页列表
export const getModelPage = async (params: ModelPageParams) => {
  try {
    return await request.get<ModelPageResult>('/ai/model/page', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 删除模型
export const deleteModel = async (id: number) => {
  try {
    return await request.post<null>(`/ai/model/delete/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 获取 AI 对话可用模型
export type ChatModelOption = {
  id: number;
  modelCode: string;
};

// 获取 AI 对话可用模型列表（供对话页模型选择器使用）
export const getChatModelOptions = async () => {
  try {
    return await request.get<ChatModelOption[]>('/ai/chat/models');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 模型下拉选项（全量模型，供监控/筛选等页面使用）
export type ModelOption = {
  id: number;
  modelCode: string;
};

// 获取所有模型下拉选项（不传 modelType 即返回全部）
export const getModelOptions = async (modelType?: string | true) => {
  try {
    return await request.get<ModelOption[]>('/ai/model/options', {
      params: modelType !== undefined ? { modelType } : undefined,
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 会话分页查询参数
export type ChatSessionPageParams = {
  pageNum: number;
  pageSize: number;
  title?: string; // 会话标题（模糊查询）
};

// 会话列表项
export type ChatSessionItem = {
  sessionId: number;
  title: string;
  updateTime: string;
};

// 会话分页返回
export type ChatSessionPageResult = {
  total: number;
  rows: ChatSessionItem[];
};

// 会话分页列表
export const getChatSessionPage = async (params: ChatSessionPageParams) => {
  try {
    return await request.get<ChatSessionPageResult>('/ai/chat/session/page', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 修改会话标题参数
export type UpdateSessionTitleParams = {
  sessionId: number;
  title: string;
};

// 修改会话标题
export const updateSessionTitle = async (data: UpdateSessionTitleParams) => {
  try {
    return await request.post<unknown>('/ai/chat/session/title', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 删除会话
export const deleteChatSession = async (sessionId: number) => {
  try {
    return await request.post<unknown>(`/ai/chat/session/delete/${sessionId}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 会话消息分页查询参数
export type ChatMessagePageParams = {
  sessionId: number;
  pageNum: number;
  pageSize: number;
};

// 会话消息分页返回
export type ChatMessagePageResult = {
  total: number;
  rows: ChatMessageDto[];
};

// 会话消息分页列表
export const getChatMessagePage = async (params: ChatMessagePageParams) => {
  try {
    return await request.get<ChatMessagePageResult>('/ai/chat/message/page', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};
