import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/add',
    name: 'AddBill',
    component: () => import('../views/AddBill.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
