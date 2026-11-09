import request from '@/utils/request.ts';
import { DictDataOption } from '@/service/dict.ts';

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
