import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { myProfile, updateUser, listUsers, deleteUser, getUser } from '../controllers/user.controller';
import { idParamSchema, updateUserSchema, listUsersQuerySchema } from './schemas/user.schema';

const r = Router();
r.get('/me', requireAuth, myProfile);
r.get('/', requireAuth, requireRole('superadmin'), validate(listUsersQuerySchema,'query'), listUsers);
r.get('/:id', requireAuth, requireRole('superadmin'), validate(idParamSchema, 'params'), getUser);
r.put('/:id', requireAuth, requireRole('superadmin'),
  validate(idParamSchema,'params'),
  validate(updateUserSchema),
  updateUser
);
r.patch('/:id', requireAuth, requireRole('superadmin'),
  validate(idParamSchema,'params'),
  validate(updateUserSchema),
  updateUser
);
r.delete('/:id', requireAuth, requireRole('superadmin'),
  validate(idParamSchema,'params'),
  deleteUser
);
export default r;