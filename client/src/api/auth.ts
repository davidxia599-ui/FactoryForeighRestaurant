import client from './client'
import type { User } from '../types'

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  const { data } = await client.post('/auth/login', { username, password })
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await client.get('/auth/me')
  return data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await client.post('/auth/change-password', { currentPassword, newPassword })
}
