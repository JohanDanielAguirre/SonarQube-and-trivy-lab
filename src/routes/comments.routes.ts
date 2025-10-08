import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createComment, listComments, getComment, updateComment, deleteComment } from '../controllers/comment.controller';
import { createCommentSchema, updateCommentSchema, idParamSchema, listCommentsQuerySchema } from './schemas/comment.schema';

const r = Router();

// Lectura pública
r.get('/', validate(listCommentsQuerySchema, 'query'), listComments);
r.get('/:id', validate(idParamSchema, 'params'), getComment);

// Operaciones que requieren autenticación
r.post('/', requireAuth, validate(createCommentSchema), createComment);
r.put('/:id', requireAuth, validate(idParamSchema, 'params'), validate(updateCommentSchema), updateComment);
r.patch('/:id', requireAuth, validate(idParamSchema, 'params'), validate(updateCommentSchema), updateComment);
r.delete('/:id', requireAuth, validate(idParamSchema, 'params'), deleteComment);

export default r;

