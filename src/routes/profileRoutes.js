import express from 'express'
import { getConnection } from '../db/db.js'
import auth from '../middleware/auth.js'

/**
 * @module routes/profileRoutes
 * @description Routes for viewing and updating the authenticated user's profile.
 */

const router = express.Router()

/**
 * Get the authenticated user's profile.
 *
 * @name GET /profile
 * @function
 * @memberof module:routes/profileRoutes
 * @param {Object} req - Express request object (contains authenticated user)
 * @param {Object} res - Express response object
 * @returns {void}
 *
 * @example
 * // Request with Authorization header:
 * GET /profile
 * Authorization: Bearer <token>
 *
 * // Example response:
 * {
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "display_name": "User",
 *     "avatar_url": "https://example.com/avatar.jpg"
 *   }
 * }
 */
router.get('/profile', auth, async (req, res) => {
  const userId = req.user.id

  try {
    const connection = await getConnection()
    const [rows] = await connection.execute(
      'SELECT id, email, display_name, avatar_url FROM user WHERE id = ?',
      [userId]
    )
    await connection.end()

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden.' })
    }

    res.status(200).json({ user: rows[0] })
  } catch (err) {
    console.error('❌ Fehler beim Laden des Profils:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

/**
 * Update the authenticated user's profile.
 *
 * @name PUT /profile
 * @function
 * @memberof module:routes/profileRoutes
 * @param {Object} req - Express request object (includes user and body)
 * @param {Object} res - Express response object
 * @returns {void}
 *
 * @example
 * // Request body:
 * {
 *   "display_name": "Neuer Name",
 *   "avatar_url": "https://example.com/avatar.jpg"
 * }
 *
 * // Response:
 * {
 *   "message": "Profil aktualisiert."
 * }
 */
router.put('/profile', auth, async (req, res) => {
  const userId = req.user.id
  const { display_name, avatar_url } = req.body

  try {
    const connection = await getConnection()
    await connection.execute(
      'UPDATE user SET display_name = ?, avatar_url = ? WHERE id = ?',
      [display_name, avatar_url || null, userId]
    )
    await connection.end()
    res.status(200).json({ message: 'Profil aktualisiert.' })
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren des Profils:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

export default router
