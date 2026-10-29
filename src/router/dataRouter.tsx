import * as React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getHomePath } from '@/router/helper';
import { createRouteObjects, transformRoutes } from '@/router/transform';
import constantRoutes from '@/router/routes';
import { AppRoute } from '@/types/route.ts';

/**
 数据路由提供器
 统一负责路由配置转换、路由实例创建和路由渲染：
 将常量路由和动态权限路由转换为 React Router 所需的 RouteObject
 根据当前动态路由状态创建数据路由实例
 通过 RouterProvider 将路由实例接入 React 应用
 */
const DataRouterProvider: React.FC = () => {
  const routes = useSelector((state: RootState) => state.permission.routes);

  const router = React.useMemo(() => {
    // 常量路由：登录页、403、404 等，始终存在
    const constantObjects = createRouteObjects(constantRoutes);

    const hasDynamic = Array.isArray(routes?.children) && routes.children.length > 0;

    // 未登录 / 权限路由尚未加载：根路径先回登录页
    if (!hasDynamic) {
      return createBrowserRouter(
        [
          { path: '/', element: <Navigate to="/login" replace /> },
          ...constantObjects,
        ],
        { future: { v7_relativeSplatPath: true } },
      );
    }

    // 动态权限路由：structuredClone 避免 transformRoutes 内的 unshift 污染 store 原始数据
    const homePath = getHomePath(routes);
    const transformed = transformRoutes(structuredClone(routes) as AppRoute, homePath);

    return createBrowserRouter(
      [...createRouteObjects([transformed]), ...constantObjects],
      { future: { v7_relativeSplatPath: true } },
    );
  }, [routes]);

  return <RouterProvider router={router} future={{ v7_startTransition: false }} />;
};

export default DataRouterProvider;
