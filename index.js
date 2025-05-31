// Projekt: Intranet-Kochbuch Backend (Express + MariaDB)

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import auth from './middleware/auth.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

dotenv.config() // Diese Zeile liest die Datei .env und lädt die Umgebungsvariablen in process.env

const dbConfig = { //Konfiguration der Datenbankverbindung
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
}


const app = express() // Initialisiert eine Express-Anwendung
const PORT = process.env.PORT || 5000 // Legt den Port fest, auf dem der Server läuft (aus .env oder Standard: 5000)
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey' // Geheimschlüssel für JWT (aus .env oder Standardwert)

const corsOptions = { //Erlaubt dem Frontend, nur aus demselben Netzwerk mit dem Backend zu kommunizieren
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://192.168.1.35')) {
      callback(null, true)
    } else {
      callback(new Error('Nicht erlaubter Ursprung'))
    }
  },
  credentials: true,
}


app.use(cors(corsOptions)) // Aktiviert das Parsen von JSON-Daten und erlaubt CORS-Anfragen
app.use(express.json())

async function initDatabase() { //Prüft, ob die Tabellen user und recipe existieren, und erstellt sie, falls sie nicht vorhanden sind
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    })

    console.log('✅ Verbindung zur MariaDB erfolgreich.')

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

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
    await connection.execute(`
    CREATE TABLE IF NOT EXISTS category (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
    )
  `);

    await connection.execute(`
    CREATE TABLE IF NOT EXISTS recipe_category (
      recipe_id INT NOT NULL,
      category_id INT NOT NULL,
      PRIMARY KEY (recipe_id, category_id),
      FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
    )
  `);


    console.log('Tabellen wurden geprüft oder erstellt.')
    await connection.end()
  } catch (error) {
    console.error('❌ Fehler bei der DB-Initialisierung:', error.message)
  }
}

initDatabase()

app.get('/', (req, res) => { //Die Haupt-Testseite unter http://localhost:5000/ zeigt eine einfache Nachricht an.
  res.send('API läuft: Intranet-Kochbuch Backend')
})

app.get('/api/protected', auth, (req, res) => { //Verwendet das Middleware auth, um das JWT zu überprüfen.
  res.json({ message: 'Erfolgreich authentifiziert!', user: req.user })
})

// Registrierung eines neuen Benutzers
app.post('/api/register', async (req, res) => {
  const { email, password, display_name } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)// Hashing des Passworts mit bcrypt
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    })

    const [existing] = await connection.execute('SELECT id FROM user WHERE email = ?', [email])// Überprüfen, ob die E-Mail bereits registriert ist
    if (existing.length > 0) {
      await connection.end()
      return res.status(409).json({ error: 'E-Mail ist bereits registriert.' })
    }

    await connection.execute( // Einfügen des neuen Benutzers in die Datenbank
      'INSERT INTO user (email, password, display_name) VALUES (?, ?, ?)',
      [email, hashedPassword, display_name || null]
    )

    // Benutzer erneut abrufen, um ID zu bekommen
    const [userResult] = await connection.execute(
      'SELECT * FROM user WHERE email = ?',
      [email]
    )
    const user = userResult[0]

    const token = jwt.sign( // Erstellen eines JWT-Tokens für den neuen Benutzer
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    )

    await connection.end() // Schließen der Datenbankverbindung

    res.status(201).json({// Erfolgreiche Registrierung
      message: 'Registrierung erfolgreich.',
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name
      }
    })
  } catch (err) {
    console.error('❌ Fehler bei Registrierung:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })// Fehlerbehandlung 500
  }
})

// Login eines Benutzers
app.post('/api/login', async (req, res) => {// Verwendet bcrypt, um das Passwort zu überprüfen
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

// Rezept hinzufügen (geschützt)
app.post('/api/recipes', auth, async (req, res) => {
  const { title, ingredients, instructions, image_url, categoryIds } = req.body
  const userId = req.user.id

  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Titel, Zutaten und Anleitung sind erforderlich.' })
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })

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
    res.status(201).json({
      message: 'Rezept erfolgreich gespeichert.',
      recipeId: result.insertId
    })
  } catch (err) {
    console.error('❌ Fehler beim Speichern des Rezepts:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})

// Rezepte abrufen (geschützt)
app.get('/api/recipes', auth, async (req, res) => {
  const userId = req.user.id

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })

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

app.put('/api/recipes/:id', auth, async (req, res) => { // Rezept aktualisieren (geschützt)
  const { title, ingredients, instructions, image_url, categoryIds } = req.body
  const recipeId = req.params.id
  const userId = req.user.id

  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Alle Felder außer Bild sind erforderlich.' })
  }

  try {
    const connection = await mysql.createConnection(dbConfig)

    // 1. Update the recipe
    const [result] = await connection.execute(
      `UPDATE recipe
       SET title = ?, ingredients = ?, instructions = ?, image_url = ?
       WHERE id = ? AND user_id = ?`,
      [title, ingredients, instructions, image_url || null, recipeId, userId]
    )

    if (result.affectedRows === 0) {
      await connection.end()
      return res.status(404).json({ error: 'Rezept nicht gefunden oder keine Berechtigung.' })
    }

    // 2. Delete old categories
    await connection.execute(
      'DELETE FROM recipe_category WHERE recipe_id = ?',
      [recipeId]
    )

    // 3. Insert new categories
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


// Rezept löschen (geschützt)
app.delete('/api/recipes/:id', auth, async (req, res) => {
  const recipeId = req.params.id
  const userId = req.user.id

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })

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
// Öffentliche (veröffentlichte) Rezepte abrufen – keine Authentifizierung nötig
app.get('/api/public-recipes', async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })

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


// Rezept veröffentlichen (geschützt)
app.put('/api/recipes/:id/publish', auth, async (req, res) => {
  const recipeId = req.params.id
  const userId = req.user.id

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })

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

import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Überprüfung, ob der Bilderordner vorhanden ist
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

// Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname
    cb(null, uniqueName)
  },
})

const upload = multer({ storage })

// Image upload route
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  const fileUrl = `http://192.168.1.35:5000/uploads/${req.file.filename}`
  res.json({ imageUrl: fileUrl })
})

