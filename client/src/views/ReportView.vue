<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import ReportPurchaseDetails from '../components/report/ReportPurchaseDetails.vue'
import { useTenant } from '../composables/useTenant'
import { getMonthlyReport } from '../api/report'
import { formatCurrency } from '../utils/currency'
import type { MonthlyReport } from '../types'

const { t } = useI18n()
const { hasTenant } = useTenant()

const loading = ref(false)
const exporting = ref(false)
const report = ref<MonthlyReport | null>(null)
const selectedMonth = ref(new Date().toISOString().substring(0, 7))

async function fetchReport() {
  if (!hasTenant.value) return
  loading.value = true
  report.value = null
  try {
    report.value = await getMonthlyReport(selectedMonth.value)
  } catch {
    ElMessage.error(t('common.loadError'))
  } finally {
    loading.value = false
  }
}

function handleMonthChange() {
  fetchReport()
}

async function handleExport() {
  if (!report.value || report.value.month !== selectedMonth.value || loading.value) return

  exporting.value = true
  try {
    const { downloadMonthlyReportExcel } = await import('../utils/monthlyReportExcel')
    await downloadMonthlyReportExcel(report.value, {
      monthlySummary: t('common.monthlySummary'),
      reportPeriod: t('common.reportPeriod'),
      totalAmount: t('common.totalAmount'),
      records: t('common.records'),
      averageDaily: t('common.averageDaily'),
      categoryBreakdown: t('common.categoryBreakdown'),
      category: t('common.category'),
      categoryChinese: t('common.categoryChinese'),
      categoryEnglish: t('common.categoryEnglish'),
      itemCount: t('common.itemCount'),
      dailyTrend: t('common.dailyTrend'),
      date: t('common.date'),
      purchaseDetails: t('common.purchaseDetails'),
      itemNameChinese: t('common.itemNameChinese'),
      itemNameEnglish: t('common.itemNameEnglish'),
      quantity: t('common.quantity'),
      unit: t('common.unit'),
      unitPrice: t('common.unitPrice'),
      note: t('common.note')
    })
    ElMessage.success(t('common.exportSuccess'))
  } catch (error) {
    console.error('匯出月度報表失敗:', error)
    ElMessage.error(t('common.exportError'))
  } finally {
    exporting.value = false
  }
}

onMounted(fetchReport)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ t('common.reports') }}</h1>
    </div>

    <el-card style="margin-bottom: 20px">
      <el-form :inline="true">
        <el-form-item :label="t('common.reportPeriod')">
          <el-date-picker
            v-model="selectedMonth"
            type="month"
            :placeholder="t('common.reportPeriod')"
            value-format="YYYY-MM"
            @change="handleMonthChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="exporting"
            :disabled="!report || report.month !== selectedMonth || loading"
            @click="handleExport"
          >
            {{ t('common.exportExcel') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <template v-if="report">
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :xs="24" :sm="8">
          <el-card class="stat-card">
            <div class="stat-value">{{ formatCurrency(report.summary.total_amount) }}</div>
            <div class="stat-label">{{ t('common.totalAmount') }}</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-card class="stat-card">
            <div class="stat-value">{{ report.summary.total_records }}</div>
            <div class="stat-label">{{ t('common.records') }}</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-card class="stat-card">
            <div class="stat-value">{{ formatCurrency(report.summary.avg_daily) }}</div>
            <div class="stat-label">{{ t('common.averageDaily') }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-card style="margin-bottom: 20px">
        <template #header>
          <span>{{ t('common.categoryBreakdown') }}</span>
        </template>
        <el-table :data="report.categoryStats" stripe>
          <el-table-column :label="t('common.category')" prop="category_name_zh" />
          <el-table-column :label="t('common.itemsCount')" prop="item_count" width="120" />
          <el-table-column :label="t('common.totalAmount')" prop="total_amount" width="150">
            <template #default="{ row }">
              {{ formatCurrency(row.total_amount) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card>
        <template #header>
          <span>{{ t('common.dailyTrend') }}</span>
        </template>
        <el-table :data="report.dailyStats" stripe>
          <el-table-column :label="t('common.date')" prop="purchase_date" width="150" />
          <el-table-column :label="t('common.records')" prop="record_count" width="120" />
          <el-table-column :label="t('common.totalAmount')" prop="total_amount" width="150">
            <template #default="{ row }">
              {{ formatCurrency(row.total_amount) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <ReportPurchaseDetails
        :rows="report.purchaseDetails"
        style="margin-top: 20px"
      />
    </template>
  </div>
</template>
