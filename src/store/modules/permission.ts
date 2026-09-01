import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppRoute } from '@/types/route.ts';

/*
  动态路由
  菜单树
  权限列表
  是否加载完成
*/
export interface MenuItem {
  key: string | null | undefined;
  label: string | null | undefined;
  icon?: string | null | undefined;
  children?: MenuItem[];
}

interface PermissionStore {
  menus: MenuItem[];
  routes: AppRoute;
}

const initialState: PermissionStore = {
  menus: [],
  routes: {},
};

const permissionStore = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    setPermission(state, action: PayloadAction<{ menus: MenuItem[]; routes: AppRoute }>) {
      state.routes = action.payload.routes;
      state.menus = action.payload.menus;
    },

    clearPermission(state) {
      state.menus = [];
      state.routes = {};
    },
  },
});

export const { clearPermission, setPermission } = permissionStore.actions;

export default permissionStore.reducer;
