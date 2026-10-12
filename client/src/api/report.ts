import client from './client'
import type { MonthlyReport } from '../types'

export async function getMonthlyReport(month: string): Promise<MonthlyReport> {
  const { data } = await client.get('/reports/monthly', { params: { month } })
  return data
}

export async function getCategoryReport(start_date?: string, end_date?: string) {
  const { data } = await client.get('/reports/category', { params: { start_date, end_date } })
  return data
}
