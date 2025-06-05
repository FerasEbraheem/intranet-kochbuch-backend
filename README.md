# Intranet Kochbuch Backend

This project provides the **Intranet Kochbuch** backend – a secure, RESTful API for an internal recipe-sharing application. It is built with **Node.js** (v22.x LTS), **Express**, and **MySQL**, following a modular architecture. Node.js is a fast, event-driven JavaScript runtime built on Chrome’s V8 engine, and Express.js is a minimalist yet robust web framework. MySQL is a popular open-source relational database management system (RDBMS) known for its reliability, performance, and scalability. Together, these technologies enable this backend to efficiently handle user authentication, recipe data, and related features. Users can register/login (with stateless JWT tokens), perform CRUD on recipes, add categories, mark favorites, comment on recipes, and upload images.

---

## 🔧 Features

- **User Authentication:** Registration and login with JWT-based authentication (stateless JSON Web Tokens). All protected routes require a valid token.
- **Password Security:** Passwords are hashed using **bcrypt** before storage. Bcrypt is a widely-used library for secure, irreversible password hashing.
- **Recipe Management:** Full CRUD operations for recipes (create, read, update, delete), including title, ingredients, instructions, and an optional image.
- **Recipe Publication:** Each recipe has an `is_published` flag. Unpublished recipes are private to the author; published ones are accessible via the public API.
- **Categories:** Static list of categories (tags) to organize recipes. Recipes can be assigned to multiple categories.
- **Favorites:** Users can mark recipes as favorites. The API tracks favorites per user.
- **Comments:** Users can add comments to recipes. Each comment links to a recipe and its author.
- **Image Uploads:** Recipe images can be uploaded via the `/api/upload-image` endpoint. We use **Multer** middleware for handling `multipart/form-data` uploads.
- **Middleware:** Reusable Express middleware handles JWT authentication and other tasks.
- **Project Structure:** Cleanly organized folders (`routes`, `db`, `middleware`, `__tests__`, etc.) for maintainability.
- **Static Files:** Uploaded images are served statically (e.g. at `http://localhost:5000/uploads/<filename>`).
- **Testing:** Comprehensive unit and integration tests with **Jest** and **SuperTest**
ensure code correctness. (Tests cover success/error cases, validations, auth, and database interactions.)
- **Environment Configuration:** Uses a `.env` file (via `dotenv`) for configuration. An `example.env` template is provided.
- **Documentation:** Source code is documented with JSDoc. Static API documentation can be generated and served (see *Documentation Generation* below).

---

## 📂 Folder Structure
The repository is organized as follows (key folders/files highlighted):

```bash
📦 intranet-kochbuch-backend/
├──📁 coverage/                  # Jest coverage report (ignored in Git)
├──📁 node_modules/              # (ignored in Git)
├──📁 docs/                      # (Documentation resources like ER diagrams, screenshots, and generated JSDoc files.
│   └──📁 screenshots/
│   └──📁 jsdoc/                        
├──📁 sql/
│   └──📄 user_recipe.sql        # SQL schema or seed data
├──📁 src/
│   ├──📁 __tests__/             # All test suites
│   │   ├──📄 app.test.js
│   │   ├──📄 auth.test.js
│   │   ├──📄 authRoutes.test.js
│   │   ├──📄 categoryRoutes.test.js
│   │   ├──📄 commentRoutes.test.js
│   │   ├──📄 favoriteRoutes.test.js
│   │   ├──📄 init.test.js
│   │   ├──📄 profileRoutes.test.js
│   │   ├──📄 recipeRoutes.test.js
│   │   └──📄 uploadRoutes.test.js
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
├──📄 jest.config.js             # Jest configuration
├──📄 package-lock.json
├──📄 package.json               # NPM scripts & dependencies
├──📄 .gitignore                 # Ignored files and folders
├──📄 README.md                  # This file
├──📄 jsdoc.json                 # JSDoc for documenting src files
└──📄 jsdoc.tests.json           # JSDoc for documenting test files

```

The project code is divided by feature. For example, each route module in `src/routes/` handles a specific API endpoint group, and middleware is used for common tasks like authentication. The `docs/screenshots/` directory contains the Entity-Relationship Diagrams (ERDs) for the database schema.

---

## 🛠️ Installation & Setup (No Docker)

### ✅ Prerequisites

