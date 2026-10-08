import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Avatar, Dropdown, Modal, Drawer, Tag, Button } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  CompassOutlined,
  BookOutlined,
  ShareAltOutlined,
  LogoutOutlined,
  MenuOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import logoImg from '../../assets/logo.png';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const menuItems = [
    {
      key: '/admin',
      label: 'Asosiy Boshqaruv',
      icon: <DashboardOutlined className="text-lg" />,
    },
    {
      key: '/admin/guides',
      label: 'Gidlar',
      icon: <TeamOutlined className="text-lg" />,
    },
    {
      key: '/admin/experiences',
      label: 'Turlar Moderatsiyasi',
      icon: <CompassOutlined className="text-lg" />,
    },
    {
      key: '/admin/bookings',
      label: 'Buyurtmalar Monitoringi',
      icon: <BookOutlined className="text-lg" />,
    },
    {
      key: '/admin/referrals',
      label: 'Hamkorlar (Referral)',
      icon: <ShareAltOutlined className="text-lg" />,
    },
  ];

  const handleLogout = () => {
    Modal.confirm({
      title: 'Tizimdan chiqish',
      content: 'Admin panelidan chiqishni xohlaysizmi?',
      okText: 'Chiqish',
      cancelText: 'Bekor qilish',
      okType: 'danger',
      centered: true,
      className: 'dark-modal',
      onOk: () => {
        logout();
        navigate('/login');
      },
    });
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between py-4">
      <div className="space-y-1">
        <div className="px-3 mb-4">
          <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Platforma Boshqaruvi
          </div>
        </div>
        {menuItems.map((item) => {
          const active = isActive(item.key);
          return (
            <Link
              key={item.key}
              to={item.key}
              onClick={() => setMobileDrawerOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className={active ? 'text-amber-400' : 'text-slate-400'}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Pastki qism: Admin foydalanuvchi va chiqish */}
      <div className="pt-4 border-t border-slate-800/80 px-2 space-y-3">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <Avatar
            size={40}
            src={user?.avatar}
            icon={<UserOutlined />}
            className="bg-amber-600 border border-amber-400/50"
          />
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
            <Tag color="gold" className="m-0 text-[10px] mt-1 border-none bg-amber-500/15 text-amber-300">
              <SafetyCertificateOutlined className="mr-1" /> Super Admin
            </Tag>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
        >
          <LogoutOutlined />
          <span>Tizimdan chiqish</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100 flex flex-col font-sans">
      {/* ─── Top Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full bg-[#131A22]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
          >
            <MenuOutlined className="text-lg" />
          </button>

          <Link to="/admin" className="flex items-center gap-3 group">
            <img
              src={logoImg}
              alt="TripUz Admin"
              className="h-10 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-[0_2px_10px_rgba(217,119,6,0.25)]"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
                Boshqaruv Markazi
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-400 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all"
          >
            Saytni ko'rish (Jonli) ↗
          </Link>

          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <Avatar
              size={36}
              src={user?.avatar}
              icon={<UserOutlined />}
              className="bg-amber-600 border border-amber-400/50 cursor-pointer"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-white leading-tight">{user?.name || 'Admin'}</div>
              <div className="text-[10px] text-amber-400">ADMINISTRATOR</div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content Area with Sidebar ───────────────────────────────────── */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 bg-[#131A22] rounded-2xl border border-slate-800/80 p-4 h-[calc(100vh-6.5rem)] sticky top-20 shadow-xl">
          {navContent}
        </aside>

        {/* Mobil Drawer Menyusi */}
        <Drawer
          title={
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Logo" className="h-8 w-auto" />
              <span className="text-sm font-bold text-white">TripUz Admin</span>
            </div>
          }
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          styles={{
            body: { background: '#0F1419', padding: '16px' },
            header: { background: '#161F28', borderColor: '#1e293b' },
          }}
        >
          {navContent}
        </Drawer>

        {/* Main Content Router View */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
