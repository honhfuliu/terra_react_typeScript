import type { ReactNode } from 'react';

/**
 * 图片上传组件 Props
 */
export interface ImageUploadProps {
  /** 上传成功回调，返回图片 URL */
  onSuccess: (url: string) => void;

  /** 上传接口，接收 FormData，返回图片 URL */
  uploadApi: (formData: FormData) => Promise<string>;

  /** 上传字段名称 */
  name?: string;

  /** 允许选择的图片格式 */
  accept?: string;

  /** 图片大小限制，单位 MB */
  maxSize?: number;

  /** 是否禁用 */
  disabled?: boolean;

  /** 自定义上传按钮 */
  children?: ReactNode;
}
