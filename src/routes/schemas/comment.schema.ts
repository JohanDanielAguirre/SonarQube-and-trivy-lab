import { z } from 'zod';

const objectId = /^[a-f\d]{24}$/i;

export const createCommentSchema = z.object({
  professor: z.string().regex(objectId, 'Invalid professor ObjectId'),
  content: z.string().min(2).max(1000)
});

export const updateCommentSchema = z.object({
  content: z.string().min(2).max(1000)
});

export const idParamSchema = z.object({
  id: z.string().regex(objectId, 'Invalid ObjectId')
});

export const listCommentsQuerySchema = z.object({
  professor: z.string().regex(objectId, 'Invalid ObjectId').optional(),
  user: z.string().regex(objectId, 'Invalid ObjectId').optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

