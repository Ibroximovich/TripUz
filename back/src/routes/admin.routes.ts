import { Router } from 'express';
import {
  getAdminStats,
  getAdminGuides,
  getAdminTourists,
  updateGuideCommission,
  getAdminExperiences,
  updateExperienceStatus,
  deleteExperience,
  getAdminBookings,
  updateBookingStatus,
  createExperience,
  updateExperience,
  addExperienceDate,
  deleteExperienceDate,
  getCommissions,
  getReferrals,
  deleteUser,
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createExperienceSchema, addAvailableDateSchema } from '../schemas/experience.schema';

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
 * 2.1. TURISTLAR BOSHQARUVI
 * GET /api/admin/tourists
 */
router.get('/tourists', getAdminTourists);
router.delete('/users/:id', deleteUser);

/**
 * 3. TURLARNI MODERATSIYA QILISH VA SANALAR BOSHQARUVI
 * GET /api/admin/experiences
 * POST /api/admin/experiences
 * PUT /api/admin/experiences/:id
 * PATCH /api/admin/experiences/:id/status
 * DELETE /api/admin/experiences/:id
 * POST /api/admin/experiences/:id/dates
 * DELETE /api/admin/experiences/dates/:dateId
 */
router.get('/experiences', getAdminExperiences);
router.post('/experiences', validate(createExperienceSchema), createExperience);
router.put('/experiences/:id', updateExperience);
router.patch('/experiences/:id/status', updateExperienceStatus);
router.delete('/experiences/:id', deleteExperience);
router.post('/experiences/:id/dates', validate(addAvailableDateSchema), addExperienceDate);
router.delete('/experiences/dates/:dateId', deleteExperienceDate);

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
