import { useState } from 'react';
import { message, Upload } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ImageUploadProps } from './types';

const ImageUpload = ({
  onSuccess,
  uploadApi,
  name = 'file',
  accept = 'image/jpeg,image/png',
  maxSize = 2,
  disabled = false,
  children,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);

  /**
   * 上传前校验
   */
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    // 校验图片格式
    const isJpgOrPng = ['image/jpeg', 'image/png'].includes(file.type);

    if (!isJpgOrPng) {
      message.error('只允许上传 JPG 或 PNG 格式的图片');
      return Upload.LIST_IGNORE;
    }

    // 校验图片大小
    const isLtMaxSize = file.size <= maxSize * 1024 * 1024;

    if (!isLtMaxSize) {
      message.error(`图片大小不能超过 ${maxSize}MB`);
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  /**
   * 自定义上传
   */
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess: onUploadSuccess, onError } = options;

    if (uploading) {
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append(name, file as File);

      // 调用业务传入的上传接口
      const url = await uploadApi(formData);

      // 通知业务页面上传成功
      onSuccess(url);

      // 通知 Ant Design 上传成功
      onUploadSuccess?.(url);
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('图片上传失败');

      message.error(uploadError.message || '图片上传失败');
      onError?.(uploadError);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Upload
      accept={accept}
      showUploadList={false}
      beforeUpload={beforeUpload}
      customRequest={handleUpload}
      disabled={disabled || uploading}
    >
      {children ?? <CameraOutlined />}
    </Upload>
  );
};

export default ImageUpload;
