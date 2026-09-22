import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import * as entreprise from '../controllers/entreprise.controller.js';
import * as cabinet from '../controllers/cabinet.controller.js';
import * as quote from '../controllers/quote.controller.js';
import { auth as authMiddleware, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/refresh', auth.refresh);
router.post('/auth/logout', auth.logout);
router.get('/auth/verify-email', auth.verifyEmail);
router.post('/auth/resend-verification', auth.resendVerification);
router.post('/auth/forgot-password', auth.forgotPassword);
router.post('/auth/reset-password', auth.resetPassword);

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

/**
 * @openapi
 * /api/quotes:
 *   post:
 *     summary: Create a quote request
 *     description: Allows an entreprise to send a new quote request to a specific cabinet. The cabinet must be approved to receive requests.
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cabinet, service, description]
 *             properties:
 *               cabinet:
 *                 type: string
 *                 description: The cabinet user ID
 *               service:
 *                 type: string
 *                 minLength: 2
 *                 description: The service needed
 *               budget:
 *                 type: string
 *                 description: Optional budget indication
 *               timeline:
 *                 type: string
 *                 description: Optional timeline indication
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 description: Detailed description of the need (min 10 characters)
 *     responses:
 *       201:
 *         description: Quote request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     status: { type: string, example: pending }
 *                     service: { type: string }
 *       400:
 *         description: Validation error or cabinet not approved
 *       401:
 *         description: Unauthorized - invalid or expired token
 *       403:
 *         description: Forbidden - only entreprises can create quotes
 *       404:
 *         description: Cabinet not found
 */
router.post('/quotes', authMiddleware, requireRole('entreprise'), quote.createQuote);
router.get('/quotes', authMiddleware, quote.myQuotes);
router.get('/quotes/:id', authMiddleware, quote.getQuote);
router.post('/quotes/:id/respond', authMiddleware, requireRole('cabinet'), quote.respondToQuote);

router.post('/quotes/:id/cancel', authMiddleware, requireRole('entreprise'), quote.cancelQuote);

export default router;
