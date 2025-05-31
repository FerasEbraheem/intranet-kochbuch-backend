-- Tabelle für Benutzerinformationen
CREATE TABLE IF NOT EXISTS user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500), -- Avatar Bild optional
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für Rezepte
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
);

-- Favoriten-Tabelle (Many-to-Many zwischen user und recipe)
CREATE TABLE IF NOT EXISTS favorite (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
);

-- Kommentar-Tabelle
CREATE TABLE IF NOT EXISTS comment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
);

-- Kategorie-Tabelle
CREATE TABLE IF NOT EXISTS category (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- Verknüpfungstabelle zwischen Rezepten und Kategorien (Many-to-Many)
CREATE TABLE IF NOT EXISTS recipe_category (
  recipe_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (recipe_id, category_id),
  FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
);

-- Vorab-Kategorien einfügen (optional, initiale Daten)
INSERT IGNORE INTO category (name) VALUES 
  ('Dessert'),
  ('Getränk'),
  ('Snack'),
  ('Vorspeise'),
  ('Hauptgericht'),
  ('Nachspeise'),
  ('Vegetarisch'),
  ('Vegan'),
  ('Fleisch'),
  ('Fisch'),
  ('Salat'),
  ('Suppe'),
  ('Frühstück');
