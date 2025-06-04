import express from 'express'
import { getConnection } from '../db/db.js'
import auth from '../middleware/auth.js'

/**
 * @module routes/recipeRoutes
 * @description Routes for managing and viewing recipes.
 */

const router = express.Router()

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
  const { title, ingredients, instructions, image_url, categoryIds } = req.body
  const userId = req.user.id

  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Titel, Zutaten und Anleitung sind erforderlich.' })
  }

  try {
    const connection = await getConnection()

    const [result] = await connection.execute(
      `INSERT INTO recipe (user_id, title, ingredients, instructions, image_url, is_published)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [userId, title, ingredients, instructions, image_url || null]
    )

    const recipeId = result.insertId

    for (const catId of categoryIds || []) {
      await connection.execute(
        'INSERT INTO recipe_category (recipe_id, category_id) VALUES (?, ?)',
        [recipeId, catId]
      )
    }

    await connection.end()
    res.status(201).json({ message: 'Rezept erfolgreich gespeichert.', recipeId })
  } catch (err) {
    console.error('❌ Fehler beim Speichern des Rezepts:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

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
  const userId = req.user.id

  try {
    const connection = await getConnection()
    const [recipes] = await connection.execute(
      'SELECT id, title, ingredients, instructions, image_url, is_published, created_at FROM recipe WHERE user_id = ?',
      [userId]
    )
    await connection.end()
    res.status(200).json({ recipes })
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Rezepte:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

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
  const { title, ingredients, instructions, image_url, categoryIds } = req.body
  const recipeId = req.params.id
  const userId = req.user.id

  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Alle Felder außer Bild sind erforderlich.' })
  }

  try {
    const connection = await getConnection()

    const [result] = await connection.execute(
      `UPDATE recipe SET title = ?, ingredients = ?, instructions = ?, image_url = ? WHERE id = ? AND user_id = ?`,
      [title, ingredients, instructions, image_url || null, recipeId, userId]
    )

    if (result.affectedRows === 0) {
      await connection.end()
      return res.status(404).json({ error: 'Rezept nicht gefunden oder keine Berechtigung.' })
    }

    await connection.execute('DELETE FROM recipe_category WHERE recipe_id = ?', [recipeId])

    for (const catId of categoryIds || []) {
      await connection.execute(
        'INSERT INTO recipe_category (recipe_id, category_id) VALUES (?, ?)',
        [recipeId, catId]
      )
    }

    await connection.end()
    res.status(200).json({ message: 'Rezept erfolgreich aktualisiert.' })
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren des Rezepts:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

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
  const recipeId = req.params.id
  const userId = req.user.id

  try {
    const connection = await getConnection()
    const [result] = await connection.execute(
      'DELETE FROM recipe WHERE id = ? AND user_id = ?',
      [recipeId, userId]
    )

    await connection.end()
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Rezept nicht gefunden oder keine Berechtigung.' })
    }

    res.status(200).json({ message: 'Rezept erfolgreich gelöscht.' })
  } catch (err) {
    console.error('❌ Fehler beim Löschen des Rezepts:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

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
  const recipeId = req.params.id
  const userId = req.user.id

  try {
    const connection = await getConnection()
    const [result] = await connection.execute(
      'UPDATE recipe SET is_published = true WHERE id = ? AND user_id = ?',
      [recipeId, userId]
    )
    await connection.end()

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Rezept nicht gefunden oder keine Berechtigung.' })
    }

    res.status(200).json({ message: 'Rezept veröffentlicht.' })
  } catch (err) {
    console.error('❌ Fehler beim Veröffentlichen:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
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
  const recipeId = req.params.id
  const userId = req.user.id

  try {
    const connection = await getConnection()
    const [result] = await connection.execute(
      'UPDATE recipe SET is_published = false WHERE id = ? AND user_id = ?',
      [recipeId, userId]
    )
    await connection.end()

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Rezept nicht gefunden oder keine Berechtigung.' })
    }

    res.status(200).json({ message: 'Rezept wurde zurückgezogen.' })
  } catch (err) {
    console.error('❌ Fehler beim Zurückziehen:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

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
    const connection = await getConnection()
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
    `)
    await connection.end()
    res.status(200).json({ recipes })
  } catch (err) {
    console.error('❌ Fehler beim Laden der öffentlichen Rezepte:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
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
  const recipeId = req.params.id

  try {
    const connection = await getConnection()
    const [rows] = await connection.execute(`
      SELECT r.id, r.title, r.ingredients, r.instructions, r.image_url, r.user_id,
             u.display_name, u.email
      FROM recipe r
      JOIN user u ON r.user_id = u.id
      WHERE r.is_published = TRUE AND r.id = ?
    `, [recipeId])
    await connection.end()

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Rezept nicht gefunden.' })
    }

    res.status(200).json({ recipe: rows[0] })
  } catch (err) {
    console.error('❌ Fehler beim Laden des Rezepts:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

export default router
