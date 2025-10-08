import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createProfessor, listProfessors, getProfessor, updateProfessor, deleteProfessor } from '../controllers/professor.controller';
import { createProfessorSchema, updateProfessorSchema, idParamSchema, listQuerySchema } from './schemas/professor.schema';

const r = Router();

// Lectura pública (con filtros opcionales ?university=ID & q=nombre)
r.get('/', validate(listQuerySchema, 'query'), listProfessors);
r.get('/:id', validate(idParamSchema, 'params'), getProfessor);

// CRUD solo superadmin
r.post('/', requireAuth, requireRole('superadmin'), validate(createProfessorSchema), createProfessor);
r.put('/:id', requireAuth, requireRole('superadmin'), validate(idParamSchema, 'params'), validate(updateProfessorSchema), updateProfessor);
r.patch('/:id', requireAuth, requireRole('superadmin'), validate(idParamSchema, 'params'), validate(updateProfessorSchema), updateProfessor);
r.delete('/:id', requireAuth, requireRole('superadmin'), validate(idParamSchema, 'params'), deleteProfessor);

export default r;