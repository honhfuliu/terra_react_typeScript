import request from '@/utils/request.ts';
import { Dayjs } from 'dayjs';
import * as React from 'react';

export type UserRow = {
  userId: number;
  username: string;
  nickname: string;
  deptName: string;
  phone: string;
  status: string; // 1-正常 0-停用
  createTime: string;
};
export type UserSearchType = {
  username?: string;
  phone?: string;
  status?: string;
  deptId?: React.Key;
  createTime?: [Dayjs, Dayjs];
  startTime?: string;
  endTime?: string;
  pageNum: number;
  pageSize: number;
};
export type UserPageResult = {
  rows: UserRow[];
  total: number;
};
export const userList = async (params: UserSearchType) => {
  try {
    return await request.get<UserPageResult>('/system/user/list', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export type UserAddType = {
  userId?: number;
  nickname: string;
  deptId: number;
  phone: string;
  email: string;
  username: string;
  password: string;
  sex: string;
  status: string;
  roleIds: number[];
  remark: string;
};

export type ResetPasswordType = {
  userId: number;
  username: string;
  password: string;
};
// 重置密码
export const resetPassword = async (data: ResetPasswordType) => {
  try {
    return await request.post('/system/user/resetPassword', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
// 添加
export const addUser = async (data: UserAddType) => {
  try {
    return await request.post('/system/user', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 根据id查询
export const getUserById = async (id: number) => {
  try {
    return await request.get<UserAddType>(`/system/user/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 删除
export const deleteUserByIds = async (roleIds: React.Key[]) => {
  try {
    return await request.post('/system/user/delete', roleIds);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
