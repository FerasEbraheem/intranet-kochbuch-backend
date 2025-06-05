// ===========================
// src/routes/recipeRoutes.js
// ===========================

import express from 'express' // Import express for router creation
import { getConnection } from '../db/db.js' // Import database connection helper
import auth from '../middleware/auth.js' // Import authentication middleware

/**
 * @module routes/recipeRoutes
 * @description Routes for managing and viewing recipes.
 */

const router = express.Router() // Create new router instance

// ===========================
// Add a new recipe
// ===========================

/**
 * Add a new recipe for the authenticated user.
 *
 * @name POST /recipes
 * @function
 * @memberof module:routes/recipeRoutes
 * @param {Object} req - Express request object with body: title, ingredients, instructions, image_url, categoryIds[]
 * @param {Object} res - Express response object
 * @returns {void}
 */
router.post('/recipes', auth, async (req, res) => {
  const { title, ingredients, instructions, image_url, categoryIds } = req.body // Extract fields from request body
  const userId = req.user.id // Get user ID from auth middleware

  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Titel, Zutaten und Anleitung sind erforderlich.' }) // Validate required fields
  }

  try {
    const connection = await getConnection() // Open DB connection

    const [result] = await connection.execute(
      `INSERT INTO recipe (user_id, title, ingredients, instructions, image_url, is_published)
       VALUES (?, ?, ?, ?, ?, FALSE)`, // Insert new recipe with is_published default false
      [userId, title, ingredients, instructions, image_url || null] // Bind parameters
    )

    const recipeId = result.insertId // Get inserted recipe ID

    for (const catId of categoryIds || []) { // Insert recipe-category relations if any
      await connection.execute(
        'INSERT INTO recipe_category (recipe_id, category_id) VALUES (?, ?)',
        [recipeId, catId]
      )
    }

    await connection.end() // Close DB connection
    res.status(201).json({ message: 'Rezept erfolgreich gespeichert.', recipeId }) // Send success response with recipe ID
  } catch (err) {
    console.error('❌ Fehler beim Speichern des Rezepts:', err.message) // Log error
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Send internal server error
  }
})

// ===========================
// Get all recipes by user
// ===========================

/**
 * Get all recipes created by the authenticated user.
 *
 * @name GET /recipes
 * @function
 * @memberof module:routes/recipeRoutes
 * @param {Object} req - Express request (contains authenticated user)
 * @param {Object} res - Express response
 * @returns {void}
 */
router.get('/recipes', auth, async (req, res) => {
  const userId = req.user.id // Get user ID from auth middleware

  try {
    const connection = await getConnection() // Open DB connection
    const [recipes] = await connection.execute(
      'SELECT id, title, ingredients, instructions, image_url, is_published, created_at FROM recipe WHERE user_id = ?', // Fetch recipes by user
      [userId]
    )
    await connection.end() // Close DB connection
    res.status(200).json({ recipes }) // Return list of recipes
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Rezepte:', err.message) // Log error
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Internal server error response
  }
})

// ===========================
// Update recipe
// ===========================

/**
 * Update an existing recipe.
 *
 * @name PUT /recipes/:id
 * @function
 * @memberof module:routes/recipeRoutes
 * @param {Object} req - Express request (contains recipeId and updated fields)
 * @param {Object} res - Express response
 * @returns {void}
 */
router.put('/recipes/:id', auth, async (req, res) => {
  const { title, ingredients, instructions, image_url, categoryIds } = req.body // Extract update fields
  const recipeId = req.params.id // Recipe ID from URL
  const userId = req.user.id // User ID from auth

  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Alle Felder außer Bild sind erforderlich.' }) // Validate required fields except image
  }

  try {
    const connection = await getConnection() // Open DB connection

    const [result] = await connection.execute(
      `UPDATE recipe SET title = ?, ingredients = ?, instructions = ?, image_url = ? WHERE id = ? AND user_id = ?`, // Update recipe where id and user match
      [title, ingredients, instructions, image_url || null, recipeId, userId]
    )

    if (result.affectedRows === 0) { // No rows affected means recipe not found or no permission
      await connection.end() // Close connection before response
      return res.status(404).json({ error: 'Rezept nicht gefunden oder keine Berechtigung.' }) // Not found or unauthorized
    }

    await connection.execute('DELETE FROM recipe_category WHERE recipe_id = ?', [recipeId]) // Remove old category links

    for (const catId of categoryIds || []) { // Add new category links
      await connection.execute(
        'INSERT INTO recipe_category (recipe_id, category_id) VALUES (?, ?)',
        [recipeId, catId]
      )
    }

    await connection.end() // Close DB connection
    res.status(200).json({ message: 'Rezept erfolgreich aktualisiert.' }) // Success response
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren des Rezepts:', err.message) // Log error
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Internal server error response
  }
})

// ===========================
// Delete recipe
// ===========================

/**
 * Delete a recipe.
 *
 * @name DELETE /recipes/:id
 * @function
 * @memberof module:routes/recipeRoutes
 * @param {Object} req - Express request with recipe ID
 * @param {Object} res - Express response
 * @returns {void}
 */
