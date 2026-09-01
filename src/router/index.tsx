import { AppRoute } from '@/types/route.ts';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import Loading from '@/components/Loading';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { transformRoutes } from '@/router/transform.ts';
import constantRoutes from '@/router/routes.tsx';
import { isLogin } from '@/utils/auth.ts';

// 统一渲染组件
const Element = (route: AppRoute) => {
  const { component: Component, path } = route;
  const token = isLogin();
  // login 页面放行
  if (path === '/login') {
    // 已登录访问login，跳首页
    if (token) {
      return <Navigate to="/index" replace />;
    }
    return Component ? <Component /> : null;
  }
  // 其他页面校验token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (route.redirect) {
    return <Navigate to={route.redirect} replace />;
  }

  if (!Component) {
    return <Outlet />;
  }
  return <Component />;
};

// 创建路由
const createRoute = (routers: AppRoute[]) => {
  return (
    <>
      {routers.map((route, index) => {
        const { path, children, index: redirectIndex } = route;
        // index 路由
        if (redirectIndex) {
          return <Route key={index} index={redirectIndex} element={<Element {...route} />} />;
        }
        return (
          <Route path={path} key={index} element={<Element {...route} />}>
            {Array.isArray(children) ? createRoute(children) : null}
          </Route>
        );
      })}
    </>
  );
};

const RouterView = () => {
  const routes = useSelector((state: RootState) => state.permission.routes);
  const result = transformRoutes(structuredClone(routes));
  const routeList = [...[result], ...constantRoutes];
  return (
    <Suspense
      fallback={
        <>
          <Loading fullscreen={true} tip={'路由加载中'} loading={true} />
        </>
      }
    >
      <Routes>{createRoute(routeList || [])}</Routes>
    </Suspense>
  );
};
export default RouterView;
