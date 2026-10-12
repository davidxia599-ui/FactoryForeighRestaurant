import { shallowRef, computed } from 'vue'
import type { Tenant } from '../types'
import * as tenantApi from '../api/tenant'

const currentTenant = shallowRef<Tenant | null>(null)
const tenants = shallowRef<Tenant[]>([])

export function useTenant() {
  const hasTenant = computed(() => !!currentTenant.value)

  async function fetchTenants(preferredTenantId?: number) {
    tenants.value = await tenantApi.getTenants()

    if (tenants.value.length === 0) {
      currentTenant.value = null
      localStorage.removeItem('currentTenant')
      return
    }

    if (!currentTenant.value) {
      const stored = localStorage.getItem('currentTenant')
      let storedTenantId: number | undefined

      if (stored) {
        try {
          const parsed: unknown = JSON.parse(stored)
          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'id' in parsed &&
            typeof parsed.id === 'number'
          ) {
            storedTenantId = parsed.id
          }
        } catch (error) {
          console.warn('無法讀取已儲存的租戶選取，將使用登入帳號的租戶。', error)
          localStorage.removeItem('currentTenant')
        }
      }

      currentTenant.value =
        tenants.value.find(tenant => tenant.id === preferredTenantId) ??
        tenants.value.find(tenant => tenant.id === storedTenantId) ??
        tenants.value[0]
      localStorage.setItem('currentTenant', JSON.stringify(currentTenant.value))
    }
  }

  function selectTenant(tenant: Tenant) {
    currentTenant.value = tenant
    localStorage.setItem('currentTenant', JSON.stringify(tenant))
  }

  async function createTenant(name: string) {
    const tenant = await tenantApi.createTenant(name)
    tenants.value = [...tenants.value, tenant]
    selectTenant(tenant)
  }

  return { currentTenant, tenants, hasTenant, fetchTenants, selectTenant, createTenant }
}
