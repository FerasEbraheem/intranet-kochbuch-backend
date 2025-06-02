import { getConnection } from './db.js'

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
