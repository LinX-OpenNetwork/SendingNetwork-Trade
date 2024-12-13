import { PROJECT_NAME } from './metas';

export default [
  {
    path: '/',
    component: '@/layouts',
    routes: [
      {
        path: '/',
        redirect: '/create',
        title: `${PROJECT_NAME} | Create ${PROJECT_NAME}`
      },
      {
        path: '/create',
        component: '@/pages/create',
        title: `${PROJECT_NAME} | Create ${PROJECT_NAME}`
      },
      {
        path: '/record',
        component: '@/pages/record',
        title: `${PROJECT_NAME} | Transfer History`
      },
      {
        path: '/order',
        component: '@/pages/order',
        title: `${PROJECT_NAME} | Transfer`
      },
      {
        path: '/collection',
        component: '@/pages/collection',
        title: `${PROJECT_NAME} | Create Collection`
      },
      {
        path: '/collection-detail',
        component: '@/pages/collection-detail',
        title: `${PROJECT_NAME} | Collection Detail`
      },
      {
        path: '/collect-record',
        component: '@/pages/collection-record',
        title: `${PROJECT_NAME} | My Collection`
      }
    ]
  }
];
