import { Router } from 'express';
import {
  getAdminStats,
  getAdminGuides,
  updateGuideCommission,
  getAdminExperiences,
  updateExperienceStatus,
  deleteExperience,
  getAdminBookings,
  updateBookingStatus,
  createExperience,
  getCommissions,
  getReferrals,
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createExperienceSchema } from '../schemas/experience.schema';

const router = Router();

// Barcha admin endpointlar requireAuth va requireRole('ADMIN') middleware bilan himoyalangan
router.use(authenticate, requireRole('ADMIN'));

/**
 * 1. DASHBOARD STATISTIKASI
 * GET /api/admin/stats
 */
router.get('/stats', getAdminStats);

/**
 * 2. GIDLAR BOSHQARUVI
 * GET /api/admin/guides
 * PATCH /api/admin/guides/:id
 */
router.get('/guides', getAdminGuides);
router.patch('/guides/:id', updateGuideCommission);

/**
 * 3. TURLARNI MODERATSIYA QILISH
 * GET /api/admin/experiences
 * POST /api/admin/experiences
 * PATCH /api/admin/experiences/:id/status
 * DELETE /api/admin/experiences/:id
 */
router.get('/experiences', getAdminExperiences);
router.post('/experiences', validate(createExperienceSchema), createExperience);
router.patch('/experiences/:id/status', updateExperienceStatus);
router.delete('/experiences/:id', deleteExperience);

/**
 * 4. BUYURTMALAR MONITORINGI
 * GET /api/admin/bookings
 * PATCH /api/admin/bookings/:id/status
 */
router.get('/bookings', getAdminBookings);
router.patch('/bookings/:id/status', updateBookingStatus);

/**
 * 5. MOLIYA VA REFERRAL HISOBOTLARI
 * GET /api/admin/commissions
 * GET /api/admin/referrals
 */
router.get('/commissions', getCommissions);
router.get('/referrals', getReferrals);

export default router;
