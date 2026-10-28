import { AppRoute } from '@/types/route.ts';
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
 * 拼接路由路径：父路径 + 子路径。
 * - path 为空：返回父路径
 * - path 为绝对路径：直接使用（去掉尾部斜杠）
 * - 否则与父路径拼接，并合并多余斜杠
 */
export function normalizePath(parentPath: string, path?: string): string {
  if (!path) return parentPath || '/';
  if (path.startsWith('/')) return path.replace(/\/+$/, '') || '/';
  const parent = parentPath.replace(/\/+$/, '');
  return `${parent}/${path}`.replace(/\/+/g, '/');
}

// 路由链路中的单个节点（面包屑、标签页等复用）
export interface MatchedRoute {
  path: string;
  title?: string;
  keepAlive?: boolean;
}

// 路径段匹配：支持 :param 动态段
function matchSegments(routePath: string, pathname: string): boolean {
  const routeSegments = routePath.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);
  return (
    routeSegments.length === pathSegments.length &&
    routeSegments.every(
      (segment, index) => segment.startsWith(':') || segment === pathSegments[index],
    )
  );
}

/**
 * 在路由树中查找与 pathname 精确匹配的节点链路（从根到当前页）。
 * 链路包含每一层的 path / title / keepAlive，可能含没有 title 的布局/目录节点，由调用方过滤。
 * 找不到精确匹配时返回空数组。
 */
export function findRouteChain(
  routes: AppRoute[],
  pathname: string,
  parentPath = '',
): MatchedRoute[] {
  for (const route of routes) {
    if (!route || route.redirect || route.index) continue;

    const currentPath = normalizePath(parentPath, route.path);
    const self: MatchedRoute = {
      path: currentPath,
      title: route.meta?.title,
      keepAlive: route.meta?.keepAlive,
    };

    // 优先向更深层匹配
    if (Array.isArray(route.children) && route.children.length) {
      const childChain = findRouteChain(route.children, pathname, currentPath);
      if (childChain.length) {
        return [self, ...childChain];
      }
    }

    // 当前节点精确匹配
    if (route.path && matchSegments(currentPath, pathname)) {
      return [self];
    }
  }
  return [];
}

// 通用路由树遍历访问器：返回 false 可阻止继续向下遍历该节点的子树
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
