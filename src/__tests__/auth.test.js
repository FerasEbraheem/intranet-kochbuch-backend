import { jest } from '@jest/globals';


const fakeVerify = jest.fn();
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: fakeVerify }
}));


const authModule = await import('../middleware/auth.js');
const auth = authModule.default;

describe('JWT Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    fakeVerify.mockReset(); 
  });

  test('should return 401 if no Authorization header', () => {
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if header does not start with Bearer', () => {
    req.headers.authorization = 'Token xyz123';
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 403 if token is invalid', () => {
    req.headers.authorization = 'Bearer invalidtoken';
    fakeVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next() if token is valid', () => {
    req.headers.authorization = 'Bearer validtoken';
    const userPayload = { id: 1, username: 'feras' };
    fakeVerify.mockReturnValue(userPayload);

    auth(req, res, next);
    expect(req.user).toEqual(userPayload);
    expect(next).toHaveBeenCalled();
  });
});
