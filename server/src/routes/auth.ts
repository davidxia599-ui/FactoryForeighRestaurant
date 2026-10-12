import '../config/env'
import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/database'
import { authenticateToken, AuthRequest } from '../middleware/auth'
import JWT_SECRET from '../config/jwt'

const router = Router()
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'

interface UserRow {
  id: number
  tenant_id: number
  username: string
  password_hash: string
  role: string
  can_view_dashboard: boolean
  can_manage_purchases: boolean
  can_manage_items: boolean
  can_view_reports: boolean
  can_manage_tenants: boolean
  can_manage_users: boolean
}

interface PasswordRow {
  password_hash: string
}

function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    tenantId: user.tenant_id,
    username: user.username,
    role: user.role,
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

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body

    if (
      typeof username !== 'string' ||
      !username.trim() ||
      username.trim().length > 50 ||
      typeof password !== 'string' ||
      !password
    ) {
      res.status(400).json({ error: '請提供帳號和密碼' })
      return
    }

    const users = await query<UserRow>(
      `SELECT id, tenant_id, username, password_hash, role, can_view_dashboard,
              can_manage_purchases, can_manage_items, can_view_reports,
              can_manage_tenants, can_manage_users
       FROM users WHERE username = @username`,
      { username: username.trim() }
    )

    if (users.length !== 1) {
      res.status(401).json({ error: '帳號或密碼錯誤' })
      return
    }

    const user = users[0]
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      res.status(401).json({ error: '帳號或密碼錯誤' })
      return
    }

    const token = jwt.sign(
      { id: user.id, tenantId: user.tenant_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    )

    res.json({
      token,
      user: toPublicUser(user)
    })
  } catch (error) {
    console.error('登入錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const users = await query<UserRow>(
      `SELECT id, tenant_id, username, role, can_view_dashboard,
              can_manage_purchases, can_manage_items, can_view_reports,
              can_manage_tenants, can_manage_users
       FROM users WHERE id = @id`,
      { id: req.user!.id }
    )

    if (users.length === 0) {
      res.status(404).json({ error: '使用者不存在' })
      return
    }

    res.json(toPublicUser(users[0]))
  } catch (error) {
    console.error('取得使用者錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      newPassword.length < 6 ||
      Buffer.byteLength(newPassword, 'utf8') > 72
    ) {
      res.status(400).json({ error: '新密碼須至少 6 個字元且不超過 72 個 UTF-8 bytes' })
      return
    }

    const users = await query<PasswordRow>(
      'SELECT password_hash FROM users WHERE id = @id',
      { id: req.user!.id }
    )
    if (users.length !== 1) {
      res.status(401).json({ error: '使用者不存在' })
      return
    }

    if (!await bcrypt.compare(currentPassword, users[0].password_hash)) {
      console.warn(`密碼變更驗證失敗: userId=${req.user!.id}`)
      res.status(400).json({ error: '目前密碼不正確' })
      return
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await query(
      'UPDATE users SET password_hash = @passwordHash WHERE id = @id',
      { id: req.user!.id, passwordHash }
    )

    console.info(`使用者已變更密碼: userId=${req.user!.id}`)
    res.json({ message: '密碼已更新' })
  } catch (error) {
    console.error('變更密碼失敗:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

export default router
