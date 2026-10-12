import client from './client'
import type { UserAccount, UserPermissions } from '../types'

export async function getUsers(): Promise<UserAccount[]> {
  const { data } = await client.get('/users')
  return data
}

export async function createUser(input: {
  username: string
  password: string
  tenantId: number
  permissions: UserPermissions
}): Promise<{ id: number; username: string }> {
  const { data } = await client.post('/users', input)
  return data
}

export async function updateUserPermissions(
  id: number,
  permissions: UserPermissions
): Promise<void> {
  await client.put(`/users/${id}/permissions`, { permissions })
}
