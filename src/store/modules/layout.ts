import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { STORAGE_KEY } from '@/constants';
import storage from '@/utils/storage.ts';

interface LayoutState {
  collapsed: boolean;
  theme: 'light' | 'dark';
}
// 获取常量中存储的主题颜色
const cacheTheme = storage.get<'light' | 'dark'>(STORAGE_KEY.THEME);

const initialState: LayoutState = {
  collapsed: false,
  theme: cacheTheme ?? 'light',
};
// 管理侧边栏折叠状态
const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    setCollapsed(state, action: PayloadAction<boolean>) {
      state.collapsed = action.payload;
    },
    // 主题切换
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
      storage.set(STORAGE_KEY.THEME, action.payload);
    },

    toggleCollapsed(state) {
      state.collapsed = !state.collapsed;
    },
  },
});

export const { setCollapsed, toggleCollapsed, setTheme } = layoutSlice.actions;

export default layoutSlice.reducer;
