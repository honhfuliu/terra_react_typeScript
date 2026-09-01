import { lazy } from 'react';
import { AppRoute } from '@/types/route.ts';

const routers: AppRoute[] = [
  {
    path: '/login',
    name: 'LOGIN',
    component: lazy(() => import('@/views/login')),
  },
  {
    path: '*',
    name: '404',
    component: lazy(() => import('@/views/notFound')),
  },
];

/*
{
  path: '/',
  component: AdminLayout,
  children: [
    {
      index: true,
      component: () => <Navigate to="/index" replace />,
    },
    {
      path: '/index',
      name: 'HOME',
      component: Home,
    },
    {
      path: '/system',
      name: 'SYSTEM',
      children: [
        {
          path: 'user',
          name: 'USER',
          component: lazy(() => import('@/views/system/user')),
        },
        {
          path: 'role',
          name: 'ROLE',
          component: lazy(() => import('@/views/system/role')),
        },
        {
          path: 'coding',
          name: 'CODING',
          component: lazy(() => import('@/views/system/globalEncodingConfiguration')),
        },
      ],
    },
  ],
},
*/
export default routers;
