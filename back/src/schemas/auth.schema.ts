import { z } from 'zod';
import { Role } from '@prisma/client';

/**
 * Schema for POST /api/auth/google
 */
export const googleAuthSchema = z.object({
  idToken: z.string({ required_error: 'idToken is required' }).min(1, 'idToken cannot be empty'),
  role: z.nativeEnum(Role).optional(),
});

export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;
