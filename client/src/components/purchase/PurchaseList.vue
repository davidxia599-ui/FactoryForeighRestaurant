<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Purchase } from '../../types'
import { formatCurrency } from '../../utils/currency'

defineProps<{
  purchases: Purchase[]
  loading: boolean
}>()

const emit = defineEmits<{
  edit: [purchase: Purchase]
  delete: [purchase: Purchase]
}>()

const { t } = useI18n()

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <el-table :data="purchases" v-loading="loading" stripe>
    <el-table-column :label="t('common.date')" prop="purchase_date" width="120">
      <template #default="{ row }">
        {{ formatDate(row.purchase_date) }}
      </template>
    </el-table-column>
    <el-table-column :label="t('common.item')" prop="item_name_zh" />
    <el-table-column :label="t('common.category')" prop="category_name_zh" width="120" />
    <el-table-column :label="t('common.quantity')" prop="quantity" width="100" />
    <el-table-column :label="t('common.unitPrice')" prop="unit_price" width="120">
      <template #default="{ row }">
        {{ formatCurrency(row.unit_price) }}
      </template>
    </el-table-column>
    <el-table-column :label="t('common.totalPrice')" prop="total_price" width="120">
      <template #default="{ row }">
        {{ formatCurrency(row.total_price) }}
      </template>
    </el-table-column>
    <el-table-column :label="t('common.note')" prop="note" show-overflow-tooltip />
    <el-table-column :label="t('common.actions')" width="150" fixed="right">
      <template #default="{ row }">
        <el-button size="small" @click="emit('edit', row)">{{ t('common.edit') }}</el-button>
        <el-button size="small" type="danger" @click="emit('delete', row)">{{ t('common.delete') }}</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
