import { getConnection } from './db.js'

/**
 * @module db/init
 */

/**
 * Initializes the database by creating necessary tables if they don't exist.
 *
 * This function creates the following tables:
 * - `user`: Stores user accounts.
 * - `recipe`: Stores recipe data linked to users.
 * - `category`: Stores unique recipe categories.
 * - `recipe_category`: Many-to-many relationship between recipes and categories.
 * - `favorite`: Many-to-many relationship for user-favorite recipes.
 * - `comment`: Stores user comments on recipes.
 *
 * Relationships:
 * - `recipe.user_id → user.id`
 * - `recipe_category.recipe_id → recipe.id`
 * - `recipe_category.category_id → category.id`
 * - `favorite.user_id → user.id`
 * - `favorite.recipe_id → recipe.id`
 * - `comment.recipe_id → recipe.id`
 * - `comment.user_id → user.id`
 *
 * @async
 * @function
 * @returns {Promise<Object>} Resolves when initialization is complete
 *
 * @example
 * import { initDatabase } from './db/init.js';
 * await initDatabase();
 */
export async function initDatabase() {
  try {
    const connection = await getConnection()

    await connection.execute(`CREATE TABLE IF NOT EXISTS user (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      display_name VARCHAR(100),
      avatar_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)

    await connection.execute(`CREATE TABLE IF NOT EXISTS recipe (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      ingredients TEXT NOT NULL,
      instructions TEXT NOT NULL,
      image_url VARCHAR(500),
      is_published BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )`)

    await connection.execute(`CREATE TABLE IF NOT EXISTS category (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
    )`)

    await connection.execute(`CREATE TABLE IF NOT EXISTS recipe_category (
      recipe_id INT NOT NULL,
      category_id INT NOT NULL,
      PRIMARY KEY (recipe_id, category_id),
      FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
    )`)

    await connection.execute(`CREATE TABLE IF NOT EXISTS favorite (
      user_id INT NOT NULL,
      recipe_id INT NOT NULL,
      PRIMARY KEY (user_id, recipe_id),
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
    )`)

    await connection.execute(`CREATE TABLE IF NOT EXISTS comment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recipe_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )`)

    console.log('✅ Tabellen wurden geprüft oder erstellt.')
    await connection.end()
  } catch (err) {
    console.error('❌ Fehler bei der DB-Initialisierung:', err.message)
  }
}
