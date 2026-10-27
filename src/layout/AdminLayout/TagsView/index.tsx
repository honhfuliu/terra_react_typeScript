import * as React from 'react';
import styles from './index.module.less';
import { Dropdown, MenuProps, Tabs } from 'antd';
import { AppRoute } from '@/types/route.ts';
import { AppDispatch, RootState } from '@/store';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  addView,
  delView,
  delOthersViews,
  delLeftViews,
  delRightViews,
  delAllViews,
} from '@/store/modules/tagView';
import { getHomePath } from '@/router/helper';
import { ReloadOutlined } from '@ant-design/icons';
import { usePageKeepAlive } from '@/keepalive/KeepAliveContext';

// 查找当前路由对应的标题和缓存配置
interface RouteInfo {
  title?: string;
  keepAlive?: boolean;
}

const normalizePath = (parentPath: string, path?: string): string => {
  if (!path) return parentPath || '/';

  if (path.startsWith('/')) {
    return path.replace(/\/+$/, '') || '/';
  }

  const parent = parentPath.replace(/\/+$/, '');
  return `${parent}/${path}`.replace(/\/+/g, '/');
};

// 根据路径查找路由信息
const findRouteInfo = (
  route: AppRoute | undefined,
  pathname: string,
  parentPath = '',
): RouteInfo | undefined => {
  if (!route) return undefined;

  const currentPath = normalizePath(parentPath, route.path);

  // 优先查找更深层的子路由
  if (Array.isArray(route.children)) {
    for (const child of route.children) {
      const info = findRouteInfo(child, pathname, currentPath);
      if (info) return info;
    }
  }

  // 精确匹配当前路由，支持动态参数
  if (route.path && !route.index && !route.redirect) {
    const pattern = currentPath
      .split('/')
      .map((segment) => {
        if (segment.startsWith(':')) return segment;
        return segment;
      })
      .join('/');

    const segments = pattern.split('/');
    const pathSegments = pathname.split('/');

    const matched =
      segments.length === pathSegments.length &&
      segments.every((segment, index) => {
        return segment.startsWith(':') || segment === pathSegments[index];
      });

    if (matched && route.meta?.title) {
      return {
        title: route.meta.title,
        keepAlive: route.meta.keepAlive,
      };
    }
  }

  return undefined;
};

