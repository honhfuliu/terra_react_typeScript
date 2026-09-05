import request from '@/utils/request.ts';
// 字典添加
export type AddDictType = {
  dictId?: number; //字典ID
  dictName: string;
  dictType: string;
  status: string;
  remark: string;
};
// 添加
export const addDictType = async (data: AddDictType) => {
  try {
    return await request.post('/system/dict/type', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 字典值添加
export type AddDictDataType = {
  dictCode?: number; // 字典数据ID
  dictId: number;
  dictSort: number;
  dictLabel: string;
  dictValue: string;
  isDefault: string;
  tagType: string;
  cssClass: string;
  status: string;
  remark: string;
};
// 添加字典值
export const addDictData = async (data: AddDictDataType) => {
  try {
    return await request.post('/system/dict/data', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
// 字典列表
export type DictListTypeItem = {
  dictId: number;
  dictName: string;
  dictType: string;
  count: number;
  status: string;
  updateTime: string;
  remark: string;
};

export const dictTypeListInfo = async (dictName?: string) => {
  try {
    return await request.get<DictListTypeItem[]>('/system/dict/type/list', {
      params: { dictName },
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 字典值列表
export type DictDataListTypeItem = {
  dictCode: number;
  dictLabel: string;
  dictValue: string;
  dictSort: number;
  status: string;
  remark: string;
};

export const dictDataListInfo = async (dictId?: number) => {
  try {
    return await request.get<DictDataListTypeItem[]>('/system/dict/data/list', {
      params: { dictId },
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 根据字典值ID查询字典值详情（编辑回显）
export const getDictDataInfo = async (dictCode: number) => {
  try {
    return await request.get<AddDictDataType>(`/system/dict/data/edit/${dictCode}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 删除字典值
export const deleteDictData = async (dictCode: number) => {
  try {
    return await request.post(`/system/dict/data/delete/${dictCode}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 删除字典类型
export const deleteDictType = async (dictId: number) => {
  try {
    return await request.post(`/system/dict/type/delete/${dictId}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
