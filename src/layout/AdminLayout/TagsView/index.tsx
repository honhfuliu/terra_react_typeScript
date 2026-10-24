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

  const currentPath = location.pathname + location.search;

  // 根据当前角色可访问的路由，计算动态首页
  const homePath = React.useMemo(() => getHomePath(routes), [routes]);

  // 关闭 Tab 页
  const handleClose = (targetPath: string) => {
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
    dispatch(delView(targetPath));
  };

  // 处理右键菜单操作
  const handleContextMenuClick = (key: string, targetPath: string) => {
    const targetIndex = visitedViews.findIndex((view) => view.path === targetPath);
    if (targetIndex === -1) return;
    switch (key) {
      case 'refresh':
        // 刷新当前浏览器页面，会重新加载整个应用
        navigate(0);
        break;
      case 'close':
        handleClose(targetPath);
        break;
      case 'closeOthers':
        // 让右键选中的标签成为当前标签
        if (currentPath !== targetPath) {
          navigate(targetPath);
        }
        dispatch(delOthersViews(targetPath));
        break;
      case 'closeLeft':
        dispatch(delLeftViews(targetPath));
        break;
      case 'closeRight':
        dispatch(delRightViews(targetPath));
        break;
      case 'closeAll':
        dispatch(delAllViews());
        navigate(homePath, { replace: true });
        break;
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
        closable: true,
        keepAlive: routeInfo.keepAlive ?? false,
      }),
    );
  }, [routes, location.pathname, currentPath, dispatch]);

  return (
    <div className={styles.tagsView}>
      <Tabs
        type="editable-card"
        hideAdd
        activeKey={currentPath}
        onChange={(key) => navigate(key)}
        onEdit={(targetKey, action) => {
          if (action === 'remove') {
            handleClose(String(targetKey));
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
                  onClick: ({ key }) => handleContextMenuClick(key, view.path),
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
