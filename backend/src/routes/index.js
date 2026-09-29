import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import * as entreprise from '../controllers/entreprise.controller.js';
import * as cabinet from '../controllers/cabinet.controller.js';
import * as quote from '../controllers/quote.controller.js';
import { auth as authMiddleware, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new account for an entreprise or cabinet
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *               role:
 *                 type: string
 *                 enum: [entreprise, cabinet]
 *               companyName:
 *                 type: string
 *                 description: Required if role is entreprise
 *               firmName:
 *                 type: string
 *                 description: Required if role is cabinet
 *     responses:
 *       201:
 *         description: Account created successfully
 *       409:
 *         description: Email already exists
 */
router.post('/auth/register', auth.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login to get access token
 *     description: Authenticate and receive JWT access and refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful - returns tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     email: { type: string }
 *                     fullName: { type: string }
 *                     role: { type: string, enum: [entreprise, cabinet] }
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token (expires in 15 minutes)
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token (expires in 7 days)
 *       401:
 *         description: Invalid email or password
 */
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
/**
 * @openapi
 * /api/quotes/{id}/messages:
 *   post:
 *     summary: Reply in the quote conversation
 *     description: Adds a message to the conversation thread. Available to both the entreprise and the cabinet, but only once the cabinet has accepted the request.
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Message added to the thread
 *       400:
 *         description: Conversation not open yet or empty message
 *       403:
 *         description: Forbidden - not a participant of this quote
 *       404:
 *         description: Quote not found
 *
 * /api/quotes/{id}/accept-terms:
 *   post:
 *     summary: Accept the agreed terms
 *     description: Records that the current user accepts the conditions of an accepted quote. Once both the entreprise and the cabinet have accepted, the quote status switches to completed.
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Terms accepted
 *       400:
 *         description: Quote not accepted yet, or already accepted by this user
 *       403:
 *         description: Forbidden - not a participant of this quote
 *       404:
 *         description: Quote not found
 */
router.post('/quotes', authMiddleware, requireRole('entreprise'), quote.createQuote);
router.get('/quotes', authMiddleware, quote.myQuotes);
router.get('/quotes/:id', authMiddleware, quote.getQuote);
router.patch('/quotes/:id', authMiddleware, requireRole('entreprise'), quote.updateQuote);
router.delete('/quotes/:id', authMiddleware, requireRole('entreprise'), quote.deleteQuote);
router.post('/quotes/:id/respond', authMiddleware, requireRole('cabinet'), quote.respondToQuote);
router.post('/quotes/:id/messages', authMiddleware, quote.addMessage);
router.post('/quotes/:id/accept-terms', authMiddleware, quote.acceptTerms);

router.post('/quotes/:id/cancel', authMiddleware, requireRole('entreprise'), quote.cancelQuote);

export default router;
