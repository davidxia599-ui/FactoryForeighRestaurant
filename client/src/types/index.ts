export interface Tenant {
  id: number
  name: string
  created_at: string
}

export interface User {
  id: number
  tenantId: number
  username: string
  role: string
  permissions: UserPermissions
}

export interface UserPermissions {
  dashboard: boolean
  purchases: boolean
  items: boolean
  reports: boolean
  tenants: boolean
  users: boolean
}

export type PermissionKey = keyof UserPermissions

export interface UserAccount extends User {
  tenantName: string
  createdAt: string
}

export interface Category {
  id: number
  tenant_id: number
  name_zh: string
  name_en: string
  sort_order: number
}

export interface Item {
  id: number
  tenant_id: number
  category_id: number
  name_zh: string
  name_en: string
  unit: string
  created_at: string
  category_name_zh?: string
  category_name_en?: string
}

export interface Purchase {
  id: number
  tenant_id: number
  item_id: number
  item_name_zh: string
  item_name_en: string
  category_name_zh: string
  category_name_en: string
  quantity: number
  unit_price: number
  total_price: number
  unit: string
  purchase_date: string
  note: string
  created_by: number
  created_at: string
}

export interface MonthlyReport {
  month: string
  summary: {
    total_amount: number
    total_records: number
    avg_daily: number
  }
  dailyStats: Array<{
    purchase_date: string
    total_amount: number
    record_count: number
  }>
  categoryStats: Array<{
    category_name_zh: string
    category_name_en: string
    total_amount: number
    item_count: number
  }>
}

export interface CategoryStat {
  category_name_zh: string
  category_name_en: string
  total_amount: number
  record_count: number
  total_quantity: number
}
