import client from './client'
import type { Purchase } from '../types'

export interface PurchaseFilter {
  start_date?: string
  end_date?: string
  category_id?: number
  item_id?: number
}

export async function getPurchases(filter?: PurchaseFilter): Promise<Purchase[]> {
  const { data } = await client.get('/purchases', { params: filter })
  return data
}

export async function createPurchase(purchase: Partial<Purchase>): Promise<Purchase> {
  const { data } = await client.post('/purchases', purchase)
  return data
}

export async function updatePurchase(id: number, purchase: Partial<Purchase>): Promise<Purchase> {
  const { data } = await client.put(`/purchases/${id}`, purchase)
  return data
}

export async function deletePurchase(id: number): Promise<void> {
  await client.delete(`/purchases/${id}`)
}
