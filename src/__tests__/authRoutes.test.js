import { jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const mockExecute = jest.fn()
const mockEnd = jest.fn()
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute,
  end: mockEnd
})

jest.unstable_mockModule('../db/db.js', () => ({
  getConnection: mockGetConnection
}))

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn((pw, hashed) => Promise.resolve(pw === 'correctpassword'))
  }
}))

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(() => 'mock-token')
  }
}))

const authRoutesModule = await import('../routes/authRoutes.js')
const authRoutes = authRoutesModule.default

const app = express()
app.use(express.json())
app.use(authRoutes)

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /register', () => {
    test('should register a new user', async () => {
      mockExecute
        .mockResolvedValueOnce([[]]) // check if email exists
        .mockResolvedValueOnce([]) // insert user
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

    test('should return 409 if email exists', async () => {
      mockExecute.mockResolvedValueOnce([[{ id: 1 }]]) // email exists

      const res = await request(app).post('/register').send({
        email: 'a@a.com', password: '123'
      })

      expect(res.status).toBe(409)
    })
  })

  describe('POST /login', () => {
    test('should login user with correct credentials', async () => {
      mockExecute.mockResolvedValueOnce([[{
        id: 1,
        email: 'a@a.com',
        password: 'correctpassword',
        display_name: 'Test User'
      }]])

      const res = await request(app).post('/login').send({
        email: 'a@a.com', password: 'correctpassword'
      })

      expect(res.status).toBe(200)
      expect(res.body.token).toBe('mock-token')
      expect(res.body.user.display_name).toBe('Test User')
    })

    test('should fail with wrong password', async () => {
      mockExecute.mockResolvedValueOnce([[{
        id: 1,
        email: 'a@a.com',
        password: 'correctpassword'
      }]])

      const res = await request(app).post('/login').send({
        email: 'a@a.com', password: 'wrong'
      })

      expect(res.status).toBe(401)
    })

    test('should fail if user not found', async () => {
      mockExecute.mockResolvedValueOnce([[]])

      const res = await request(app).post('/login').send({
        email: 'unknown@a.com', password: '123'
      })

      expect(res.status).toBe(401)
    })
  })
})
