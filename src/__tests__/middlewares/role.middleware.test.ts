import { jest } from '@jest/globals';

import { requireRole, ownerOrAdmin } from '../../middlewares/role.middleware';

describe('role.middleware', () => {
  test('requireRole - unauthenticated and forbidden and allowed', () => {
    const handler = requireRole('superadmin');
    const next = jest.fn();
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    handler({} as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);

    handler({ user: { role: 'user' } } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(403);

    handler({ user: { role: 'superadmin' } } as any, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('ownerOrAdmin - allows owner or admin', () => {
    const getOwner = (req: any) => req.params?.ownerId;
    const handler = ownerOrAdmin(getOwner);
    const next = jest.fn();
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    handler({} as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);

    handler({ user: { role: 'user', sub: 'u' }, params: { ownerId: 'other' } } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(403);

    handler({ user: { role: 'superadmin' }, params: { ownerId: 'x' } } as any, res, next);
    expect(next).toHaveBeenCalled();

    handler({ user: { role: 'user', sub: 'u' }, params: { ownerId: 'u' } } as any, res, next);
    expect(next).toHaveBeenCalled();
  });
});
