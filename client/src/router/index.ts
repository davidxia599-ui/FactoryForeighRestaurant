import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuth } from '../composables/useAuth'
import { useTenant } from '../composables/useTenant'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true, permission: 'dashboard' }
    },
    {
      path: '/purchase',
      name: 'Purchase',
      component: () => import('../views/PurchaseView.vue'),
      meta: { requiresAuth: true, permission: 'purchases' }
    },
    {
      path: '/items',
      name: 'Items',
      component: () => import('../views/ItemManageView.vue'),
      meta: { requiresAuth: true, permission: 'items' }
    },
    {
      path: '/reports',
      name: 'Reports',
      component: () => import('../views/ReportView.vue'),
      meta: { requiresAuth: true, permission: 'reports' }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

function getDefaultRoute(hasPermission: (permission: 'dashboard' | 'purchases' | 'items' | 'reports') => boolean) {
  if (hasPermission('dashboard')) return '/'
  if (hasPermission('purchases')) return '/purchase'
  if (hasPermission('items')) return '/items'
  if (hasPermission('reports')) return '/reports'
  return '/settings'
}

router.beforeEach(async (to) => {
  const { isAuthenticated, user, fetchUser, hasPermission } = useAuth()
  const { hasTenant, fetchTenants } = useTenant()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return '/login'
  }

  if (to.meta.requiresAuth) {
    await fetchUser()
    if (!user.value) return '/login'
    const permission = to.meta.permission
    if (
      (permission === 'dashboard' || permission === 'purchases' ||
        permission === 'items' || permission === 'reports') &&
      !hasPermission(permission)
    ) {
      return getDefaultRoute(hasPermission)
    }
  }

  if (to.meta.requiresAuth && !hasTenant.value) {
    try {
      await fetchTenants(user.value?.tenantId)
    } catch (error) {
      console.error('載入租戶失敗:', error)
      ElMessage.error('載入租戶失敗，請稍後再試')
      return false
    }
  }

  if (to.path === '/login' && isAuthenticated.value) {
    return getDefaultRoute(hasPermission)
  }

  return true
})

export default router
