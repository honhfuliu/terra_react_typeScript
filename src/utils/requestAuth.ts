import { message } from 'antd';
import storage from '@/utils/storage.ts';
import { HTTP, STORAGE_KEY } from '@/constants';

/**
 * 获取请求认证请求头
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = storage.get(STORAGE_KEY.TOKEN);
  return token ? { [HTTP.TOKEN_HEADER]: `${HTTP.TOKEN_PREFIX}${token}` } : {};
};

/**
 * 处理登录失效
 */
export const handleUnauthorized = () => {
  message.error('登录已失效，请重新登录');
  storage.remove(STORAGE_KEY.TOKEN);
  storage.remove(STORAGE_KEY.USER);
  window.location.href = '/login';
};

/**
 * 处理权限不足
 */
export const handleForbidden = (errorMessage?: string) => {
  message.error(errorMessage || '没有权限访问该资源');
};
