import { getRouters } from '@/service/router.ts';
import { transformMenus } from '@/router/transform.ts';
import { store } from '@/store';
import { setPermission } from '@/store/modules/permission.ts';

// 初始化获取路由信息
export async function initPermission() {
  try {
    const data = await getRouters();
    if (data && data.children) {
      const menus = transformMenus(data.children);
      store.dispatch(setPermission({ menus: menus, routes: data }));
    }
  } catch {
    /* empty */
  }
}
