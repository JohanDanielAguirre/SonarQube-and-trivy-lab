import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createUniversity, listUniversities, getUniversity, updateUniversity, deleteUniversity } from '../controllers/university.controller';
import { createUniversitySchema, updateUniversitySchema, idParamSchema } from './schemas/university.schema';

const r = Router();

// Lectura pública
r.get('/', listUniversities);
r.get('/:id', validate(idParamSchema, 'params'), getUniversity);

// CRUD solo superadmin
r.post('/', requireAuth, requireRole('superadmin'), validate(createUniversitySchema), createUniversity);
r.put('/:id', requireAuth, requireRole('superadmin'), validate(idParamSchema, 'params'), validate(updateUniversitySchema), updateUniversity);
r.patch('/:id', requireAuth, requireRole('superadmin'), validate(idParamSchema, 'params'), validate(updateUniversitySchema), updateUniversity);
r.delete('/:id', requireAuth, requireRole('superadmin'), validate(idParamSchema, 'params'), deleteUniversity);

export default r;