import express from 'express'
import { getConnection } from '../db/db.js'

/**
 * @module routes/categoryRoutes
 * @description Routes for handling recipe categories.
 */

const router = express.Router()

/**
 * Get all recipe categories.
 *
 * @name GET /categories
 * @function
 * @memberof module:routes/categoryRoutes
 * @param {Object} _req - Express request object (not used)
 * @param {Object} res - Express response object
 * @returns {void}
 *
 * @example
 * // Example response:
 * {
 *   "categories": [
 *     { "id": 1, "name": "Dessert" },
 *     { "id": 2, "name": "Vegetarisch" }
 *   ]
 * }
 */
router.get('/categories', async (_req, res) => {
  try {
    const connection = await getConnection()
    const [rows] = await connection.execute(
      'SELECT id, name FROM category ORDER BY name'
    )
    await connection.end()
    res.json({ categories: rows })
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Kategorien:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

export default router
