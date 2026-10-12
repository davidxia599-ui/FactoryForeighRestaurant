<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useTenant } from '../composables/useTenant'
import { getPurchases } from '../api/purchase'
import { getItems } from '../api/item'
import { formatCurrency } from '../utils/currency'
import type { Purchase } from '../types'

const { t } = useI18n()
const { hasTenant } = useTenant()

const loading = ref(false)
const todayPurchases = ref<Purchase[]>([])
const recentPurchases = ref<Purchase[]>([])
const totalItems = ref(0)
const todayTotal = ref(0)
const monthTotal = ref(0)

const today = new Date().toISOString().split('T')[0]
const month = today.substring(0, 7)

async function fetchDashboard() {
  if (!hasTenant.value) return
  loading.value = true
  try {
    const [purchases, items] = await Promise.all([
      getPurchases({ start_date: today, end_date: today }),
      getItems()
    ])
    todayPurchases.value = purchases
    totalItems.value = items.length
    todayTotal.value = purchases.reduce((sum, p) => sum + p.total_price, 0)

    const monthPurchases = await getPurchases({
      start_date: `${month}-01`,
      end_date: today
    })
    monthTotal.value = monthPurchases.reduce((sum, p) => sum + p.total_price, 0)
    recentPurchases.value = monthPurchases.slice(0, 5)
  } catch {
    ElMessage.error(t('common.loadError'))
  } finally {
    loading.value = false
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

onMounted(fetchDashboard)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ t('common.dashboard') }}</h1>
    </div>

    <el-alert
      v-if="!hasTenant"
      :title="t('common.noTenantSelected')"
      type="warning"
      :closable="false"
      style="margin-bottom: 20px"
    />

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ todayPurchases.length }}</div>
          <div class="stat-label">{{ t('common.todayPurchases') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ formatCurrency(todayTotal) }}</div>
          <div class="stat-label">{{ t('common.todayPurchases') }} {{ t('common.amount') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ formatCurrency(monthTotal) }}</div>
          <div class="stat-label">{{ t('common.monthPurchases') }} {{ t('common.amount') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ totalItems }}</div>
          <div class="stat-label">{{ t('common.totalItems') }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <span>{{ t('common.recentPurchases') }}</span>
      </template>
      <el-table :data="recentPurchases" v-loading="loading" stripe>
        <el-table-column :label="t('common.date')" prop="purchase_date" width="120">
          <template #default="{ row }">
            {{ formatDate(row.purchase_date) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.item')" prop="item_name_zh" />
        <el-table-column :label="t('common.category')" prop="category_name_zh" width="120" />
        <el-table-column :label="t('common.quantity')" prop="quantity" width="100" />
        <el-table-column :label="t('common.totalPrice')" prop="total_price" width="120">
          <template #default="{ row }">
            {{ formatCurrency(row.total_price) }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && recentPurchases.length === 0" :description="t('common.noRecentPurchases')" />
    </el-card>
  </div>
</template>
