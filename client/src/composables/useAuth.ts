import { shallowRef, computed } from 'vue'
import type { User } from '../types'
import * as authApi from '../api/auth'

const user = shallowRef<User | null>(null)
const token = shallowRef<string | null>(localStorage.getItem('token'))
let userLoaded = false

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)

  function hasPermission(permission: keyof User['permissions']) {
    return user.value?.role === 'admin' || user.value?.permissions?.[permission] === true
  }

  async function login(username: string, password: string) {
    const res = await authApi.login(username, password)
    token.value = res.token
    user.value = res.user
    userLoaded = true
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
  }

  async function fetchUser() {
    if (!token.value || userLoaded) return
    try {
      user.value = await authApi.getMe()
      localStorage.setItem('user', JSON.stringify(user.value))
      userLoaded = true
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    userLoaded = false
  }

  function init() {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      user.value = JSON.parse(storedUser)
    }
  }

  return { user, token, isAuthenticated, hasPermission, login, logout, fetchUser, init }
}
