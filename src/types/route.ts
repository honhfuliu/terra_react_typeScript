import { RouteObject } from 'react-router-dom';
import * as React from 'react';

type Meta = {
  title: string;
  icon?: string;
  hidden?: boolean;
  keepAlive?: boolean;
};
/*
 * 路由类型定义
 * */
export type AppRoute = RouteObject & {
  name?: string;
  children?: AppRoute[];
  component?: React.ComponentType | string;
  meta?: Meta;
  redirect?: string;
};
