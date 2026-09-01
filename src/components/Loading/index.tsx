import * as React from 'react';
import { Spin } from 'antd';
import styles from './index.module.less';

interface LoadingProps {
  /**
   * 是否显示loading
   */
  loading?: boolean;
  /**
   * loading大小
   */
  size?: 'small' | 'default' | 'large';

  /**
   * 提示文字
   */
  tip?: string;

  /**
   * 是否全屏
   */
  fullscreen?: boolean;
}
const Loading: React.FC<LoadingProps> = ({
  loading = false,
  size = 'large',
  tip = '加载中...',
  fullscreen = false,
}) => {
  if (!loading) {
    return null;
  }
  return (
    <div className={fullscreen ? styles.fullscreen : styles.loading}>
      <Spin size={size} description={tip} />
    </div>
  );
};
export default Loading;
