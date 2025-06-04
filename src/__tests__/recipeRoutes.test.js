/**
 * @file __tests__/recipeRoutes.test.js
 * @description Unit and integration tests for recipe-related routes:
 * GET, POST, PUT, DELETE for both public and user-specific recipes.
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockExecute = jest.fn();
const mockEnd = jest.fn();
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute,
  end: mockEnd
});

/**
 * Fake authentication middleware for protected route simulation.
 * Assigns a mock user to req.user.
 */
function fakeAuth(req, res, next) {
  req.user = { id: 1 };
  next();
}

let app;

beforeAll(async () => {
  // Mock external modules
  jest.unstable_mockModule('../db/db.js', () => ({
    getConnection: mockGetConnection
  }));

  jest.unstable_mockModule('../middleware/auth.js', () => ({
    default: fakeAuth
  }));

  const recipeRoutesModule = await import('../routes/recipeRoutes.js');
  const recipeRoutes = recipeRoutesModule.default;

  app = express();
  app.use(express.json());
  app.use(recipeRoutes);
});

beforeEach(() => {
  jest.clearAllMocks();
});

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
    mockExecute.mockResolvedValueOnce(fakeData);

    const res = await request(app).get('/public-recipes');

    expect(res.status).toBe(200);
    expect(res.body.recipes).toBeDefined();
    expect(res.body.recipes.length).toBe(1);
  });

  test('should handle database errors gracefully', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/public-recipes');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Interner Serverfehler.');
  });
});

/**
 * Tests for authenticated route: GET /recipes
 */
describe('GET /recipes', () => {
  test('should return user recipes', async () => {
    const fakeRecipes = [[{
      id: 1, title: 'My Recipe', ingredients: 'Eggs', instructions: 'Mix', is_published: false
    }]];
    mockExecute.mockResolvedValueOnce(fakeRecipes);

    const res = await request(app).get('/recipes');

    expect(res.status).toBe(200);
    expect(res.body.recipes.length).toBe(1);
  });

  test('should handle DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/recipes');
    expect(res.status).toBe(500);
  });
});

/**
 * Tests for POST /recipes
 */
describe('POST /recipes', () => {
  test('should create recipe and return ID', async () => {
    const insertResult = [{ insertId: 42 }];
    mockExecute.mockResolvedValueOnce(insertResult);
    mockExecute.mockResolvedValue();

    const res = await request(app).post('/recipes').send({
      title: 'New', ingredients: 'Things', instructions: 'Cook them',
      image_url: null, categoryIds: [1, 2]
    });

    expect(res.status).toBe(201);
    expect(res.body.recipeId).toBe(42);
  });

  test('should return 400 if fields missing', async () => {
    const res = await request(app).post('/recipes').send({});
    expect(res.status).toBe(400);
  });
});

/**
 * Tests for PUT /recipes/:id
 */
describe('PUT /recipes/:id', () => {
  test('should update recipe if exists', async () => {
    const updateResult = [{ affectedRows: 1 }];
    mockExecute.mockResolvedValueOnce(updateResult);
    mockExecute.mockResolvedValue();
    mockExecute.mockResolvedValue();

    const res = await request(app).put('/recipes/1').send({
      title: 'Updated', ingredients: 'New', instructions: 'Steps',
      image_url: null, categoryIds: [1]
    });

    expect(res.status).toBe(200);
  });

  test('should return 404 if not found', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const res = await request(app).put('/recipes/999').send({
      title: 'X', ingredients: 'X', instructions: 'X'
    });

    expect(res.status).toBe(404);
  });
});

/**
 * Tests for DELETE /recipes/:id
 */
describe('DELETE /recipes/:id', () => {
  test('should delete recipe if found', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/recipes/1');
    expect(res.status).toBe(200);
  });

  test('should return 404 if not found', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).delete('/recipes/999');
    expect(res.status).toBe(404);
  });
});
