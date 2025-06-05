// ===========================
// src/routes/favoriteRoutes.js
// ===========================

// ==============================
// Imports
// ==============================

import express from 'express' // Importiere Express für Routing
import { getConnection } from '../db/db.js' // Importiere Datenbankverbindung
import auth from '../middleware/auth.js' // Importiere Auth-Middleware

/**
 * @module routes/favoriteRoutes
 * @description Routes for managing user's favorite recipes.
 */

// ==============================
// Router Setup
// ==============================

const router = express.Router() // Neuen Router erstellen

// ==============================
// Route: POST /favorites/:recipeId (Add favorite)
// ==============================

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
  const userId = req.user.id // Authentifizierter Benutzer
  const recipeId = req.params.recipeId // Rezept-ID aus URL

  try {
    const connection = await getConnection() // DB-Verbindung öffnen
    await connection.execute(
      'INSERT IGNORE INTO favorite (user_id, recipe_id) VALUES (?, ?)', // Einfügen, falls noch nicht vorhanden
      [userId, recipeId]
    )
    await connection.end() // Verbindung schließen
    res.status(200).json({ message: 'Zur Favoritenliste hinzugefügt.' }) // Erfolgsantwort senden
  } catch (err) {
    console.error('❌ Fehler beim Hinzufügen zur Favoritenliste:', err.message) // Fehlerprotokoll
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Fehlerantwort senden
  }
})

// ==============================
// Route: GET /favorites (Fetch favorites)
// ==============================

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
  const userId = req.user.id // Aktueller Benutzer

  try {
    const connection = await getConnection() // DB-Verbindung öffnen
    const [favorites] = await connection.execute(`
      SELECT r.id, r.title, r.ingredients, r.instructions, r.image_url,
             u.display_name, u.email
      FROM favorite f
      JOIN recipe r ON f.recipe_id = r.id
      JOIN user u ON r.user_id = u.id
      WHERE f.user_id = ?
    `, [userId]) // Lieblingsrezepte mit Userdaten laden
    await connection.end() // Verbindung schließen
    res.status(200).json({ recipes: favorites }) // Erfolgreiche Antwort
  } catch (err) {
    console.error('❌ Fehler beim Laden der Favoriten:', err.message) // Fehlerausgabe
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Fehlerantwort
  }
})

// ==============================
// Route: DELETE /favorites/:recipeId (Remove favorite)
// ==============================

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
  const userId = req.user.id // Authentifizierter User
  const recipeId = req.params.recipeId // Rezept-ID

  try {
    const connection = await getConnection() // DB-Verbindung öffnen
    const [result] = await connection.execute(
      'DELETE FROM favorite WHERE user_id = ? AND recipe_id = ?', // Lösche Eintrag aus Favoriten
      [userId, recipeId]
    )
    await connection.end() // Verbindung schließen
    res.status(200).json({ message: 'Rezept wurde aus Favoriten entfernt.' }) // Erfolgreiche Antwort
  } catch (err) {
    console.error('❌ Fehler beim Entfernen aus Favoriten:', err.message) // Fehlerprotokoll
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Fehlerantwort
  }
})

// ==============================
// Export Router
// ==============================

export default router // Router exportieren
