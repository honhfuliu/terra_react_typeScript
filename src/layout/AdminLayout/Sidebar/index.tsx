import * as React from 'react';
import styles from './index.module.less';
import { Layout, Menu, theme } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setCollapsed } from '@/store/modules/layout.ts';
import { useDispatch } from 'react-redux';
import type { MenuProps } from 'antd';
import logo from '@/assets/images/logo.svg';
import {
  HomeOutlined,
  SettingOutlined,
  SmileOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { MenuItem } from '@/store/modules/permission.ts';

type AntdMenuItem = Required<MenuProps>['items'][number];

const { Sider } = Layout;
const Sidebar: React.FC = () => {
  const collapsed = useSelector((state: RootState) => state.layout.collapsed);
  const menus = useSelector((state: RootState) => state.permission.menus); // 获取动态菜单
  const { token } = theme.useToken();
  const dispatch = useDispatch();
  const items: AntdMenuItem[] = [
    {
      key: '/index',
      label: '首页',
      icon: <HomeOutlined />,
    },
    {
      key: '/system',
      label: '系统管理',
      icon: <SettingOutlined />,
      children: [
        {
          key: '/system/user',
          label: '用户管理',
          icon: <UserDeleteOutlined />,
        },
        {
          key: '/system/role',
          label: '角色管理',
          icon: <SmileOutlined />,
        },
        {
          key: '/system/coding',
          label: '全局编码',
          icon: <SmileOutlined />,
        },
      ],
    },
    {
      key: '/system1',
      label: '系统管理',
      icon: <SettingOutlined />,
      children: [
        {
          key: '/system/use1r',
          label: '用户管理',
          icon: <UserDeleteOutlined />,
        },
        {
          key: '/system/role1',
          label: '角色管理',
          icon: <SmileOutlined />,
        },
      ],
    },
  ];

  // 类型转换
  const convertMenuItems = (menus: MenuItem[]): AntdMenuItem[] => {
    return menus.map((menuItem) => ({
      key: menuItem.key!,
      label: menuItem.label,
      icon: <HomeOutlined />,
      children: menuItem.children?.length ? convertMenuItems(menuItem.children) : undefined,
    }));
  };
  const menuItems = convertMenuItems(menus); // 转换类型

  const navigate = useNavigate();

  const location = useLocation();

  return (
    <Sider
      collapsed={collapsed}
      trigger={null}
      breakpoint="lg"
      collapsedWidth={64}
      onBreakpoint={(broken) => {
        dispatch(setCollapsed(broken));
      }}
      className={styles.sidebar}
      style={{ background: token.colorBgContainer }}
    >
      <div className={styles.logo}>
        <img src={logo} />
        {!collapsed && <span>terra管理平台</span>}
      </div>
      <Menu
        className={styles.menu}
        selectedKeys={[location.pathname]}
        mode="inline"
        items={menuItems}
        onClick={(e) => {
          navigate(e.key);
        }}
      />
    </Sider>
  );
};
export default Sidebar;
