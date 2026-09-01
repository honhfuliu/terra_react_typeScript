// 响应类型定义
export interface Result<T = any> {
  code: number;
  message: string;
  data: T;
}
