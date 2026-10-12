<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import { useTenant } from '../../composables/useTenant'
import type { PermissionKey } from '../../types'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { user, logout, hasPermission } = useAuth()
const { currentTenant, tenants, selectTenant } = useTenant()

const navItems: Array<{ path: string; label: string; permission?: PermissionKey }> = [
  { path: '/', label: 'common.dashboard', permission: 'dashboard' },
  { path: '/purchase', label: 'common.purchase', permission: 'purchases' },
  { path: '/items', label: 'common.items', permission: 'items' },
  { path: '/reports', label: 'common.reports', permission: 'reports' },
  { path: '/settings', label: 'common.settings' }
]

const currentPath = computed(() => route.path)
const visibleNavItems = computed(() => navItems.filter(
  item => !item.permission || hasPermission(item.permission)
))

function handleLogout() {
  logout()
  router.push('/login')
}

function handleTenantChange(tenantId: number) {
  const tenant = tenants.value.find(t => t.id === tenantId)
  if (tenant) selectTenant(tenant)
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <h1 class="logo">{{ t('common.loginTitle') }}</h1>
    </div>
    <nav class="header-nav">
      <router-link
        v-for="item in visibleNavItems"
        :key="item.path"
        :to="item.path"
        class="nav-link"
        :class="{ active: currentPath === item.path }"
      >
        {{ t(item.label) }}
      </router-link>
    </nav>
    <div class="header-right">
      <el-select
        v-if="tenants.length > 0"
        :model-value="currentTenant?.id"
        @update:model-value="handleTenantChange"
        size="small"
        style="width: 150px; margin-right: 12px"
      >
        <el-option
          v-for="tenant in tenants"
          :key="tenant.id"
          :label="tenant.name"
          :value="tenant.id"
        />
      </el-select>
      <span class="username">{{ user?.username }}</span>
      <el-button size="small" @click="handleLogout">{{ t('common.logout') }}</el-button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
  margin: 0;
}

.header-nav {
  display: flex;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.nav-link {
  padding: 8px 16px;
  text-decoration: none;
  color: #606266;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-link:hover {
  color: #409eff;
  background: #ecf5ff;
}

.nav-link.active {
  color: #409eff;
  background: #ecf5ff;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 14px;
  color: #606266;
}

@media (max-width: 768px) {
  .header-nav {
    display: none;
  }
}
</style>
