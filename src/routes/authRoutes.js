import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getConnection } from '../db/db.js'
import auth from '../middleware/auth.js'
import dotenv from 'dotenv'
dotenv.config()

/**
 * @module routes/authRoutes
 * @description Auth routes for user registration, login, and protected route.
 */

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey'

/**
 * Register a new user.
 *
 * @name POST /register
 * @function
 * @memberof module:routes/authRoutes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 *
 * @example
 * // Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "123456",
 *   "display_name": "User"
 * }
 */
router.post('/register', async (req, res) => {
  const { email, password, display_name } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const connection = await getConnection()

    const [existing] = await connection.execute('SELECT id FROM user WHERE email = ?', [email])
    if (existing.length > 0) {
      await connection.end()
      return res.status(409).json({ error: 'E-Mail ist bereits registriert.' })
    }

    await connection.execute(
      'INSERT INTO user (email, password, display_name) VALUES (?, ?, ?)',
      [email, hashedPassword, display_name || null]
    )

    const [userResult] = await connection.execute(
      'SELECT * FROM user WHERE email = ?',
      [email]
    )
    const user = userResult[0]

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    )

    await connection.end()
    res.status(201).json({
      message: 'Registrierung erfolgreich.',
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name
      }
    })
  } catch (err) {
    console.error('❌ Fehler bei Registrierung:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

/**
 * Log in a registered user.
 *
 * @name POST /login
 * @function
 * @memberof module:routes/authRoutes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 *
 * @example
 * // Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "123456"
 * }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' })
  }

  try {
    const connection = await getConnection()
    const [users] = await connection.execute('SELECT * FROM user WHERE email = ?', [email])

    if (users.length === 0) {
      await connection.end()
      return res.status(401).json({ error: 'Ungültige Anmeldedaten.' })
    }

    const user = users[0]
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      await connection.end()
      return res.status(401).json({ error: 'Ungültige Anmeldedaten.' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    )

    await connection.end()
    res.status(200).json({
      message: 'Login erfolgreich.',
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name
      }
    })
  } catch (err) {
    console.error('❌ Fehler beim Login:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

/**
 * A protected route that requires authentication.
 *
 * @name GET /protected
 * @function
 * @memberof module:routes/authRoutes
 * @param {Object} req - Express request object (must include authenticated user)
 * @param {Object} res - Express response object
 * @returns {void}
 *
 * @example
 * // Request with Authorization header:
 * Authorization: Bearer <token>
 */
router.get('/protected', auth, (req, res) => {
  res.json({ message: 'Erfolgreich authentifiziert!', user: req.user })
})

export default router
