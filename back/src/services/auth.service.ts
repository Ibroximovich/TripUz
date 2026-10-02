import { Role, User } from '@prisma/client';
import prisma from '../config/prisma';
import { verifyGoogleToken } from '../utils/google';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/jwt';
import { JwtPayload } from '../types';
import { HttpError } from '../middlewares/error.middleware';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'updatedAt'>;
}

/**
 * Parse JWT_REFRESH_EXPIRES_IN (e.g. "30d", "7d", "1h") → Date
 */
function parseExpiresIn(value: string): Date {
  const unit = value.slice(-1);
  const amount = parseInt(value.slice(0, -1), 10);
  const ms =
    unit === 'd' ? amount * 86_400_000 :
    unit === 'h' ? amount * 3_600_000 :
    unit === 'm' ? amount * 60_000 :
    amount * 1000;
  return new Date(Date.now() + ms);
}

/**
 * Persist the refresh token hash in the DB.
 * Previous tokens for the same user remain; they are rotated one-by-one.
 */
async function storeRefreshTokenHash(userId: string, rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = parseExpiresIn(process.env.JWT_REFRESH_EXPIRES_IN || '30d');
  await prisma.refreshToken.create({
    data: { tokenHash, userId, expiresAt },
  });
}

/**
 * Verify Google ID token, find or create the user, issue JWTs, store refresh hash.
 */
export async function loginWithGoogle(idToken: string, requestedRole?: Role): Promise<AuthTokens> {
  const googlePayload = await verifyGoogleToken(idToken);

  let userRole: Role;
  if (requestedRole) {
    userRole = requestedRole;
  } else if (googlePayload.email.includes('guide') || googlePayload.email.includes('jasur')) {
    userRole = Role.GUIDE;
  } else {
    userRole = Role.TOURIST;
  }

  const targetId = googlePayload.sub && googlePayload.sub.startsWith('google-mock-') ? googlePayload.sub : undefined;

  // To'g'ridan-to'g'ri upsert — ortiqcha findUnique so'rovini olib tashlaymiz
  const user = await prisma.user.upsert({
    where: { email: googlePayload.email },
    update: {
      name: googlePayload.name,
      role: userRole,
    },
    create: {
      id: targetId,
      email: googlePayload.email,
      name: googlePayload.name,
      avatar: googlePayload.picture,
      isCustomAvatarUploaded: false,
      role: userRole,
    },
  });

  const jwtPayload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken(jwtPayload);

  await storeRefreshTokenHash(user.id, refreshToken);

  return { accessToken, refreshToken, user };
}

/**
 * Rotate refresh token:
 * 1. Verify JWT signature & expiry
 * 2. Look up the hash in DB — must exist and not be revoked
 * 3. If hash is NOT found (already rotated) → revoke ALL tokens for this user (token theft)
 * 4. Revoke old hash, issue new token pair, persist new hash
 */
export async function refreshTokens(rawRefreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // Step 1: verify JWT signature / expiry
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }

  const tokenHash = hashToken(rawRefreshToken);

  // Step 2: look up in DB
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!stored) {
    // Token hash not found: either already rotated (theft) or never issued
    // Revoke ALL tokens for this user as a security measure
    await prisma.refreshToken.updateMany({
      where: { userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new HttpError(401, 'Refresh token reuse detected — all sessions revoked');
  }

  // Step 3: check not revoked and not expired
  if (stored.revokedAt || stored.expiresAt < new Date()) {
    throw new HttpError(401, 'Refresh token is expired or revoked');
  }

  // Step 4: revoke old token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  // Step 5: issue new pair
  const newJwtPayload: JwtPayload = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };

  const newAccessToken = generateAccessToken(newJwtPayload);
  const newRefreshToken = generateRefreshToken(newJwtPayload);

  await storeRefreshTokenHash(payload.sub, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/**
 * Revoke a specific refresh token on logout (server-side invalidation).
 */
export async function revokeRefreshToken(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Get the authenticated user's profile by userId.
 */
export async function getMe(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'User not found');
  return user;
}

