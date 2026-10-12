import { query } from '../config/database'

export async function getNextId(tableName: string): Promise<number> {
  const result = await query<{ id: number }>(
    `SELECT ISNULL(MAX(id), 0) + 1 AS id FROM ${tableName}`
  )
  return result[0].id
}

export function buildWhereClause(conditions: Record<string, unknown>): { clause: string; params: Record<string, unknown> } {
  const keys = Object.keys(conditions).filter(k => conditions[k] !== undefined && conditions[k] !== '')
  if (keys.length === 0) return { clause: '', params: {} }

  const clauses = keys.map(k => `${k} = @${k}`)
  return {
    clause: `WHERE ${clauses.join(' AND ')}`,
    params: conditions
  }
}
