import request from '@/utils/request.ts';

export type MenuNode = {
  menuName: string;
  menuId: number;
  children?: MenuNode[];
};
// 获取菜单树（用于选择上级菜单）
export const menuOptions = async (isRoot: boolean) => {
  try {
    return await request.get<MenuNode[]>('/system/menu/options', {
      params: {
        needRoot: isRoot,
      },
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};
export type MenuTable = {
  menuId: number;
  menuName: string;
  menuType: string;
  menuSort: number;
  perms: string;
  component: string;
  status: string;
  children?: MenuTable[];
};

export type MenuSearchType = {
  menuName: string;
  status: string;
};
// 列表查询
export const menuList = async (params: MenuSearchType) => {
  try {
    return await request.get<MenuTable[]>('/system/menu/list', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export type MenuAddType = {
  menuId: number;
  parentId: number; // 上级菜单
  menuType: string; // 菜单类型
  menuSort: number; // 显示排序
  icon: string; // 菜单图标
  menuName: string; // 菜单名称
  path: string; // 路由地址
  visible: string; // 显示状态
  status: string; // 菜单状态
  name: string; // 路由名称
  component: string; // 组件地址
  perms: string; // 权限字符
  keepAlive: string; // 是否緩存
};
// 添加
export const addMenu = async (data: MenuAddType) => {
  try {
    return await request.post('/system/menu', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
// 根据id查询
export const getMenuById = async (id: number) => {
  try {
    return await request.get<MenuAddType>(`/system/menu/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 删除
export const deleteMenuById = async (id: number) => {
  try {
    return await request.post(`/system/menu/delete/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
// 保存排序
export const updateBatchMenuSort = async (MenuBatchDataSort: MenuTable[]) => {
  try {
    return await request.post('/system/menu/sort', MenuBatchDataSort);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
