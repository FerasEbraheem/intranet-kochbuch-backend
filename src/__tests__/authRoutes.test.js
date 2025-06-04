/**
 * @file __tests__/authRoutes.test.js
 * @description Integration tests for user registration and login via /register and /login routes.
 * Mocks database, bcrypt, and JWT functionality to isolate route behavior.
 */

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

jest.unstable_mockModule('../db/db.js', () => ({
  getConnection: mockGetConnection
}))

// Mocked bcrypt
jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn((pw, hashed) => Promise.resolve(pw === 'correctpassword'))
  }
}))

// Mocked JWT
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(() => 'mock-token')
  }
}))

// Import auth routes after mocks
const authRoutesModule = await import('../routes/authRoutes.js')
const authRoutes = authRoutesModule.default

// Setup app instance
const app = express()
app.use(express.json())
app.use(authRoutes)

/**
 * Test suite for authentication routes (/register, /login).
 */
describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * Tests for POST /register
   */
  describe('POST /register', () => {
    /**
     * Should register a new user and return a token
     */
    test('should register a new user', async () => {
      mockExecute
        .mockResolvedValueOnce([[]]) // check if email exists
        .mockResolvedValueOnce([])   // insert user
        .mockResolvedValueOnce([[{ id: 1, email: 'a@a.com', display_name: 'A' }]]) // get user

      const res = await request(app).post('/register').send({
        email: 'a@a.com',
        password: '123',
        display_name: 'A'
      })

      expect(res.status).toBe(201)
      expect(res.body.token).toBe('mock-token')
      expect(res.body.user.email).toBe('a@a.com')
    })

    /**
     * Should return 409 if the email already exists
     */
    test('should return 409 if email exists', async () => {
      mockExecute.mockResolvedValueOnce([[{ id: 1 }]]) // email exists

      const res = await request(app).post('/register').send({
        email: 'a@a.com',
        password: '123'
      })

      expect(res.status).toBe(409)
    })
  })

  /**
   * Tests for POST /login
   */
  describe('POST /login', () => {
    /**
     * Should allow login with correct credentials
     */
    test('should login user with correct credentials', async () => {
      mockExecute.mockResolvedValueOnce([[{
        id: 1,
        email: 'a@a.com',
        password: 'correctpassword',
        display_name: 'Test User'
      }]])

      const res = await request(app).post('/login').send({
        email: 'a@a.com',
        password: 'correctpassword'
      })

      expect(res.status).toBe(200)
      expect(res.body.token).toBe('mock-token')
      expect(res.body.user.display_name).toBe('Test User')
    })

    /**
     * Should return 401 on incorrect password
     */
    test('should fail with wrong password', async () => {
      mockExecute.mockResolvedValueOnce([[{
        id: 1,
        email: 'a@a.com',
        password: 'correctpassword'
      }]])

      const res = await request(app).post('/login').send({
        email: 'a@a.com',
        password: 'wrong'
      })

      expect(res.status).toBe(401)
    })

    /**
     * Should return 401 if user not found
     */
    test('should fail if user not found', async () => {
      mockExecute.mockResolvedValueOnce([[]])

      const res = await request(app).post('/login').send({
        email: 'unknown@a.com',
        password: '123'
      })

      expect(res.status).toBe(401)
    })
  })
})
