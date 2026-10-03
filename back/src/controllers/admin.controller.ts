import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import { CreateExperienceDto } from '../schemas/experience.schema';
import { BookingStatus } from '@prisma/client';

/**
 * GET /api/admin/stats
 * Admin dashboard umumiy statistikasi
 */
export async function getAdminStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await adminService.getAdminStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/guides
 * Barcha gidlar ro'yxati, paginatsiya va qidiruv bilan
 */
export async function getAdminGuides(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, search } = req.query as {
      page?: string;
      limit?: string;
      search?: string;
    };

    const result = await adminService.getAdminGuides({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/guides/:id
 * Gid komissiya foizini yangilash
 */
export async function updateGuideCommission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { commissionRate } = req.body as { commissionRate: number };

    if (commissionRate === undefined || typeof commissionRate !== 'number') {
      res.status(400).json({
        success: false,
        message: 'commissionRate raqam bo\'lishi shart (masalan: 10)',
      });
      return;
    }

    const updated = await adminService.updateGuideCommission(id, commissionRate);

    res.status(200).json({
      success: true,
      message: 'Gid komissiya foizi muvaffaqiyatli yangilandi',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/experiences
 * Barcha turlar ro'yxati (filtrlash va paginatsiya bilan)
 */
export async function getAdminExperiences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, city, isActive, search, guideId } = req.query as {
      page?: string;
      limit?: string;
      city?: string;
      isActive?: string;
      search?: string;
      guideId?: string;
    };

    const result = await adminService.getAdminExperiences({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      city,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
      guideId,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/experiences/:id/status
 * Turni faollashtirish yoki yashirish
 */
export async function updateExperienceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { isActive } = req.body as { isActive: boolean };

    if (typeof isActive !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'isActive boolean bo\'lishi shart (true yoki false)',
      });
      return;
    }

    const updated = await adminService.updateExperienceStatus(id, isActive);

    res.status(200).json({
      success: true,
      message: `Tur holati muvaffaqiyatli ${isActive ? 'faollashtirildi' : 'yashirildi'}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/admin/experiences/:id
 * Turni o'chirish (yoki yashirish)
 */
export async function deleteExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await adminService.deleteExperienceByAdmin(id);

    res.status(200).json({
      success: true,
      message: 'Tur muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/bookings
 * Barcha buyurtmalar ro'yxati (filtrlash, qidiruv va paginatsiya bilan)
 */
export async function getAdminBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, status, paymentStatus, guideId, search, startDate, endDate } = req.query as {
      page?: string;
      limit?: string;
      status?: string;
      paymentStatus?: string;
      guideId?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    };

    const result = await adminService.getAdminBookings({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      paymentStatus,
      guideId,
      search,
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/bookings/:id/status
 * Buyurtma holatini o'zgartirish
 */
export async function updateBookingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: BookingStatus };

    if (!status || !Object.values(BookingStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: `Noto'g'ri status. Mumkin bo'lgan holatlar: ${Object.values(BookingStatus).join(', ')}`,
      });
      return;
    }

    const updated = await adminService.updateBookingStatusByAdmin(id, status);

    res.status(200).json({
      success: true,
      message: 'Buyurtma holati yangilandi',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/experiences
 * Create a new experience (admin only).
 */
export async function createExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as CreateExperienceDto;
    const experience = await adminService.adminCreateExperience(dto);

    res.status(201).json({
      success: true,
      message: 'Experience created successfully',
      data: experience,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/bookings (legacy wrapper)
 */
export async function getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  return getAdminBookings(req, res, next);
}

/**
 * GET /api/admin/commissions
 * Get commission report per guide.
 */
export async function getCommissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [report, stats] = await Promise.all([
      adminService.getCommissionReport(),
      adminService.getPlatformStats(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        platformStats: stats,
        commissionByGuide: report,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/referrals
 * Get referral statistics grouped by referral code.
 */
export async function getReferrals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await adminService.getReferralStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
