// ===========================
// src/routes/commentRoutes.js
// ===========================

// ==============================
// Imports
// ==============================

import express from 'express' // Express framework für Routing importieren
import { getConnection } from '../db/db.js' // Funktion zur DB-Verbindung importieren
import auth from '../middleware/auth.js' // Authentifizierungsmiddleware importieren

/**
 * @module routes/commentRoutes
 * @description Routes for handling recipe comments.
 */

// ==============================
// Router Setup
// ==============================

const router = express.Router() // Neuen Express Router erstellen

// ==============================
// Route: POST /comments/:recipeId (Add comment)
// ==============================

/**
 * Add a comment to a recipe.
 *
 * @name POST /comments/:recipeId
 * @function
 * @memberof module:routes/commentRoutes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 *
 * @example
 * // Request body:
 * {
 *   "text": "Leckeres Rezept!"
 * }
 */
router.post('/comments/:recipeId', auth, async (req, res) => {
  const recipeId = req.params.recipeId // Rezept-ID aus URL
  const userId = req.user.id // Benutzer-ID aus authentifiziertem Token
  const { text } = req.body // Kommentartext aus Anfrage extrahieren

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Kommentar darf nicht leer sein.' }) // Validierung: Kommentar darf nicht leer sein
  }

  try {
    const connection = await getConnection() // Verbindung zur DB öffnen
    await connection.execute(
      'INSERT INTO comment (recipe_id, user_id, content) VALUES (?, ?, ?)', // SQL-Befehl zum Speichern des Kommentars
      [recipeId, userId, text] // Platzhalterwerte einsetzen
    )
    await connection.end() // DB-Verbindung schließen
    res.status(201).json({ message: 'Kommentar gespeichert.' }) // Erfolgreiche Antwort senden
  } catch (err) {
    console.error('❌ Fehler beim Speichern des Kommentars:', err.message) // Fehler protokollieren
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Fehlerantwort senden
  }
})

// ==============================
// Route: GET /comments/:recipeId (Fetch comments)
// ==============================

/**
 * Get all comments for a recipe.
 *
 * @name GET /comments/:recipeId
 * @function
 * @memberof module:routes/commentRoutes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 *
 * @example
 * // Example response:
 * {
 *   "comments": [
 *     {
 *       "id": 5,
 *       "user_id": 2,
 *       "text": "Leckeres Rezept!",
 *       "display_name": "Fatima",
 *       "email": "fatima@example.com"
 *     }
 *   ]
 * }
 */
router.get('/comments/:recipeId', async (req, res) => {
  const recipeId = req.params.recipeId // Rezept-ID aus URL holen

  try {
    const connection = await getConnection() // DB-Verbindung herstellen
    const [comments] = await connection.execute(`
      SELECT c.id, c.user_id, c.content AS text, u.display_name, u.email
      FROM comment c
      JOIN user u ON c.user_id = u.id
      WHERE c.recipe_id = ?
      ORDER BY c.created_at ASC
    `, [recipeId]) // Kommentare mit Benutzerdaten abfragen
    await connection.end() // Verbindung schließen
    res.status(200).json({ comments }) // Erfolgreiche Antwort mit Kommentaren senden
  } catch (err) {
    console.error('❌ Fehler beim Laden der Kommentare:', err.message) // Fehlerprotokoll
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Fehlerantwort senden
  }
})

// ==============================
// Route: DELETE /comments/:commentId (Delete comment)
// ==============================

/**
 * Delete a user's own comment.
 *
 * @name DELETE /comments/:commentId
 * @function
 * @memberof module:routes/commentRoutes
 * @param {Object} req - Express request object (must include authenticated user)
 * @param {Object} res - Express response object
 * @returns {void}
 */
router.delete('/comments/:commentId', auth, async (req, res) => {
  const commentId = req.params.commentId // Kommentar-ID aus URL
  const userId = req.user.id // Authentifizierter Benutzer

  try {
    const connection = await getConnection() // DB-Verbindung aufbauen
    const [result] = await connection.execute(
      'DELETE FROM comment WHERE id = ? AND user_id = ?', // Nur eigenen Kommentar löschen
      [commentId, userId]
    )
    await connection.end() // Verbindung schließen

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Keine Berechtigung zum Löschen dieses Kommentars.' }) // Falls Kommentar nicht dem User gehört
    }

    res.status(200).json({ message: 'Kommentar gelöscht.' }) // Erfolgreich gelöscht
  } catch (err) {
    console.error('❌ Fehler beim Löschen des Kommentars:', err.message) // Fehlerausgabe
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Fehlerantwort
  }
})

// ==============================
// Export Router
// ==============================

export default router // Exportiere Router für die Verwendung in app.js
