
const routes = [
  {
    path: '/print',
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
      { path: '', component: () => import('pages/Index.vue') }
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
