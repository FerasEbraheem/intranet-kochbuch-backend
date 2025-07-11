// ===========================
// intranet-kochbuch-backend/server.js
// ===========================

/**
 * @file server.js
 * @description Entry point of the Intranet Kochbuch backend application.
 * Loads environment variables, starts the Express server, and listens on the specified port.
 */

// ===========================
// Imports
// ===========================

import app from './app.js'
import dotenv from 'dotenv'

// ===========================
// Environment Configuration
// ===========================

// Load environment variables from .env file
dotenv.config()

// ===========================
// Server Setup
// ===========================

// Define the port the server should listen on
const PORT = process.env.PORT || 5000

/**
 * Starts the Express server.
 * Binds to 0.0.0.0 to allow access from local network.
 */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf http://0.0.0.0:${PORT}`)
})
