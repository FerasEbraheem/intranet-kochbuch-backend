// ===========================
// src/__tests__/auth.test.js
// ===========================

/**
 * @file __tests__/auth.test.js
 * @description Unit tests for the JWT authentication middleware (`middleware/auth.js`).
 * Covers validation of Authorization header and token verification behavior.
 */

// ===========================
// Imports & Mocks
// ===========================

import { jest } from '@jest/globals'

// Mock JWT verify function
const fakeVerify = jest.fn()
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: fakeVerify }
}))

// ===========================
// Middleware Setup
// ===========================

// Import the middleware after mocking
const authModule = await import('../middleware/auth.js')
const auth = authModule.default

// ===========================
// Test Suite
// ===========================

/**
 * Test suite for JWT middleware behavior.
 */
describe('JWT Middleware', () => {
  let req, res, next

  /**
   * Setup a fresh request/response/next for each test
   */
  beforeEach(() => {
    req = { headers: {} }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
    fakeVerify.mockReset()
  })

  /**
   * Should return 401 when no Authorization header is provided.
   */
  test('should return 401 if no Authorization header', () => {
    auth(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided.' })
    expect(next).not.toHaveBeenCalled()
  })

  /**
   * Should return 401 if Authorization header does not start with Bearer.
   */
  test('should return 401 if header does not start with Bearer', () => {
    req.headers.authorization = 'Token xyz123'
    auth(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided.' })
    expect(next).not.toHaveBeenCalled()
  })

  /**
   * Should return 403 if token is invalid.
   */
  test('should return 403 if token is invalid', () => {
    req.headers.authorization = 'Bearer invalidtoken'
    fakeVerify.mockImplementation(() => {
      throw new Error('Invalid token')
    })

    auth(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' })
    expect(next).not.toHaveBeenCalled()
  })

  /**
   * Should call next() and attach decoded user to req.user if token is valid.
   */
  test('should call next() if token is valid', () => {
    req.headers.authorization = 'Bearer validtoken'
    const userPayload = { id: 1, username: 'feras' }
    fakeVerify.mockReturnValue(userPayload)

    auth(req, res, next)
    expect(req.user).toEqual(userPayload)
    expect(next).toHaveBeenCalled()
  })
})
