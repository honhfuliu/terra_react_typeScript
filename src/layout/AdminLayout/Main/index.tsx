import * as React from 'react';
import styles from './index.module.less';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
const { Content } = Layout;
const Main: React.FC = () => {
  return (
    <Content className={styles.content}>
      <Outlet />
    </Content>
  );
};
export default Main;
