import client from './client'
import type { Category, Item } from '../types'

export async function getCategories(): Promise<Category[]> {
  const { data } = await client.get('/categories')
  return data
}

export async function createCategory(name_zh: string, name_en: string, sort_order?: number): Promise<Category> {
  const { data } = await client.post('/categories', { name_zh, name_en, sort_order })
  return data
}

export async function updateCategory(id: number, name_zh: string, name_en: string, sort_order?: number): Promise<Category> {
  const { data } = await client.put(`/categories/${id}`, { name_zh, name_en, sort_order })
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  await client.delete(`/categories/${id}`)
}

export async function getItems(): Promise<Item[]> {
  const { data } = await client.get('/items')
  return data
}

export async function createItem(item: Partial<Item>): Promise<Item> {
  const { data } = await client.post('/items', item)
  return data
}

export async function updateItem(id: number, item: Partial<Item>): Promise<Item> {
  const { data } = await client.put(`/items/${id}`, item)
  return data
}

export async function deleteItem(id: number): Promise<void> {
  await client.delete(`/items/${id}`)
}
