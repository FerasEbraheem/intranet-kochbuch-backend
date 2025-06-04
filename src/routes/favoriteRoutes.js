import express from 'express'
import { getConnection } from '../db/db.js'
import auth from '../middleware/auth.js'

/**
 * @module routes/favoriteRoutes
 * @description Routes for managing user's favorite recipes.
 */

const router = express.Router()

/**
 * Add a recipe to the user's favorites.
 *
 * @name POST /favorites/:recipeId
 * @function
 * @memberof module:routes/favoriteRoutes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 *
 * @example
 * // With Authorization header and URL:
 * POST /favorites/12
 * Authorization: Bearer <token>
 */
router.post('/favorites/:recipeId', auth, async (req, res) => {
  const userId = req.user.id
  const recipeId = req.params.recipeId

  try {
    const connection = await getConnection()
    await connection.execute(
      'INSERT IGNORE INTO favorite (user_id, recipe_id) VALUES (?, ?)',
      [userId, recipeId]
    )
    await connection.end()
    res.status(200).json({ message: 'Zur Favoritenliste hinzugefügt.' })
  } catch (err) {
    console.error('❌ Fehler beim Hinzufügen zur Favoritenliste:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

/**
 * Get all favorite recipes of the logged-in user.
 *
 * @name GET /favorites
 * @function
 * @memberof module:routes/favoriteRoutes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 *
 * @example
 * // Example response:
 * {
 *   "recipes": [
 *     {
 *       "id": 12,
 *       "title": "Pasta Carbonara",
 *       "ingredients": "...",
 *       "instructions": "...",
 *       "image_url": "...",
 *       "display_name": "Lina",
 *       "email": "lina@example.com"
 *     }
 *   ]
 * }
 */
router.get('/favorites', auth, async (req, res) => {
  const userId = req.user.id

  try {
    const connection = await getConnection()
    const [favorites] = await connection.execute(`
      SELECT r.id, r.title, r.ingredients, r.instructions, r.image_url,
             u.display_name, u.email
      FROM favorite f
      JOIN recipe r ON f.recipe_id = r.id
      JOIN user u ON r.user_id = u.id
      WHERE f.user_id = ?
    `, [userId])
    await connection.end()
    res.status(200).json({ recipes: favorites })
  } catch (err) {
    console.error('❌ Fehler beim Laden der Favoriten:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

/**
 * Remove a recipe from the user's favorites.
 *
 * @name DELETE /favorites/:recipeId
 * @function
 * @memberof module:routes/favoriteRoutes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 *
 * @example
 * // Request:
 * DELETE /favorites/12
 * Authorization: Bearer <token>
 */
router.delete('/favorites/:recipeId', auth, async (req, res) => {
  const userId = req.user.id
  const recipeId = req.params.recipeId

  try {
    const connection = await getConnection()
    const [result] = await connection.execute(
      'DELETE FROM favorite WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId]
    )
    await connection.end()
    res.status(200).json({ message: 'Rezept wurde aus Favoriten entfernt.' })
  } catch (err) {
    console.error('❌ Fehler beim Entfernen aus Favoriten:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

export default router
