import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey'

/**
 * @module middleware/auth
 */

/**
 * JWT authentication middleware for Express routes.
 *
 * This middleware checks for a JWT token in the `Authorization` header
 * (expected format: `Bearer <token>`). If the token is valid, it adds
 * the decoded payload to `req.user` and calls `next()`.
 *
 * @function
 * @param {Object} req - Express request object (with headers and user)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
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
    console.error('JWT Error:', err.message)
    return res.status(403).json({ error: 'Invalid token.' })
  }
}

export default auth
