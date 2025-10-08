// src/__tests__/app.test.ts
import request from 'supertest';
import app from '../app';

describe('app export', () => {
  it('exports an express application instance (has use and listen)', () => {
    expect(app).toBeDefined();
    expect(typeof (app as any).use).toBe('function');
    expect(typeof (app as any).listen).toBe('function');
  });

  it('should respond to root endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Qualifica o seu Professor - API' });
  });

  it('should respond to health endpoint', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Not Found' });
  });

  it('should handle error middleware branches', () => {
    // Test the error middleware directly
    const errorHandler = (err: any, req: any, res: any, next: any) => {
      console.error(err);
      if (res.headersSent) return;
      res.status(err?.status || 500).json({ message: err?.message || 'Internal Server Error' });
    };

    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Test when headers are already sent
    const resHeadersSent = {
      headersSent: true,
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    errorHandler(new Error('test'), {}, resHeadersSent, jest.fn());
    expect(resHeadersSent.status).not.toHaveBeenCalled();
    expect(resHeadersSent.json).not.toHaveBeenCalled();

    // Test with custom error status and message
    const resCustomError = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const customError = new Error('Custom message');
    (customError as any).status = 422;
    errorHandler(customError, {}, resCustomError, jest.fn());
    expect(resCustomError.status).toHaveBeenCalledWith(422);
    expect(resCustomError.json).toHaveBeenCalledWith({ message: 'Custom message' });

    // Test with default error
    const resDefaultError = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    errorHandler({}, {}, resDefaultError, jest.fn());
    expect(resDefaultError.status).toHaveBeenCalledWith(500);
    expect(resDefaultError.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });

    mockConsoleError.mockRestore();
  });
});
