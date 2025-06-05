// ===========================
// src/db/db.js
// ===========================

/**
 * @file db.js
 * @description Database connection configuration and utility using mysql2/promise.
 * Loads credentials from environment variables and exports a reusable connection method.
 *
 * @module db/db
 */

import mysql from 'mysql2/promise'         // Import MySQL promise-based client
import dotenv from 'dotenv'                // Load environment variables from .env file
dotenv.config()                            // Initialize dotenv

// ==============================
// Configuration Object
// ==============================

/**
 * Database configuration object.
 *
 * Loaded from environment variables:
 * - DB_HOST
 * - DB_USER
 * - DB_PASS
 * - DB_NAME
 *
 * @type {Object}
 * @property {string} host - Database host
 * @property {string} user - Database user
 * @property {string} password - Database password
 * @property {string} database - Database name
 */
export const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
}

// ==============================
// Connection Factory Function
// ==============================

/**
 * Creates a new MySQL connection using mysql2/promise.
 *
 * @async
 * @function
 * @returns {Promise<import('mysql2/promise').Connection>} Resolves to a MySQL connection object
 *
 * @example
 * const connection = await getConnection();
 * const [rows] = await connection.query('SELECT * FROM users');
 */
export const getConnection = () => mysql.createConnection(dbConfig)
