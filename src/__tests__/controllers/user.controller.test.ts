import { jest } from '@jest/globals';

beforeEach(() => jest.resetModules());

describe('User Controller', () => {
  test('myProfile - 404 when not found, 200 when found', async () => {
    const mockFindById: any = jest.fn((id: string) => {
      const sel: any = jest.fn();
      sel.mockResolvedValue(id === 'u1' ? { id: 'u1', name: 'A' } : null);
      return { select: sel };
    });
    jest.doMock('../../models/user.model', () => ({ UserModel: { findById: mockFindById } }));

    const { myProfile } = await import('../../controllers/user.controller');

    const res404: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await myProfile({ user: { sub: 'no' } } as any, res404 as any);
    expect(res404.status).toHaveBeenCalledWith(404);

    const resOk: any = { json: jest.fn() };
    await myProfile({ user: { sub: 'u1' } } as any, resOk as any);
    expect(resOk.json).toHaveBeenCalledWith({ id: 'u1', name: 'A' });
  });

  test('updateUser - returns 404 when missing, 400 on duplicate email, and success updates', async () => {
    const mockFindByIdAndUpdate: any = jest.fn((id: string) => {
      const sel: any = jest.fn();
      sel.mockResolvedValue(id === 'u2' ? { id: 'u2', name: 'New' } : null);
      return { select: sel };
    });

    // 404 scenario
    jest.resetModules();
    const mock404: any = jest.fn((id: string) => {
      const sel: any = jest.fn();
      sel.mockResolvedValue(null);
      return { select: sel };
    });
    jest.doMock('../../models/user.model', () => ({ UserModel: { findByIdAndUpdate: mock404 } }));
    {
      const { updateUser } = await import('../../controllers/user.controller');
      const res404: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await updateUser({ params: { id: 'x' }, body: {} } as any, res404 as any);
      expect(res404.status).toHaveBeenCalledWith(404);
    }

    // simulate duplicate key error
    jest.resetModules();
    const mockFindByIdAndUpdate2: any = jest.fn().mockImplementation(() => { throw { code: 11000, keyPattern: { email: 1 } }; });
    jest.doMock('../../models/user.model', () => ({ UserModel: { findByIdAndUpdate: mockFindByIdAndUpdate2 } }));
    {
      const { updateUser: updateUser2 } = await import('../../controllers/user.controller');
      const res400: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await updateUser2({ params: { id: 'y' }, body: { password: 'p' } } as any, res400 as any);
      expect(res400.status).toHaveBeenCalledWith(400);
    }

    // success path
    jest.resetModules();
    jest.doMock('../../models/user.model', () => ({ UserModel: { findByIdAndUpdate: mockFindByIdAndUpdate } }));
    {
      const { updateUser: updateUser3 } = await import('../../controllers/user.controller');
      const resOk: any = { json: jest.fn() };
      await updateUser3({ params: { id: 'u2' }, body: { name: 'New' } } as any, resOk as any);
      expect(resOk.json).toHaveBeenCalledWith({ id: 'u2', name: 'New' });
    }
  });

  // --- additional tests merged from user.controller.extra.test.ts ---
  test('listUsers - no filters returns paginated response', async () => {
    const mockCount: any = jest.fn();
    mockCount.mockResolvedValue(2);

    const lm: any = jest.fn(); lm.mockResolvedValue([{ id: 'u1' }]);
    const skip: any = jest.fn(() => ({ limit: lm }));
    const sort: any = jest.fn(() => ({ skip }));
    const select: any = jest.fn(() => ({ sort }));
    const find: any = jest.fn(() => ({ select }));

    jest.doMock('../../models/user.model', () => ({ UserModel: { countDocuments: mockCount, find } }));
    const { listUsers } = await import('../../controllers/user.controller');

    const req: any = { query: {} };
    const res: any = { json: jest.fn() };
    await listUsers(req, res);

    expect(mockCount).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalled();
  });

  test('listUsers - with q and role filters', async () => {
    const mockCount: any = jest.fn();
    mockCount.mockResolvedValue(1);

    const lm: any = jest.fn(); lm.mockResolvedValue([{ id: 'u2' }]);
    const skip: any = jest.fn(() => ({ limit: lm }));
    const sort: any = jest.fn(() => ({ skip }));
    const select: any = jest.fn(() => ({ sort }));
    const find: any = jest.fn((filter: any) => ({ select }));

    jest.doMock('../../models/user.model', () => ({ UserModel: { countDocuments: mockCount, find } }));
    const { listUsers } = await import('../../controllers/user.controller');

    const req: any = { query: { q: 'x', role: 'superadmin', page: '1', limit: '10' } };
    const res: any = { json: jest.fn() };
    await listUsers(req, res);

    expect(mockCount).toHaveBeenCalledWith(expect.any(Object));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Array), total: 1 }));
  });

  test('deleteUser - 404 and 204', async () => {
    const mockFindByIdAndDelete: any = jest.fn((id: string) => id === 'ok' ? { id: 'ok' } : null);
    jest.doMock('../../models/user.model', () => ({ UserModel: { findByIdAndDelete: mockFindByIdAndDelete } }));
    const { deleteUser } = await import('../../controllers/user.controller');

    const res404: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await deleteUser({ params: { id: 'no' } } as any, res404 as any);
    expect(res404.status).toHaveBeenCalledWith(404);

    const resOk: any = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    await deleteUser({ params: { id: 'ok' } } as any, resOk as any);
    expect(resOk.status).toHaveBeenCalledWith(204);
  });
});
