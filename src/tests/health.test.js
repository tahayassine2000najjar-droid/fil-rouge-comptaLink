import request from 'supertest';
import { app } from '../server.js';
import mongoose from 'mongoose';

describe('Integration Test: API Health', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('service', 'ComptaLink API');
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});
