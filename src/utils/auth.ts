// 权限工具

import storage from '@/utils/storage.ts';
import { STORAGE_KEY } from '@/constants';

export function getToken() {
  return storage.get(STORAGE_KEY.TOKEN);
}

export function clearToken() {
  storage.remove(STORAGE_KEY.TOKEN);
}

export function isLogin() {
  return !!getToken();
}
