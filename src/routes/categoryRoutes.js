import express from 'express'
import { getConnection } from '../db/db.js'

const router = express.Router()

// Kategorien abrufen
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