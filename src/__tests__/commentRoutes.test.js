// ===========================
// src/__tests__/commentRoutes.test.js
// ===========================

/**
 * @file __tests__/commentRoutes.test.js
 * @description Tests for the `/comments` route: adding, retrieving, and deleting recipe comments.
 */

// ===========================
// Imports & Mocks
// ===========================

import { jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

// Mocked DB connection
const mockExecute = jest.fn()
const mockEnd = jest.fn()
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute,
  end: mockEnd
})

// Fake authentication middleware
const fakeAuth = (req, _res, next) => {
  req.user = { id: 1 }
  next()
}

jest.unstable_mockModule('../db/db.js', () => ({
  getConnection: mockGetConnection
}))

jest.unstable_mockModule('../middleware/auth.js', () => ({
  default: fakeAuth
}))

// ===========================
// Setup Express App
// ===========================

const commentRoutesModule = await import('../routes/commentRoutes.js')
const commentRoutes = commentRoutesModule.default

const app = express()
app.use(express.json())
app.use(commentRoutes)

// ===========================
// Test Suite: POST /comments/:recipeId
// ===========================

describe('POST /comments/:recipeId', () => {
  beforeEach(() => jest.clearAllMocks())

  /**
   * Should return 400 if comment text is empty
   */
  test('should return 400 if comment is empty', async () => {
    const res = await request(app)
      .post('/comments/1')
      .send({ text: '' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  /**
   * Should save a valid comment and return 201
   */
  test('should save comment and return 201', async () => {
    mockExecute.mockResolvedValueOnce()

    const res = await request(app)
      .post('/comments/1')
      .send({ text: 'Nice recipe!' })

    expect(res.status).toBe(201)
    expect(res.body.message).toContain('Kommentar gespeichert')
  })
})

// ===========================
// Test Suite: GET /comments/:recipeId
// ===========================

describe('GET /comments/:recipeId', () => {
  /**
   * Should return a list of comments with status 200
   */
  test('should return comments with 200', async () => {
    const fakeComments = [[
      { id: 1, user_id: 1, text: 'Nice', display_name: 'Feras', email: 'feras@example.com' }
    ]]
    mockExecute.mockResolvedValueOnce(fakeComments)

    const res = await request(app).get('/comments/1')

    expect(res.status).toBe(200)
    expect(res.body.comments).toBeDefined()
    expect(res.body.comments.length).toBe(1)
  })

  /**
   * Should handle DB errors and return 500
   */
  test('should handle DB errors', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).get('/comments/1')
    expect(res.status).toBe(500)
    expect(res.body.error).toBeDefined()
  })
})

// ===========================
// Test Suite: DELETE /comments/:commentId
// ===========================

describe('DELETE /comments/:commentId', () => {
  /**
   * Should delete comment and return 200 if found and authorized
   */
  test('should delete comment if found', async () => {
    const delResult = [{ affectedRows: 1 }]
    mockExecute.mockResolvedValueOnce(delResult)

    const res = await request(app).delete('/comments/10')
    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Kommentar gelöscht')
  })

  /**
   * Should return 403 if comment does not exist or user is not authorized
   */
  test('should return 403 if user not authorized or comment not found', async () => {
    const delResult = [{ affectedRows: 0 }]
    mockExecute.mockResolvedValueOnce(delResult)

    const res = await request(app).delete('/comments/99')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Keine Berechtigung')
  })
})
