import { jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockExecute = jest.fn()
const mockEnd = jest.fn()
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute,
  end: mockEnd
})

jest.unstable_mockModule('../db/db.js', () => ({
  getConnection: mockGetConnection
}))

const categoryRoutesModule = await import('../routes/categoryRoutes.js')
const categoryRoutes = categoryRoutesModule.default

const app = express()
app.use(categoryRoutes)

describe('GET /categories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return categories with 200', async () => {
    const fakeCategories = [[
      { id: 1, name: 'Breakfast' },
      { id: 2, name: 'Lunch' }
    ]]
    mockExecute.mockResolvedValueOnce(fakeCategories)

    const res = await request(app).get('/categories')

    expect(res.status).toBe(200)
    expect(res.body.categories).toBeDefined()
    expect(res.body.categories.length).toBe(2)
    expect(mockGetConnection).toHaveBeenCalled()
    expect(mockExecute).toHaveBeenCalled()
    expect(mockEnd).toHaveBeenCalled()
  })

  test('should handle DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'))

    const res = await request(app).get('/categories')

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Interner Serverfehler.')
  })
})
