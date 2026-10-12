import { Router, Response } from 'express'
import { query } from '../config/database'
import { authenticateToken, AuthRequest, requirePermission } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

interface PurchaseRow {
  id: number
  tenant_id: number
  item_id: number
  item_name_zh: string
  item_name_en: string
  category_name_zh: string
  category_name_en: string
  quantity: number
  unit_price: number
  total_price: number
  unit: string
  purchase_date: string
  note: string
  created_by: number
  created_at: string
}

router.get('/', requirePermission('purchases', 'dashboard'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { start_date, end_date, category_id, item_id } = req.query

    let sqlText = `
      SELECT p.*, i.name_zh AS item_name_zh, i.name_en AS item_name_en,
             c.name_zh AS category_name_zh, c.name_en AS category_name_en, i.unit
      FROM purchases p
      JOIN items i ON p.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE p.tenant_id = @tenantId`
    const params: Record<string, unknown> = { tenantId }

    if (start_date) {
      sqlText += ' AND p.purchase_date >= @start_date'
      params.start_date = start_date
    }
    if (end_date) {
      sqlText += ' AND p.purchase_date <= @end_date'
      params.end_date = end_date
    }
    if (category_id) {
      sqlText += ' AND i.category_id = @category_id'
      params.category_id = parseInt(category_id as string)
    }
    if (item_id) {
      sqlText += ' AND p.item_id = @item_id'
      params.item_id = parseInt(item_id as string)
    }

    sqlText += ' ORDER BY p.purchase_date DESC, p.created_at DESC'

    const purchases = await query<PurchaseRow>(sqlText, params)
    res.json(purchases)
  } catch (error) {
    console.error('取得採購記錄錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.post('/', requirePermission('purchases'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { item_id, quantity, unit_price, purchase_date, note } = req.body

    if (!item_id || !quantity || !unit_price || !purchase_date) {
      res.status(400).json({ error: '請提供完整採購資訊' })
      return
    }

    const result = await query<PurchaseRow>(
      `INSERT INTO purchases (tenant_id, item_id, quantity, unit_price, purchase_date, note, created_by)
       OUTPUT INSERTED.id, INSERTED.tenant_id, INSERTED.item_id, INSERTED.quantity,
              INSERTED.unit_price, INSERTED.total_price, INSERTED.purchase_date, INSERTED.note,
              INSERTED.created_by, INSERTED.created_at
       VALUES (@tenantId, @item_id, @quantity, @unit_price, @purchase_date, @note, @created_by)`,
      {
        tenantId,
        item_id: parseInt(item_id),
        quantity: parseFloat(quantity),
        unit_price: parseFloat(unit_price),
        purchase_date,
        note: note || null,
        created_by: req.user!.id
      }
    )

    res.status(201).json(result[0])
  } catch (error) {
    console.error('新增採購記錄錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.put('/:id', requirePermission('purchases'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { id } = req.params
    const { item_id, quantity, unit_price, purchase_date, note } = req.body

    if (!item_id || !quantity || !unit_price || !purchase_date) {
      res.status(400).json({ error: '請提供完整採購資訊' })
      return
    }

    await query(
      `UPDATE purchases
       SET item_id = @item_id, quantity = @quantity, unit_price = @unit_price,
           purchase_date = @purchase_date, note = @note
       WHERE id = @id AND tenant_id = @tenantId`,
      {
        id: parseInt(id),
        tenantId,
        item_id: parseInt(item_id),
        quantity: parseFloat(quantity),
        unit_price: parseFloat(unit_price),
        purchase_date,
        note: note || null
      }
    )

    res.json({ id: parseInt(id), item_id, quantity, unit_price, purchase_date, note })
  } catch (error) {
    console.error('更新採購記錄錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.delete('/:id', requirePermission('purchases'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { id } = req.params

    await query('DELETE FROM purchases WHERE id = @id AND tenant_id = @tenantId', {
      id: parseInt(id),
      tenantId
    })

    res.json({ success: true })
  } catch (error) {
    console.error('刪除採購記錄錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

export default router
