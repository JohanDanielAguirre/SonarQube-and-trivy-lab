import request from 'supertest';
import app from '../app';

describe('app routes', () => {

  test('404 handler for unknown route', async () => {
    const res = await request(app).get('/no-such-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Not Found');
  }, 10000);

  test('error handler handles thrown errors (mounted before 404)', async () => {
    // Re-import app with a mocked routes module that contains a throwing route
    jest.resetModules();
    const express = await import('express');
    const router = express.Router();
    router.get('/err-route', () => { throw new Error('boom'); });
    // mock the routes module so app mounts this router at /api
    jest.doMock('../routes', () => router);
    const { default: appWithMock } = await import('../app');

    const res = await request(appWithMock).get('/api/err-route');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message');
  }, 10000);
});
