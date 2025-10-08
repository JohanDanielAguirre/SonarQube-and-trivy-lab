import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: Array<'superadmin'|'user'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

export function ownerOrAdmin(getOwnerId: (req: Request)=>string|undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
    const isAdmin = req.user.role === 'superadmin';
    const ownerId = getOwnerId(req);
    if (isAdmin || (ownerId && ownerId === req.user.sub)) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
}