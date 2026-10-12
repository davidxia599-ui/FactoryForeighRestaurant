<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MonthlyReport } from '../../types'
import { formatCurrency } from '../../utils/currency'

defineProps<{
  rows: MonthlyReport['purchaseDetails']
}>()

const { t } = useI18n()
</script>

<template>
  <el-card>
    <template #header>
      <span>{{ t('common.purchaseDetails') }}</span>
    </template>
    <el-table :data="rows" stripe>
      <el-table-column :label="t('common.date')" prop="purchase_date" width="130" />
      <el-table-column :label="t('common.category')" prop="category_name_zh" min-width="120" />
      <el-table-column :label="t('common.item')" prop="item_name_zh" min-width="140" />
      <el-table-column :label="t('common.quantity')" prop="quantity" width="100" />
      <el-table-column :label="t('common.unit')" prop="unit" width="90" />
      <el-table-column :label="t('common.unitPrice')" prop="unit_price" width="150">
        <template #default="{ row }">
          {{ formatCurrency(row.unit_price) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('common.totalAmount')" prop="total_price" width="150">
        <template #default="{ row }">
          {{ formatCurrency(row.total_price) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('common.note')" prop="note" min-width="160" />
    </el-table>
  </el-card>
</template>
