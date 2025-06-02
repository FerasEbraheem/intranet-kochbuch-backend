import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { initDatabase } from './src/db/init.js'

import authRoutes from './src/routes/authRoutes.js'
import recipeRoutes from './src/routes/recipeRoutes.js'
import favoriteRoutes from './src/routes/favoriteRoutes.js'
import commentRoutes from './src/routes/commentRoutes.js'
import profileRoutes from './src/routes/profileRoutes.js'
import uploadRoutes from './src/routes/uploadRoutes.js'
import categoryRoutes from './src/routes/categoryRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://192.168.1.35')) {
      callback(null, true)
    } else {
      callback(new Error('Nicht erlaubter Ursprung'))
    }
  },
  credentials: true,
}

const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

app.use(cors(corsOptions))
app.use(express.json())
app.use('/uploads', express.static(uploadDir))

app.get('/', (req, res) => {
  res.send('API läuft: Intranet-Kochbuch Backend')
})

await initDatabase()

app.use('/api', authRoutes)
app.use('/api', recipeRoutes)
app.use('/api', favoriteRoutes)
app.use('/api', commentRoutes)
app.use('/api', profileRoutes)
app.use('/api', uploadRoutes)
app.use('/api', categoryRoutes)

export default app
