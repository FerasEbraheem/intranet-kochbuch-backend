// ===========================
// src/routes/categoryRoutes.js
// ===========================

// ==============================
// Imports
// ==============================

import express from 'express' // Importiere express framework
import { getConnection } from '../db/db.js' // Hole DB-Verbindungsfunktion

/**
 * @module routes/categoryRoutes
 * @description Routes for handling recipe categories.
 */

// ==============================
// Router Setup
// ==============================

const router = express.Router() // Erstelle neuen Express Router

// ==============================
// Route: GET /categories
// ==============================

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
    const connection = await getConnection() // DB-Verbindung öffnen
    const [rows] = await connection.execute(
      'SELECT id, name FROM category ORDER BY name' // Kategorien sortiert abrufen
    )
    await connection.end() // Verbindung schließen
    res.json({ categories: rows }) // Antwort mit Kategorien zurückgeben
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Kategorien:', err.message) // Fehler loggen
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Fehlerantwort senden
  }
})

// ==============================
// Export Router
// ==============================

export default router // Exportiere Router für Verwendung in app.js
