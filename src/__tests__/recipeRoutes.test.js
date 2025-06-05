// ===========================
// src/__tests__/recipeRoutes.test.js
// ===========================

/**
 * @file __tests__/recipeRoutes.test.js
 * @description Unit and integration tests for recipe-related routes:
 * GET, POST, PUT, DELETE for both public and user-specific recipes.
 */

import { jest } from '@jest/globals'; // Import jest for mocking
import request from 'supertest'; // Import supertest for HTTP assertions
import express from 'express'; // Import express to create test app

// ===========================
// Mocks & Setup
// ===========================

const mockExecute = jest.fn(); // Mock for database execute function
const mockEnd = jest.fn(); // Mock for database end function
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute, // Inject mockExecute into DB connection
  end: mockEnd // Inject mockEnd into DB connection
});

/**
 * Fake authentication middleware for protected route simulation.
 * Assigns a mock user to req.user.
 */
function fakeAuth(req, res, next) {
  req.user = { id: 1 }; // Simulate authenticated user
  next(); // Proceed to next middleware/route
}

let app; // Declare app to be initialized later

beforeAll(async () => {
  // Mock external modules before importing routes
  jest.unstable_mockModule('../db/db.js', () => ({
    getConnection: mockGetConnection // Override DB module with mock
  }));

  jest.unstable_mockModule('../middleware/auth.js', () => ({
    default: fakeAuth // Override auth middleware with fakeAuth
  }));

  const recipeRoutesModule = await import('../routes/recipeRoutes.js'); // Dynamic import after mocks
  const recipeRoutes = recipeRoutesModule.default; // Extract router

  app = express(); // Initialize express app
  app.use(express.json()); // Enable JSON body parsing
  app.use(recipeRoutes); // Use recipe routes
});

beforeEach(() => {
  jest.clearAllMocks(); // Reset all mocks before each test
});

// ===========================
// Public Route Tests
// ===========================

/**
 * Tests for public route: GET /public-recipes
 */
describe('GET /public-recipes', () => {
  test('should return public recipes with status 200', async () => {
    const fakeData = [[{
      id: 1,
      title: 'Test Recipe',
      ingredients: 'Eggs, Cheese',
      instructions: 'Mix and bake',
      image_url: null,
      user_id: 1,
      display_name: 'Feras',
      email: 'feras@example.com',
      categories: 'Breakfast,Dessert'
    }]];
    mockExecute.mockResolvedValueOnce(fakeData); // Mock DB response

    const res = await request(app).get('/public-recipes'); // Make GET request

    expect(res.status).toBe(200); // Expect HTTP 200
    expect(res.body.recipes).toBeDefined(); // Recipes should exist
    expect(res.body.recipes.length).toBe(1); // One recipe returned
  });

  test('should handle database errors gracefully', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error')); // Simulate DB failure
    const res = await request(app).get('/public-recipes'); // Make GET request
    expect(res.status).toBe(500); // Expect HTTP 500
    expect(res.body.error).toBe('Interner Serverfehler.'); // Error message
  });
});

// ===========================
// Authenticated Route Tests
// ===========================

/**
 * Tests for authenticated route: GET /recipes
 */
describe('GET /recipes', () => {
  test('should return user recipes', async () => {
    const fakeRecipes = [[{
      id: 1, title: 'My Recipe', ingredients: 'Eggs', instructions: 'Mix', is_published: false
    }]];
    mockExecute.mockResolvedValueOnce(fakeRecipes); // Mock user recipe fetch

    const res = await request(app).get('/recipes'); // Make GET request

    expect(res.status).toBe(200); // Expect success
    expect(res.body.recipes.length).toBe(1); // One recipe returned
  });

  test('should handle DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error')); // Simulate DB failure
    const res = await request(app).get('/recipes'); // Make GET request
    expect(res.status).toBe(500); // Expect HTTP 500
  });
});

/**
 * Tests for POST /recipes
 */
describe('POST /recipes', () => {
  test('should create recipe and return ID', async () => {
    const insertResult = [{ insertId: 42 }]; // Simulate insert result
    mockExecute.mockResolvedValueOnce(insertResult); // First insert
    mockExecute.mockResolvedValue(); // Category insert

    const res = await request(app).post('/recipes').send({
      title: 'New', ingredients: 'Things', instructions: 'Cook them',
      image_url: null, categoryIds: [1, 2]
    });

    expect(res.status).toBe(201); // Expect created
    expect(res.body.recipeId).toBe(42); // Check returned ID
  });

  test('should return 400 if fields missing', async () => {
    const res = await request(app).post('/recipes').send({}); // Send empty body
    expect(res.status).toBe(400); // Expect bad request
  });
});

/**
 * Tests for PUT /recipes/:id
 */
describe('PUT /recipes/:id', () => {
  test('should update recipe if exists', async () => {
    const updateResult = [{ affectedRows: 1 }]; // Simulate update success
    mockExecute.mockResolvedValueOnce(updateResult); // Main update
    mockExecute.mockResolvedValue(); // Delete old categories
    mockExecute.mockResolvedValue(); // Insert new categories

    const res = await request(app).put('/recipes/1').send({
      title: 'Updated', ingredients: 'New', instructions: 'Steps',
      image_url: null, categoryIds: [1]
    });

    expect(res.status).toBe(200); // Expect success
  });

  test('should return 404 if not found', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]); // Simulate no match

    const res = await request(app).put('/recipes/999').send({
      title: 'X', ingredients: 'X', instructions: 'X'
    });

    expect(res.status).toBe(404); // Expect not found
  });
});

/**
 * Tests for DELETE /recipes/:id
 */
describe('DELETE /recipes/:id', () => {
  test('should delete recipe if found', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]); // Simulate delete success
    const res = await request(app).delete('/recipes/1'); // Make DELETE request
    expect(res.status).toBe(200); // Expect success
  });

  test('should return 404 if not found', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]); // Simulate no match
    const res = await request(app).delete('/recipes/999'); // Make DELETE request
    expect(res.status).toBe(404); // Expect not found
  });
});
