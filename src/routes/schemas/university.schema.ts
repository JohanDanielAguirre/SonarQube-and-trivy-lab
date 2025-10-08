import { z } from 'zod';

export const createUniversitySchema = z.object({
  name: z.string().min(2).max(120),
  country: z.string().min(2).max(80).optional(),
  city: z.string().min(2).max(80).optional()
});

export const updateUniversitySchema = createUniversitySchema.partial();

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId')
});