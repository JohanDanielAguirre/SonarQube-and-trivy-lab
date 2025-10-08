import { jest } from '@jest/globals';

beforeEach(() => jest.resetModules());

describe('Comment Controller', () => {
  test('createComment - returns 201 with populated comment when professor exists', async () => {
  const mockExists: any = jest.fn();
  mockExists.mockResolvedValue(true);
  const mockPopulate: any = jest.fn();
  mockPopulate.mockResolvedValue({ id: 'c1', content: 'ok' });
  const mockCreate: any = jest.fn();
  mockCreate.mockResolvedValue({ populate: mockPopulate });

    jest.doMock('../../models/professor.model', () => ({ ProfessorModel: { exists: mockExists } }));
    jest.doMock('../../models/comment.model', () => ({ CommentModel: { create: mockCreate } }));

    const { createComment } = await import('../../controllers/comment.controller');

    const req: any = { user: { sub: 'u1' }, body: { professor: 'p1', content: 'hello' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createComment(req, res);

    expect(mockExists).toHaveBeenCalledWith({ _id: 'p1' });
    expect(mockCreate).toHaveBeenCalledWith({ user: 'u1', professor: 'p1', content: 'hello' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'c1', content: 'ok' });
  });

  test('createComment - returns 400 when professor does not exist', async () => {
  const mockExists: any = jest.fn();
  mockExists.mockResolvedValue(false);
    jest.doMock('../../models/professor.model', () => ({ ProfessorModel: { exists: mockExists } }));
    jest.doMock('../../models/comment.model', () => ({ CommentModel: { create: jest.fn() } }));

    const { createComment } = await import('../../controllers/comment.controller');

    const req: any = { user: { sub: 'u1' }, body: { professor: 'pNot', content: 'x' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createComment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Professor does not exist' });
  });

  test('getComment - 404 when not found and 200 when found', async () => {
    const mockFindById: any = jest.fn((id: string) => {
      const pop: any = jest.fn();
      pop.mockResolvedValue(id === 'missing' ? null : { id: 'c2', content: 'found' });
      return { populate: pop };
    });
    jest.doMock('../../models/comment.model', () => ({ CommentModel: { findById: mockFindById } }));

    const { getComment } = await import('../../controllers/comment.controller');

    const req1: any = { params: { id: 'missing' } };
    const res1: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await getComment(req1, res1);
    expect(res1.status).toHaveBeenCalledWith(404);

    const req2: any = { params: { id: 'c2' } };
    const res2: any = { json: jest.fn() };
    await getComment(req2, res2);
    expect(res2.json).toHaveBeenCalledWith({ id: 'c2', content: 'found' });
  });

  test('updateComment - 404, 403 and success paths', async () => {
    const fakeComment: any = {
      user: { toString: () => 'owner' },
      save: jest.fn(),
      populate: jest.fn(),
      deleteOne: jest.fn(),
    };
    fakeComment.save.mockResolvedValue(undefined);
    fakeComment.populate.mockResolvedValue({ id: 'c3', content: 'edited' });
    fakeComment.deleteOne.mockResolvedValue(undefined);

    const mockFindById: any = jest.fn((id: string) => {
      if (id === 'no') return null;
      if (id === 'forbid') return { ...fakeComment, user: { toString: () => 'other' } };
      if (id === 'ok') return fakeComment;
      return null;
    });

    jest.doMock('../../models/comment.model', () => ({ CommentModel: { findById: mockFindById } }));

    const { updateComment, deleteComment } = await import('../../controllers/comment.controller');

    const res404: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateComment({ params: { id: 'no' }, body: { content: 'x' }, user: { sub: 'u' } } as any, res404 as any);
    expect(res404.status).toHaveBeenCalledWith(404);

    const res403: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await updateComment({ params: { id: 'forbid' }, body: { content: 'x' }, user: { sub: 'u', role: 'user' } } as any, res403 as any);
    expect(res403.status).toHaveBeenCalledWith(403);

    const resOk: any = { json: jest.fn() };
    await updateComment({ params: { id: 'ok' }, body: { content: 'edited' }, user: { sub: 'owner' } } as any, resOk as any);
    expect(resOk.json).toHaveBeenCalledWith({ id: 'c3', content: 'edited' });

    // delete 404 and forbidden and success
    const mockFindByIdForDelete: any = jest.fn((id: string) => {
      if (id === 'no') return null;
      if (id === 'forbid') return { ...fakeComment, user: { toString: () => 'other' } };
      if (id === 'ok') return fakeComment;
      return null;
    });

    jest.doMock('../../models/comment.model', () => ({ CommentModel: { findById: mockFindByIdForDelete } }));
    const { deleteComment: del } = await import('../../controllers/comment.controller');

    const resDel404: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await del({ params: { id: 'no' }, user: { sub: 'u' } } as any, resDel404 as any);
    expect(resDel404.status).toHaveBeenCalledWith(404);

    const resDel403: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await del({ params: { id: 'forbid' }, user: { sub: 'u' } } as any, resDel403 as any);
    expect(resDel403.status).toHaveBeenCalledWith(403);

    const resDelOk: any = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    await del({ params: { id: 'ok' }, user: { sub: 'owner' } } as any, resDelOk as any);
    expect(resDelOk.status).toHaveBeenCalledWith(204);
  });

  test('updateComment - admin can edit any comment', async () => {
    const fakeComment: any = {
      user: { toString: () => 'other' },
      save: jest.fn(),
      populate: jest.fn(),
    };
    (fakeComment.save as any).mockResolvedValue(undefined);
    (fakeComment.populate as any).mockResolvedValue({ id: 'c3', content: 'edited by admin' });

    const mockFindById: any = jest.fn();
    mockFindById.mockResolvedValue(fakeComment);
    jest.doMock('../../models/comment.model', () => ({ CommentModel: { findById: mockFindById } }));

    const { updateComment } = await import('../../controllers/comment.controller');

    const resOk: any = { json: jest.fn() };
    await updateComment({ 
      params: { id: 'ok' }, 
      body: { content: 'edited by admin' }, 
      user: { sub: 'admin', role: 'superadmin' } 
    } as any, resOk as any);
    
    expect(fakeComment.content).toBe('edited by admin');
    expect(resOk.json).toHaveBeenCalledWith({ id: 'c3', content: 'edited by admin' });
  });

  test('deleteComment - admin can delete any comment', async () => {
    const fakeComment: any = {
      user: { toString: () => 'other' },
      deleteOne: jest.fn(),
    };
    (fakeComment.deleteOne as any).mockResolvedValue(undefined);

    const mockFindById: any = jest.fn();
    mockFindById.mockResolvedValue(fakeComment);
    jest.doMock('../../models/comment.model', () => ({ CommentModel: { findById: mockFindById } }));

    const { deleteComment } = await import('../../controllers/comment.controller');

    const resOk: any = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    await deleteComment({ 
      params: { id: 'ok' }, 
      user: { sub: 'admin', role: 'superadmin' } 
    } as any, resOk as any);
    
    expect(resOk.status).toHaveBeenCalledWith(204);
    expect(fakeComment.deleteOne).toHaveBeenCalled();
  });

  test('listComments - handles query parameters and filters', async () => {
    const mockCountDocuments: any = jest.fn();
    mockCountDocuments.mockResolvedValue(5);
    const mockPopulate: any = jest.fn();
    mockPopulate.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: mockPopulate
    });

    jest.doMock('../../models/comment.model', () => ({ 
      CommentModel: { 
        countDocuments: mockCountDocuments,
        find: mockFind 
      } 
    }));

    const { listComments } = await import('../../controllers/comment.controller');

    // Test with filters
    const req: any = { 
      validatedQuery: { 
        professor: 'prof1', 
        user: 'user1', 
        q: 'search', 
        page: 2, 
        limit: 10 
      } 
    };
    const res: any = { json: jest.fn() };

    await listComments(req, res);

    expect(mockCountDocuments).toHaveBeenCalledWith({
      professor: 'prof1',
      user: 'user1',
      content: { $regex: 'search', $options: 'i' }
    });
    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 'c1' }, { id: 'c2' }],
      page: 2,
      limit: 10,
      total: 5,
      pages: 1
    });
  });

  test('listComments - works without validatedQuery (fallback to req.query)', async () => {
    const mockCountDocuments: any = jest.fn();
    mockCountDocuments.mockResolvedValue(3);
    const mockPopulate: any = jest.fn();
    mockPopulate.mockResolvedValue([{ id: 'c3' }]);
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: mockPopulate
    });

    jest.doMock('../../models/comment.model', () => ({ 
      CommentModel: { 
        countDocuments: mockCountDocuments,
        find: mockFind 
      } 
    }));

    const { listComments } = await import('../../controllers/comment.controller');

    // Test without validatedQuery - should use req.query
    const req: any = { 
      query: { 
        professor: 'prof2', 
        page: 1, 
        limit: 5 
      } 
    };
    const res: any = { json: jest.fn() };

    await listComments(req, res);

    expect(mockCountDocuments).toHaveBeenCalledWith({
      professor: 'prof2'
    });
    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 'c3' }],
      page: 1,
      limit: 5,
      total: 3,
      pages: 1
    });
  });

  test('listComments - handles empty filters', async () => {
    const mockCountDocuments: any = jest.fn();
    mockCountDocuments.mockResolvedValue(10);
    const mockPopulate: any = jest.fn();
    mockPopulate.mockResolvedValue([{ id: 'c4' }, { id: 'c5' }]);
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: mockPopulate
    });

    jest.doMock('../../models/comment.model', () => ({ 
      CommentModel: { 
        countDocuments: mockCountDocuments,
        find: mockFind 
      } 
    }));

    const { listComments } = await import('../../controllers/comment.controller');

    // Test with no filters - empty query
    const req: any = { 
      validatedQuery: {} 
    };
    const res: any = { json: jest.fn() };

    await listComments(req, res);

    expect(mockCountDocuments).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 'c4' }, { id: 'c5' }],
      page: 1,
      limit: 20,
      total: 10,
      pages: 1
    });
  });

  test('listComments - handles undefined req.query fallback', async () => {
    const mockCountDocuments: any = jest.fn();
    mockCountDocuments.mockResolvedValue(2);
    const mockPopulate: any = jest.fn();
    mockPopulate.mockResolvedValue([{ id: 'c6' }]);
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: mockPopulate
    });

    jest.doMock('../../models/comment.model', () => ({ 
      CommentModel: { 
        countDocuments: mockCountDocuments,
        find: mockFind 
      } 
    }));

    const { listComments } = await import('../../controllers/comment.controller');

    // Test with no validatedQuery and no req.query - should default to empty object
    const req: any = {};
    const res: any = { json: jest.fn() };

    await listComments(req, res);

    expect(mockCountDocuments).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 'c6' }],
      page: 1,
      limit: 20,
      total: 2,
      pages: 1
    });
  });
});
