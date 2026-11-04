// 后端路由转换
import AdminLayout from '@/layout/AdminLayout';
import { AppRoute } from '@/types/route.ts';
import { lazy } from 'react';
import * as React from 'react';
import { MenuItem } from '@/store/modules/permission.ts';
import { RouteObject } from 'react-router-dom';
import { Element } from '@/router/element.tsx';

// 路由转换
// homePath: 根路由默认 index 重定向地址（登录后/刷新默认进入的第一个可访问页面）
export function transformRoutes(route: AppRoute, homePath = '/403'): AppRoute {
  if (!route) {
    return {} as AppRoute;
  }
  // AppRoute 是 RouteObject & {...} 交叉类型，直接对象展开后 TS 无法将其推断类型赋回交叉类型，需断言
  const result = { ...route } as AppRoute;

  if (route.component) {
    result.component = loadComponent(route.component as string);
  }
  if (route.path === '/') {
    route.children?.unshift({
      redirect: homePath,
      index: true,
    });
  }
  if (route.children?.length) {
    result.children = route.children.map((child) => transformRoutes(child, homePath));
  }
  return result;
}

// 组件处理
function loadComponent(component: string): React.ComponentType | undefined {
  const modules = import.meta.glob('@/views/**/*.tsx');
  if (component === 'Layout') {
    return AdminLayout;
  }
  if (!component) {
    return undefined;
  }
  const path = `/src/views/${component}.tsx`;
  const module = modules[path];
  if (!module) {
    return lazy(() => import('@/components/RouteError'));
  }
  return lazy(module as () => Promise<{ default: React.ComponentType }>);
  // return lazy(() => import(`@/views/${component}.tsx`));
}

// 转换为菜单
export function transformMenus(routes: AppRoute[], parentPath = ''): MenuItem[] {
  return routes
    .filter((item) => !item.meta?.hidden)
    .map((item) => {
      const currentPath = parentPath + '/' + item.path;
      const menu: MenuItem = {
        key: currentPath,
        label: item.meta?.title,
        icon: item.meta?.icon,
      };
      if (item.children && item.children.length) {
        menu.children = transformMenus(item.children, currentPath);
      }
      return menu;
    });
}

// 把 AppRoute 转换为 React Router 数据路由（RouteObject）
// 注意：传入的 component 需已由 transformRoutes 转成 React 组件
export function createRouteObjects(routes: AppRoute[]): RouteObject[] {
  return routes.map((route): RouteObject => {
    const children = route.children ? createRouteObjects(route.children) : undefined;

    // 每个匹配节点的业务元信息交给 handle，方便 useMatches 读取（面包屑等）
    const handle = route.meta
      ? { ...route.meta, name: route.name }
      : route.name
        ? { name: route.name }
        : undefined;

    const element = React.createElement(Element, { route });

    // index 路由（前端补的默认重定向），单独构造以匹配 IndexRouteObject 类型
    if (route.index) {
      return { index: true, element } as RouteObject;
    }

    const result: RouteObject = {
      handle,
      // 统一由 Element 处理鉴权、redirect 与组件渲染
      element,
    };

    if (route.path !== undefined) {
      result.path = route.path;
    }

    if (children?.length) {
      result.children = children;
    }

    return result;
  });
}
