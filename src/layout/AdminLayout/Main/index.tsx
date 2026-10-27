import * as React from 'react';
import { Suspense, useMemo } from 'react';
import styles from './index.module.less';
import { useLocation, useOutlet } from 'react-router-dom';
import { Layout } from 'antd';
import { KeepAlive } from 'keepalive-for-react';
import Loading from '@/components/Loading';
import { usePageKeepAlive } from '@/keepalive/KeepAliveContext.tsx';
import { AppRoute } from '@/types/route.ts';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const { Content } = Layout;
// 路径处理
const normalizePath = (parentPath: string, path?: string): string => {
  if (!path) return parentPath || '/';

  if (path.startsWith('/')) {
    return path.replace(/\/+$/, '') || '/';
  }

  const parent = parentPath.replace(/\/+$/, '');
  return `${parent}/${path}`.replace(/\/+/g, '/');
};

/**
 * 收集所有「不需要缓存」的页面完整路径，作为 KeepAlive 的 exclude。
 * 页面节点（有 path、非 index/redirect、非 Layout 布局）且未开启 meta.keepAlive 时视为不缓存。
 * 返回稳定集合（只随 routes 变化，与当前路由无关），保证切走时能被正确销毁。
 */
const collectExcludePaths = (routes: AppRoute[], parentPath = ''): string[] => {
  const result: string[] = [];
  for (const route of routes) {
    if (!route || route.redirect || route.index) continue;

    const currentPath = normalizePath(parentPath, route.path);

    // 真实页面节点，且未开启缓存
    if (
      route.path &&
      route.component &&
      route.component !== 'Layout' &&
      route.meta?.keepAlive !== true
    ) {
      result.push(currentPath);
    }

    // 目录 / 布局节点继续向下递归
    if (Array.isArray(route.children) && route.children.length) {
      result.push(...collectExcludePaths(route.children, currentPath));
    }
  }
  return result;
};

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
  console.log('未缓存：', exclude);
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
