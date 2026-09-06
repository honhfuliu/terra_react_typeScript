import { getRouters } from '@/service/router.ts';
import { transformMenus } from '@/router/transform.ts';
import { store } from '@/store';
import { setPermission } from '@/store/modules/permission.ts';
import { getUserPerms } from '@/service/auto.ts';

// 初始化获取路由信息
export async function initPermission() {
  try {
    const data = await getRouters();
    // 获取当前用户权限
    const permissionData = await getUserPerms();
    console.log('permissionData', permissionData);
    if (data && data.children && permissionData) {
      const menus = transformMenus(data.children);
      store.dispatch(
        setPermission({
          menus: menus,
          routes: data,
          permissions: permissionData.permissions,
          roles: permissionData.roles,
        }),
      );
    }
  } catch (e) {
    console.error(e);
  }
}
