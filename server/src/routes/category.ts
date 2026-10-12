import { Router, Response } from 'express'
import { query } from '../config/database'
import { authenticateToken, AuthRequest, requirePermission } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

interface CategoryRow {
  id: number
  tenant_id: number
  name_zh: string
  name_en: string
  sort_order: number
}

router.get('/', requirePermission('items', 'purchases', 'dashboard'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const categories = await query<CategoryRow>(
      'SELECT id, tenant_id, name_zh, name_en, sort_order FROM categories WHERE tenant_id = @tenantId ORDER BY sort_order',
      { tenantId }
    )
    res.json(categories)
  } catch (error) {
    console.error('取得分類錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.post('/', requirePermission('items'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { name_zh, name_en, sort_order } = req.body

    if (!name_zh || !name_en) {
      res.status(400).json({ error: '請提供分類名稱' })
      return
    }

    const result = await query<CategoryRow>(
      `INSERT INTO categories (tenant_id, name_zh, name_en, sort_order)
       OUTPUT INSERTED.id, INSERTED.tenant_id, INSERTED.name_zh, INSERTED.name_en, INSERTED.sort_order
       VALUES (@tenantId, @name_zh, @name_en, @sort_order)`,
      { tenantId, name_zh, name_en, sort_order: sort_order || 0 }
    )

    res.status(201).json(result[0])
  } catch (error) {
    console.error('新增分類錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.put('/:id', requirePermission('items'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { id } = req.params
    const { name_zh, name_en, sort_order } = req.body

    if (!name_zh || !name_en) {
      res.status(400).json({ error: '請提供分類名稱' })
      return
    }

    await query(
      'UPDATE categories SET name_zh = @name_zh, name_en = @name_en, sort_order = @sort_order WHERE id = @id AND tenant_id = @tenantId',
      { id: parseInt(id), tenantId, name_zh, name_en, sort_order: sort_order || 0 }
    )

    res.json({ id: parseInt(id), name_zh, name_en, sort_order })
  } catch (error) {
    console.error('更新分類錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.delete('/:id', requirePermission('items'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { id } = req.params

    await query('DELETE FROM categories WHERE id = @id AND tenant_id = @tenantId', {
      id: parseInt(id),
      tenantId
    })

    res.json({ success: true })
  } catch (error) {
    console.error('刪除分類錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

export default router
