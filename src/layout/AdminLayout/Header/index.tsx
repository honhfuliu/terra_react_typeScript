import * as React from 'react';
import styles from './index.module.less';
import avatarImage from '@/assets/images/avatar.png';
import { Avatar, Breadcrumb, Button, Dropdown, Layout, MenuProps, Space, Grid } from 'antd';
import {
  BellOutlined,
  FullscreenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
  TranslationOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, toggleCollapsed } from '@/store/modules/layout.ts';
import { RootState } from '@/store';
import Search from '@/layout/AdminLayout/Header/Search';
import GERENZHONGXIN from '@/assets/svgs/GERENZHONGXIN.svg?react';
import Exit from '@/assets/svgs/Exit.svg?react';

const { Header: AntdHeader } = Layout;
const Header: React.FC = () => {
  const dispatch = useDispatch();
  const collapsed = useSelector((state: RootState) => state.layout.collapsed);
  const themeMode = useSelector((state: RootState) => state.layout.theme);
  // 切换主题
  const switchTheme = () => {
    dispatch(setTheme(themeMode === 'dark' ? 'light' : 'dark'));
  };

  // 响应式处理
  const screens = Grid.useBreakpoint();

  const items: MenuProps['items'] = [
    {
      key: '4',
      label: '个人设置',
      icon: <GERENZHONGXIN width={16} height={16} />,
    },
    {
      key: '5',
      label: '退出登录',
      icon: <Exit width={16} height={16} />,
    },
  ];
  const languages: MenuProps['items'] = [
    {
      key: '1',
      label: '简体中文',
    },
    {
      key: '2',
      label: 'English',
    },
  ];

  return (
    <AntdHeader className={styles.header}>
      <div className={styles.layout}>
        <div className={styles.left}>
          <div>
            <Button
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => {
                dispatch(toggleCollapsed());
              }}
            ></Button>
          </div>
          <div>
            {screens.lg && (
              <Breadcrumb
                items={[{ title: '首页' }, { title: '系统管理' }, { title: '菜单管理' }]}
              />
            )}
          </div>
        </div>
        <div className={styles.right}>
          <Space size={'large'}>
            <div>
              <Search />
            </div>
            <div>
              <Dropdown
                menu={{ items: languages }}
                placement="bottomRight"
                trigger={['click']}
                popupRender={(menu) => <div style={{ marginTop: 12 }}>{menu}</div>}
              >
                <a onClick={(e) => e.preventDefault()}>
                  <TranslationOutlined style={{ fontSize: 16 }} />
                </a>
              </Dropdown>
            </div>
            <div>
              {themeMode === 'dark' ? (
                <MoonOutlined style={{ fontSize: 16, cursor: 'pointer' }} onClick={switchTheme} />
              ) : (
                <SunOutlined style={{ fontSize: 16, cursor: 'pointer' }} onClick={switchTheme} />
              )}
            </div>
            <div>
              <FullscreenOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
            </div>
            <div>
              <BellOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
            </div>
            <div>
              <Dropdown
                menu={{ items: items }}
                trigger={['click']}
                placement="bottomRight"
                popupRender={(menu) => <div style={{ marginTop: 11 }}>{menu}</div>}
              >
                <a onClick={(e) => e.preventDefault()}>
                  <Space>
                    <Avatar
                      size={{ xs: 24, sm: 24, md: 32, lg: 32, xl: 32 }}
                      src={avatarImage}
                      icon={<UserOutlined />}
                    />
                  </Space>
                </a>
              </Dropdown>
            </div>
          </Space>
        </div>
      </div>
    </AntdHeader>
  );
};
export default Header;
