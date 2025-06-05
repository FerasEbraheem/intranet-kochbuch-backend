// ===========================
// src/__tests__/uploadRoutes.test.js
// ===========================

/**
 * @file __tests__/uploadRoutes.test.js
 * @description Tests for the image upload endpoint (/upload-image).
 * Validates file upload and error handling.
 */

import request from 'supertest' // Import supertest for HTTP request simulation
import express from 'express' // Import express for app setup
import fs from 'fs' // File system module to handle uploads directory
import path from 'path' // Path module for cross-platform file paths
import { fileURLToPath } from 'url' // Needed to get __dirname in ES modules

// ===========================
// App & Directory Setup
// ===========================

// Setup app and upload route
const app = express() // Initialize express app

// Define upload directory
const __filename = fileURLToPath(import.meta.url) // Get current file path
const __dirname = path.dirname(__filename) // Get directory name from path
const uploadDir = path.join(__dirname, '../../uploads') // Construct full path to uploads folder

// Ensure upload directory exists
beforeAll(() => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir) // Create upload directory if it doesn't exist
  }
})

// ===========================
// Route Import
// ===========================

/**
 * Import upload route after ensuring env is set.
 */
const uploadRoutesModule = await import('../routes/uploadRoutes.js') // Dynamically import routes
const uploadRoutes = uploadRoutesModule.default // Extract router
app.use(uploadRoutes) // Mount routes

// ===========================
// Upload Tests
// ===========================

/**
 * @testgroup Upload Routes
 */
describe('POST /upload-image', () => {
  /**
   * @test should upload image and return imageUrl
   */
  test('should upload an image and return imageUrl', async () => {
    const res = await request(app)
      .post('/upload-image') // Call upload endpoint
      .attach('image', Buffer.from('fake-image-data'), 'test.png') // Attach fake image file

    expect(res.status).toBe(200) // Should respond with HTTP 200
    expect(res.body.imageUrl).toBeDefined() // Response should contain imageUrl
    expect(res.body.imageUrl).toContain('/uploads/') // imageUrl should contain uploads path
  })

  /**
   * @test should return 500 if no file is attached
   */
  test('should fail if no file is attached', async () => {
    const res = await request(app).post('/upload-image') // Call without attaching file
    expect(res.status).toBe(500) // Should fail with HTTP 500
  })
})

// ===========================
// Cleanup
// ===========================

/**
 * @cleanup remove test image files after tests
 */
afterAll(() => {
  const files = fs.readdirSync(uploadDir) // Read uploaded files
  for (const file of files) {
    if (file.includes('test.png')) fs.unlinkSync(path.join(uploadDir, file)) // Delete test file
  }
})
