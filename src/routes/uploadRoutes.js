/**
 * @module routes/uploadRoutes
 * @description Route for handling image uploads using multer.
 */

import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.join(__dirname, '../../uploads')

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

/**
 * Multer storage configuration for saving uploaded images with unique filenames.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname
    cb(null, uniqueName)
  }
})

const upload = multer({ storage })

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
  const imageUrl = `${req.protocol}://${req.hostname}:5000/uploads/${req.file.filename}`
  res.json({ imageUrl })
})

export default router