- **Node.js:** version **v22.14.0** (current LTS, released Feb 2025).
- **MySQL:** A running MySQL server (local or remote).
- (Optional) **npm:** Comes with Node.js for package management.
- Ensure you have write permissions for the `uploads/` directory (image storage).

### 📦 Install Dependencies
1.Clone the repository.

2.Install Node packages:
```bash
npm install
```

### ⚙️ Configure Environment
1. Copy the example environment file:
   ```bash
   cp example.env .env
   ```
2. Open `.env` and fill in your configuration:

| Variable     | Description                                  |
|--------------|----------------------------------------------|
| `PORT`       | Port on which the server runs (e.g. 5000)    |
| `DB_HOST`    | MySQL host (e.g. `localhost`)                |
| `DB_USER`    | MySQL username                               |
| `DB_PASS`    | MySQL password                               |
| `DB_NAME`    | MySQL database name                          |
| `JWT_SECRET` | Secret key to sign and verify JWT tokens     |

### 🧱 Initialize the Database
1. Create the MySQL database (if not already). Example:

```sql
CREATE DATABASE your_db_name
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```
2. Provide those credentials in `.env` (see variables above). The application’s `src/db/init.js` will automatically create the required tables (`user`, `recipe`, `category`, etc.) on server startup if they do not exist. You can also inspect `sql/user_recipe.sql` for reference schema or initial data.

### 🚀 Run the Server
- **Development mode** (auto-restarts on file changes with `nodemon`):
```bash
 npm run dev 
 ```
- **Production mode:**
```bash
npm start
```
By default, the API listens at:`http://localhost:5000` (or your specified `PORT`). Visit `http://localhost:<PORT>/` to see a basic health-check response, and `http://localhost:<PORT>/coverage/` (once tests have run) to view coverage details.

---
## 🗃️ Entity-Relationship Diagram (ERD)

The `docs/screenshots/ERD.png` file illustrates the database schema: tables (`user`, `recipe`, `category`, `recipe_category`, `comment`, `favorite`) and their relationships (e.g. foreign keys linking `recipe.user_id` to `user.id`, and join table `recipe_category` for many-to-many tags). Refer to the `docs/screenshots` folder for this diagram.

![ERD](./docs/screenshots/ERD.png)

---
## 📸 Screenshots Diagram

![ERD2](./docs/screenshots/ERD2.png)

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

- `POST /api/register` – Register a new user. Expects `{ email, password, display_name }`.
- `POST /api/login` – Authenticate and receive a JWT token.

### User Profile (Protected)

- `GET /api/profile` – Get current user profile (requires valid JWT).
- `PUT /api/profile` – Update profile (display name, avatar URL).

### Recipes

- `POST /api/recipes` – Create a new recipe (JWT required). Body includes title, ingredients, instructions, (optional) `image_url`, etc.
- `GET /api/recipes` – Get all recipes belonging to the logged-in user (JWT required).
- `GET /api/recipes/:id` – Get a specific recipe by ID (own recipes).
- `PUT /api/recipes/:id` – Update a recipe by ID (JWT required; only owner can update).
- `DELETE /api/recipes/:id` – Delete a recipe by ID (JWT required; only owner).
- `PUT /api/recipes/:id/publish` – Mark a recipe as published (JWT required).
- `PUT /api/recipes/:id/unpublish` – Mark as unpublished (JWT required).

### Public Recipes

- `GET /api/public-recipes` – List all recipes with `is_published = true`.
- `GET /api/public-recipes/:id` – Get details of a single published recipe.

### Comments

- `POST /api/comments/:recipeId` – Add a comment to a published recipe (JWT required).
- `GET /api/comments/:recipeId` – Retrieve comments for a recipe.
- `DELETE /api/comments/:commentId` – Delete a comment (JWT required; users can delete their own comments).

### Favorites

- `POST /api/favorites/:recipeId` – Mark a recipe as favorite (JWT required).
- `GET /api/favorites` – List all favorite recipes of the user (JWT required).
- `DELETE /api/favorites/:recipeId` – Remove a recipe from favorites (JWT required).

### Categories

- `GET /api/categories` –  Get all available categories (tags).

### File Upload

- `POST /api/upload-image` – Upload an image file (multipart/form-data). Field name: `image`. Returns JSON with the file’s accessible URL.

---
## ❗ Error Handling
All error responses use the JSON format:

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
🧠 **Developer Notes**

