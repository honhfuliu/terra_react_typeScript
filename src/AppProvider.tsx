import zhCN from 'antd/locale/zh_CN';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import App from '@/App.tsx';
import { useTheme } from '@/hooks/useTheme.ts';

const AppProvider: React.FC = () => {
  const mode = useSelector((state: RootState) => state.layout.theme);
  useTheme(mode);
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  );
};
export default AppProvider;
