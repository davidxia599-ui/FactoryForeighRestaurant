import client from './client'
import type { Tenant } from '../types'

export async function getTenants(): Promise<Tenant[]> {
  const { data } = await client.get('/tenants')
  return data
}

export async function createTenant(name: string): Promise<Tenant> {
  const { data } = await client.post('/tenants', { name })
  return data
}

export async function updateTenant(id: number, name: string): Promise<Tenant> {
  const { data } = await client.put(`/tenants/${id}`, { name })
  return data
}
