import request from '@/utils/request.ts';

export type LoginFormType = {
  username: string;
  password: string;
  code: string;
};

// 登录请求参数：表单数据 + 验证码唯一标识（后端据此校验验证码）
export type LoginParams = LoginFormType & {
  uuid?: string;
};

export type UserInfo = {
  nickname: string;
  token: string;
  username: string;
};
// 用户登录
export const login = async (data: LoginParams) => {
  try {
    return await request.post<UserInfo>('/auth/login', data);
  } catch (e) {
    console.error(e);
    return null;
  }
};

// 图形验证码
export type CaptchaResult = {
  enabled: boolean; // 是否开启验证码
  uuid: string; // 验证码唯一标识，登录时回传给后端
  img: string; // base64 图片（data:image/png;base64,...）
};
// 获取图形验证码
export const getCode = async () => {
  try {
    return await request.get<CaptchaResult>('/auth/getCode');
  } catch (e) {
    console.error(e);
    return null;
  }
};
// 退出登录
export const logout = async () => {
  try {
    await request.post<void>('/auth/logout');
    return true;
  } catch (e) {
    console.error(e);
    return false;
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
