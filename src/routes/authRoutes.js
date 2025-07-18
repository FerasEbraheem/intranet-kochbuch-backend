// ===========================
// src/routes/authRoutes.js
// ===========================

// ==============================
// Imports
// ==============================

import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getConnection } from '../db/db.js'
import auth from '../middleware/auth.js'
import dotenv from 'dotenv'
dotenv.config()

// ==============================
// Constants
// ==============================

/**
 * @module routes/authRoutes
 * @description Auth routes for user registration, login, and protected route.
 */

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey'

// ==============================
// Route: POST /register
// ==============================

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
  const { email, password, display_name } = req.body // Extract email, password, and display_name from user input

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' }) // Return 400 if email or password is missing
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10) // Hash the password using bcrypt with 10 salt rounds
    const connection = await getConnection() // Establish a database connection

    const [existing] = await connection.execute('SELECT id FROM user WHERE email = ?', [email]) // Check if the email is already registered
    if (existing.length > 0) {
      await connection.end()
      return res.status(409).json({ error: 'E-Mail ist bereits registriert.' }) // Return 409 if email already exists
    }

    await connection.execute(
      'INSERT INTO user (email, password, display_name) VALUES (?, ?, ?)',
      [email, hashedPassword, display_name || null] // Insert new user into the database
    )

    const [userResult] = await connection.execute(
      'SELECT * FROM user WHERE email = ?',
      [email] // Retrieve the newly created user's full data
    )
    const user = userResult[0] // Extract user object from result

    const token = jwt.sign(
      { id: user.id, email: user.email }, // Payload: user's ID and email
      JWT_SECRET, // Secret key to sign the token
      { expiresIn: '2h' } // Token expires in 2 hours
    )

    await connection.end() // Close the database connection
    res.status(201).json({
      message: 'Registrierung erfolgreich.', // Registration successful
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name // Send limited user data (excluding password)
      }
    })
  } catch (err) {
    console.error('❌ Fehler bei Registrierung:', err.message) // Log error on server side
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Return 500 Internal Server Error
  }
})

// ==============================
// Route: POST /login
// ==============================

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
  const { email, password } = req.body // Extract email and password from request body

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' }) // Return 400 if email or password is missing
  }

  try {
    const connection = await getConnection() // Establish a database connection
    const [users] = await connection.execute('SELECT * FROM user WHERE email = ?', [email]) // Query user by email

    if (users.length === 0) {
      await connection.end()
      return res.status(401).json({ error: 'Ungültige Anmeldedaten.' }) // Return 401 if no user found with the given email
    }

    const user = users[0] // Extract the user object from the result
    const passwordMatch = await bcrypt.compare(password, user.password) // Compare provided password with the hashed password

    if (!passwordMatch) {
      await connection.end()
      return res.status(401).json({ error: 'Ungültige Anmeldedaten.' }) // Return 401 if password does not match
    }

    const token = jwt.sign(
      { id: user.id, email: user.email }, // Payload: user's ID and email
      JWT_SECRET,  // Secret key for signing the JWT
      { expiresIn: '2h' } // Token validity: 2 hours
    )

    await connection.end() // Close the database connection
    res.status(200).json({
      message: 'Login erfolgreich.', // Login successful message
      token, // Return JWT token to the client
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name // Return user details (excluding password)
      }
    })
  } catch (err) {
    console.error('❌ Fehler beim Login:', err.message) // Log any error during login
    res.status(500).json({ error: 'Interner Serverfehler.' })  // Return 500 Internal Server Error
  }
})

// ==============================
// Route: GET /protected
// ==============================

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

// ==============================
// Export Router
// ==============================

export default router
