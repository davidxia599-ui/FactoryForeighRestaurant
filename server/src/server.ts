import './config/env'
import app from './app'
import { verifyDatabaseConnection } from './config/database'

const PORT = parseInt(process.env.PORT || '3003')

async function startServer() {
  try {
    await verifyDatabaseConnection()
    app.listen(PORT, () => {
      console.log(`食堂管理伺服器運行於埠 ${PORT}`)
    })
  } catch (error) {
    console.error('無法啟動伺服器，請確認資料庫連線設定與 SQL Server 狀態。', error)
    process.exitCode = 1
  }
}

void startServer()
