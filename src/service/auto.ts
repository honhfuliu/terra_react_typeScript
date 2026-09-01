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

export const login = async (data: LoginFormType) => {
  try {
    return await request.post<UserInfo>('/auth/login', data);
  } catch (e) {
    console.error(e);
    return null;
  }
};
