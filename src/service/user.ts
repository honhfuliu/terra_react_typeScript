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

// 个人中心用户信息
export type UserProfileType = {
  userId: number;
  username: string;
  nickname: string;
  email: string;
  phone: string;
  sex: string; // 性别：0-未知 1-男 2-女（字典 sys_sex）
  status: string; // 1-正常 0-停用
  remark: string | null;
  avatar: string | null;
  createTime: string;
  updateTime: string;
  lastLoginInfo: string | null; // 最近登录信息（浏览器 · 系统 · IP · 时间 · 归属地）
  lastLoginTime: string | null;
};

// 修改个人信息参数
export type UpdateUserProfileType = {
  nickname: string; // 昵称（必填，最长 64）
  sex: string; // 性别：0-未知 1-男 2-女
  remark?: string; // 个人备注（最长 500）
};

// 查询当前登录用户信息
export const getUserProfile = async () => {
  try {
    return await request.get<UserProfileType>('/system/user/profile');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 修改个人信息（昵称、性别、备注）
export const updateUserProfile = async (data: UpdateUserProfileType) => {
  try {
    return await request.post<void>('/system/user/profile/update', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 修改密码参数
export type ChangePasswordType = {
  oldPassword: string; // 原密码
  newPassword: string; // 新密码（6-100 位）
  confirmPassword: string; // 确认新密码
};

// 修改密码
export const changePassword = async (data: ChangePasswordType) => {
  try {
    return await request.post<void>('/system/user/changePassword', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
// 头像上传
export const uploadAvatar = (formData: FormData) => {
  try {
    return request.post<string>('/system/user/avatar', formData);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
