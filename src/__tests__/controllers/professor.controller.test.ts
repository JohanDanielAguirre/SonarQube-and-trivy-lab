import { jest } from '@jest/globals';

beforeEach(() => jest.resetModules());

describe('Professor Controller', () => {
  test('createProfessor - returns 201 with created object', async () => {
    const mockCreate: any = jest.fn();
    mockCreate.mockResolvedValue({ id: 'p1', name: 'Prof' });
    jest.doMock('../../models/professor.model', () => ({ ProfessorModel: { create: mockCreate } }));

    const { createProfessor } = await import('../../controllers/professor.controller');
    const req: any = { body: { name: 'Prof', university: 'u1' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await createProfessor(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'p1', name: 'Prof' });
  });

  test('get/list/update/delete - various branches', async () => {
    const findMock: any = jest.fn((filter: any) => {
      const pop: any = jest.fn(() => {
        const s: any = jest.fn();
        s.mockResolvedValue([{ id: 'p1' }]);
        return { sort: s };
      });
      return { populate: pop };
    });
    const findByIdMock: any = jest.fn((id: string) => {
      const pop: any = jest.fn(() => {
        return Promise.resolve(id === 'exists' ? { id: 'exists' } : null);
      });
      return { populate: pop };
    });
    const findByIdAndUpdate: any = jest.fn((id: string) => id === 'u' ? { id: 'u', name: 'x' } : null);
    const findByIdAndDelete: any = jest.fn((id: string) => id === 'del' ? { id: 'del' } : null);

    jest.doMock('../../models/professor.model', () => ({
      ProfessorModel: { find: findMock, findById: findByIdMock, findByIdAndUpdate, findByIdAndDelete }
    }));

  const { listProfessors, getProfessor, updateProfessor, deleteProfessor } = await import('../../controllers/professor.controller');

    const resList: any = { json: jest.fn() };
    await listProfessors({ query: {} } as any, resList as any);
    expect(resList.json).toHaveBeenCalledWith([{ id: 'p1' }]);

    const res404: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getProfessor({ params: { id: 'no' } } as any, res404 as any);
    expect(res404.status).toHaveBeenCalledWith(404);

    const resOk: any = { json: jest.fn() };
    await getProfessor({ params: { id: 'exists' } } as any, resOk as any);
    expect(resOk.json).toHaveBeenCalledWith({ id: 'exists' });

    const resUpd404: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateProfessor({ params: { id: 'no' }, body: {} } as any, resUpd404 as any);
    expect(resUpd404.status).toHaveBeenCalledWith(404);

    const resUpdOk: any = { json: jest.fn() };
    await updateProfessor({ params: { id: 'u' }, body: { name: 'x' } } as any, resUpdOk as any);
    expect(resUpdOk.json).toHaveBeenCalledWith({ id: 'u', name: 'x' });

    const resDel404: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await deleteProfessor({ params: { id: 'no' } } as any, resDel404 as any);
    expect(resDel404.status).toHaveBeenCalledWith(404);

    const resDelOk: any = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    await deleteProfessor({ params: { id: 'del' } } as any, resDelOk as any);
    expect(resDelOk.status).toHaveBeenCalledWith(204);
  });
});
