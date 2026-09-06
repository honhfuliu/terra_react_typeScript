import request from '@/utils/request.ts';

export type LoginFormType = {
  username: string;
  password: string;
  code: string;
};

export type UserInfo = {
  nickname: string;
  token: string;
  username: string;
};
// 用户登录
export const login = async (data: LoginFormType) => {
  try {
    return await request.post<UserInfo>('/auth/login', data);
  } catch (e) {
    console.error(e);
    return null;
  }
};
export type UserPermissions = {
  permissions: string[];
  roles: string[];
};
// 用户权限
export const getUserPerms = async () => {
  try {
    return await request.get<UserPermissions>('/auth/permissions');
  } catch (e) {
    console.error(e);
    return null;
  }
};
