import { Router } from 'express';
import {
  createExperience,
  getAllBookings,
  getCommissions,
  getReferrals,
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createExperienceSchema } from '../schemas/experience.schema';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, requireRole('ADMIN'));

/**
 * POST /api/admin/experiences
 * Admin: Create a new tour experience
 */
router.post('/experiences', validate(createExperienceSchema), createExperience);

/**
 * GET /api/admin/bookings
 * Admin: View all bookings (optionally filtered by status)
 */
router.get('/bookings', getAllBookings);

/**
 * GET /api/admin/commissions
 * Admin: View commission report per guide + platform stats
 */
router.get('/commissions', getCommissions);

/**
 * GET /api/admin/referrals
 * Admin: View referral statistics grouped by referralCode
 */
router.get('/referrals', getReferrals);

export default router;
