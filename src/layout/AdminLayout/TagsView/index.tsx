import * as React from 'react';
import styles from './index.module.less';
import { Dropdown, MenuProps } from 'antd';
import { AppDispatch, RootState } from '@/store';
import { UIMatch, useLocation, useMatches, useNavigate } from 'react-router-dom';
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
import { CloseOutlined, LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { usePageKeepAlive } from '@/keepalive/KeepAliveContext';
import { Meta } from '@/types/route.ts';

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

  // 标签列表滚动容器
  const listRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // 更新左右箭头的可用状态
  const updateScrollState = React.useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // 容器尺寸变化时重新计算
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateScrollState]);

  // 标签增减后重新计算
  React.useEffect(() => {
    const raf = requestAnimationFrame(updateScrollState);
    return () => cancelAnimationFrame(raf);
  }, [visitedViews, updateScrollState]);

  // 当前标签变化后，将其滚动到可视区域
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const activeNode = Array.from(listRef.current?.children ?? []).find(
        (child) => (child as HTMLElement).dataset.path === currentPath,
      ) as HTMLElement | undefined;

      activeNode?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
      updateScrollState();
    });
    return () => cancelAnimationFrame(raf);
  }, [currentPath, updateScrollState]);

  // 左右箭头滚动
  const scrollList = (direction: 1 | -1) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.7, 160), behavior: 'smooth' });
  };

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

  // 构建单个标签的右键菜单
  const getMenuItems = (view: (typeof visitedViews)[number]): MenuProps['items'] => {
    const index = visitedViews.findIndex((item) => item.path === view.path);
    return [
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
        disabled: index === 0,
      },
      {
        key: 'closeRight',
        label: '关闭右侧标签',
        disabled: index === visitedViews.length - 1,
      },
      {
        type: 'divider',
      },
      {
        key: 'closeAll',
        label: '关闭全部标签',
      },
    ];
  };

  const matches = useMatches() as UIMatch<unknown, Meta>[];

  // 监听路由变化，添加标签页
  React.useEffect(() => {
    // 获取当前匹配链中最后一个有效页面路由
    const currentMatch = [...matches].reverse().find((match) => {
      const handle = match.handle;
      return handle?.title && !handle.hidden;
    });

    if (!currentMatch) return;

    const handle = currentMatch.handle;

    dispatch(
      addView({
        path: currentPath,
        title: handle.title,
        closable: currentPath !== homePath,
        keepAlive: handle.keepAlive ?? false,
      }),
    );
  }, [matches, currentPath, dispatch, homePath]);

  return (
    <div className={styles.tagsView}>
      <button
        type="button"
        className={styles.arrow}
        aria-label="向左滚动标签"
        disabled={!canScrollLeft}
        onClick={() => scrollList(-1)}
      >
        <LeftOutlined />
      </button>

      <div className={styles.tagList} ref={listRef} onScroll={updateScrollState}>
        {visitedViews.map((view) => {
          const active = view.path === currentPath;
          return (
            <Dropdown
              key={view.path}
              trigger={['contextMenu']}
              menu={{
                items: getMenuItems(view),
                onClick: ({ key, domEvent }) => {
                  // 阻止菜单项点击事件冒泡到标签，否则会误触发标签的跳转
                  domEvent.stopPropagation();
                  handleContextMenuClick(key, view.path);
                },
              }}
            >
              <div
                data-path={view.path}
                className={`${styles.tag}${active ? ` ${styles.tagActive}` : ''}`}
                onClick={() => navigate(view.path)}
              >
                <span className={styles.tagTitle}>{view.title}</span>
                {view.closable && (
                  <CloseOutlined
                    className={styles.tagClose}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleClose(view.path);
                    }}
                  />
                )}
              </div>
            </Dropdown>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.arrow}
        aria-label="向右滚动标签"
        disabled={!canScrollRight}
        onClick={() => scrollList(1)}
      >
        <RightOutlined />
      </button>
    </div>
  );
};
export default TagsView;
