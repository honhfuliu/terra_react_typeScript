import * as React from 'react';
import styles from './index.module.less';
import { Grid, Input, Modal, Divider } from 'antd';
import {
  SearchOutlined,
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  FileTextOutlined,
  ProfileOutlined,
  MonitorOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  ApartmentOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

// 静态菜单数据（后续接入真实菜单数据）
interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon: React.ReactNode;
}

const staticMenus: MenuItem[] = [
  { id: 1, name: '仪表盘', path: '/dashboard', icon: <DashboardOutlined /> },
  { id: 2, name: '用户管理', path: '/system/user', icon: <UserOutlined /> },
  { id: 3, name: '角色管理', path: '/system/role', icon: <TeamOutlined /> },
  { id: 4, name: '菜单管理', path: '/system/menu', icon: <OrderedListOutlined /> },
  { id: 5, name: '部门管理', path: '/system/dept', icon: <ApartmentOutlined /> },
  { id: 6, name: '字典管理', path: '/system/dict', icon: <FileTextOutlined /> },
  { id: 7, name: '通知公告', path: '/system/announcement', icon: <BellOutlined /> },
  { id: 8, name: '操作日志', path: '/system/operation-log', icon: <ProfileOutlined /> },
  { id: 9, name: '登录日志', path: '/system/loginlog', icon: <LogoutOutlined /> },
  { id: 10, name: '在线用户', path: '/monitor/online', icon: <MonitorOutlined /> },
  { id: 11, name: '参数设置', path: '/system/config', icon: <SettingOutlined /> },
  { id: 12, name: '安全中心', path: '/profile', icon: <SafetyCertificateOutlined /> },
];

const Search: React.FC = () => {
  // 响应式处理
  const screens = Grid.useBreakpoint();
  // 对话框控制
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 当前选中的菜单项索引
  const [activeIndex, setActiveIndex] = useState(0);

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
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
                <Input prefix={<SearchOutlined />} placeholder={'输入关键字搜索菜单'} />
              </div>
            </div>
          }
          closable
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          footer={null}
        >
          <div>
            <div>
              <Divider />
            </div>
            <div className={styles.modal_body}>
              {staticMenus.length === 0 ? (
                <div className={styles.empty_text}>暂无匹配的菜单</div>
              ) : (
                <ul className={styles.menu_list}>
                  {staticMenus.map((menu, index) => (
                    <li
                      key={menu.id}
                      className={`${styles.menu_item} ${index === activeIndex ? styles.active : ''}`}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <span className={styles.menu_icon}>{menu.icon}</span>
                      <span className={styles.menu_name}>{menu.name}</span>
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
                <div className={styles.footer_right}>共 {staticMenus.length} 项</div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
export default Search;
