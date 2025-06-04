// commentRoutes.test.js
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockExecute = jest.fn();
const mockEnd = jest.fn();
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute,
  end: mockEnd
});

const fakeAuth = (req, res, next) => {
  req.user = { id: 1 };
  next();
};

jest.unstable_mockModule('../db/db.js', () => ({
  getConnection: mockGetConnection
}));

jest.unstable_mockModule('../middleware/auth.js', () => ({
  default: fakeAuth
}));

const commentRoutesModule = await import('../routes/commentRoutes.js');
const commentRoutes = commentRoutesModule.default;

const app = express();
app.use(express.json());
app.use(commentRoutes);

describe('POST /comments/:recipeId', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should return 400 if comment is empty', async () => {
    const res = await request(app)
      .post('/comments/1')
      .send({ text: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('should save comment and return 201', async () => {
    mockExecute.mockResolvedValueOnce();

    const res = await request(app)
      .post('/comments/1')
      .send({ text: 'Nice recipe!' });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('Kommentar gespeichert');
  });
});

describe('GET /comments/:recipeId', () => {
  test('should return comments with 200', async () => {
    const fakeComments = [[
      { id: 1, user_id: 1, text: 'Nice', display_name: 'Feras', email: 'feras@example.com' }
    ]];
    mockExecute.mockResolvedValueOnce(fakeComments);

    const res = await request(app).get('/comments/1');

    expect(res.status).toBe(200);
    expect(res.body.comments).toBeDefined();
    expect(res.body.comments.length).toBe(1);
  });

  test('should handle DB errors', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/comments/1');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});

describe('DELETE /comments/:commentId', () => {
  test('should delete comment if found', async () => {
    const delResult = [{ affectedRows: 1 }];
    mockExecute.mockResolvedValueOnce(delResult);

    const res = await request(app).delete('/comments/10');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Kommentar gelöscht');
  });

  test('should return 403 if user not authorized or comment not found', async () => {
    const delResult = [{ affectedRows: 0 }];
    mockExecute.mockResolvedValueOnce(delResult);

    const res = await request(app).delete('/comments/99');
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Keine Berechtigung');
  });
});
