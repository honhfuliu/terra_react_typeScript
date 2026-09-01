// 请求封装
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { Result } from '@/types/request.ts';
import storage from '@/utils/storage.ts';

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// 请求拦截
service.interceptors.request.use(
  // token 设置
  (config) => {
    const token = storage.get('$_token');
    // 登录接口不需要 Token
    if (config.url !== '/auth/login' && token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error.message);
    return Promise.reject(error);
  },
);
// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<Result>) => {
    const res = response.data;
    if (res.code !== 200) {
      // 401：未登录 / Token失效
      if (res.code === 401) {
        message.error('登录已失效，请重新登录');
        // 清除 Token
        storage.remove('$_token');
        storage.remove('$_user');
        localStorage.removeItem('token');
        // 跳转登录页
        window.location.href = '/login';
        return Promise.reject(res);
      }
      // 403：没有权限
      if (res.code === 403) {
        message.error(res.message || '没有权限访问该资源');
        return Promise.reject(res);
      }
      message.error(res.message);
      return Promise.reject(res);
    }
    console.log(res);
    return res.data;
  },
  (error) => {
    console.error('响应拦截器错误:', error.message);
    return Promise.reject(error);
  },
);
const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config);
  },

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config);
  },
};

export default request;
