import { Router } from 'express';
import { googleLogin, getMe, refreshToken, logout, updateLanguage } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { googleAuthSchema, refreshTokenSchema } from '../schemas/auth.schema';

const router = Router();

/**
 * POST /api/auth/google
 * Verify Google ID token and return JWT pair
 */
router.post('/google', validate(googleAuthSchema), googleLogin);

/**
 * POST /api/auth/refresh
 * Rotate refresh token — returns new access + refresh token pair
 */
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

/**
 * POST /api/auth/logout
 * Revoke refresh token server-side (refreshToken in body, optional)
 */
router.post('/logout', logout);

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 */
router.get('/me', authenticate, getMe);

/**
 * PATCH /api/auth/me/language
 * Update user language preference
 */
router.patch('/me/language', authenticate, updateLanguage);

export default router;
