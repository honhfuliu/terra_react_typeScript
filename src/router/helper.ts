import { AppRoute, RouteSearchItem } from '@/types/route.ts';
import { LAYOUT_COMPONENT } from '@/constants';

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

/**
 * 拼接并规范化路由路径。
 *
 * - path 为空：返回父路径
 * - path 为绝对路径：直接使用
 * - path 为相对路径：与父路径拼接
 * - 合并连续斜杠
 * - 移除尾部斜杠，根路径保留 /
 */
export function normalizePath(parentPath: string, path?: string): string {
  if (!path) {
    return parentPath.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';
  }
  const fullPath = path.startsWith('/') ? path : `${parentPath}/${path}`;

  const normalized = fullPath.replace(/\/+/g, '/');

  return normalized.replace(/\/+$/, '') || '/';
}

export type RouteVisitor = (
  route: AppRoute,
  currentPath: string,
  parentPath: string,
) => boolean | void;

/**
 * 通用路由树遍历（深度优先）。
 */
export function walkRoutes(routes: AppRoute[], visitor: RouteVisitor, parentPath = ''): void {
  for (const route of routes) {
    if (!route) continue;
    const currentPath = normalizePath(parentPath, route.path);
    const shouldDescend = visitor(route, currentPath, parentPath);
    if (shouldDescend === false) continue;
    if (Array.isArray(route.children) && route.children.length) {
      walkRoutes(route.children, visitor, currentPath);
    }
  }
}

/**
 * 收集所有「不需要缓存」的页面完整路径，作为 KeepAlive 的 exclude。
 * 页面节点（有 path、非 index/redirect、非 Layout 布局）且未开启 meta.keepAlive 时视为不缓存。
 * 返回稳定集合（只随 routes 变化，与当前路由无关），保证切走时能被正确销毁。
 */
export function collectExcludePaths(routes: AppRoute[], parentPath = ''): string[] {
  const result: string[] = [];
  walkRoutes(
    routes,
    (route, currentPath) => {
      if (route.redirect || route.index) return false;
      if (
        route.path &&
        route.component &&
        route.component !== LAYOUT_COMPONENT &&
        route.meta?.keepAlive !== true
      ) {
        result.push(currentPath);
      }
    },
    parentPath,
  );
  return result;
}

/**
 * 获取可搜索的页面路由
 * 只负责提取页面信息，不负责搜索过滤
 */
export function getSearchableRoutes(routes: AppRoute[], parentPath = ''): RouteSearchItem[] {
  const result: RouteSearchItem[] = [];

  for (const route of routes) {
    // 排除无效、重定向、隐藏路由
    if (!route || route.redirect || route.meta?.hidden) {
      continue;
    }
    const currentPath = normalizePath(parentPath, route.path);

    // 判断是否为真实页面
    const isPage =
      !!route.path && !!route.component && route.component !== LAYOUT_COMPONENT && !route.index;

    if (isPage && route.meta?.title) {
      result.push({
        icon: route.meta.icon,
        title: route.meta.title,
        path: currentPath,
      });
    }

    // 继续遍历子路由，包括目录路由
    if (route.children?.length) {
      result.push(...getSearchableRoutes(route.children, currentPath));
    }
  }

  return result;
}
