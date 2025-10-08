import { z } from 'zod';

export const createProfessorSchema = z.object({
  name: z.string().min(2).max(120),
  department: z.string().min(2).max(120).optional(),
  university: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid university ObjectId')
});

export const updateProfessorSchema = createProfessorSchema.partial();

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId')
});

export const listQuerySchema = z.object({
  university: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId').optional(),
  q: z.string().max(120).optional()
});