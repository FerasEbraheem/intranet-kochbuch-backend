# Intranet Kochbuch Backend

A secure and feature-rich **RESTful API** backend for the internal Intranet Kochbuch (cookbook) application.
Built with **Node.js**, **Express**, and **MySQL**, this backend allows users to manage and share recipes,
mark favorites, add comments, and organize recipes using categories.

---

## 🔧 Features

- Registration and login with JWT authentication
- Password hashing using bcrypt
- CRUD operations for recipes
- Recipe categorization & publication
- User-specific favorites system
- Commenting system for recipes
- Image uploads via multer
- Middleware for authentication
- Structured project organization
- Static serving of uploaded images

---

## 📂 Folder Structure

```bash
📦 intranet-kochbuch-backend/
├──📁docs/                       # (ERD, diagrams, etc.)
├──📁 sql/
│   └──📄 user_recipe.sql        # SQL schema or seed data
├──📁 src/
│   ├──📁 db/
│   │   ├──📄 db.js              # DB connection handler
│   │   └──📄 init.js            # Tables initialization logic
│   ├──📁 middleware/
│   │   └──📄 auth.js            # JWT auth middleware
│   └──📁 routes/                # API route modules
│       ├──📄 authRoutes.js
│       ├──📄 categoryRoutes.js
│       ├──📄 commentRoutes.js
│       ├──📄 favoriteRoutes.js
│       ├──📄 profileRoutes.js
│       ├──📄 recipeRoutes.js
│       └──📄 uploadRoutes.js
├──📁 uploads/                   # Uploaded recipe images
├──📄 app.js                     # Initializes Express app & loads routes
├──📄 server.js                  # Entry point to run the server
├──📄 .env                       # Environment config (not committed)
├──📄 example.env                # Template for .env setup
├──📄 package.json               # NPM scripts & dependencies
├──📄 .gitignore                 # Ignored files and folders
└──📄 README.md                  # This file
```

---

## 🛠️ Installation & Setup (No Docker)

### ✅ Prerequisites
- Node.js **v22.14.0** (latest LTS recommended)
- MySQL server running locally or remotely

### 📦 Install Dependencies
```bash
npm install
```

### ⚙️ Configure Environment
1. Copy the example file:
   ```bash
   cp example.env .env
   ```
2. Edit `.env` with your database and secret config:

| Variable     | Description                                  |
|--------------|----------------------------------------------|
| `PORT`       | Port on which the server runs (e.g. 5000)    |
| `DB_HOST`    | MySQL host (e.g. `localhost`)                |
| `DB_USER`    | MySQL username                               |
| `DB_PASS`    | MySQL password                               |
| `DB_NAME`    | MySQL database name                          |
| `JWT_SECRET` | Secret key to sign and verify JWT tokens     |

### 🧱 Initialize the Database
Create your database manually (if not already):
```sql
CREATE DATABASE your_db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
The tables will be auto-created at server start via `init.js`.

### 🚀 Run the Server
- Development mode (with file watching):
```bash
npm run dev
```
- Production mode:
```bash
npm start
```

The API will run at: `http://localhost:5000`

---
## 🗃️ Entity Relationship Diagram (ERD)

![ERD](./docs/screenshots/ERD.png)

---
## 📸 Screenshots

Screenshots can be placed in `docs/screenshots/`.

---

## 📑 Data Model Overview

### Table: `user`

| Column       | Type         | Description                   |
|--------------|--------------|-------------------------------|
| id           | INT          | Primary key                   |
| email        | VARCHAR(255) | Unique                        |
| password     | VARCHAR(255) | Hashed with bcrypt            |
| display_name | VARCHAR(100) | Display name                  |
| avatar_url   | VARCHAR(500) | Optional                      |
| created_at   | TIMESTAMP    | Default: current timestamp    |

### Table: `recipe`

| Column       | Type         | Description                   |
|--------------|--------------|-------------------------------|
| id           | INT          | Primary key                   |
| user_id      | INT          | Foreign key to user(id)       |
| title        | VARCHAR(255) | Recipe title                  |
| ingredients  | TEXT         | Recipe ingredients            |
| instructions | TEXT         | Step-by-step instructions     |
| image_url    | VARCHAR(500) | Image path (optional)         |
| is_published | BOOLEAN      | Published status              |
| created_at   | TIMESTAMP    | Timestamp of creation         |

### Other Tables

- `category(id, name)`
- `recipe_category(recipe_id, category_id)`
- `comment(id, recipe_id, user_id, content, created_at)`
- `favorite(user_id, recipe_id)`

---

## 📡 API Endpoints Overview

### Authentication

- `POST /api/register` – Register
- `POST /api/login` – Login

### User Profile

- `GET /api/profile` – Get profile *(JWT required)*
- `PUT /api/profile` – Update profile *(JWT required)*

### Recipes

- `POST /api/recipes` – Create recipe *(JWT required)*
- `GET /api/recipes` – Get user's recipes *(JWT required)*
- `PUT /api/recipes/:id` – Update recipe *(JWT required)*
- `DELETE /api/recipes/:id` – Delete recipe *(JWT required)*
- `PUT /api/recipes/:id/publish` – Publish recipe *(JWT required)*
- `PUT /api/recipes/:id/unpublish` – Unpublish recipe *(JWT required)*

### Public Recipes

- `GET /api/public-recipes` – List published recipes
- `GET /api/public-recipes/:id` – Get single recipe

### Comments

- `POST /api/comments/:recipeId` – Add comment *(JWT required)*
- `GET /api/comments/:recipeId` – Get comments
- `DELETE /api/comments/:commentId` – Delete comment *(JWT required)*

### Favorites

- `POST /api/favorites/:recipeId` – Add to favorites *(JWT required)*
- `GET /api/favorites` – Get favorites *(JWT required)*
- `DELETE /api/favorites/:recipeId` – Remove favorite *(JWT required)*

### Categories

- `GET /api/categories` – Get all categories

### File Upload

- `POST /api/upload-image` – Upload image *(multipart/form-data)*

---
## ❗ Error Handling

```json
{
  "error": "Error message"
}
```

| Status Code | Meaning                        |
|-------------|--------------------------------|
| 400         | Missing fields / invalid input |
| 401         | Unauthorized                   |
| 403         | Access denied                  |
| 404         | Not found                      |
| 500         | Internal server error          |

---
## 🧠 Developer Notes

- Node.js version: `v22.14.0`
- Database: **local**
- `uploads/` folder must be writable
- `init.js` automatically creates required tables
- Uploaded images served at: `http://localhost:5000/uploads/<filename>`
- Timestamps are in UTC

---

### 📤 Upload Image
```http
POST /api/upload-image
Content-Type: multipart/form-data
Form field: image
```
Response:
```json
{ "imageUrl": "http://192.168.1.35:5000/uploads/filename.png" }
```

More endpoints available in route files under `src/routes/`.

---

## 📸 Screenshots
Add screenshots of your API responses or Postman examples here. For example:

- `GET /api/public-recipes` result in browser
- Response after uploading a recipe image
- Example of login + token output

<!-- Example placeholder -->
![Public Recipes Screenshot](docs/screenshots/public-recipes.png)

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute with proper attribution.

---

## 🤝 Contributing

1. Fork the repository
2. Create your branch (`git checkout -b feature/xyz`)
3. Commit your changes (`git commit -am 'Add xyz'`)
4. Push to the branch (`git push origin feature/xyz`)
5. Open a Pull Request

Issues and suggestions are welcome via GitHub.

---

© 2025 Feras Ebraheem — All rights reserved.
