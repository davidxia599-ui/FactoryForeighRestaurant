import { Router, Response } from 'express'
import { query } from '../config/database'
import { authenticateToken, AuthRequest, requirePermission } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

interface ItemRow {
  id: number
  tenant_id: number
  category_id: number
  name_zh: string
  name_en: string
  unit: string
  created_at: string
}

router.get('/', requirePermission('items', 'purchases', 'dashboard'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const items = await query<ItemRow & { category_name_zh: string; category_name_en: string }>(
      `SELECT i.*, c.name_zh AS category_name_zh, c.name_en AS category_name_en
       FROM items i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.tenant_id = @tenantId
       ORDER BY i.category_id, i.name_zh`,
      { tenantId }
    )
    res.json(items)
  } catch (error) {
    console.error('取得品項錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.post('/', requirePermission('items'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { category_id, name_zh, name_en, unit } = req.body

    if (!name_zh || !name_en) {
      res.status(400).json({ error: '請提供品項名稱' })
      return
    }

    const result = await query<ItemRow>(
      `INSERT INTO items (tenant_id, category_id, name_zh, name_en, unit)
       OUTPUT INSERTED.id, INSERTED.tenant_id, INSERTED.category_id, INSERTED.name_zh, INSERTED.name_en, INSERTED.unit, INSERTED.created_at
       VALUES (@tenantId, @category_id, @name_zh, @name_en, @unit)`,
      { tenantId, category_id: category_id || null, name_zh, name_en, unit: unit || null }
    )

    res.status(201).json(result[0])
  } catch (error) {
    console.error('新增品項錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.put('/:id', requirePermission('items'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { id } = req.params
    const { category_id, name_zh, name_en, unit } = req.body

    if (!name_zh || !name_en) {
      res.status(400).json({ error: '請提供品項名稱' })
      return
    }

    await query(
      'UPDATE items SET category_id = @category_id, name_zh = @name_zh, name_en = @name_en, unit = @unit WHERE id = @id AND tenant_id = @tenantId',
      { id: parseInt(id), tenantId, category_id: category_id || null, name_zh, name_en, unit: unit || null }
    )

    res.json({ id: parseInt(id), category_id, name_zh, name_en, unit })
  } catch (error) {
    console.error('更新品項錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.delete('/:id', requirePermission('items'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { id } = req.params

    await query('DELETE FROM items WHERE id = @id AND tenant_id = @tenantId', {
      id: parseInt(id),
      tenantId
    })

    res.json({ success: true })
  } catch (error) {
    console.error('刪除品項錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

export default router
