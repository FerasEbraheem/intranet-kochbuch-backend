// ===========================
// src/routes/uploadRoutes.js
// ===========================

/**
 * @module routes/uploadRoutes
 * @description Route for handling image uploads using multer.
 */

// ===========================
// Imports and Setup
// ===========================

import express from 'express' // Import express for routing
import multer from 'multer' // Import multer for file uploads
import path from 'path' // Import path for directory paths
import { fileURLToPath } from 'url' // To get __dirname in ES modules
import fs from 'fs' // File system module for directory operations

const router = express.Router() // Create router instance

const __filename = fileURLToPath(import.meta.url) // Get current filename
const __dirname = path.dirname(__filename) // Get current directory name
const uploadDir = path.join(__dirname, '../../uploads') // Define upload directory path

// ===========================
// Directory Initialization
// ===========================

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir) // Check and create uploads folder

// ===========================
// Multer Configuration
// ===========================

/**
 * Multer storage configuration for saving uploaded images with unique filenames.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir), // Set destination folder
  filename: (_req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname // Generate unique filename with timestamp
    cb(null, uniqueName) // Callback with filename
  }
})

const upload = multer({ storage }) // Initialize multer with storage config

// ===========================
// Routes
// ===========================

/**
 * Upload a single image.
 *
 * @name POST /upload-image
 * @function
 * @memberof module:routes/uploadRoutes
 * @param {FormData} image - The image file (in form-data format) to be uploaded
 * @returns {object} 200 - An object containing the uploaded image URL
 *
 * @example
 * // Request with multipart/form-data:
 * {
 *   "image": (binary image file)
 * }
 *
 * // Response:
 * {
 *   "imageUrl": "http://localhost:5000/uploads/1627216482345-cake.jpg"
 * }
 */
router.post('/upload-image', upload.single('image'), (req, res) => {
  const imageUrl = `${req.protocol}://${req.hostname}:5000/uploads/${req.file.filename}` // Construct image URL
  res.json({ imageUrl }) // Respond with image URL
})

// ===========================
// Export
// ===========================

export default router // Export the router
