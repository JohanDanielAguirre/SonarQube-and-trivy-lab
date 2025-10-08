import { Router } from 'express';
import { loginCtrl, registerCtrl, meCtrl } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {validate} from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from './schemas/auth.schema';

const r = Router();

// Solo superadmin registra nuevos usuarios
r.post('/register', requireAuth, requireRole('superadmin'), validate(registerSchema), registerCtrl);
r.post('/login', validate(loginSchema), loginCtrl);
r.get('/me', requireAuth, meCtrl);

export default r;