// src/__tests__/favoriteRoutes.test.js

import { jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockExecute = jest.fn()
const mockEnd = jest.fn()
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute,
  end: mockEnd
})

// Benutzermock
const fakeAuth = (req, res, next) => {
  req.user = { id: 1 }
  next()
}

// Module-Mocks
jest.unstable_mockModule('../db/db.js', () => ({
  getConnection: mockGetConnection
}))

jest.unstable_mockModule('../middleware/auth.js', () => ({
  default: fakeAuth
}))

const favoriteRoutesModule = await import('../routes/favoriteRoutes.js')
const favoriteRoutes = favoriteRoutesModule.default

const app = express()
app.use(express.json())
app.use(favoriteRoutes)

describe('Favorite Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /favorites/:recipeId', () => {
    test('should add recipe to favorites', async () => {
      mockExecute.mockResolvedValueOnce()

      const res = await request(app).post('/favorites/123')
      expect(res.status).toBe(200)
      expect(res.body.message).toContain('hinzugefügt')
    })

    test('should handle DB error on add', async () => {
      mockExecute.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app).post('/favorites/123')
      expect(res.status).toBe(500)
      expect(res.body.error).toBe('Interner Serverfehler.')
    })
  })

  describe('GET /favorites', () => {
    test('should return favorite recipes', async () => {
      const fakeRecipes = [[
        {
          id: 1,
          title: 'Pizza',
          ingredients: 'Cheese, Dough',
          instructions: 'Bake it',
          image_url: null,
          display_name: 'Feras',
          email: 'feras@example.com'
        }
      ]]
      mockExecute.mockResolvedValueOnce(fakeRecipes)

      const res = await request(app).get('/favorites')
      expect(res.status).toBe(200)
      expect(res.body.recipes.length).toBe(1)
    })

    test('should handle DB error on get', async () => {
      mockExecute.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app).get('/favorites')
      expect(res.status).toBe(500)
      expect(res.body.error).toBe('Interner Serverfehler.')
    })
  })

  describe('DELETE /favorites/:recipeId', () => {
    test('should remove recipe from favorites', async () => {
      mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }])

      const res = await request(app).delete('/favorites/123')
      expect(res.status).toBe(200)
      expect(res.body.message).toContain('entfernt')
    })

    test('should handle DB error on delete', async () => {
      mockExecute.mockRejectedValueOnce(new Error('DB error'))

      const res = await request(app).delete('/favorites/123')
      expect(res.status).toBe(500)
      expect(res.body.error).toBe('Interner Serverfehler.')
    })
  })
})
