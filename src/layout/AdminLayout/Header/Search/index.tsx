import * as React from 'react';
import styles from './index.module.less';
import { Grid, Input, Modal, Divider } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { RootState } from '@/store';
import { useSelector } from 'react-redux';
import { getSearchableRoutes } from '@/router/helper.ts';
import { useLocation, useNavigate } from 'react-router-dom';

const Search: React.FC = () => {
  // 响应式处理
  const screens = Grid.useBreakpoint();

  const location = useLocation();
  const navigate = useNavigate();
  // 对话框控制
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 当前选中的菜单项索引
  const [activePath, setActivePath] = useState(location.pathname);
  const [keyword, setKeyword] = useState('');

  const routes = useSelector((state: RootState) => state.permission.routes);

  const searchValues = useMemo(() => {
    console.log('触发getSearchableRoutes');
    return getSearchableRoutes(routes?.children ?? []);
  }, [routes]);
  console.log('searchValues', searchValues);
  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // 跳转到指定菜单
  const handleNavigate = (path: string) => {
    navigate(path);
    setIsModalOpen(false);
  };

  // 搜索功能
  const filteredMenus = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) {
      return searchValues;
    }
    return searchValues.filter(
      (menu) => menu.title.toLowerCase().includes(value) || menu.path.toLowerCase().includes(value),
    );
  }, [searchValues, keyword]);
  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredMenus.length === 0) {
      return;
    }
    const currentIndex = filteredMenus.findIndex((menu) => menu.path === activePath);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex =
        currentIndex === -1 || currentIndex === filteredMenus.length - 1 ? 0 : currentIndex + 1;
      setActivePath(filteredMenus[nextIndex].path);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex <= 0 ? filteredMenus.length - 1 : currentIndex - 1;
      setActivePath(filteredMenus[prevIndex].path);
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const targetMenu = filteredMenus.find((menu) => menu.path === activePath);
      if (targetMenu) {
        handleNavigate(targetMenu.path);
      }
    }
  };

  return (
    <div className={styles.layout}>
      <div>
        {screens.lg && (
          <div
            className={styles.search}
            onClick={() => {
              setIsModalOpen(true);
            }}
          >
            <SearchOutlined style={{ fontSize: 14, cursor: 'pointer' }} />
            <span className={styles.text}>搜索菜单</span>
          </div>
        )}
        {!screens.lg && (
          <div
            onClick={() => {
              setIsModalOpen(true);
            }}
          >
            <SearchOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
          </div>
        )}
      </div>
      {/*搜索框*/}
      <div>
        <Modal
          rootClassName={styles.full_modal}
          width={600}
          className={styles.custom_modal}
          title={
            <div className={styles.modal_title}>
              <div>
                <Input
                  autoFocus
                  prefix={<SearchOutlined />}
                  placeholder={'输入关键字搜索菜单'}
                  value={keyword}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>
          }
          closable
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          footer={null}
          destroyOnHidden
        >
          <div>
            <div>
              <Divider />
            </div>
            <div className={styles.modal_body}>
              {filteredMenus.length === 0 ? (
                <div className={styles.empty_text}>暂无匹配的菜单</div>
              ) : (
                <ul className={styles.menu_list}>
                  {filteredMenus.map((menu) => (
                    <li
                      key={menu.path}
                      className={`${styles.menu_item} ${
                        menu.path === activePath ? styles.active : ''
                      }`}
                      onMouseEnter={() => setActivePath(menu.path)}
                      onClick={() => handleNavigate(menu.path)}
                    >
                      <span className={styles.menu_icon}>{menu.icon}</span>
                      <span className={styles.menu_name}>{menu.title}</span>
                      <span className={styles.menu_path}>{menu.path}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div>
                <Divider />
              </div>
            </div>
            <div className={styles.modal_footer}>
              <div className={styles.modal_footer_layout}>
                <div className={styles.footer_left}>
                  <div className={styles.footer_item}>
                    <kbd className={styles.keycap}>↑</kbd>
                    <kbd className={styles.keycap}>↓</kbd>
                    <span className={styles.footer_text}>导航</span>
                  </div>
                  <div className={styles.footer_item}>
                    <kbd className={styles.keycap}>Esc</kbd>
                    <span className={styles.footer_text}>关闭</span>
                  </div>
                  <div className={styles.footer_item}>
                    <kbd className={styles.keycap}>↵</kbd>
                    <span className={styles.footer_text}>选择</span>
                  </div>
                </div>
                <div className={styles.footer_right}>共 {filteredMenus.length} 项</div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
export default Search;
