// 请求封装
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { Result } from '@/types/request.ts';
import { HTTP } from '@/constants';
import { getAuthHeaders, handleForbidden, handleUnauthorized } from '@/utils/requestAuth.ts';

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: HTTP.REQUEST_TIMEOUT,
});

// 请求拦截
service.interceptors.request.use(
  // token 设置
  (config) => {
    // 登录接口不需要 Token
    if (config.url !== '/auth/login') {
      config.headers = config.headers || {};
      Object.assign(config.headers, getAuthHeaders());
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
    // 文件下载：返回完整响应（含 headers，便于解析后端文件名），不进行 JSON 业务响应处理
    if (response.config.responseType === 'blob') {
      return response;
    }
    const res = response.data;
    if (res.code !== HTTP.SUCCESS) {
      // 401：未登录 / Token失效
      if (res.code === HTTP.UNAUTHORIZED) {
        handleUnauthorized();
        return Promise.reject(res);
      }
      // 403：没有权限
      if (res.code === HTTP.FORBIDDEN) {
        handleForbidden(res.message);
        return Promise.reject(res);
      }
      message.error(res.message);
      return Promise.reject(res);
    }
    // console.log(res);
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
