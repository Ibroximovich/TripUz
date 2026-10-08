import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Input,
  Button,
  Tag,
  Select,
  Modal,
  message,
  Avatar,
  Divider,
  Space,
} from 'antd';
import {
  BookOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined,
  CompassOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { getAdminBookings, updateBookingStatus } from '../../services/admin.api';

export const AdminBookings: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-bookings', page, search, status, paymentStatus],
    queryFn: () =>
      getAdminBookings({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status,
        paymentStatus,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateBookingStatus(id, status),
    onSuccess: (_, variables) => {
      message.success('Buyurtma holati muvaffaqiyatli yangilandi');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (selectedBooking && selectedBooking.id === variables.id) {
        setSelectedBooking((prev: any) => ({ ...prev, status: variables.status }));
      }
    },
    onError: () => {
      message.error('Holatni yangilashda xatolik yuz berdi');
    },
  });

  const getStatusTag = (st: string) => {
    switch (st) {
      case 'PENDING':
        return <Tag color="gold" icon={<ClockCircleOutlined />}>Kutilmoqda</Tag>;
      case 'CONFIRMED':
        return <Tag color="blue" icon={<SafetyCertificateOutlined />}>Tasdiqlangan</Tag>;
      case 'COMPLETED':
        return <Tag color="green" icon={<CheckCircleOutlined />}>Yakunlangan</Tag>;
      case 'CANCELLED':
        return <Tag color="red" icon={<CloseCircleOutlined />}>Bekor qilingan</Tag>;
      default:
        return <Tag>{st}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Voucher / ID',
      dataIndex: 'voucherCode',
      key: 'voucherCode',
      render: (val: string, record: any) => (
        <span
          onClick={() => setSelectedBooking(record)}
          className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors"
        >
          {val || `#${record.id.slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      title: 'Turist',
      key: 'user',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <Avatar
            size="small"
            src={record.user?.avatar}
            icon={<UserOutlined />}
            className="bg-slate-700 text-slate-300"
          />
          <div>
            <div className="font-bold text-white text-xs">{record.user?.name}</div>
            <div className="text-[11px] text-slate-400">{record.user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Tur & Gid',
      key: 'experience',
      render: (_: any, record: any) => (
        <div className="max-w-xs">
          <div className="font-semibold text-slate-200 text-xs truncate">
            {record.experience?.title}
          </div>
          <div className="text-[11px] text-slate-400">
            Gid: <span className="text-amber-400">{record.experience?.guide?.name}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Sana & Odam',
      key: 'date',
      render: (_: any, record: any) => (
        <div className="text-xs">
          <div className="text-slate-200">
            {record.bookingDate || record.availableDate?.date
              ? new Date(record.bookingDate || record.availableDate?.date).toLocaleDateString()
              : '—'}
          </div>
          <div className="text-slate-400 text-[11px]">
            {record.numberOfPeople || record.participantsCount || 1} kishi
          </div>
        </div>
      ),
    },
    {
      title: 'Summa',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (val: any) => (
        <span className="font-bold text-emerald-400">${Number(val).toLocaleString()}</span>
      ),
    },
    {
      title: 'Holati',
      key: 'status',
      render: (_: any, record: any) => (
        <Select
          size="small"
          value={record.status}
          onChange={(newVal) =>
            updateStatusMutation.mutate({ id: record.id, status: newVal })
          }
          className="w-32"
          options={[
            { label: 'Kutilmoqda', value: 'PENDING' },
            { label: 'Tasdiqlangan', value: 'CONFIRMED' },
            { label: 'Yakunlangan', value: 'COMPLETED' },
            { label: 'Bekor qilingan', value: 'CANCELLED' },
          ]}
        />
      ),
    },
    {
      title: 'To\'lov',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (val: string) => (
        <Tag color={val === 'PAID' ? 'green' : 'orange'}>
          {val === 'PAID' ? 'To\'langan' : 'Kutilmoqda'}
        </Tag>
      ),
    },
    {
      title: 'Referral',
      dataIndex: 'referralCode',
      key: 'referralCode',
      render: (val: string | null) =>
        val ? (
          <Tag color="purple" className="text-[10px]">
            {val}
          </Tag>
        ) : (
          <span className="text-slate-600 text-xs">—</span>
        ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setSelectedBooking(record)}
          className="bg-slate-800 text-sky-400 border-slate-700 hover:text-sky-300 hover:border-sky-500"
        >
          Batafsil
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOutlined className="text-emerald-400" /> Buyurtmalar Monitoringi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Barcha bron qilingan turlar, turistlar, to'lov holati va statuslarni real-vaqtda boshqarish
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            placeholder="Status"
            allowClear
            value={status}
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            className="w-32"
            options={[
              { label: 'Kutilmoqda', value: 'PENDING' },
              { label: 'Tasdiqlangan', value: 'CONFIRMED' },
              { label: 'Yakunlangan', value: 'COMPLETED' },
              { label: 'Bekor qilingan', value: 'CANCELLED' },
            ]}
          />
          <Select
            placeholder="To'lov"
            allowClear
            value={paymentStatus}
            onChange={(val) => {
              setPaymentStatus(val);
              setPage(1);
            }}
            className="w-32"
            options={[
              { label: 'To\'langan (PAID)', value: 'PAID' },
              { label: 'Kutilmoqda (PENDING)', value: 'PENDING' },
            ]}
          />
          <Input.Search
            placeholder="Voucher, turist, email..."
            allowClear
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            className="w-56"
          />
          <Button
            icon={<ReloadOutlined className={isFetching ? 'animate-spin' : ''} />}
            onClick={() => refetch()}
            loading={isFetching}
            className="bg-slate-800 text-slate-200 border-slate-700 hover:text-amber-400"
          />
        </div>
      </div>

      <div className="bg-[#131A22] rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <Table
          dataSource={data?.data || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 10,
            total: data?.pagination.total || 0,
            onChange: (p) => setPage(p),
            showTotal: (total) => `Jami: ${total} ta buyurtma`,
          }}
          className="dark-table"
        />
      </div>

      {/* BOOKING DETAIL MODAL */}
      <Modal
        title={
          <div className="flex items-center justify-between pr-8">
            <span className="text-lg font-bold text-white flex items-center gap-2">
              <BookOutlined className="text-emerald-400" /> Buyurtma Tafsilotlari
            </span>
            {selectedBooking && getStatusTag(selectedBooking.status)}
          </div>
        }
        open={!!selectedBooking}
        onCancel={() => setSelectedBooking(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedBooking(null)}>
            Yopish
          </Button>,
        ]}
        width={700}
        centered
        className="dark-modal"
      >
        {selectedBooking && (
          <div className="space-y-5 pt-2 max-h-[75vh] overflow-y-auto pr-1">
            {/* Voucher Card Banner */}
            <div className="bg-gradient-to-r from-amber-600/20 via-slate-900 to-amber-900/20 p-4 rounded-xl border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">
                  Vaucher Kodi
                </div>
                <div className="text-xl font-mono font-black text-amber-400 tracking-wider mt-0.5">
                  {selectedBooking.voucherCode || `#${selectedBooking.id.slice(-8).toUpperCase()}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Jami Qiymat</div>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">
                  ${Number(selectedBooking.totalPrice).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Tourist & Guide Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tourist Info */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
                  <UserOutlined className="text-sky-400" /> Turist Ma'lumotlari
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Avatar
                    size={42}
                    src={selectedBooking.user?.avatar}
                    icon={<UserOutlined />}
                    className="bg-slate-800 text-sky-400 border border-slate-700"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">
                      {selectedBooking.user?.name || 'Noma\'lum turist'}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <MailOutlined className="text-slate-500" />
                      <a href={`mailto:${selectedBooking.user?.email}`} className="text-slate-300 hover:text-sky-400">
                        {selectedBooking.user?.email}
                      </a>
                    </div>
                    {selectedBooking.user?.phone && (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <PhoneOutlined className="text-slate-500" />
                        <a href={`tel:${selectedBooking.user?.phone}`} className="text-sky-400 font-medium">
                          {selectedBooking.user?.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Guide Info */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
                  <CompassOutlined className="text-amber-400" /> Biriktirilgan Gid
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Avatar
                    size={42}
                    src={selectedBooking.experience?.guide?.avatar}
                    icon={<UserOutlined />}
                    className="bg-amber-600/30 text-amber-300 border border-amber-500/40"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">
                      {selectedBooking.experience?.guide?.name || 'Noma\'lum gid'}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <MailOutlined className="text-slate-500" />
                      <a href={`mailto:${selectedBooking.experience?.guide?.email}`} className="text-slate-300 hover:text-amber-400">
                        {selectedBooking.experience?.guide?.email}
                      </a>
                    </div>
                    {selectedBooking.experience?.guide?.phone && (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <PhoneOutlined className="text-slate-500" />
                        <a href={`tel:${selectedBooking.experience?.guide?.phone}`} className="text-amber-400 font-medium">
                          {selectedBooking.experience?.guide?.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tour & Booking Details */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase">
                Tur Tafsilotlari
              </div>
              <div className="text-base font-bold text-white">
                {selectedBooking.experience?.title}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Shahar:</span>
                  <span className="text-slate-200 font-medium">{selectedBooking.experience?.city || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sana:</span>
                  <span className="text-slate-200 font-medium">
                    {selectedBooking.bookingDate || selectedBooking.availableDate?.date
                      ? new Date(selectedBooking.bookingDate || selectedBooking.availableDate?.date).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Kishi soni:</span>
                  <span className="text-slate-200 font-medium">
                    {selectedBooking.numberOfPeople || selectedBooking.participantsCount || 1} kishi
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Hamkor Kodi:</span>
                  <span className="text-purple-400 font-medium">
                    {selectedBooking.referralCode || 'To\'g\'ridan-to\'g\'ri'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Status Control */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-3">
                Buyurtma Holatini O'zgartirish
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="middle"
                  type={selectedBooking.status === 'CONFIRMED' ? 'primary' : 'default'}
                  icon={<SafetyCertificateOutlined />}
                  onClick={() =>
                    updateStatusMutation.mutate({ id: selectedBooking.id, status: 'CONFIRMED' })
                  }
                  loading={updateStatusMutation.isPending}
                  className="bg-blue-600/30 text-blue-300 border-blue-500/40 hover:bg-blue-600/50"
                >
                  Tasdiqlash (CONFIRMED)
                </Button>
                <Button
                  size="middle"
                  type={selectedBooking.status === 'COMPLETED' ? 'primary' : 'default'}
                  icon={<CheckCircleOutlined />}
                  onClick={() =>
                    updateStatusMutation.mutate({ id: selectedBooking.id, status: 'COMPLETED' })
                  }
                  loading={updateStatusMutation.isPending}
                  className="bg-emerald-600/30 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/50"
                >
                  Yakunlash (COMPLETED)
                </Button>
                <Button
                  size="middle"
                  danger
                  type={selectedBooking.status === 'CANCELLED' ? 'primary' : 'default'}
                  icon={<CloseCircleOutlined />}
                  onClick={() =>
                    updateStatusMutation.mutate({ id: selectedBooking.id, status: 'CANCELLED' })
                  }
                  loading={updateStatusMutation.isPending}
                >
                  Bekor qilish (CANCELLED)
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminBookings;
