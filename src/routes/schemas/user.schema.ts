import { z } from 'zod';

const objectId = /^[a-f\d]{24}$/i;

export const roleEnum = z.enum(['superadmin', 'user']);

// Admin crea usuario
export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  password: z.string().min(6).max(100),
  role: roleEnum.default('user')
});

// Admin actualiza usuario
export const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().max(160).optional(),
  // si el admin resetea password
  password: z.string().min(6).max(100).optional(),
  role: roleEnum.optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

// Param :id
export const idParamSchema = z.object({
  id: z.string().regex(objectId, 'Invalid ObjectId')
});

export const listUsersQuerySchema = z.object({
  q: z.string().max(160).optional(),         // buscar por nombre/email
  role: roleEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});