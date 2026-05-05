import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should login an existing user', async () => {
    // First register
    await request(app).post('/api/user/register').send({
      email: 'testlogin@example.com',
      password: 'password123',
    });

    const res = await request(app)
      .post('/api/user/login')
      .send({
        email: 'testlogin@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});
