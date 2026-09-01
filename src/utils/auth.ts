// 权限工具

import storage from '@/utils/storage.ts';

export function getToken() {
  return storage.get('$_token');
}

export function clearToken() {
  storage.remove('$_token');
}

export function isLogin() {
  return !!getToken();
}
