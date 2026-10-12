import { Router, Response } from 'express'
import { query } from '../config/database'
import { authenticateToken, AuthRequest, requirePermission } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

router.get('/monthly', requirePermission('reports'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { month } = req.query

    if (!month) {
      res.status(400).json({ error: '請提供月份' })
      return
    }

    const monthStr = month as string
    const startDate = `${monthStr}-01`
    const endDate = new Date(parseInt(monthStr.split('-')[0]), parseInt(monthStr.split('-')[1]), 0).toISOString().split('T')[0]

    const dailyStats = await query<{ purchase_date: string; total_amount: number; record_count: number }>(
      `SELECT CAST(purchase_date AS DATE) AS purchase_date,
              SUM(total_price) AS total_amount,
              COUNT(*) AS record_count
       FROM purchases
       WHERE tenant_id = @tenantId AND purchase_date BETWEEN @startDate AND @endDate
       GROUP BY CAST(purchase_date AS DATE)
       ORDER BY purchase_date`,
      { tenantId, startDate, endDate }
    )

    const categoryStats = await query<{ category_name_zh: string; category_name_en: string; total_amount: number; item_count: number }>(
      `SELECT c.name_zh AS category_name_zh, c.name_en AS category_name_en,
              SUM(p.total_price) AS total_amount,
              COUNT(DISTINCT p.item_id) AS item_count
       FROM purchases p
       JOIN items i ON p.item_id = i.id
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE p.tenant_id = @tenantId AND p.purchase_date BETWEEN @startDate AND @endDate
       GROUP BY c.name_zh, c.name_en
       ORDER BY total_amount DESC`,
      { tenantId, startDate, endDate }
    )

    const summary = await query<{ total_amount: number; total_records: number; avg_daily: number }>(
      `SELECT COALESCE(SUM(total_price), 0) AS total_amount,
              COUNT(*) AS total_records,
              COALESCE(
                SUM(total_price) / NULLIF(DATEDIFF(DAY, @startDate, @endDate) + 1, 0),
                0
              ) AS avg_daily
       FROM purchases
       WHERE tenant_id = @tenantId AND purchase_date BETWEEN @startDate AND @endDate`,
      { tenantId, startDate, endDate }
    )

    res.json({
      month,
      summary: summary[0] || { total_amount: 0, total_records: 0, avg_daily: 0 },
      dailyStats,
      categoryStats
    })
  } catch (error) {
    console.error('取得月度報表錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

router.get('/category', requirePermission('reports'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { start_date, end_date } = req.query

    let sqlText = `
      SELECT c.name_zh AS category_name_zh, c.name_en AS category_name_en,
             SUM(p.total_price) AS total_amount,
             COUNT(*) AS record_count,
             SUM(p.quantity) AS total_quantity
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

    sqlText += ' GROUP BY c.name_zh, c.name_en ORDER BY total_amount DESC'

    const stats = await query(sqlText, params)
    res.json(stats)
  } catch (error) {
    console.error('取得分類統計錯誤:', error)
    res.status(500).json({ error: '伺服器錯誤' })
  }
})

export default router
