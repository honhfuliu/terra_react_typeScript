// 后端路由转换
import AdminLayout from '@/layout/AdminLayout';
import { AppRoute } from '@/types/route.ts';
import { lazy } from 'react';
import * as React from 'react';
import { MenuItem } from '@/store/modules/permission.ts';

// 路由转换
export function transformRoutes(route: AppRoute): AppRoute {
  if (!route) {
    return {};
  }
  const result: AppRoute = { ...route };

  if (route.component) {
    result.component = loadComponent(route.component as string);
  }
  if (route.path === '/') {
    route.children?.unshift({
      redirect: '/index',
      index: true,
    });
  }
  if (route.children?.length) {
    result.children = route.children.map((child) => transformRoutes(child));
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
