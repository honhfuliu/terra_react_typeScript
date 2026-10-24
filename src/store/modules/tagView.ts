import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 标签页接口定义
export interface TagView {
  path: string; //
  title: string; // 标签页标题
  closable: boolean; // 是否可关闭
  keepAlive: boolean; // 是否缓存
}

// 标签页状态管理
interface TagViewState {
  visitedViews: TagView[];
}

// 初始状态
const initialState: TagViewState = {
  visitedViews: [],
};

// 创建标签页
const tagViewSlice = createSlice({
  name: 'tagViews',
  initialState,
  reducers: {
    // 添加 Tab：已存在则不重复添加
    addView(state, action: PayloadAction<TagView>) {
      const view = action.payload;
      const exists = state.visitedViews.some((item) => item.path === view.path);

      if (!exists) {
        state.visitedViews.push(view);
      }
    },
    // 关闭指定 Tab
    delView(state, action: PayloadAction<string>) {
      state.visitedViews = state.visitedViews.filter(
        (item) => item.path !== action.payload || !item.closable,
      );
    },

    // 关闭其他 Tab，保留固定 Tab 和当前 Tab
    delOthersViews(state, action: PayloadAction<string>) {
      state.visitedViews = state.visitedViews.filter(
        (item) => !item.closable || item.path === action.payload,
      );
    },

    // 关闭左侧 Tab
    delLeftViews(state, action: PayloadAction<string>) {
      const index = state.visitedViews.findIndex((item) => item.path === action.payload);
      if (index !== -1) {
        state.visitedViews = state.visitedViews.filter(
          (item, itemIndex) => !item.closable || itemIndex >= index,
        );
      }
    },

    // 关闭右侧 Tab
    delRightViews(state, action: PayloadAction<string>) {
      const index = state.visitedViews.findIndex((item) => item.path === action.payload);
      if (index !== -1) {
        state.visitedViews = state.visitedViews.filter(
          (item, itemIndex) => !item.closable || itemIndex <= index,
        );
      }
    },

    // 关闭所有非固定 Tab
    delAllViews(state) {
      state.visitedViews = [];
    },
  },
});
export const { addView, delView, delOthersViews, delLeftViews, delRightViews, delAllViews } =
  tagViewSlice.actions;

export default tagViewSlice.reducer;
