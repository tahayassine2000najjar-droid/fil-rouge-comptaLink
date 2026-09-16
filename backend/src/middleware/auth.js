import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const auth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentification requise');
    }
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new AppError(401, 'Compte introuvable ou désactivé');
    }
    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(401, 'Session invalide ou expirée'));
  }
};
export const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next();
    }
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user && user.isActive) {
      req.user = { id: user.id, role: user.role, email: user.email };
    }
    next();
  } catch (err) {
    next();
  }
};
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentification requise'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Accès refusé : permissions insuffisantes'));
    }
    next();
  };
}
