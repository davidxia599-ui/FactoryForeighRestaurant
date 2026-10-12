import { Router, Response } from 'express'
import { query } from '../config/database'
import { authenticateToken, AuthRequest, requirePermission } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

interface TenantRow {
  id: number
  name: string
  created_at: string
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const tenants = await query<TenantRow>(
      'SELECT id, name, created_at FROM tenants ORDER BY name'
    )
    res.json(tenants)
  } catch (error) {
    console.error('取得租戶錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.post('/', requirePermission('tenants'), async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body

    if (!name) {
      res.status(400).json({ error: '請提供租戶名稱' })
      return
    }

    const result = await query<TenantRow>(
      'INSERT INTO tenants (name) OUTPUT INSERTED.id, INSERTED.name, INSERTED.created_at VALUES (@name)',
      { name }
    )

    res.status(201).json(result[0])
  } catch (error) {
    console.error('建立租戶錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.put('/:id', requirePermission('tenants'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name } = req.body

    if (!name) {
      res.status(400).json({ error: '請提供租戶名稱' })
      return
    }

    await query('UPDATE tenants SET name = @name WHERE id = @id', { id: parseInt(id), name })
    res.json({ id: parseInt(id), name })
  } catch (error) {
    console.error('更新租戶錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

export default router
