/**
 * @file app.js
 * @description Initializes the Express application for the Intranet Kochbuch backend.
 * Sets up middleware, routes, database initialization, and static file serving.
 *
 * @module app
 */

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

// __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create Express app
const app = express()

/**
 * CORS options to allow requests only from the local network (e.g. 192.168.x.x)
 */
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

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

// Apply middleware
app.use(cors(corsOptions))
app.use(express.json())

// Serve static files
app.use('/uploads', express.static(uploadDir))
app.use('/coverage', express.static(path.join(__dirname, 'coverage/lcov-report')))
app.use('/docs', express.static(path.join(__dirname, 'docs')))
app.use('/docs/tests-docs', express.static(path.join(__dirname, 'docs/tests-docs')))


/**
 * Root route for health check
 */
app.get('/', (req, res) => {
  res.send('API läuft: Intranet-Kochbuch Backend')
})

// Initialize database tables
await initDatabase()

// Mount all routes under /api
app.use('/api', authRoutes)
app.use('/api', recipeRoutes)
app.use('/api', favoriteRoutes)
app.use('/api', commentRoutes)
app.use('/api', profileRoutes)
app.use('/api', uploadRoutes)
app.use('/api', categoryRoutes)

export default app
