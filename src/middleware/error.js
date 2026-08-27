import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export function notFound(req, _res, next) {
  next(new AppError(404, `Route introuvable : ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  const anyErr = err;
  if (anyErr?.code === 11000) {
    res.status(409).json({ success: false, message: 'Une entrée en double existe déjà (email, nom...)' });
    return;
  }

  console.error('[error]', err);
  res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
}
