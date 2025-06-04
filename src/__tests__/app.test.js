/**
 * @file __tests__/app.test.js
 * @description Integration tests for the Express application (`app.js`).
 * Covers the root route, public endpoints, and database initialization behavior.
 */

import { jest } from '@jest/globals'
import request from 'supertest'

// Mock database initialization
const initMock = jest.fn()
jest.unstable_mockModule('../db/init.js', () => ({
  initDatabase: initMock
}))

// Dynamic import of the app after mocks are applied
const appModule = await import('../../app.js')
const app = appModule.default

/**
 * Main test suite for application-level routes and startup logic.
 */
describe('App Integration', () => {
  /**
   * Test the root endpoint.
   * It should return a 200 OK status and a welcome message.
   */
  test('GET / should return welcome message', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('API läuft')
  })

  /**
   * Ensure that the database initialization function is called when the app loads.
   */
  test('should initialize database on load', () => {
    expect(initMock).toHaveBeenCalled()
  })

  /**
   * Public endpoint: GET /api/public-recipes
   * This test verifies that the route exists and does not return a 404.
   */
  test('GET /api/public-recipes should not return 404', async () => {
    const res = await request(app).get('/api/public-recipes')
    expect(res.status).not.toBe(404)
  })

  /**
   * Public endpoint: GET /api/categories
   * This test verifies that the route exists and does not return a 404.
   */
  test('GET /api/categories should not return 404', async () => {
    const res = await request(app).get('/api/categories')
    expect(res.status).not.toBe(404)
  })
})
