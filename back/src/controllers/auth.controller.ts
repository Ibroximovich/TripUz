import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../types';

/**
 * POST /api/auth/google
 * Accepts Google ID token, verifies it, upserts user, returns JWT tokens.
 */
export async function googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idToken, role } = req.body;
    const result = await authService.loginWithGoogle(idToken, role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 * Accepts a refresh token, validates it against the DB, returns a new token pair (rotation).
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: rawRefreshToken } = req.body;

    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      res.status(400).json({ success: false, message: 'refreshToken is required' });
      return;
    }

    const tokens = await authService.refreshTokens(rawRefreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Revokes the refresh token server-side.
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: rawRefreshToken } = req.body;

    if (rawRefreshToken && typeof rawRefreshToken === 'string') {
      await authService.revokeRefreshToken(rawRefreshToken);
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const user = await authService.getMe(userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/me/language & /api/auth/me/language
 * Update authenticated user's preferred language ('uz' | 'en' | 'ru').
 */
export async function updateLanguage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { language } = req.body;

    if (!language || !['uz', 'en', 'ru'].includes(language)) {
      res.status(400).json({ success: false, message: 'Invalid language. Must be uz, en, or ru' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { language },
    });

    res.status(200).json({
      success: true,
      message: 'Language updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
}
