// ===========================
// intranet-kochbuch-backend/app.js
// ===========================

/**
 * @file app.js
 * @description Initializes the Express application for the Intranet Kochbuch backend.
 * Sets up middleware, routes, database initialization, and static file serving.
 *
 * @module app
 */

// ===========================
// Imports
// ===========================

import express from 'express' // Import Express framework
import cors from 'cors' // Import CORS middleware
import path from 'path' // Import path module for file paths
import { fileURLToPath } from 'url' // For __dirname in ES modules
import fs from 'fs' // File system module for directory checks
import { initDatabase } from './src/db/init.js' // Import database initializer

import authRoutes from './src/routes/authRoutes.js' // Auth routes
import recipeRoutes from './src/routes/recipeRoutes.js' // Recipe routes
import favoriteRoutes from './src/routes/favoriteRoutes.js' // Favorite routes
import commentRoutes from './src/routes/commentRoutes.js' // Comment routes
import profileRoutes from './src/routes/profileRoutes.js' // Profile routes
import uploadRoutes from './src/routes/uploadRoutes.js' // Upload routes
import categoryRoutes from './src/routes/categoryRoutes.js' // Category routes

// ===========================
// Constants and App Setup
// ===========================

// __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url) // Get current file path
const __dirname = path.dirname(__filename) // Get directory name

// Create Express app
const app = express() // Initialize Express application

/**
 * CORS options to allow requests only from the local network (e.g. 192.168.x.x)
 */
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://192.168.1.35')) { // Allow local network origin
      callback(null, true) // Allow
    } else {
      callback(new Error('Nicht erlaubter Ursprung')) // Deny other origins
    }
  },
  credentials: true, // Enable cookies and credentials
}

// ===========================
// File System Preparations
// ===========================

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads') // Define uploads folder path
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir) // Create if missing

// ===========================
// Middleware
// ===========================

// Apply middleware
app.use(cors(corsOptions)) // Enable CORS with options
app.use(express.json()) // Parse JSON request bodies

// ===========================
// Static File Serving
// ===========================

// Serve static files for uploads and documentation
app.use('/uploads', express.static(uploadDir)) // Serve uploaded files
app.use('/coverage', express.static(path.join(__dirname, 'coverage/lcov-report'))) // Coverage reports
app.use('/docs', express.static(path.join(__dirname, 'docs'))) // API docs
app.use('/docs/tests-docs', express.static(path.join(__dirname, 'docs/tests-docs'))) // Test docs

// ===========================
// Health Check Route
// ===========================

/**
 * Root route for health check
 */
app.get('/', (req, res) => {
  res.send('API läuft: Intranet-Kochbuch Backend') // Simple health check response
})

// ===========================
// Database Initialization
// ===========================

// Initialize database tables on app start
await initDatabase()

// ===========================
// API Routes
// ===========================

// Mount all API routes under /api prefix
app.use('/api', authRoutes)
app.use('/api', recipeRoutes)
app.use('/api', favoriteRoutes)
app.use('/api', commentRoutes)
app.use('/api', profileRoutes)
app.use('/api', uploadRoutes)
app.use('/api', categoryRoutes)

// ===========================
// Export
// ===========================

export default app // Export the configured Express app
