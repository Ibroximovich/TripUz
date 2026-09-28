import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { JwtPayload } from '../types';

/**
 * Generate a short-lived access token (signed with JWT_SECRET)
 */
export function generateAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

/**
 * Generate a long-lived refresh token (signed with JWT_REFRESH_SECRET)
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtRefreshExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtRefreshSecret, options);
}

/**
 * Verify an access token and return its decoded payload
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

/**
 * Verify a refresh token and return its decoded payload
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
}

/**
 * Compute SHA-256 hash of a raw token string.
 * Only the hash is stored in the DB — never the raw token.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Extract token from Authorization: Bearer <token> header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}
