
const routes = [
  {
    path: '/print', // print path is used by usually invisible printing windows.
    component: () => import('layouts/Print.vue'),
    children: [
      { path: '', component: () => import('pages/print/Index.vue') },
      { path: 'invoice', component: () => import('pages/print/Invoice.vue') },
      { path: 'receipt', component: () => import('pages/print/Receipt.vue') },
      { path: 'order', component: () => import('pages/print/Order.vue') }
    ]
  },
  {
    path: '/',
    component: () => import('layouts/MyLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: 'settings', component: () => import('pages/Settings.vue') },
      { path: 'password', component: () => import('pages/Password.vue') },
      { path: 'quicksale', component: () => import('pages/QuickSale.vue') },
      { path: 'salesorders', component: () => import('pages/SalesOrders.vue') },
      { path: 'salesorder', component: () => import('pages/SalesOrder.vue') },
      { path: 'salesorder/:DocEntry', props: true, component: () => import('pages/SalesOrder.vue') },
      { path: 'report', component: () => import('pages/Report.vue') }
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
