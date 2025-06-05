// ===========================
// src/middleware/auth.js
// ===========================

/**
 * @file auth.js
 * @description Express middleware to protect routes using JWT authentication.
 * Validates token and attaches the decoded user to `req.user`.
 *
 * @module middleware/auth
 */

import jwt from 'jsonwebtoken'

// ==============================
// Constants
// ==============================

/**
 * Secret key used to verify JWT.
 * Defaults to 'mysecretkey' if not set in environment.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey'

// ==============================
// Auth Middleware
// ==============================

/**
 * JWT authentication middleware for Express routes.
 *
 * This middleware checks for a JWT token in the `Authorization` header
 * (expected format: `Bearer <token>`). If the token is valid, it adds
 * the decoded payload to `req.user` and calls `next()`.
 *
 * @function
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 *
 * @example
 * // Protect a route
 * router.get('/profile', auth, (req, res) => {
 *   res.json(req.user);
 * });
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    console.error('❌ JWT verification failed:', err.message)
    return res.status(403).json({ error: 'Invalid token.' })
  }
}

export default auth
