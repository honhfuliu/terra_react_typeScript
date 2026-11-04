// 注册Store
import { configureStore } from '@reduxjs/toolkit';
import layoutReducer from './modules/layout.ts';
import permissionReducer from './modules/permission.ts';
import tagViewsReducer from './modules/tagView.ts';
import storage from '@/utils/storage.ts';
import { STORAGE_KEY } from '@/constants';
export const store = configureStore({
  reducer: {
    layout: layoutReducer,
    permission: permissionReducer,
    tagViews: tagViewsReducer,
  },
});
// 记录上一次的 visitedViews 引用（用于后续对比是否发生变化）
let previousViews = store.getState().tagViews.visitedViews;

// 订阅 store 的变化：每次 dispatch 导致 state 更新时都会触发这个回调
store.subscribe(() => {
  // 获取当前最新的 visitedViews
  const currentViews = store.getState().tagViews.visitedViews;
  if (currentViews === previousViews) {
    return;
  }
  // 引用变了，更新 previousViews，供下次对比使用
  previousViews = currentViews;
  // 将 currentViews 保存到 localStorage
  storage.setSession(STORAGE_KEY.TAG_VIEWS, currentViews);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
