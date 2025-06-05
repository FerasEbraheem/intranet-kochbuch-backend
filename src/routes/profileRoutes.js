// ===========================
// src/routes/profileRoutes.js
// ===========================

// ==============================
// Imports
// ==============================

import express from 'express' // Importiere Express für Router
import { getConnection } from '../db/db.js' // Importiere DB-Verbindungsfunktion
import auth from '../middleware/auth.js' // Importiere Authentifizierungsmiddleware

/**
 * @module routes/profileRoutes
 * @description Routes for viewing and updating the authenticated user's profile.
 */

// ==============================
// Router Setup
// ==============================

const router = express.Router() // Initialisiere Express-Router

// ==============================
// Route: GET /profile (Fetch user profile)
// ==============================

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
  const userId = req.user.id // Hole User-ID aus Auth-Middleware

  try {
    const connection = await getConnection() // DB-Verbindung öffnen
    const [rows] = await connection.execute(
      'SELECT id, email, display_name, avatar_url FROM user WHERE id = ?', // Benutzerprofil abfragen
      [userId]
    )
    await connection.end() // DB-Verbindung schließen

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden.' }) // Kein Benutzer gefunden
    }

    res.status(200).json({ user: rows[0] }) // Erfolgreiche Rückgabe des Profils
  } catch (err) {
    console.error('❌ Fehler beim Laden des Profils:', err.message) // Fehlerprotokoll
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Serverfehler melden
  }
})

// ==============================
// Route: PUT /profile (Update profile)
// ==============================

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
  const userId = req.user.id // Authentifizierter Benutzer
  const { display_name, avatar_url } = req.body // Neue Profildaten auslesen

  try {
    const connection = await getConnection() // DB-Verbindung öffnen
    await connection.execute(
      'UPDATE user SET display_name = ?, avatar_url = ? WHERE id = ?', // Profil aktualisieren
      [display_name, avatar_url || null, userId] // Null verwenden, wenn kein avatar_url vorhanden
    )
    await connection.end() // Verbindung schließen
    res.status(200).json({ message: 'Profil aktualisiert.' }) // Erfolgsmeldung senden
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren des Profils:', err.message) // Fehler ausgeben
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Fehlerantwort
  }
})

// ==============================
// Export Router
// ==============================

export default router // Router exportieren
