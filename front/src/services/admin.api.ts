import { api } from './api';

export interface AdminStatsResponse {
  users: {
    guidesCount: number;
    touristsCount: number;
    totalUsers: number;
  };
  experiences: {
    total: number;
    active: number;
    inactive: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  financials: {
    totalRevenue: number;
    platformCommission: number;
    commissionRate: number;
    currency: string;
  };
  last30DaysTrend: Array<{
    date: string;
    bookingsCount: number;
    revenue: number;
  }>;
}

export interface AdminGuidesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminGuideItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  telegramHandle: string | null;
  commissionRate: number;
  language: string | null;
  createdAt: string;
  experiencesCount: number;
  activeExperiencesCount: number;
  bookingsCount: number;
  totalRevenue: number;
}

export interface AdminTouristsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminTouristBookingItem {
  id: string;
  voucherCode: string;
  participantsCount: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  experience?: {
    id: string;
    title: string;
    city: string;
  };
  availableDate?: {
    date: string;
  };
}

export interface AdminTouristItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  telegramHandle: string | null;
  language: string | null;
  createdAt: string;
  bookingsCount: number;
  totalSpent: number;
  bookings: AdminTouristBookingItem[];
}

export interface AdminExperiencesQuery {
  page?: number;
  limit?: number;
  city?: string;
  isActive?: boolean;
  search?: string;
  guideId?: string;
}

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

export interface AdminReferralItem {
  referralCode: string;
  totalBookings: number;
  totalAmount: number;
  commission: number;
  commissionRate: number;
}

// 1. Dashboard stats
export async function getAdminStats(): Promise<AdminStatsResponse> {
  const res = await api.get<{ success: boolean; data: AdminStatsResponse }>('/admin/stats');
  return res.data.data;
}

// 2. Guides
export async function getAdminGuides(params?: AdminGuidesQuery) {
  const res = await api.get<{
    success: boolean;
    data: AdminGuideItem[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>('/admin/guides', { params });
  return res.data;
}

export async function updateGuideCommission(guideId: string, commissionRate: number) {
  const res = await api.patch<{ success: boolean; message: string; data: any }>(
    `/admin/guides/${guideId}`,
    { commissionRate }
  );
  return res.data;
}

// 2.1. Tourists
export async function getAdminTourists(params?: AdminTouristsQuery) {
  const res = await api.get<{
    success: boolean;
    data: AdminTouristItem[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>('/admin/tourists', { params });
  return res.data;
}

export async function deleteAdminUser(userId: string) {
  const res = await api.delete<{ success: boolean; message: string }>(`/admin/users/${userId}`);
  return res.data;
}

// 3. Experiences
export async function getAdminExperiences(params?: AdminExperiencesQuery) {
  const res = await api.get<{
    success: boolean;
    data: any[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>('/admin/experiences', { params });
  return res.data;
}

export async function updateExperienceStatus(id: string, isActive: boolean) {
  const res = await api.patch<{ success: boolean; message: string; data: any }>(
    `/admin/experiences/${id}/status`,
    { isActive }
  );
  return res.data;
}

export async function deleteExperience(id: string) {
  const res = await api.delete<{ success: boolean; message: string }>(`/admin/experiences/${id}`);
  return res.data;
}

export async function createAdminExperience(data: any) {
  const res = await api.post<{ success: boolean; message: string; data: any }>(
    '/admin/experiences',
    data
  );
  return res.data;
}

export async function updateAdminExperience(id: string, data: any) {
  const res = await api.put<{ success: boolean; message: string; data: any }>(
    `/admin/experiences/${id}`,
    data
  );
  return res.data;
}

export async function addExperienceDate(experienceId: string, data: { date: string; slots?: number; maxCapacity?: number }) {
  const res = await api.post<{ success: boolean; message: string; data: any }>(
    `/admin/experiences/${experienceId}/dates`,
    data
  );
  return res.data;
}

export async function deleteExperienceDate(dateId: string) {
  const res = await api.delete<{ success: boolean; message: string }>(
    `/admin/experiences/dates/${dateId}`
  );
  return res.data;
}

// 4. Bookings
export async function getAdminBookings(params?: AdminBookingsQuery) {
  const res = await api.get<{
    success: boolean;
    data: any[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>('/admin/bookings', { params });
  return res.data;
}

export async function updateBookingStatus(id: string, status: string) {
  const res = await api.patch<{ success: boolean; message: string; data: any }>(
    `/admin/bookings/${id}/status`,
    { status }
  );
  return res.data;
}

// 5. Referrals
export async function getAdminReferrals(): Promise<AdminReferralItem[]> {
  const res = await api.get<{ success: boolean; data: AdminReferralItem[] }>('/admin/referrals');
  return res.data.data;
}
