import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.model';

// GET /api/users/me  (usuario autenticado)
export const myProfile = async (req: Request, res: Response) => {
  const me = await UserModel.findById(req.user!.sub).select('-passwordHash');
  if (!me) return res.status(404).json({ message: 'User not found' });
  res.json(me);
};

// GET /api/users/:id (solo superadmin)
export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await UserModel.findById(id).select('-passwordHash');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

// GET /api/users  (solo superadmin) - soporta filtros y paginación
// Query validada por listUsersQuerySchema: { q?, role?, page=1, limit=20 }
export const listUsers = async (req: Request, res: Response) => {
  // Usar validatedQuery si existe, o req.query como fallback para tests
  const validatedQuery = (req as any).validatedQuery ?? req.query ?? {};
  const { q, role, page = 1, limit = 20 } = validatedQuery;

  const filter: any = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }
  if (role) filter.role = role;

  const [total, data] = await Promise.all([
    UserModel.countDocuments(filter),
    UserModel.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({
    data,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
};

// PATCH /api/users/:id (solo superadmin) - puede resetear password
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body as {
    name?: string;
    email?: string;
    role?: 'superadmin' | 'user';
    password?: string;
  };

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  try {
    const updated = await UserModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err: any) {
    // manejo de email duplicado
    if (err?.code === 11000 && err?.keyPattern?.email) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    throw err;
  }
};

// DELETE /api/users/:id (solo superadmin)
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await UserModel.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'User not found' });
  res.status(204).send();
};