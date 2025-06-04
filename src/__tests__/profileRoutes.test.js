import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockExecute = jest.fn();
const mockEnd = jest.fn();
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute,
  end: mockEnd
});

const fakeAuth = (req, _res, next) => {
  req.user = { id: 1 };
  next();
};

jest.unstable_mockModule('../db/db.js', () => ({
  getConnection: mockGetConnection
}));

jest.unstable_mockModule('../middleware/auth.js', () => ({
  default: fakeAuth
}));

const profileRoutesModule = await import('../routes/profileRoutes.js');
const profileRoutes = profileRoutesModule.default;

const app = express();
app.use(express.json());
app.use(profileRoutes);

describe('GET /profile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should return profile data', async () => {
    const user = [{ id: 1, email: 'test@example.com', display_name: 'Test User', avatar_url: null }];
    mockExecute.mockResolvedValueOnce([user]);

    const res = await request(app).get('/profile');

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(user[0]);
  });

  test('should return 404 if user not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/profile');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Benutzer nicht gefunden');
  });

  test('should handle DB error on GET', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/profile');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Interner Serverfehler.');
  });
});

describe('PUT /profile', () => {
  test('should update profile successfully', async () => {
    mockExecute.mockResolvedValueOnce();

    const res = await request(app).put('/profile').send({
      display_name: 'Updated User',
      avatar_url: 'https://example.com/avatar.png'
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('aktualisiert');
  });

  test('should handle DB error on PUT', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).put('/profile').send({
      display_name: 'Failing User'
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Interner Serverfehler.');
  });
});
