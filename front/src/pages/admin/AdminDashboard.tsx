import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Spin, Tag, Button, Progress, Alert } from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  TeamOutlined,
  CompassOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../services/admin.api';

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    refetchInterval: 30000, // har 30 soniyada yangilanish
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spin size="large" />
        <span className="text-slate-400 text-sm">Dashboard statistikasi yuklanmoqda...</span>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <Alert
        type="error"
        message="Statistika yuklashda xatolik yuz berdi"
        description="Iltimos, qayta urinib ko'ring yoki internet aloqangizni tekshiring."
        action={
          <Button size="small" type="primary" onClick={() => refetch()}>
            Qayta yuklash
          </Button>
        }
        className="my-6"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Platforma Ko'rsatkichlari
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            TripUz platformasining real vaqtdagi faoliyati, daromad va foydalanuvchilar statistikasi
          </p>
        </div>

        <Button
          icon={<ReloadOutlined className={isFetching ? 'animate-spin' : ''} />}
          onClick={() => refetch()}
          loading={isFetching}
          className="bg-slate-800 text-slate-200 border-slate-700 hover:text-amber-400 hover:border-amber-400 self-start sm:self-auto"
        >
          Yangilash
        </Button>
      </div>

      {/* ─── Top Stats Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Jami Tushum & Komissiya */}
        <div className="bg-[#131A22] rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Jami Tushum
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg">
              <DollarOutlined />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ${stats.financials.totalRevenue.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-800/80">
            <span className="text-slate-400">Platforma ulushi:</span>
            <span className="font-bold text-amber-400">
              ${stats.financials.platformCommission.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 2. Jami Buyurtmalar */}
        <div className="bg-[#131A22] rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Buyurtmalar
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-lg">
              <ShoppingOutlined />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.bookings.total} <span className="text-xs font-normal text-slate-400">ta</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-800/80">
            <span className="text-slate-400">Tugallangan:</span>
            <span className="font-bold text-emerald-400">{stats.bookings.completed} ta</span>
          </div>
        </div>

        {/* 3. Gidlar & Turistlar */}
        <div className="bg-[#131A22] rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Foydalanuvchilar
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">
              <TeamOutlined />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.users.totalUsers} <span className="text-xs font-normal text-slate-400">jami</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-800/80">
            <span className="text-slate-400">Gidlar: <strong className="text-white">{stats.users.guidesCount}</strong></span>
            <span className="text-slate-400">Turistlar: <strong className="text-white">{stats.users.touristsCount}</strong></span>
          </div>
        </div>

        {/* 4. Turlar (Experiences) */}
        <div className="bg-[#131A22] rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ekskursiyalar
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-lg">
              <CompassOutlined />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.experiences.total} <span className="text-xs font-normal text-slate-400">ta</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-800/80">
            <span className="text-emerald-400 font-semibold">{stats.experiences.active} ta faol</span>
            <span className="text-slate-500">{stats.experiences.inactive} ta nofaol</span>
          </div>
        </div>
      </div>

      {/* ─── Buyurtmalar Holati & Tezkor O'tish ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buyurtmalar statusi taqsimoti */}
        <div className="lg:col-span-2 bg-[#131A22] rounded-2xl p-6 border border-slate-800/80 shadow-lg">
          <h2 className="text-base font-bold text-white mb-4">
            Buyurtmalar Holati Taqsimoti
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-amber-400 font-bold text-xl">{stats.bookings.pending}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                <ClockCircleOutlined /> Kutilmoqda
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-blue-400 font-bold text-xl">{stats.bookings.confirmed}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                <SafetyCertificateOutlined /> Tasdiqlangan
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-emerald-400 font-bold text-xl">{stats.bookings.completed}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                <CheckCircleOutlined /> Yakunlangan
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-rose-400 font-bold text-xl">{stats.bookings.cancelled}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                <CloseCircleOutlined /> Bekor qilingan
              </div>
            </div>
          </div>

          {/* Konversiya / Bajarilish progressi */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Muvaffaqiyatli yakunlanish nisbati</span>
              <span className="font-bold text-white">
                {stats.bookings.total > 0
                  ? Math.round((stats.bookings.completed / stats.bookings.total) * 100)
                  : 0}
                %
              </span>
            </div>
            <Progress
              percent={
                stats.bookings.total > 0
                  ? Math.round((stats.bookings.completed / stats.bookings.total) * 100)
                  : 0
              }
              strokeColor="#10B981"
              trailColor="#1E293B"
              showInfo={false}
            />
          </div>
        </div>

        {/* Tezkor Boshqaruv Havolalari */}
        <div className="bg-[#131A22] rounded-2xl p-6 border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-2">Tezkor Boshqaruv</h2>
            <p className="text-xs text-slate-400 mb-4">
              Kerakli bo'limga tezkor o'tish orqali boshqarish:
            </p>

            <div className="space-y-2.5">
              <Link
                to="/admin/guides"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-amber-400 transition-all"
              >
                <span className="flex items-center gap-2">
                  <TeamOutlined className="text-amber-400" /> Gidlar Ro'yxati & Komissiya
                </span>
                <span>→</span>
              </Link>

              <Link
                to="/admin/experiences"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-sky-400 transition-all"
              >
                <span className="flex items-center gap-2">
                  <CompassOutlined className="text-sky-400" /> Turlarni Moderatsiya Qilish
                </span>
                <span>→</span>
              </Link>

              <Link
                to="/admin/bookings"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-emerald-400 transition-all"
              >
                <span className="flex items-center gap-2">
                  <ShoppingOutlined className="text-emerald-400" /> Barcha Buyurtmalar Monitoringi
                </span>
                <span>→</span>
              </Link>

              <Link
                to="/admin/referrals"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-indigo-400 transition-all"
              >
                <span className="flex items-center gap-2">
                  <DollarOutlined className="text-indigo-400" /> Mehmonxona Referral Statistikasi
                </span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Oxirgi 30 Kunlik Faollik (Trend) ─────────────────────────────────── */}
      <div className="bg-[#131A22] rounded-2xl p-6 border border-slate-800/80 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Oxirgi 30 Kunlik Dinamika</h2>
            <p className="text-xs text-slate-400">Kunlik buyurtmalar va tushumlar harakati</p>
          </div>
          <Tag color="gold" className="m-0 border-none bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1">
            Real-vaqt tahlili
          </Tag>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px] grid grid-cols-31 gap-1.5 items-end h-36 pt-4 px-2 border-b border-slate-800">
            {stats.last30DaysTrend.map((item, idx) => {
              const maxBookings = Math.max(...stats.last30DaysTrend.map((t) => t.bookingsCount), 1);
              const heightPct = Math.max(10, Math.round((item.bookingsCount / maxBookings) * 100));

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-1 group relative h-full justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 border border-slate-700 shadow-xl">
                    <div>{item.date}</div>
                    <div className="text-amber-400 font-bold">{item.bookingsCount} ta buyurtma</div>
                    <div className="text-emerald-400">${item.revenue}</div>
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${
                      item.bookingsCount > 0
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300'
                        : 'bg-slate-800/60'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-2 px-2">
            <span>30 kun avval</span>
            <span>Bugun</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
