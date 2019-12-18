
const routes = [
  {
    path: '/print', // print path is used by usually invisible printing windows.
    component: () => import('layouts/Print.vue'),
    children: [
      { path: '', component: () => import('pages/print/Index.vue') },
      { path: 'invoice', component: () => import('pages/print/Invoice.vue') },
      { path: 'bill', component: () => import('pages/print/Bill.vue') },
      { path: 'note', component: () => import('pages/print/Note.vue') }
    ]
  },
  {
    path: '/',
    component: () => import('layouts/MyLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: 'auth/login', component: () => import('pages/auth/Login.vue') },
      { path: 'sales/rapid', component: () => import('pages/sales/Rapid.vue') }
    ]
  }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue')
  })
}

export default routes
