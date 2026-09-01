import * as React from 'react';
import styles from './index.module.less';
import Header from '@/layout/AdminLayout/Header';
import Sidebar from '@/layout/AdminLayout/Sidebar';
import TagsView from '@/layout/AdminLayout/TagsView';
import Main from '@/layout/AdminLayout/Main';
import { Layout } from 'antd';
const AdminLayout: React.FC = () => {
  return (
    <Layout className={styles.layout}>
      <Sidebar />
      <Layout>
        <Header />
        <TagsView />
        <Main />
      </Layout>
    </Layout>
  );
};
export default AdminLayout;
