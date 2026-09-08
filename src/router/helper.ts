import { AppRoute } from '@/types/route.ts';

// 布局组件标识（后端数据结构中根布局的 component 值）
const LAYOUT_COMPONENT = 'Layout';

// 从后端路由树中递归查找第一个可访问的页面路径
// 规则：有 path、有 component、且不是 Layout 布局的节点才算页面
export function getFirstAccessiblePath(routes: AppRoute[], parentPath = ''): string | null {
  if (!Array.isArray(routes)) {
    return null;
  }
  for (const route of routes) {
    if (!route || route.redirect) {
      continue;
    }
    const currentPath = route.path
      ? `${parentPath}/${route.path}`.replace(/\/{2,}/g, '/')
      : parentPath;

    // 命中真实页面
    if (route.path && route.component && route.component !== LAYOUT_COMPONENT) {
      return currentPath;
    }
    // 目录/布局继续向下递归
    if (Array.isArray(route.children) && route.children.length) {
      const childPath = getFirstAccessiblePath(route.children, currentPath);
      if (childPath) {
        return childPath;
      }
    }
  }
  return null;
}

// 计算动态首页：后端路由根节点 → 第一个可访问页面；无任何页面权限时返回 /403
export function getHomePath(root: AppRoute): string {
  // 注意：不能用 Array.isArray(root?.children) 三元收窄，TS 不会把对可选链的收窄传播回 root.children
  const children: AppRoute[] = root?.children ?? [];
  const path = getFirstAccessiblePath(children);
  return path ?? '/403';
}
