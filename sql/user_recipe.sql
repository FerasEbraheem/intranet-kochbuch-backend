-- Tabelle für Benutzerinformationen
CREATE TABLE IF NOT EXISTS user (
  id INT AUTO_INCREMENT PRIMARY KEY,                          -- Eindeutige ID für jeden Benutzer
  email VARCHAR(255) NOT NULL UNIQUE,                         -- E-Mail-Adresse des Benutzers (muss eindeutig sein)
  password VARCHAR(255) NOT NULL,                             -- Passwort des Benutzers (verschlüsselt speichern!)
  display_name VARCHAR(100),                                  -- Anzeigename des Benutzers (optional)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP              -- Zeitpunkt der Kontoerstellung
);

-- Tabelle für Rezepte
CREATE TABLE IF NOT EXISTS recipe (
  id INT AUTO_INCREMENT PRIMARY KEY,                          -- Eindeutige ID für jedes Rezept
  user_id INT NOT NULL,                                       -- Verweis auf den Ersteller des Rezepts (user.id)
  title VARCHAR(255) NOT NULL,                                -- Titel des Rezepts
  ingredients TEXT NOT NULL,                                  -- Zutatenliste
  instructions TEXT NOT NULL,                                 -- Zubereitungsanleitung
  image_url VARCHAR(500),                                     -- Optionaler Bild-Link zum Rezept
  is_published BOOLEAN DEFAULT FALSE,                         -- Veröffentlichungsstatus (true/false)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,             -- Erstellungszeitpunkt des Rezepts
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE -- Fremdschlüssel zu Benutzer, mit automatischem Löschen bei Benutzerlöschung
);

-- Tabelle für Favoriten
CREATE TABLE IF NOT EXISTS favorite (
  id INT AUTO_INCREMENT PRIMARY KEY,                          -- Eindeutige ID für jeden Favoriteneintrag
  user_id INT NOT NULL,                                       -- Verweis auf den Benutzer, der das Rezept favorisiert hat
  recipe_id INT NOT NULL,                                     -- Verweis auf das favorisierte Rezept
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,             -- Zeitpunkt des Hinzufügens zu den Favoriten
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,  -- Löschen bei Benutzerlöschung
  FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE -- Löschen bei Rezeptlöschung
);

-- Tabelle für Kommentare
CREATE TABLE IF NOT EXISTS comment (
  id INT AUTO_INCREMENT PRIMARY KEY,                          -- Eindeutige ID für jeden Kommentar
  user_id INT NOT NULL,                                       -- Verweis auf den Benutzer, der kommentiert hat
  recipe_id INT NOT NULL,                                     -- Verweis auf das kommentierte Rezept
  content TEXT NOT NULL,                                      -- Inhalt des Kommentars
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,             -- Zeitpunkt der Kommentarerstellung
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,  -- Löschen bei Benutzerlöschung
  FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE -- Löschen bei Rezeptlöschung
);


ALTER TABLE user ADD COLUMN avatar_url VARCHAR(500); -- Optionaler Link zum Avatar-Bild des Benutzers