import { jest } from '@jest/globals'
import request from 'supertest'

// mock database init
const initMock = jest.fn()
jest.unstable_mockModule('../db/init.js', () => ({
  initDatabase: initMock
}))

// dynamic import after mocks
const appModule = await import('../../app.js')
const app = appModule.default

describe('App Integration', () => {
  test('GET / should return welcome message', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('API läuft')
  })

  test('should initialize database on load', () => {
    expect(initMock).toHaveBeenCalled()
  })

  test('GET /api/public-recipes should not return 404', async () => {
    const res = await request(app).get('/api/public-recipes')
    expect(res.status).not.toBe(404)
  })

  test('GET /api/categories should not return 404', async () => {
    const res = await request(app).get('/api/categories')
    expect(res.status).not.toBe(404)
  })
})
