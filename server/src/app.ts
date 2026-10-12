import './config/env'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import tenantRoutes from './routes/tenant'
import categoryRoutes from './routes/category'
import itemRoutes from './routes/item'
import purchaseRoutes from './routes/purchase'
import reportRoutes from './routes/report'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tenants', tenantRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/items', itemRoutes)
app.use('/api/purchases', purchaseRoutes)
app.use('/api/reports', reportRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default app
