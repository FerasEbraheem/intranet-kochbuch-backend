import request from 'supertest'
import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Create express app with the router
const app = express()

// Mock the upload directory and multer behavior
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.join(__dirname, '../../uploads')

// Ensure upload directory exists (mocked filesystem or real)
beforeAll(() => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir)
  }
})

// Import upload route after setting up env
const uploadRoutesModule = await import('../routes/uploadRoutes.js')
const uploadRoutes = uploadRoutesModule.default
app.use(uploadRoutes)


describe('POST /upload-image', () => {
  test('should upload an image and return imageUrl', async () => {
    const res = await request(app)
      .post('/upload-image')
      .attach('image', Buffer.from('fake-image-data'), 'test.png')

    expect(res.status).toBe(200)
    expect(res.body.imageUrl).toBeDefined()
    expect(res.body.imageUrl).toContain('/uploads/')

  })

  test('should fail if no file is attached', async () => {
    const res = await request(app).post('/upload-image')
    expect(res.status).toBe(500)
  })
})

// Cleanup files if needed (optional)
afterAll(() => {
  const files = fs.readdirSync(uploadDir)
  for (const file of files) {
    if (file.includes('test.png')) fs.unlinkSync(path.join(uploadDir, file))
  }
})
