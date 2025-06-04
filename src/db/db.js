import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

/**
 * @module db/db
 */

/**
 * Database configuration object.
 *
 * Loaded from environment variables:
 * - `DB_HOST`
 * - `DB_USER`
 * - `DB_PASS`
 * - `DB_NAME`
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

/**
 * Creates a new MySQL connection using `mysql2/promise`.
 *
 * @async
 * @function
 * @returns {Promise<Object>} Resolves to a MySQL connection object
 *
 * @example
 * const connection = await getConnection();
 * const [rows] = await connection.query('SELECT * FROM users');
 */
export const getConnection = () => mysql.createConnection(dbConfig)
