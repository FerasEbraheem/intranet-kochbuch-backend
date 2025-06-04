import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockExecute = jest.fn();
const mockEnd = jest.fn();
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute,
  end: mockEnd
});

// Wir übergeben einen Fake-Benutzer, um die geschützten Routen zu testen
function fakeAuth(req, res, next) {
    req.user = { id: 1 };
    next();
}

let app;

beforeAll(async () => {
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

//
// ─── PUBLIC RECIPES ─────────────────────────────────────────────────────────────
//

describe('GET /public-recipes', () => {
  test('should return public recipes with status 200', async () => {
    const fakeData = [[
      {
        id: 1,
        title: 'Test Recipe',
        ingredients: 'Eggs, Cheese',
        instructions: 'Mix and bake',
        image_url: null,
        user_id: 1,
        display_name: 'Feras',
        email: 'feras@example.com',
        categories: 'Breakfast,Dessert'
      }
    ]];

    mockExecute.mockResolvedValueOnce(fakeData);

    const res = await request(app).get('/public-recipes');

    expect(res.status).toBe(200);
    expect(res.body.recipes).toBeDefined();
    expect(res.body.recipes.length).toBe(1);
    expect(mockGetConnection).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalled();
    expect(mockEnd).toHaveBeenCalled();
  });

  test('should handle database errors gracefully', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/public-recipes');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Interner Serverfehler.');
  });
});

//
// ─── PRIVATE ROUTES (AUTH REQUIRED) ────────────────────────────────────────────
//

describe('GET /recipes', () => {
  test('should return user recipes', async () => {
    const fakeRecipes = [[
      { id: 1, title: 'My Recipe', ingredients: 'Eggs', instructions: 'Mix', is_published: false }
    ]];
    mockExecute.mockResolvedValueOnce(fakeRecipes);

    const res = await request(app).get('/recipes');

    expect(res.status).toBe(200);
    expect(res.body.recipes).toBeDefined();
    expect(res.body.recipes.length).toBe(1);
  });

  test('should handle DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/recipes');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Interner Serverfehler.');
  });
});

describe('POST /recipes', () => {
  test('should create recipe and return ID', async () => {
    const insertResult = [{ insertId: 42 }];
    mockExecute.mockResolvedValueOnce(insertResult); // insert into recipe
    mockExecute.mockResolvedValue(); // insert into categories

    const payload = {
      title: 'New',
      ingredients: 'Things',
      instructions: 'Cook them',
      image_url: null,
      categoryIds: [1, 2]
    };

    const res = await request(app).post('/recipes').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.recipeId).toBe(42);
  });

  test('should return 400 if fields missing', async () => {
    const res = await request(app).post('/recipes').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe('PUT /recipes/:id', () => {
  test('should update recipe if exists', async () => {
    const updateResult = [{ affectedRows: 1 }];
    mockExecute.mockResolvedValueOnce(updateResult); // update
    mockExecute.mockResolvedValue(); // delete categories
    mockExecute.mockResolvedValue(); // insert categories

    const res = await request(app).put('/recipes/1').send({
      title: 'Updated',
      ingredients: 'New',
      instructions: 'Steps',
      image_url: null,
      categoryIds: [1]
    });

    expect(res.status).toBe(200);
  });

  test('should return 404 if not found', async () => {
    const updateResult = [{ affectedRows: 0 }];
    mockExecute.mockResolvedValueOnce(updateResult);

    const res = await request(app).put('/recipes/999').send({
      title: 'X',
      ingredients: 'X',
      instructions: 'X'
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('nicht gefunden');
  });
});

describe('DELETE /recipes/:id', () => {
  test('should delete recipe if found', async () => {
    const delResult = [{ affectedRows: 1 }];
    mockExecute.mockResolvedValueOnce(delResult);

    const res = await request(app).delete('/recipes/1');

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('erfolgreich');
  });

  test('should return 404 if not found', async () => {
    const delResult = [{ affectedRows: 0 }];
    mockExecute.mockResolvedValueOnce(delResult);

    const res = await request(app).delete('/recipes/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('nicht gefunden');
  });
});
