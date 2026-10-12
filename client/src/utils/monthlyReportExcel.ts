import ExcelJS from 'exceljs'
import type { MonthlyReport } from '../types'

export interface MonthlyReportExcelLabels {
  monthlySummary: string
  reportPeriod: string
  totalAmount: string
  records: string
  averageDaily: string
  categoryBreakdown: string
  category: string
  categoryChinese: string
  categoryEnglish: string
  itemCount: string
  dailyTrend: string
  date: string
  purchaseDetails: string
  itemNameChinese: string
  itemNameEnglish: string
  quantity: string
  unit: string
  unitPrice: string
  note: string
}

export async function downloadMonthlyReportExcel(
  report: MonthlyReport,
  labels: MonthlyReportExcelLabels
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const summarySheet = workbook.addWorksheet(labels.monthlySummary)
  summarySheet.addRows([
    [labels.reportPeriod, report.month],
    [labels.totalAmount, report.summary.total_amount],
    [labels.records, report.summary.total_records],
    [labels.averageDaily, report.summary.avg_daily]
  ])
  summarySheet.columns = [{ width: 24 }, { width: 20 }]

  const categorySheet = workbook.addWorksheet(labels.categoryBreakdown)
  categorySheet.addRow([
    labels.category,
    labels.categoryEnglish,
    labels.itemCount,
    labels.totalAmount
  ])
  categorySheet.addRows(report.categoryStats.map(row => [
    row.category_name_zh,
    row.category_name_en,
    row.item_count,
    row.total_amount
  ]))
  categorySheet.columns = [
    { width: 24 },
    { width: 28 },
    { width: 16 },
    { width: 20 }
  ]
  categorySheet.getRow(1).font = { bold: true }

  const dailySheet = workbook.addWorksheet(labels.dailyTrend)
  dailySheet.addRow([labels.date, labels.records, labels.totalAmount])
  dailySheet.addRows(report.dailyStats.map(row => [
    row.purchase_date,
    row.record_count,
    row.total_amount
  ]))
  dailySheet.columns = [{ width: 18 }, { width: 16 }, { width: 20 }]
  dailySheet.getRow(1).font = { bold: true }

  const detailSheet = workbook.addWorksheet(labels.purchaseDetails)
  detailSheet.addRow([
    labels.date,
    labels.categoryChinese,
    labels.categoryEnglish,
    labels.itemNameChinese,
    labels.itemNameEnglish,
    labels.quantity,
    labels.unit,
    labels.unitPrice,
    labels.totalAmount,
    labels.note
  ])
  detailSheet.addRows(report.purchaseDetails.map(row => [
    row.purchase_date,
    row.category_name_zh ?? '',
    row.category_name_en ?? '',
    row.item_name_zh,
    row.item_name_en,
    row.quantity,
    row.unit ?? '',
    row.unit_price,
    row.total_price,
    row.note ?? ''
  ]))
  detailSheet.columns = [
    { width: 18 },
    { width: 24 },
    { width: 28 },
    { width: 28 },
    { width: 32 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 18 },
    { width: 36 }
  ]
  detailSheet.getRow(1).font = { bold: true }
  detailSheet.autoFilter = 'A1:J1'
  detailSheet.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `monthly-report-${report.month}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
