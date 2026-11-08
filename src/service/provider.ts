import request from '@/utils/request.ts';

// 接入协议选项
export type ProtocolOption = {
  label: string;
  value: string;
};

// 获取接入协议列表
export const getProtocolOptions = async () => {
  try {
    return await request.get<ProtocolOption[]>('/ai/options/protocols');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 新增/修改模型提供商入参（id 为 null 时新增，有值则修改）
export type SaveProviderParams = {
  id: number | null;
  providerCode: string;
  providerName: string;
  apiBaseUrl: string;
  protocol: string;
  enabled: string;
  apiKey?: string;
  isDefault?: string; // 1 默认，0 非默认
  remark?: string;
};

// 新增/修改模型提供商
export const saveProvider = async (data: SaveProviderParams) => {
  try {
    return await request.post<number | null>('/ai/provider', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 提供商列表行（对应后端返回）
export type ProviderRow = {
  id: number;
  providerCode: string;
  providerName: string;
  apiBaseUrl: string;
  protocol: string;
  apiKey: string; // 后端已脱敏
  enabled: string; // 1 启用，0 停用
  remark: string;
  isDefault: string; // 1 默认，0 非默认
};

// 提供商分页查询参数
export type ProviderPageParams = {
  keyword?: string; // 关键字（模糊匹配提供商编码或名称）
  protocol?: string; // 接入协议（精确匹配）
  pageNum: number;
  pageSize: number;
};

// 分页返回
export type ProviderPageResult = {
  rows: ProviderRow[];
  total: number;
};

// 提供商分页列表
export const getProviderPage = async (params: ProviderPageParams) => {
  try {
    return await request.get<ProviderPageResult>('/ai/provider/page', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 删除模型提供商
export const deleteProvider = async (id: number) => {
  try {
    return await request.post<null>(`/ai/provider/delete/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
