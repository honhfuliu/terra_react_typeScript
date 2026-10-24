import { lazy } from 'react';
import { AppRoute } from '@/types/route.ts';

const routers: AppRoute[] = [
  {
    path: '/login',
    name: 'LOGIN',
    component: lazy(() => import('@/views/login')),
  },
  {
    path: '/profile',
    name: 'PROFILE',
    component: lazy(() => import('@/views/profile')),
  },
  {
    path: '/403',
    name: '403',
    component: lazy(() => import('@/views/forbidden')),
  },
  {
    path: '*',
    name: '404',
    component: lazy(() => import('@/views/notFound')),
  },
];

export default routers;
