import { Request, Response } from 'express';
import { CommentModel } from '../models/comment.model';
import { ProfessorModel } from '../models/professor.model';

// POST /api/comments - crear comentario (requiere auth)
export const createComment = async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { professor, content } = req.body as { professor: string; content: string };

  // validar que el profesor exista
  const profExists = await ProfessorModel.exists({ _id: professor });
  if (!profExists) return res.status(400).json({ message: 'Professor does not exist' });

  const created = await CommentModel.create({ user: userId, professor, content });
  const populated = await created.populate([
    { path: 'user', select: 'name email role' },
    { path: 'professor', select: 'name' }
  ]);
  res.status(201).json(populated);
};

// GET /api/comments - lista pública con filtros/paginación
export const listComments = async (req: Request, res: Response) => {
  // Usar validatedQuery si existe, o req.query como fallback para tests
  const validatedQuery = (req as any).validatedQuery ?? req.query ?? {};
  const { professor, user, q, page = 1, limit = 20 } = validatedQuery;

  const filter: any = {};
  if (professor) filter.professor = professor;
  if (user) filter.user = user;
  if (q) filter.content = { $regex: q, $options: 'i' };

  const [total, data] = await Promise.all([
    CommentModel.countDocuments(filter),
    CommentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate([{ path: 'user', select: 'name email role' }, { path: 'professor', select: 'name' }])
  ]);

  res.json({ data, page, limit, total, pages: Math.ceil(total / limit) });
};

// GET /api/comments/:id - público
export const getComment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await CommentModel.findById(id).populate([
    { path: 'user', select: 'name email role' },
    { path: 'professor', select: 'name' }
  ]);
  if (!item) return res.status(404).json({ message: 'Comment not found' });
  res.json(item);
};

// PATCH /api/comments/:id - dueño o admin
export const updateComment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body as { content: string };

  const comment = await CommentModel.findById(id);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  const isOwner = comment.user.toString() === req.user!.sub;
  const isAdmin = req.user!.role === 'superadmin';
  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

  comment.content = content;
  await comment.save();
  const populated = await comment.populate([
    { path: 'user', select: 'name email role' },
    { path: 'professor', select: 'name' }
  ]);
  res.json(populated);
};

// DELETE /api/comments/:id - dueño o admin
export const deleteComment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const comment = await CommentModel.findById(id);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  const isOwner = comment.user.toString() === req.user!.sub;
  const isAdmin = req.user!.role === 'superadmin';
  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

  await comment.deleteOne();
  res.status(204).send();
};