- **Node Version:** Uses Node.js v22.x (LTS “Jod” as of 2025). Any recent LTS version should work.
- **Environment:** All configurations are via environment variables. Never commit real credentials to `.env`.
- **Database:** MySQL must be accessible with credentials from `.env`. Tables are created on startup by `src/db/init.js`.
- **Uploads:** The `uploads/` directory must be writable by the server. Uploaded images can be accessed via URLs like `http://localhost:5000/uploads/<filename>`.
- **Testing:** Run `npm test` to execute Jest tests. Coverage reports are available under `coverage/` or via `http://localhost:5000/coverage/`.
- **Documentation:** API docs are in code comments (JSDoc). After `npm run doc`, browse to `/docs/jsdoc/` for generated documentation.
- **Error Logging:** Server logs to console. For production, consider integrating a logging service or rotating logs.
- **Dependencies:** Key packages include:
  - **express:** Web framework.
  - **mysql2:** MySQL driver for Node.js.
  - **bcrypt:** Password hashing.
  - **jsonwebtoken:** JWT generation/verification.
  - **multer:** File upload middleware.
  - **jest** and **supertest:** Testing frameworks.
- **Timezones:** All timestamps are in UTC.


---

### 📤 Upload Image
```http
POST /api/upload-image
Content-Type: multipart/form-data
Form field: image
```
Response:
```json
{ "imageUrl": "http://localhost:5000/uploads/filename.png" }
```

This endpoint uses Multer to save the image to `uploads/` and returns the accessible URL. More details on endpoints can be found in the route files under `src/routes/`.

---

## 📸 Screenshots

Example outputs from real API endpoints:

- 🔍 `GET /api/public-recipes` – list of public recipes  
  ![Public Recipes JSON](./docs/screenshots/public-recipes-json.png)

---



# 🧪 API Backend Tests – Intranet-Kochbuch

This project includes comprehensive unit and integration tests for the backend API of the Intranet-Kochbuch system. All routes and core logic have been thoroughly tested.

---

## 📁 Test Structure

- All tests live in `src/__tests__/`, organized by feature (each route file has corresponding tests).
- Tests simulate HTTP requests to the Express app (without starting a live server) and assert on the JSON responses and status codes.
- Example: `authRoutes.test.js` checks user registration/login; `recipeRoutes.test.js` covers creating, updating, deleting recipes.

---

## ✅ Tested Routes

### 🔐 Authentication (src/routes/authRoutes.js)
- `POST /register` – Registers a new user, checks for duplicate emails
- `POST /login` – Authenticates user
- `GET /protected` – Protected route using JWT middleware

### 🍽️ Recipes (src/routes/recipeRoutes.js)
- `GET /public-recipes` – Fetches all public recipes
- `GET /recipes` – Fetches user's private recipes
- `POST /recipes` – Creates a new recipe
- `PUT /recipes/:id` – Updates an existing recipe
- `DELETE /recipes/:id` – Deletes a recipe

### 💬 Comments (src/routes/commentRoutes.js)
- `POST /comments/:recipeId` – Adds a comment to a recipe
- `GET /comments/:recipeId` – Retrieves comments for a recipe
- `DELETE /comments/:commentId` – Deletes a user’s comment

### ⭐ Favorites (src/routes/favoriteRoutes.js)
- `POST /favorites/:recipeId` – Adds a recipe to favorites
- `GET /favorites` – Retrieves all favorite recipes
- `DELETE /favorites/:recipeId` – Removes a recipe from favorites

### 📂 Categories (src/routes/categoryRoutes.js)
- `GET /categories` – Retrieves all available categories

### 👤 Profile (src/routes/profileRoutes.js)
- `GET /profile` – Retrieves user profile
- `PUT /profile` – Updates user profile

### 🖼️ Uploads (src/routes/uploadRoutes.js)
- `POST /upload-image` – Uploads a single image and returns its URL

### 🔧 App Initialization (app.js)
- Verifies that `initDatabase()` is called
- `GET /` – Base health check route
- Verifies route availability for `/api/public-recipes` and `/api/categories`

---

## 🧪 What Was Tested

| Aspect              | Description                                 |
|---------------------|---------------------------------------------|
| Validation          | Empty fields, required fields               |
| Success cases       | Correct responses and data creation         |
| Error handling      | Graceful fallback for DB or logic failures  |
| Authentication      | JWT token verification for protected routes |
| Integration         | Middleware, routing, DB interaction mocks   |
| File upload         | Proper handling of image upload requests    |
  
