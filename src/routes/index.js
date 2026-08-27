import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/auth.controller.js';
import * as entreprise from '../controllers/entreprise.controller.js';
import * as cabinet from '../controllers/cabinet.controller.js';
import { auth as authMiddleware, optionalAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives. Réessayez plus tard.' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes. Réessayez dans une minute.' },
});

router.use(generalLimiter);


router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.post('/auth/refresh', authLimiter, auth.refresh);
router.post('/auth/logout', auth.logout);
router.get('/auth/verify-email', auth.verifyEmail);
router.post('/auth/resend-verification', authLimiter, auth.resendVerification);
router.post('/auth/forgot-password', authLimiter, auth.forgotPassword);
router.post('/auth/reset-password', authLimiter, auth.resetPassword);


router.get('/me', authMiddleware, auth.me);
router.patch('/me', authMiddleware, auth.updateMe);


router.post('/entreprise', authMiddleware, requireRole('entreprise'), entreprise.createEntreprise);
router.get('/entreprise/me', authMiddleware, requireRole('entreprise'), entreprise.getMyEntreprise);
router.patch('/entreprise/me', authMiddleware, requireRole('entreprise'), entreprise.updateMyEntreprise);
router.delete('/entreprise/me', authMiddleware, requireRole('entreprise'), entreprise.deleteMyEntreprise);

router.get('/cabinets', cabinet.listCabinets);
router.get('/cabinets/:id', optionalAuth, cabinet.getCabinet);
router.get('/cabinet/me', authMiddleware, requireRole('cabinet'), cabinet.getMyCabinet);
router.patch('/cabinet/me', authMiddleware, requireRole('cabinet'), cabinet.updateMyCabinet);
router.post('/cabinet/me/documents', authMiddleware, requireRole('cabinet'), upload.single('document'), cabinet.uploadDocument);
router.delete('/cabinet/me/documents/:docId', authMiddleware, requireRole('cabinet'), cabinet.removeDocument);

export default router;
