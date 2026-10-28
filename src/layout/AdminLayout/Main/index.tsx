import * as React from 'react';
import { Suspense, useMemo } from 'react';
import styles from './index.module.less';
import { useLocation, useOutlet } from 'react-router-dom';
import { Layout } from 'antd';
import { KeepAlive } from 'keepalive-for-react';
import Loading from '@/components/Loading';
import { usePageKeepAlive } from '@/keepalive/KeepAliveContext.tsx';
import { collectExcludePaths } from '@/router/helper';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const { Content } = Layout;

const Main: React.FC = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const { aliveRef } = usePageKeepAlive();
  const currentCacheKey = useMemo(() => {
    return location.pathname;
  }, [location.pathname]);
  const routes = useSelector((state: RootState) => state.permission.routes);
  // 仅缓存 meta.keepAlive === true 的页面，其余页面路径全部加入 exclude（稳定集合）
  const exclude = useMemo(() => collectExcludePaths([routes]), [routes]);
  return (
    <Content className={styles.content}>
      <KeepAlive
        viewTransition
        aliveRef={aliveRef}
        activeCacheKey={currentCacheKey}
        exclude={exclude}
        max={20}
      >
        <Suspense fallback={<Loading fullscreen={false} tip="页面加载中" loading={true} />}>
          {outlet}
        </Suspense>
      </KeepAlive>
    </Content>
  );
};
export default Main;