- Tests ensure that the backend behaves as expected under both normal and edge cases, catching regressions early.
---

## 🛠️ Tools & Frameworks

- **Node.js (v22 LTS)** – JavaScript runtime.
- **Express.js** – Minimal web framework.
- **MySQL** – Relational database (via `mysql2`).
- **Jest** – Testing framework for Node.js.
- **SuperTest** – Library for HTTP assertions on Express apps.
- **babel-jest** / ESM – For modern JavaScript module support in tests.

---

## ▶️ Running the Tests
Execute the full test suite with coverage:
```bash
npm test
```
The command runs Jest and outputs results in the console. To open the coverage report:
```bash
npm test -- --coverage
```
- Then view the HTML report at `coverage/lcov-report/index.html` or visit `http://localhost:5000/coverage/` (if the server is running and serving that directory).
---

## 📊 Test Coverage Report

The project uses Jest with built-in code coverage tracking (`--coverage`). This helps visualize which parts of the backend codebase are fully tested and where improvements are needed.

### 🔎 Test Coverage Report

Current coverage statistics (via Jest’s built-in reporting):

| Metric       | Value     |
|--------------|-----------|
| Statements   | **81.04%** |
| Branches     | **78.12%** |
| Functions    | **84%**    |
| Lines        | **81.27%** |

You can view the live report by running:

```bash
npm test
```
---
Then open this file in your browser:

```bash
/coverage/lcov-report/index.html
```
Or, with the server running at http://localhost:5000:

```bash
http://localhost:5000/coverage/
```

## 🖼️ Screenshots

🔹 Overall Coverage Summary
![All-files](./docs/screenshots/All-files.png)
🔹 Routes Breakdown
![All-files-routes](./docs/screenshots/All-files-routes.png)
🔹 CLI Report Snapshot
![CLI](./docs/screenshots/all-tests.png)

✅ Most routes reach 100% coverage.

📉 Some uncovered branches still exist in complex routes like recipeRoutes.js — these are marked for future enhancement.
---

## 📄 Documentation Generation

### 1. Main Source Code Documentation

Configuration file: `jsdoc.json`

```json
{
  "tags": {
    "allowUnknownTags": true
  },
  "source": {
    "include": ["src", "app.js", "server.js"],
    "includePattern": ".js$",
    "excludePattern": "(node_modules/|docs)"
  },
  "opts": {
    "destination": "./docs/jsdoc",
    "recurse": true
  },
  "plugins": ["plugins/markdown"]
}
```

Run the command to generate documentation:

```bash
npm run doc
```

📂 Accessible at:
```
http://localhost:5000/docs/jsdoc/index.html
```

🖼️ Screenshots *![jsdoc](./docs/screenshots/jsdoc.png)*

---

### 2. Test Files Documentation

Configuration file: `jsdoc.tests.json`

```json
{
  "tags": {
    "allowUnknownTags": true
  },
  "source": {
    "include": ["src/__tests__"],
    "includePattern": ".js$"
  },
  "opts": {
    "destination": "./docs/tests-docs",
    "recurse": true
  },
  "plugins": ["plugins/markdown"]
}
```

Run the command to generate test documentation:

```bash
npm run doc:tests
```

📂 Accessible at:
```
http://localhost:5000/docs/tests-docs/index.html
```

🖼️ Screenshots *![jsdoc-tests](./docs/screenshots/jsdoc-tests.png)* 

---

## ⚙️ Required Modifications

### `app.js`

Ensure the documentation folders are served statically:

```js
app.use('/docs', express.static(path.join(__dirname, 'docs')));
app.use('/docs/tests-docs', express.static(path.join(__dirname, 'docs/tests-docs')));
```

### `package.json`

Add the documentation scripts:

```json
"scripts": {
  ...
  "doc": "jsdoc -c jsdoc.json",
  "doc:tests": "jsdoc -c jsdoc.tests.json"
}
```

---

## 📄 License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute the code with attribution.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m "Add feature ..."`
4. Push to your fork: `git push origin feature/your-feature`.
5. Open a Pull Request for review.

Please follow consistent coding style, include tests for new features, and update documentation as needed. Report issues via the GitHub issue tracker.

---

© 2025 Feras Alshaekh Ebraheem — All rights reserved.