router.delete('/recipes/:id', auth, async (req, res) => {
  const recipeId = req.params.id // Recipe ID from URL
  const userId = req.user.id // User ID from auth

  try {
    const connection = await getConnection() // Open DB connection
    const [result] = await connection.execute(
      'DELETE FROM recipe WHERE id = ? AND user_id = ?', // Delete recipe owned by user
      [recipeId, userId]
    )

    await connection.end() // Close DB connection
    if (result.affectedRows === 0) { // If no rows deleted, recipe not found or unauthorized
      return res.status(404).json({ error: 'Rezept nicht gefunden oder keine Berechtigung.' }) // Not found response
    }

    res.status(200).json({ message: 'Rezept erfolgreich gelöscht.' }) // Success deletion response
  } catch (err) {
    console.error('❌ Fehler beim Löschen des Rezepts:', err.message) // Log error
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Internal server error
  }
})

// ===========================
// Publish and unpublish
// ===========================

/**
 * Publish a recipe.
 *
 * @name PUT /recipes/:id/publish
 * @function
 * @memberof module:routes/recipeRoutes
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {void}
 */
router.put('/recipes/:id/publish', auth, async (req, res) => {
  const recipeId = req.params.id // Recipe ID from URL
  const userId = req.user.id // User ID from auth

  try {
    const connection = await getConnection() // Open DB connection
    const [result] = await connection.execute(
      'UPDATE recipe SET is_published = true WHERE id = ? AND user_id = ?', // Set recipe as published for this user
      [recipeId, userId]
    )
    await connection.end() // Close DB connection

    if (result.affectedRows === 0) { // No rows updated means not found or no permission
      return res.status(404).json({ error: 'Rezept nicht gefunden oder keine Berechtigung.' }) // Not found or unauthorized
    }

    res.status(200).json({ message: 'Rezept veröffentlicht.' }) // Success response
  } catch (err) {
    console.error('❌ Fehler beim Veröffentlichen:', err.message) // Log error
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Internal server error
  }
})

/**
 * Unpublish a recipe.
 *
 * @name PUT /recipes/:id/unpublish
 * @function
 * @memberof module:routes/recipeRoutes
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {void}
 */
router.put('/recipes/:id/unpublish', auth, async (req, res) => {
  const recipeId = req.params.id // Recipe ID from URL
  const userId = req.user.id // User ID from auth

  try {
    const connection = await getConnection() // Open DB connection
    const [result] = await connection.execute(
      'UPDATE recipe SET is_published = false WHERE id = ? AND user_id = ?', // Set recipe as unpublished
      [recipeId, userId]
    )
    await connection.end() // Close DB connection

    if (result.affectedRows === 0) { // No rows updated means not found or no permission
      return res.status(404).json({ error: 'Rezept nicht gefunden oder keine Berechtigung.' }) // Not found or unauthorized
    }

    res.status(200).json({ message: 'Rezept wurde zurückgezogen.' }) // Success response
  } catch (err) {
    console.error('❌ Fehler beim Zurückziehen:', err.message) // Log error
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Internal server error
  }
})

// ===========================
// Public recipes
// ===========================

/**
 * Get all published public recipes.
 *
 * @name GET /public-recipes
 * @function
 * @memberof module:routes/recipeRoutes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
router.get('/public-recipes', async (req, res) => {
  try {
    const connection = await getConnection() // Open DB connection
    const [recipes] = await connection.execute(`
      SELECT r.id, r.title, r.ingredients, r.instructions, r.image_url, r.user_id,
             u.display_name, u.email,
             GROUP_CONCAT(c.name) AS categories
      FROM recipe r
      JOIN user u ON r.user_id = u.id
      LEFT JOIN recipe_category rc ON rc.recipe_id = r.id
      LEFT JOIN category c ON rc.category_id = c.id
      WHERE r.is_published = TRUE
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `) // Query for published recipes with user and categories
    await connection.end() // Close DB connection
    res.status(200).json({ recipes }) // Send recipes response
  } catch (err) {
    console.error('❌ Fehler beim Laden der öffentlichen Rezepte:', err.message) // Log error
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Internal server error
  }
})

/**
 * Get a single published recipe by ID.
 *
 * @name GET /public-recipes/:id
 * @function
 * @memberof module:routes/recipeRoutes
 * @param {Object} req - Express request with recipe ID
 * @param {Object} res - Express response
 * @returns {void}
 */
router.get('/public-recipes/:id', async (req, res) => {
  const recipeId = req.params.id // Recipe ID from URL

  try {
    const connection = await getConnection() // Open DB connection
    const [rows] = await connection.execute(`
      SELECT r.id, r.title, r.ingredients, r.instructions, r.image_url, r.user_id,
             u.display_name, u.email
      FROM recipe r
      JOIN user u ON r.user_id = u.id
      WHERE r.is_published = TRUE AND r.id = ?
    `, [recipeId]) // Query for a single published recipe by ID
    await connection.end() // Close DB connection

    if (rows.length === 0) { // If no recipe found
      return res.status(404).json({ error: 'Rezept nicht gefunden.' }) // Not found response
    }

    res.status(200).json({ recipe: rows[0] }) // Return the found recipe
  } catch (err) {
    console.error('❌ Fehler beim Laden des Rezepts:', err.message) // Log error
    res.status(500).json({ error: 'Interner Serverfehler.' }) // Internal server error
  }
})

export default router // Export router as default
