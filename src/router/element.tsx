import * as React from 'react';
import { Suspense, useMemo } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { AppRoute } from '@/types/route.ts';
import { getHomePath } from '@/router/helper.ts';
import { isLogin } from '@/utils/auth.ts';
import Loading from '@/components/Loading';

// 跳转到动态首页（后端返回的第一个可访问页面，无权限页面后端不会下发）
export const HomeNavigate: React.FC = () => {
  const routes = useSelector((state: RootState) => state.permission.routes);
  const homePath = useMemo(() => getHomePath(routes), [routes]);
  return <Navigate to={homePath} replace />;
};

// 懒加载组件统一包裹 Suspense
const renderComponent = (Component: React.ComponentType) => (
  <Suspense fallback={<Loading fullscreen={false} loading tip="页面加载中" />}>
    <Component />
  </Suspense>
);

/**
 * 统一处理路由节点的渲染逻辑
 * 数据路由通过 RouteObject 的 element 属性使用该组件，
 * 根据当前匹配的路由配置决定最终渲染内容。
 */
export const Element: React.FC<{ route: AppRoute }> = ({ route }) => {
  const Component = route.component as React.ComponentType | undefined;
  const { path } = route;
  const token = isLogin();

  // 登录页放行
  if (path === '/login') {
    if (token) return <HomeNavigate />;
    return Component ? renderComponent(Component) : null;
  }

  // 其他页面校验 token
  if (!token) return <Navigate to="/login" replace />;

  // 前端补的 index 重定向 / 后端配置的 redirect
  if (route.redirect) return <Navigate to={route.redirect} replace />;

  // 目录 / 布局节点：渲染子路由
  if (!Component) return <Outlet />;

  return renderComponent(Component);
};
