import express from 'express'
import { getConnection } from '../db/db.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Kommentar hinzufügen
router.post('/comments/:recipeId', auth, async (req, res) => {
  const recipeId = req.params.recipeId
  const userId = req.user.id
  const { text } = req.body

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Kommentar darf nicht leer sein.' })
  }

  try {
    const connection = await getConnection()
    await connection.execute(
      'INSERT INTO comment (recipe_id, user_id, content) VALUES (?, ?, ?)',
      [recipeId, userId, text]
    )
    await connection.end()
    res.status(201).json({ message: 'Kommentar gespeichert.' })
  } catch (err) {
    console.error('❌ Fehler beim Speichern des Kommentars:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

// Kommentare abrufen
router.get('/comments/:recipeId', async (req, res) => {
  const recipeId = req.params.recipeId

  try {
    const connection = await getConnection()
    const [comments] = await connection.execute(`
      SELECT c.id, c.user_id, c.content AS text, u.display_name, u.email
      FROM comment c
      JOIN user u ON c.user_id = u.id
      WHERE c.recipe_id = ?
      ORDER BY c.created_at ASC
    `, [recipeId])
    await connection.end()
    res.status(200).json({ comments })
  } catch (err) {
    console.error('❌ Fehler beim Laden der Kommentare:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

// Kommentar löschen
router.delete('/comments/:commentId', auth, async (req, res) => {
  const commentId = req.params.commentId
  const userId = req.user.id

  try {
    const connection = await getConnection()
    const [result] = await connection.execute(
      'DELETE FROM comment WHERE id = ? AND user_id = ?',
      [commentId, userId]
    )
    await connection.end()

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Keine Berechtigung zum Löschen dieses Kommentars.' })
    }

    res.status(200).json({ message: 'Kommentar gelöscht.' })
  } catch (err) {
    console.error('❌ Fehler beim Löschen des Kommentars:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

export default router
