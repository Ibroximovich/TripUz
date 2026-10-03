import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { CommissionReport } from '../types';
import { CreateExperienceDto } from '../schemas/experience.schema';
import { createExperience as createExpService } from './experience.service';
import { HttpError } from '../middlewares/error.middleware';

// ==========================================
// 1. DASHBOARD STATISTIKASI (GET /api/admin/stats)
// ==========================================
export async function getAdminStats() {
  const [
    guidesCount,
    touristsCount,
    totalExperiences,
    activeExperiences,
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    revenueResult,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'GUIDE' } }),
    prisma.user.count({ where: { role: 'TOURIST' } }),
    prisma.experience.count(),
    prisma.experience.count({ where: { isActive: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
    prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
    prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
    prisma.booking.aggregate({
      where: { paymentStatus: PaymentStatus.PAID },
      _sum: { totalPrice: true },
    }),
  ]);

  const totalRevenue = Number(revenueResult._sum.totalPrice ?? 0);
  const platformCommission = parseFloat((totalRevenue * env.commissionRate).toFixed(2));

  // Oxirgi 30 kunlik trend hisoblash
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const recentBookings = await prisma.booking.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
      totalPrice: true,
      paymentStatus: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Kunlar bo'yicha guruhlash
  const trendMap: Record<string, { date: string; bookingsCount: number; revenue: number }> = {};
  for (let i = 0; i <= 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    trendMap[dateStr] = { date: dateStr, bookingsCount: 0, revenue: 0 };
  }

  for (const b of recentBookings) {
    const dateStr = b.createdAt.toISOString().split('T')[0];
    if (trendMap[dateStr]) {
      trendMap[dateStr].bookingsCount += 1;
      if (b.paymentStatus === PaymentStatus.PAID) {
        trendMap[dateStr].revenue += Number(b.totalPrice);
      }
    }
  }

  const last30DaysTrend = Object.values(trendMap);

  return {
    users: {
      guidesCount,
      touristsCount,
      totalUsers: guidesCount + touristsCount,
    },
    experiences: {
      total: totalExperiences,
      active: activeExperiences,
      inactive: totalExperiences - activeExperiences,
    },
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
    },
    financials: {
      totalRevenue,
      platformCommission,
      commissionRate: env.commissionRate,
      currency: 'USD',
    },
    last30DaysTrend,
  };
}

// ==========================================
// 2. GIDLAR BOSHQARUVI (GET & PATCH /api/admin/guides)
// ==========================================
export interface AdminGuidesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getAdminGuides(query: AdminGuidesQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.UserWhereInput = {
    role: 'GUIDE',
  };

  if (query.search && query.search.trim()) {
    const search = query.search.trim();
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, guides] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        telegramHandle: true,
        commissionRate: true,
        language: true,
        createdAt: true,
        experiences: {
          select: {
            id: true,
            title: true,
            isActive: true,
            bookings: {
              select: {
                totalPrice: true,
                paymentStatus: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const data = guides.map((guide) => {
    const allBookings = guide.experiences.flatMap((e) => e.bookings);
    const paidBookings = allBookings.filter((b) => b.paymentStatus === PaymentStatus.PAID);
    const totalRevenue = paidBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0);

    return {
      id: guide.id,
      name: guide.name,
      email: guide.email,
      phone: guide.phone,
      avatar: guide.avatar,
      telegramHandle: guide.telegramHandle,
      commissionRate: guide.commissionRate,
      language: guide.language,
      createdAt: guide.createdAt,
      experiencesCount: guide.experiences.length,
      activeExperiencesCount: guide.experiences.filter((e) => e.isActive).length,
      bookingsCount: allBookings.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    };
  });

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateGuideCommission(guideId: string, commissionRate: number) {
  if (commissionRate < 0 || commissionRate > 100) {
    throw new HttpError(400, 'Commission rate must be between 0 and 100 percent');
  }

  const user = await prisma.user.findUnique({
    where: { id: guideId },
  });

  if (!user || user.role !== 'GUIDE') {
    throw new HttpError(404, 'Guide not found');
  }

  return prisma.user.update({
    where: { id: guideId },
    data: { commissionRate },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      commissionRate: true,
      updatedAt: true,
    },
  });
}

// ==========================================
// 3. TURLARNI MODERATSIYA QILISH (GET & PATCH /api/admin/experiences)
// ==========================================
export interface AdminExperiencesQuery {
  page?: number;
  limit?: number;
  city?: string;
  isActive?: boolean;
  search?: string;
  guideId?: string;
}

export async function getAdminExperiences(query: AdminExperiencesQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.ExperienceWhereInput = {};

  if (query.city) {
    whereClause.city = { equals: query.city, mode: 'insensitive' };
  }

  if (query.isActive !== undefined) {
    whereClause.isActive = query.isActive;
  }

  if (query.guideId) {
    whereClause.guideId = query.guideId;
  }

  if (query.search && query.search.trim()) {
    whereClause.title = { contains: query.search.trim(), mode: 'insensitive' };
  }

  const [total, experiences] = await Promise.all([
    prisma.experience.count({ where: whereClause }),
    prisma.experience.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            availableDates: true,
          },
        },
      },
    }),
  ]);

  return {
    data: experiences,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateExperienceStatus(experienceId: string, isActive: boolean) {
  const exp = await prisma.experience.findUnique({
    where: { id: experienceId },
  });

  if (!exp) {
    throw new HttpError(404, 'Experience not found');
  }

  return prisma.experience.update({
    where: { id: experienceId },
    data: { isActive },
    include: {
      guide: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function deleteExperienceByAdmin(experienceId: string) {
  const exp = await prisma.experience.findUnique({
    where: { id: experienceId },
    include: { _count: { select: { bookings: true } } },
  });

  if (!exp) {
    throw new HttpError(404, 'Experience not found');
  }

  // Agar buyurtmalari bo'lsa, xavfsizlik uchun turni o'chirmasdan yashirib qo'yamiz
  if (exp._count.bookings > 0) {
    return prisma.experience.update({
      where: { id: experienceId },
      data: { isActive: false },
    });
  }

  return prisma.experience.delete({
    where: { id: experienceId },
  });
}

// ==========================================
// 4. BUYURTMALAR MONITORINGI (GET & PATCH /api/admin/bookings)
// ==========================================
export interface AdminBookingsQuery {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  guideId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAdminBookings(query: AdminBookingsQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.BookingWhereInput = {};

  if (query.status && Object.values(BookingStatus).includes(query.status as BookingStatus)) {
    whereClause.status = query.status as BookingStatus;
  }

  if (query.paymentStatus && Object.values(PaymentStatus).includes(query.paymentStatus as PaymentStatus)) {
    whereClause.paymentStatus = query.paymentStatus as PaymentStatus;
  }

  if (query.guideId) {
    whereClause.experience = { guideId: query.guideId };
  }

  if (query.startDate || query.endDate) {
    whereClause.createdAt = {};
    if (query.startDate) whereClause.createdAt.gte = new Date(query.startDate);
    if (query.endDate) whereClause.createdAt.lte = new Date(query.endDate);
  }

  if (query.search && query.search.trim()) {
    const search = query.search.trim();
    whereClause.OR = [
      { voucherCode: { contains: search, mode: 'insensitive' } },
      { referralCode: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { phone: { contains: search, mode: 'insensitive' } } },
      { experience: { title: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where: whereClause }),
    prisma.booking.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        experience: {
          select: {
            id: true,
            title: true,
            city: true,
            guideId: true,
            guide: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        availableDate: {
          select: {
            id: true,
            date: true,
          },
        },
      },
    }),
  ]);

  return {
    data: bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateBookingStatusByAdmin(bookingId: string, status: BookingStatus) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new HttpError(404, 'Booking not found');
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status },
    include: {
      user: { select: { id: true, name: true, email: true } },
      experience: { select: { id: true, title: true, city: true } },
    },
  });
}

// ==========================================
// 5. MAVJUD FUNKSIYALAR (Backward-Compatibility)
// ==========================================

export async function getAllBookings(statusFilter?: string) {
  const whereClause =
    statusFilter && Object.values(BookingStatus).includes(statusFilter as BookingStatus)
      ? { status: statusFilter as BookingStatus }
      : {};

  return prisma.booking.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      experience: { select: { id: true, title: true, city: true, guideId: true } },
      availableDate: { select: { date: true } },
    },
  });
}

