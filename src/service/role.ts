import * as React from 'react';
import request from '@/utils/request.ts';

export // 角色添加
type RoleAddType = {
  roleId: number;
  roleName: string;
  roleKey: string;
  sort: number;
  status: string;
  menuPermissions: React.Key[];
  remark: string;
};
// 添加
export const addRole = async (data: RoleAddType) => {
  try {
    return await request.post('/system/role', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export type RoleSearchType = {
  name?: string;
  status?: string;
  createTime?: [string, string];
  roleKey?: string;
  pageNum: number;
  pageSize: number;
};
export type RoleRow = {
  roleId: number;
  roleName: string;
  roleKey: string;
  sort: number;
  status: string;
  createTime: string;
};
// 列表查询
export type RolePageResult = {
  rows: RoleRow[];
  total: number;
};
export const roleList = async (params: RoleSearchType) => {
  try {
    return await request.get<RolePageResult>('/system/role/list', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 根据id查询
export const getRoleById = async (id: number) => {
  try {
    return await request.get<RoleAddType>(`/system/role/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 删除
export const deleteRoleByIds = async (roleIds: React.Key[]) => {
  try {
    return await request.post('/system/role/delete', roleIds);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
