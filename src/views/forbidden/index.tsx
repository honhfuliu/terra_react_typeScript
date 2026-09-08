import * as React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getHomePath } from '@/router/helper.ts';
import { isLogin } from '@/utils/auth.ts';
import styles from './index.module.less';

const Forbidden: React.FC = () => {
  const navigate = useNavigate();
  const routes = useSelector((state: RootState) => state.permission.routes);

  const backHome = () => {
    // 已登录跳动态首页（第一个有权限的页面），未登录去登录页
    if (isLogin()) {
      navigate(getHomePath(routes));
    } else {
      navigate('/login');
    }
  };

  return (
    <div className={styles.container}>
      <Result
        className={styles.result}
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问该页面。"
        extra={
          <Button type="primary" className={styles.homeButton} onClick={backHome}>
            返回首页
          </Button>
        }
      />
    </div>
  );
};

export default Forbidden;
