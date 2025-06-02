import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.join(__dirname, '../../uploads')

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname
    cb(null, uniqueName)
  }
})

const upload = multer({ storage })

router.post('/upload-image', upload.single('image'), (req, res) => {
  const imageUrl = `${req.protocol}://${req.hostname}:5000/uploads/${req.file.filename}`
  res.json({ imageUrl })
})

export default router