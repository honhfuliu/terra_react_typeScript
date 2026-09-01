// 注册Store
import { configureStore } from '@reduxjs/toolkit';
import layoutReducer from './modules/layout.ts';
import permissionReducer from './modules/permission.ts';

export const store = configureStore({
  reducer: {
    layout: layoutReducer,
    permission: permissionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
