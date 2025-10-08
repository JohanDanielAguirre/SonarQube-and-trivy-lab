// src/__tests__/routes/auth.routes.test.ts
import authRouter from '../../routes/auth.routes';

describe('auth.routes', () => {
  it('exports an express router (has use or stack)', () => {
    expect(authRouter).toBeDefined();
    const hasUse = typeof (authRouter as any).use === 'function';
    const hasStack = Array.isArray((authRouter as any).stack);
    expect(hasUse || hasStack).toBe(true);
  });
});
