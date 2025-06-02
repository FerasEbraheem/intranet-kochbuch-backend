import express from 'express'
import { getConnection } from '../db/db.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Rezept zur Favoritenliste hinzufügen
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

// Favoriten abrufen
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

// Rezept aus Favoriten entfernen
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
