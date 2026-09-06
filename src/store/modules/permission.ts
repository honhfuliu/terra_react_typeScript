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
  permissions: string[];
  roles: string[];
}

const initialState: PermissionStore = {
  menus: [],
  routes: {},
  permissions: [],
  roles: [],
};

const permissionStore = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    setPermission(
      state,
      action: PayloadAction<{
        menus: MenuItem[];
        routes: AppRoute;
        permissions: string[];
        roles: string[];
      }>,
    ) {
      state.routes = action.payload.routes;
      state.menus = action.payload.menus;
      state.permissions = action.payload.permissions;
      state.roles = action.payload.roles;
    },

    clearPermission(state) {
      state.menus = [];
      state.routes = {};
      state.permissions = [];
      state.roles = [];
    },
  },
});

export const { clearPermission, setPermission } = permissionStore.actions;

export default permissionStore.reducer;