export async function getCommissionReport(): Promise<CommissionReport[]> {
  const commissionRate = env.commissionRate;

  const guides = await prisma.user.findMany({
    where: { role: 'GUIDE' },
    select: {
      id: true,
      name: true,
      email: true,
      experiences: {
        select: {
          bookings: {
            where: { paymentStatus: PaymentStatus.PAID },
            select: { totalPrice: true, participantsCount: true },
          },
        },
      },
    },
  });

  const report: CommissionReport[] = guides.map((guide) => {
    const allBookings = guide.experiences.flatMap((exp) => exp.bookings);
    const totalRevenue = allBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0);
    const platformCommission = totalRevenue * commissionRate;
    const netPayout = totalRevenue - platformCommission;

    return {
      guideId: guide.id,
      guideName: guide.name,
      guideEmail: guide.email,
      totalBookings: allBookings.length,
      totalRevenue,
      platformCommission: parseFloat(platformCommission.toFixed(2)),
      netPayout: parseFloat(netPayout.toFixed(2)),
    };
  });

  return report.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export async function adminCreateExperience(data: CreateExperienceDto) {
  return createExpService(data);
}

export async function getPlatformStats() {
  const [totalUsers, totalExperiences, totalBookings, revenueResult] = await Promise.all([
    prisma.user.count(),
    prisma.experience.count(),
    prisma.booking.count(),
    prisma.booking.aggregate({
      where: { paymentStatus: PaymentStatus.PAID },
      _sum: { totalPrice: true },
    }),
  ]);

  const totalRevenue = Number(revenueResult._sum.totalPrice ?? 0);

  return {
    totalUsers,
    totalExperiences,
    totalBookings,
    totalRevenue,
    platformCommission: parseFloat((totalRevenue * env.commissionRate).toFixed(2)),
    commissionRate: env.commissionRate,
  };
}

export async function getReferralStats() {
  const hotelCommissionRate = env.commissionRate || 0.10;

  const groups = await prisma.booking.groupBy({
    by: ['referralCode'],
    where: {
      referralCode: { not: null },
    },
    _count: {
      id: true,
    },
    _sum: {
      totalPrice: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  return groups.map((g) => {
    const totalAmount = Number(g._sum.totalPrice ?? 0);
    const commission = parseFloat((totalAmount * hotelCommissionRate).toFixed(2));
    return {
      referralCode: g.referralCode,
      totalBookings: g._count.id,
      totalAmount,
      commission,
      commissionRate: hotelCommissionRate,
    };
  });
}
