//自定义less 切换
import { useEffect } from 'react';

export const useTheme = (theme: string) => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
};
