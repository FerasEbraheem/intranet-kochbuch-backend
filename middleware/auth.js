// middleware/auth.js

const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey'

/**
 * Middleware zur Verifizierung des JWT-Tokens
 * Erwartet: Authorization: Bearer <token>
 * Fügt bei Erfolg req.user = { id, email } hinzu
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Kein Token vorhanden.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    console.error('JWT Fehler:', err.message)
    return res.status(403).json({ error: 'Ungültiger Token.' })
  }
}

module.exports = auth