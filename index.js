// Projekt: Intranet-Kochbuch Backend (Express + MariaDB)

const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const auth = require('./middleware/auth')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey'

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://192.168.1.35')) {
      callback(null, true)
    } else {
      callback(new Error('Nicht erlaubter Ursprung'))
    }
  },
  credentials: true,
}


app.use(cors(corsOptions))

app.use(express.json())

async function initDatabase() {
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

    console.log('Tabellen wurden geprüft oder erstellt.')
    await connection.end()
  } catch (error) {
    console.error('❌ Fehler bei der DB-Initialisierung:', error.message)
  }
}

initDatabase()

app.get('/', (req, res) => {
  res.send('API läuft: Intranet-Kochbuch Backend')
})

app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'Erfolgreich authentifiziert!', user: req.user })
})

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

    // Benutzer erneut abrufen, um ID zu bekommen
    const [userResult] = await connection.execute(
      'SELECT * FROM user WHERE email = ?',
      [email]
    )
    const user = userResult[0]

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    )

    await connection.end()

    res.status(201).json({
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
    res.status(500).json({ error: 'Interner Serverfehler.' })
  }
})


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

// Rezept hinzufügen (geschützt)
app.post('/api/recipes', auth, async (req, res) => {
  const { title, ingredients, instructions, image_url } = req.body
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
      `INSERT INTO recipe (user_id, title, ingredients, instructions, image_url)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, ingredients, instructions, image_url || null]
    )

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

// Rezept aktualisieren (geschützt)
app.put('/api/recipes/:id', auth, async (req, res) => {
  const { title, ingredients, instructions, image_url } = req.body
  const recipeId = req.params.id
  const userId = req.user.id

  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Alle Felder außer Bild sind erforderlich.' })
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })

    const [result] = await connection.execute(
      `UPDATE recipe
       SET title = ?, ingredients = ?, instructions = ?, image_url = ?
       WHERE id = ? AND user_id = ?`,
      [title, ingredients, instructions, image_url || null, recipeId, userId]
    )

    await connection.end()

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Rezept nicht gefunden oder keine Berechtigung.' })
    }

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
             u.display_name, u.email
      FROM recipe r
      JOIN user u ON r.user_id = u.id
      WHERE r.is_published = TRUE
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

const multer = require('multer')
const path = require('path')
const fs = require('fs')

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





// Server Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf http://0.0.0.0:${PORT}`)
})
