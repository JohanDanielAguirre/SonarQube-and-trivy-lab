import { jest } from '@jest/globals';

beforeEach(() => jest.resetModules());

describe('University Controller', () => {
  test('list/get/create/update/delete branches', async () => {
    const findMock: any = jest.fn(() => {
      const s: any = jest.fn();
      s.mockResolvedValue([{ id: 'u1' }]);
      return { sort: s };
    });
    const findByIdMock: any = jest.fn((id: string) => {
      return id === 'ok' ? { id: 'ok' } : null;
    });
    const createMock: any = jest.fn();
    createMock.mockResolvedValue({ id: 'new' });
    const findByIdAndUpdate: any = jest.fn((id: string) => id === 'ok' ? { id: 'ok', name: 'n' } : null);
    const findByIdAndDelete: any = jest.fn((id: string) => id === 'ok' ? { id: 'ok' } : null);

    jest.doMock('../../models/university.model', () => ({ UniversityModel: { find: findMock, findById: findByIdMock, create: createMock, findByIdAndUpdate, findByIdAndDelete } }));

    const { listUniversities, getUniversity, createUniversity, updateUniversity, deleteUniversity } = await import('../../controllers/university.controller');

    const resList: any = { json: jest.fn() };
    await listUniversities({} as any, resList as any);
    expect(resList.json).toHaveBeenCalledWith([{ id: 'u1' }]);

    const resGet404: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getUniversity({ params: { id: 'no' } } as any, resGet404 as any);
    expect(resGet404.status).toHaveBeenCalledWith(404);

    const resGetOk: any = { json: jest.fn() };
    await getUniversity({ params: { id: 'ok' } } as any, resGetOk as any);
    expect(resGetOk.json).toHaveBeenCalledWith({ id: 'ok' });

    const resCreate: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await createUniversity({ body: { name: 'X' } } as any, resCreate as any);
    expect(resCreate.status).toHaveBeenCalledWith(201);

    const resUpd404: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateUniversity({ params: { id: 'no' }, body: {} } as any, resUpd404 as any);
    expect(resUpd404.status).toHaveBeenCalledWith(404);

    const resUpdOk: any = { json: jest.fn() };
    await updateUniversity({ params: { id: 'ok' }, body: { name: 'n' } } as any, resUpdOk as any);
    expect(resUpdOk.json).toHaveBeenCalledWith({ id: 'ok', name: 'n' });

    const resDel404: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await deleteUniversity({ params: { id: 'no' } } as any, resDel404 as any);
    expect(resDel404.status).toHaveBeenCalledWith(404);

    const resDelOk: any = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    await deleteUniversity({ params: { id: 'ok' } } as any, resDelOk as any);
    expect(resDelOk.status).toHaveBeenCalledWith(204);
  });
});
