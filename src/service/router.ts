import request from '@/utils/request.ts';
import { AppRoute } from '@/types/route.ts';

export const getRouters = async () => {
  try {
    return await request.get<AppRoute>('/auth/getRouters');
  } catch (e) {
    console.error(e);
    return null;
  }
};
