/**
 * @file __tests__/uploadRoutes.test.js
 * @description Tests for the image upload endpoint (/upload-image).
 * Validates file upload and error handling.
 */

import request from 'supertest'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Setup app and upload route
const app = express()

// Define upload directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.join(__dirname, '../../uploads')

// Ensure upload directory exists
beforeAll(() => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir)
  }
})

/**
 * Import upload route after ensuring env is set.
 */
const uploadRoutesModule = await import('../routes/uploadRoutes.js')
const uploadRoutes = uploadRoutesModule.default
app.use(uploadRoutes)

/**
 * @testgroup Upload Routes
 */
describe('POST /upload-image', () => {
  /**
   * @test should upload image and return imageUrl
   */
  test('should upload an image and return imageUrl', async () => {
    const res = await request(app)
      .post('/upload-image')
      .attach('image', Buffer.from('fake-image-data'), 'test.png')

    expect(res.status).toBe(200)
    expect(res.body.imageUrl).toBeDefined()
    expect(res.body.imageUrl).toContain('/uploads/')
  })

  /**
   * @test should return 500 if no file is attached
   */
  test('should fail if no file is attached', async () => {
    const res = await request(app).post('/upload-image')
    expect(res.status).toBe(500)
  })
})

/**
 * @cleanup remove test image files after tests
 */
afterAll(() => {
  const files = fs.readdirSync(uploadDir)
  for (const file of files) {
    if (file.includes('test.png')) fs.unlinkSync(path.join(uploadDir, file))
  }
})