const TagsView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const routes = useSelector((state: RootState) => state.permission.routes);

  const visitedViews = useSelector((state: RootState) => state.tagViews.visitedViews);

  const currentPath = location.pathname;

  // 根据当前角色可访问的路由，计算动态首页
  const homePath = React.useMemo(() => getHomePath(routes), [routes]);

  // 获取 keepAlive 维护的 ref
  const { aliveRef } = usePageKeepAlive();

  // 清理页面缓存
  const clearViewCache = async (views: typeof visitedViews) => {
    const cacheKeys = views.filter((view) => view.keepAlive).map((view) => view.path);

    if (cacheKeys.length > 0) {
      await aliveRef.current?.destroy(cacheKeys);
    }
  };

  // 关闭 Tab 页
  const handleClose = async (targetPath: string) => {
    const targetView = visitedViews.find((view) => view.path === targetPath);

    // Tab 不存在或不允许关闭时，不执行操作
    if (!targetView || !targetView.closable) {
      return;
    }

    // 如果关闭的是当前页面，先确定关闭后要跳转的页面
    if (targetPath === currentPath) {
      const targetIndex = visitedViews.findIndex((view) => view.path === targetPath);

      const remainingViews = visitedViews.filter(
        (view) => view.path !== targetPath || !view.closable,
      );
      // 优先选择左侧 Tab，其次选择右侧 Tab
      const nextView =
        remainingViews.find((view) => visitedViews.indexOf(view) === targetIndex - 1) ??
        remainingViews.find((view) => visitedViews.indexOf(view) >= targetIndex);

      // 先切换路由，再删除 Tab
      if (nextView) {
        navigate(nextView.path);
      } else {
        // 没有其他 Tab 时，返回根路由，由现有动态路由处理跳转
        navigate(homePath, { replace: true });
      }
    }
    // 清理当前页面的缓存
    if (targetView.keepAlive) {
      await aliveRef.current?.destroy(targetPath);
    }
    dispatch(delView(targetPath));
  };

  // 处理右键菜单操作
  const handleContextMenuClick = (key: string, targetPath: string) => {
    const targetIndex = visitedViews.findIndex((view) => view.path === targetPath);
    if (targetIndex === -1) return;
    switch (key) {
      case 'refresh':
        // 刷新当前标签页
        aliveRef.current?.refresh(currentPath);
        break;
      case 'close':
        void handleClose(targetPath);
        break;
      case 'closeOthers': {
        const removedViews = visitedViews.filter(
          (view) => view.path !== targetPath && view.closable,
        );
        // 让右键选中的标签成为当前标签
        if (currentPath !== targetPath) {
          navigate(targetPath);
        }
        void clearViewCache(removedViews);
        dispatch(delOthersViews(targetPath));
        break;
      }
      case 'closeLeft': {
        const removedViews = visitedViews.slice(0, targetIndex).filter((view) => view.closable);
        void clearViewCache(removedViews);
        dispatch(delLeftViews(targetPath));
        break;
      }
      case 'closeRight': {
        const removedViews = visitedViews.slice(targetIndex + 1).filter((view) => view.closable);
        void clearViewCache(removedViews);
        dispatch(delRightViews(targetPath));
        break;
      }
      case 'closeAll': {
        // 关闭全部时保留首页：首页不纳入待关闭集合，也不销毁其缓存，
        // 否则在首页上操作时 activeCacheKey 不变而缓存节点被销毁，会导致首页空白
        const removedViews = visitedViews.filter((view) => view.closable && view.path !== homePath);
        void clearViewCache(removedViews);
        dispatch(delAllViews());
        navigate(homePath, { replace: true });
        break;
      }
      default:
        break;
    }
  };

  React.useEffect(() => {
    if (!routes) return;
    const routeInfo = findRouteInfo(routes as AppRoute, location.pathname);
    if (!routeInfo?.title) return;
    dispatch(
      addView({
        path: currentPath,
        title: routeInfo.title,
        closable: currentPath !== homePath,
        keepAlive: routeInfo.keepAlive ?? false,
      }),
    );
  }, [routes, location.pathname, currentPath, dispatch, homePath]);

  // React.useEffect(() => {
  //   console.log('[TagsView] 路由变化:', location.pathname);
  // }, [location.pathname]);
  //
  // React.useEffect(() => {
  //   console.log(
  //     '[TagsView] 标签列表变化:',
  //     visitedViews.map((view) => view.path),
  //   );
  // }, [visitedViews]);
  return (
    <div className={styles.tagsView}>
      <Tabs
        type="editable-card"
        hideAdd
        activeKey={currentPath}
        onChange={(key) => navigate(key)}
        onEdit={(targetKey, action) => {
          if (action === 'remove') {
            void handleClose(String(targetKey));
          }
        }}
        items={visitedViews.map((view) => {
          const menuItems: MenuProps['items'] = [
            {
              key: 'refresh',
              label: '刷新当前页',
              icon: <ReloadOutlined />,
            },
            {
              type: 'divider',
            },
            {
              key: 'close',
              label: '关闭当前页',
              disabled: !view.closable,
            },
            {
              key: 'closeOthers',
              label: '关闭其他页',
            },
            {
              key: 'closeLeft',
              label: '关闭左侧标签',
              disabled: visitedViews.findIndex((item) => item.path === view.path) === 0,
            },
            {
              key: 'closeRight',
              label: '关闭右侧标签',
              disabled:
                visitedViews.findIndex((item) => item.path === view.path) ===
                visitedViews.length - 1,
            },
            {
              type: 'divider',
            },
            {
              key: 'closeAll',
              label: '关闭全部标签',
            },
          ];

          return {
            key: view.path,
            label: (
              <Dropdown
                trigger={['contextMenu']}
                menu={{
                  items: menuItems,
                  onClick: ({ key, domEvent }) => {
                    // 阻止菜单项点击事件沿 React 组件树冒泡到 Tabs 标签，
                    // 否则会误触发标签的 onChange 导航，覆盖菜单里的跳转逻辑
                    domEvent.stopPropagation();
                    handleContextMenuClick(key, view.path);
                  },
                }}
              >
                <span>{view.title}</span>
              </Dropdown>
            ),
            closable: view.closable,
          };
        })}
      />
    </div>
  );
};
export default TagsView;
