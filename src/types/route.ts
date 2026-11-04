import * as React from 'react';

export type Meta = {
  title: string;
  icon?: string;
  hidden?: boolean;
  keepAlive?: boolean;
};
/*
 * 路由类型定义
 * */
export type AppRoute = {
  path?: string;
  index?: boolean;
  name?: string;
  children?: AppRoute[];
  component?: React.ComponentType | string;
  meta?: Meta;
  redirect?: string;
};

/**
 * 路由搜索项
 */
export type RouteSearchItem = {
  icon?: string;
  title: string;
  path: string;
};
