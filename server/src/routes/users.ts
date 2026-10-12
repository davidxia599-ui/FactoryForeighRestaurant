import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../config/database'
import { authenticateToken, AuthRequest, requirePermission } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requirePermission('users'))

const permissionColumns = {
  dashboard: 'can_view_dashboard',
  purchases: 'can_manage_purchases',
  items: 'can_manage_items',
  reports: 'can_view_reports',
  tenants: 'can_manage_tenants',
  users: 'can_manage_users'
} as const

type PermissionSet = Record<keyof typeof permissionColumns, boolean>

interface UserRow {
  id: number
  tenant_id: number
  tenant_name: string
  username: string
  role: string
  created_at: string
  can_view_dashboard: boolean
  can_manage_purchases: boolean
  can_manage_items: boolean
  can_view_reports: boolean
  can_manage_tenants: boolean
  can_manage_users: boolean
}

function isPermissionSet(value: unknown): value is PermissionSet {
  if (typeof value !== 'object' || value === null) return false
  return Object.keys(permissionColumns).every(
    key => typeof (value as Record<string, unknown>)[key] === 'boolean'
  )
}

function toPermissionColumns(permissions: PermissionSet): Record<string, boolean> {
  return {
    can_view_dashboard: permissions.dashboard,
    can_manage_purchases: permissions.purchases,
    can_manage_items: permissions.items,
    can_view_reports: permissions.reports,
    can_manage_tenants: permissions.tenants,
    can_manage_users: permissions.users
  }
}

function toUserResponse(user: UserRow) {
  return {
    id: user.id,
    tenantId: user.tenant_id,
    tenantName: user.tenant_name,
    username: user.username,
    role: user.role,
    createdAt: user.created_at,
    permissions: {
      dashboard: user.can_view_dashboard,
      purchases: user.can_manage_purchases,
      items: user.can_manage_items,
      reports: user.can_view_reports,
      tenants: user.can_manage_tenants,
      users: user.can_manage_users
    }
  }
}

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await query<UserRow>(
      `SELECT u.id, u.tenant_id, t.name AS tenant_name, u.username, u.role, u.created_at,
              u.can_view_dashboard, u.can_manage_purchases, u.can_manage_items,
              u.can_view_reports, u.can_manage_tenants, u.can_manage_users
       FROM users u JOIN tenants t ON t.id = u.tenant_id
       ORDER BY u.username`
    )
    res.json(users.map(toUserResponse))
  } catch (error) {
    console.error('取得帳號清單失敗:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : ''
    const password = req.body.password
    const tenantId = Number(req.body.tenantId)
    const permissions = req.body.permissions

    if (!username || username.length > 50) {
      res.status(400).json({ error: '帳號長度須介於 1 到 50 個字元' })
      return
    }
    if (
      typeof password !== 'string' ||
      password.length < 6 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      res.status(400).json({ error: '密碼須至少 6 個字元且不超過 72 個 UTF-8 bytes' })
      return
    }
    if (!Number.isSafeInteger(tenantId) || tenantId <= 0 || !isPermissionSet(permissions)) {
      res.status(400).json({ error: '租戶或模組權限設定無效' })
      return
    }

    const tenants = await query<{ id: number }>('SELECT id FROM tenants WHERE id = @tenantId', { tenantId })
    if (tenants.length !== 1) {
      res.status(400).json({ error: '指定的租戶不存在' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const columns = toPermissionColumns(permissions)
    const result = await query<{ id: number }>(
      `SET NOCOUNT ON;
       SET XACT_ABORT ON;
       BEGIN TRY
         BEGIN TRANSACTION;
         IF EXISTS (SELECT 1 FROM users WITH (TABLOCKX, HOLDLOCK) WHERE username = @username)
           THROW 51001, 'Username already exists.', 1;

         INSERT INTO users (
           tenant_id, username, password_hash, role, can_view_dashboard,
           can_manage_purchases, can_manage_items, can_view_reports,
           can_manage_tenants, can_manage_users
         )
         OUTPUT INSERTED.id
         VALUES (
           @tenantId, @username, @passwordHash, 'user', @dashboard,
           @purchases, @items, @reports, @tenants, @users
         );
         COMMIT TRANSACTION;
       END TRY
       BEGIN CATCH
         IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
         THROW;
       END CATCH;`,
      {
        tenantId,
        username,
        passwordHash,
        dashboard: permissions.dashboard,
        purchases: permissions.purchases,
        items: permissions.items,
        reports: permissions.reports,
        tenants: permissions.tenants,
        users: permissions.users
      }
    )

    if (result.length !== 1) {
      throw new Error('Account creation did not return exactly one user.')
    }

    console.info(`帳號管理員建立帳號: managerId=${req.user!.id}, userId=${result[0].id}`)
    res.status(201).json({ id: result[0].id, username })
  } catch (error) {
    const errorNumber = typeof error === 'object' && error !== null && 'number' in error
      ? error.number
      : undefined
    if (errorNumber === 51001) {
      res.status(409).json({ error: '此帳號名稱已被使用' })
      return
    }
    console.error('建立帳號失敗:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.put('/:id/permissions', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id)
    const permissions = req.body.permissions
    if (!Number.isSafeInteger(id) || id <= 0 || !isPermissionSet(permissions)) {
      res.status(400).json({ error: '帳號或模組權限設定無效' })
      return
    }

    const columns = toPermissionColumns(permissions)
    const result = await query<{ id: number }>(
      `UPDATE users
       SET can_view_dashboard = @can_view_dashboard,
           can_manage_purchases = @can_manage_purchases,
           can_manage_items = @can_manage_items,
           can_view_reports = @can_view_reports,
           can_manage_tenants = @can_manage_tenants,
           can_manage_users = @can_manage_users
       OUTPUT INSERTED.id
       WHERE id = @id`,
      { id, ...columns }
    )

    if (result.length !== 1) {
      res.status(404).json({ error: '帳號不存在' })
      return
    }
    console.info(`帳號管理員更新權限: managerId=${req.user!.id}, userId=${id}`)
    res.json({ id, permissions })
  } catch (error) {
    console.error('更新帳號權限失敗:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

export default router
