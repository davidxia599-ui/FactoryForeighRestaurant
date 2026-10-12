import sql from 'mssql'
import './env'

const configuredServer = process.env.DB_SERVER || 'localhost'
const [server, serverInstance] = configuredServer.replace(/\//g, '\\').split('\\', 2)
const instanceName = process.env.DB_INSTANCE || serverInstance
const configuredPort = process.env.DB_PORT

const config: sql.config = {
  server,
  database: process.env.DB_NAME || 'Restaurant',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD ,
  ...(configuredPort
    ? { port: parseInt(configuredPort, 10) }
    : instanceName
      ? {}
      : { port: 1433 }),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    ...(configuredPort ? {} : instanceName ? { instanceName } : {})
  }
}

let pool: sql.ConnectionPool | null = null

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    const connectionPool = new sql.ConnectionPool(config)
    try {
      pool = await connectionPool.connect()
      console.log('資料庫連線成功')
    } catch (error) {
      await connectionPool.close().catch(() => undefined)
      console.error('資料庫連線失敗')
      throw error
    }
  }
  return pool
}

export async function verifyDatabaseConnection(): Promise<void> {
  const connectionPool = await getPool()
  await connectionPool.request().query('SELECT 1 AS connected')
}

export async function query<T>(sqlText: string, params?: Record<string, unknown>): Promise<T[]> {
  const pool = await getPool()
  const request = pool.request()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value)
    }
  }
  const result = await request.query(sqlText)
  return result.recordset as T[]
}

export async function execute(sqlText: string, params?: Record<string, unknown>): Promise<sql.IResult<unknown>> {
  const pool = await getPool()
  const request = pool.request()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value)
    }
  }
  return await request.query(sqlText)
}

export default { getPool, verifyDatabaseConnection, query, execute }
