import express from 'express'
import { getConnection } from '../db/db.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Profil abrufen
router.get('/profile', auth, async (req, res) => {
  const userId = req.user.id

  try {
    const connection = await getConnection()
    const [rows] = await connection.execute(
      'SELECT id, email, display_name, avatar_url FROM user WHERE id = ?',
      [userId]
    )
    await connection.end()

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden.' })
    }

    res.status(200).json({ user: rows[0] })
  } catch (err) {
    console.error('❌ Fehler beim Laden des Profils:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

// Profil aktualisieren
router.put('/profile', auth, async (req, res) => {
  const userId = req.user.id
  const { display_name, avatar_url } = req.body

  try {
    const connection = await getConnection()
    await connection.execute(
      'UPDATE user SET display_name = ?, avatar_url = ? WHERE id = ?',
      [display_name, avatar_url || null, userId]
    )
    await connection.end()
    res.status(200).json({ message: 'Profil aktualisiert.' })
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren des Profils:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

export default router