// Serve images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))




// Einzelnes öffentliches Rezept abrufen
app.get('/api/public-recipes/:id', async (req, res) => {
  const recipeId = req.params.id

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })

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

app.post('/api/favorites/:recipeId', auth, async (req, res) => {
  const userId = req.user.id;
  const recipeId = req.params.recipeId;

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    await connection.execute(
      'INSERT IGNORE INTO favorite (user_id, recipe_id) VALUES (?, ?)',
      [userId, recipeId]
    );

    await connection.end();
    res.status(200).json({ message: 'Zur Favoritenliste hinzugefügt.' });
  } catch (err) {
    console.error('❌ Fehler beim Hinzufügen zur Favoritenliste:', err.message);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});


app.get('/api/favorites', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    const [favorites] = await connection.execute(`
      SELECT r.id, r.title, r.ingredients, r.instructions, r.image_url, u.display_name, u.email
      FROM favorite f
      JOIN recipe r ON f.recipe_id = r.id
      JOIN user u ON r.user_id = u.id
      WHERE f.user_id = ?
    `, [userId]);

    await connection.end();
    res.status(200).json({ recipes: favorites });
  } catch (err) {
    console.error('❌ Fehler beim Laden der Favoriten:', err.message);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

app.delete('/api/favorites/:recipeId', auth, async (req, res) => {
  const userId = req.user.id;
  const recipeId = req.params.recipeId;

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    const [result] = await connection.execute(
      'DELETE FROM favorite WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId]
    );

    await connection.end();
    res.status(200).json({ message: 'Rezept wurde aus Favoriten entfernt.' });
  } catch (err) {
    console.error('❌ Fehler beim Entfernen aus Favoriten:', err.message);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// Kommentar hinzufügen
app.post('/api/comments/:recipeId', auth, async (req, res) => {
  const recipeId = req.params.recipeId
  const userId = req.user.id
  const { text } = req.body

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Kommentar darf nicht leer sein.' })
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })

    await connection.execute(
      `INSERT INTO comment (recipe_id, user_id, content)
      VALUES (?, ?, ?)`,
      [recipeId, userId, text]
    )


    await connection.end()
    res.status(201).json({ message: 'Kommentar gespeichert.' })
  } catch (err) {
    console.error('❌ Fehler beim Speichern des Kommentars:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})


app.get('/api/comments/:recipeId', async (req, res) => {
  const recipeId = req.params.recipeId

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })

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


// Kommentar löschen (nur vom Besitzer)
app.delete('/api/comments/:commentId', auth, async (req, res) => {
  const commentId = req.params.commentId
  const userId = req.user.id

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })

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


// GET Profil
app.get('/api/profile', auth, async (req, res) => {
  const userId = req.user.id

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })

    const [rows] = await connection.execute(
      'SELECT id, email, display_name, avatar_url FROM user WHERE id = ?',
      [userId]
    )

    await connection.end()

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden.' })
    }

    const user = rows[0]

    res.status(200).json({ user }) 
  } catch (err) {
    console.error('❌ Fehler beim Laden des Profils:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})


// PUT Profil aktualisieren
app.put('/api/profile', auth, async (req, res) => {
  const userId = req.user.id
  const { display_name, avatar_url } = req.body

  try {
    const connection = await mysql.createConnection(dbConfig)
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

// Rezept zurückziehen (nicht mehr veröffentlichen)
app.put('/api/recipes/:id/unpublish', auth, async (req, res) => {
  const recipeId = req.params.id
  const userId = req.user.id

  try {
    const connection = await mysql.createConnection(dbConfig)

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

//(distinct categories)
app.get('/api/categories', async (_req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig)
    const [rows] = await connection.execute(`
      SELECT id, name FROM category ORDER BY name

    `)
    await connection.end()
    res.json({ categories: rows })

  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Kategorien:', err.message)
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})



// Server Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf http://0.0.0.0:${PORT}`)
})
