import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';

describe('validate.middleware', () => {
  test('returns 400 on schema errors and calls next on success', () => {
    const schema = z.object({ a: z.string() });
    const handler = validate(schema, 'body');
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();

    handler({ body: { a: 1 } } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    handler({ body: { a: 'ok' } } as any, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('validates params and updates request', () => {
    const schema = z.object({ id: z.string() });
    const handler = validate(schema, 'params');
    const req: any = { params: { id: 'test123' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    handler(req, res, next);
    expect(req.params).toEqual({ id: 'test123' });
    expect(next).toHaveBeenCalled();
  });

  test('validates query and sets validatedQuery', () => {
    const schema = z.object({ search: z.string() });
    const handler = validate(schema, 'query');
    const req: any = { query: { search: 'test' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    handler(req, res, next);
    expect(req.validatedQuery).toEqual({ search: 'test' });
    expect(next).toHaveBeenCalled();
  });

  test('defaults to body validation when where parameter not provided', () => {
    const schema = z.object({ name: z.string() });
    const handler = validate(schema); // Sin especificar 'where'
    const req: any = { body: { name: 'test' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    handler(req, res, next);
    expect(req.body).toEqual({ name: 'test' });
    expect(next).toHaveBeenCalled();
  });
});
