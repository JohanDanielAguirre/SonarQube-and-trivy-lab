import { Router } from 'express';
import auth from './auth.routes';
import users from './users.routes';
import universities from './universities.routes';
import professors from './professors.routes';
import comments from './comments.routes';

const r = Router();
r.use('/auth', auth);
r.use('/users', users);
r.use('/universities', universities);
r.use('/professors', professors);
r.use('/comments', comments);

export default r;