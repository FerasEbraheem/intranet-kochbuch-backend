// Projekt: Intranet-Kochbuch Backend (Express + MariaDB)

// ===========================
// index.js
// ===========================
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mysql = require('mysql2/promise')

// Load env vars
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

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

    console.log('📦 Tabellen wurden geprüft oder erstellt.')
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

// Server Start
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`)
})