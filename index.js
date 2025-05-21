// Projekt: Intranet-Kochbuch Backend (Express + MariaDB)

// ===========================
// index.js
// ===========================
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const auth = require('./middleware/auth')

// Load env vars
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey'

// Middlewares
app.use(cors())
app.use(express.json())

// Initialisiere Datenbank und Tabellen
async function initDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    })

    console.log('✅ Verbindung zur MariaDB erfolgreich.')

    // Tabelle: user
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Tabelle: recipe
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recipe (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        image_url VARCHAR(500),
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `)

    console.log('Tabellen wurden geprüft oder erstellt.')
    await connection.end()
  } catch (error) {
    console.error('❌ Fehler bei der DB-Initialisierung:', error.message)
  }
}

initDatabase()

// Test Route
app.get('/', (req, res) => {
  res.send('API läuft: Intranet-Kochbuch Backend')
})

// Geschützte Route (Test)
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'Erfolgreich authentifiziert!', user: req.user })
})

// Registrierung
app.post('/api/register', async (req, res) => {
  const { email, password, display_name } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    })

    const [existing] = await connection.execute('SELECT id FROM user WHERE email = ?', [email])
    if (existing.length > 0) {
      await connection.end()
      return res.status(409).json({ error: 'E-Mail ist bereits registriert.' })
    }

    await connection.execute(
      'INSERT INTO user (email, password, display_name) VALUES (?, ?, ?)',
      [email, hashedPassword, display_name || null]
    )

    await connection.end()
    res.status(201).json({ message: 'Registrierung erfolgreich.' })
  } catch (err) {
    console.error('❌ Fehler bei Registrierung:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' })
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    })

    const [users] = await connection.execute('SELECT * FROM user WHERE email = ?', [email])

    if (users.length === 0) {
      await connection.end()
      return res.status(401).json({ error: 'Ungültige Anmeldedaten.' })
    }

    const user = users[0]
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      await connection.end()
      return res.status(401).json({ error: 'Ungültige Anmeldedaten.' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    )
    console.log("Token erstellt:", token)

    await connection.end()
    res.status(200).json({
      message: 'Login erfolgreich.',
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name
      }
    })
  } catch (err) {
    console.error('❌ Fehler beim Login:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

// Server Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf http://0.0.0.0:${PORT}`)
})