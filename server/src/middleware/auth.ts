import '../config/env'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../config/database'
import JWT_SECRET from '../config/jwt'

export interface AuthRequest extends Request {
  user?: {
    id: number
    tenantId: number
    username: string
    role: string
  }
}

export type PermissionKey = 'dashboard' | 'purchases' | 'items' | 'reports' | 'tenants' | 'users'

interface AccessRow {
  role: string
  can_view_dashboard: boolean
  can_manage_purchases: boolean
  can_manage_items: boolean
  can_view_reports: boolean
  can_manage_tenants: boolean
  can_manage_users: boolean
}

const permissionColumns: Record<PermissionKey, keyof AccessRow> = {
  dashboard: 'can_view_dashboard',
  purchases: 'can_manage_purchases',
  items: 'can_manage_items',
  reports: 'can_view_reports',
  tenants: 'can_manage_tenants',
  users: 'can_manage_users'
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: '未提供認證令牌' })
    return
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: '令牌無效或已過期' })
      return
    }
    req.user = decoded as AuthRequest['user']
    next()
  })
}

export function requirePermission(...permissions: PermissionKey[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await query<AccessRow>(
        `SELECT role, can_view_dashboard, can_manage_purchases, can_manage_items,
                can_view_reports, can_manage_tenants, can_manage_users
         FROM users WHERE id = @id`,
        { id: req.user!.id }
      )

      if (users.length !== 1) {
        res.status(401).json({ error: '使用者不存在' })
        return
      }

      const access = users[0]
      const allowed = access.role === 'admin' || permissions.some(
        permission => access[permissionColumns[permission]]
      )

      if (!allowed) {
        console.warn(`權限拒絕: userId=${req.user!.id}, required=${permissions.join(',')}`)
        res.status(403).json({ error: '沒有執行此操作的權限' })
        return
      }

      next()
    } catch (error) {
      console.error('檢查使用者權限失敗:', error)
      res.status(500).json({ error: '伺服器錯誤' })
    }
  }
}
