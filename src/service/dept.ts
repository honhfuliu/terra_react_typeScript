import request from '@/utils/request.ts';

export type DeptAddType = {
  deptId: number;
  parentId?: number; // 上级部门
  deptName: string; // 部门名称
  sortOrder: number; // 显示排序
  leader: string; // 负责人
  phone: string; // 联系电话
  email: string; // 邮箱
  status: string; // 部门状态：1-启用，0-停用
};

export const addDept = async (data: DeptAddType) => {
  try {
    return await request.post('/system/dept', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export type DeptNode = {
  deptName: string;
  deptId: number;
  children?: DeptNode[];
};
export const deptOptions = async () => {
  try {
    return await request.get<DeptNode[]>('/system/dept/options');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export type DeptTable = {
  deptId: number;
  deptName: string;
  sortOrder: number;
  status: string;
  createTime: string;
  children?: DeptTable[];
};

export type DeptSearchType = {
  deptName: string;
  status: string;
};
export const deptList = async (params: DeptSearchType) => {
  try {
    return await request.get<DeptTable[]>('/system/dept/list', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const getDeptById = async (id: number) => {
  try {
    return await request.get<DeptAddType>(`/system/dept/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const deleteDeptById = async (id: number) => {
  try {
    return await request.post(`/system/dept/delete/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const updateBatchDeptSort = async (deptBatchDataSort: DeptTable[]) => {
  try {
    return await request.post('/system/dept/sort', deptBatchDataSort);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
