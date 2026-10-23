import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Input,
  Button,
  Modal,
  Tag,
  Avatar,
  Badge,
  Popconfirm,
  message,
} from 'antd';
import {
  UserOutlined,
  ReloadOutlined,
  EyeOutlined,
  PhoneOutlined,
  MailOutlined,
  SendOutlined,
  DollarOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  CompassOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAdminTourists, deleteAdminUser, type AdminTouristItem } from '../../services/admin.api';

export const AdminTourists: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTourist, setSelectedTourist] = useState<AdminTouristItem | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-tourists', page, search],
    queryFn: () => getAdminTourists({ page, limit: 10, search: search.trim() || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => {
      message.success("Turist bazadan muvaffaqiyatli o'chirildi");
      queryClient.invalidateQueries({ queryKey: ['admin-tourists'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (selectedTourist) setSelectedTourist(null);
    },
    onError: () => {
      message.error("Turistni o'chirishda xatolik yuz berdi");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Tag color="green" icon={<CheckCircleOutlined />}>Tasdiqlangan</Tag>;
      case 'COMPLETED':
        return <Tag color="cyan" icon={<CheckCircleOutlined />}>Yakunlangan</Tag>;
      case 'CANCELLED':
        return <Tag color="red" icon={<CloseCircleOutlined />}>Bekor qilingan</Tag>;
      default:
        return <Tag color="orange" icon={<ClockCircleOutlined />}>Kutilmoqda</Tag>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge status="success" text={<span className="text-emerald-400 font-medium text-xs">To'langan</span>} />;
      case 'REFUNDED':
        return <Badge status="error" text={<span className="text-rose-400 font-medium text-xs">Qaytarilgan</span>} />;
      default:
        return <Badge status="warning" text={<span className="text-amber-400 font-medium text-xs">Kutilmoqda</span>} />;
    }
  };

  const columns = [
    {
      title: 'Turist',
      key: 'name',
      render: (_: any, record: AdminTouristItem) => (
        <div
          onClick={() => setSelectedTourist(record)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            className="bg-sky-600/30 text-sky-300 border border-sky-500/30 group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="font-bold text-white text-sm group-hover:text-sky-400 transition-colors">
              {record.name}
            </div>
            <div className="text-xs text-slate-400">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      render: (val: string | null) =>
        val ? (
          <a href={`tel:${val}`} className="text-sky-400 text-xs hover:underline flex items-center gap-1">
            <PhoneOutlined /> {val}
          </a>
        ) : (
          <span className="text-slate-500 text-xs">—</span>
        ),
    },
    {
      title: 'Telegram',
      dataIndex: 'telegramHandle',
      key: 'telegramHandle',
      render: (val: string | null) =>
        val ? (
          <a
            href={`https://t.me/${val.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 text-xs hover:underline flex items-center gap-1"
          >
            <SendOutlined /> {val}
          </a>
        ) : (
          <span className="text-slate-500 text-xs">—</span>
        ),
    },
    {
      title: 'Buyurtmalar soni',
      dataIndex: 'bookingsCount',
      key: 'bookingsCount',
      render: (val: number) => (
        <Tag color="blue" className="font-bold text-xs">
          {val} ta buyurtma
        </Tag>
      ),
    },
    {
      title: 'Jami Haridlari',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (val: number) => (
        <span className="font-bold text-emerald-400 text-sm">
          ${Number(val).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Ro'yxatdan o'tgan",
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => (
        <span className="text-xs text-slate-400">
          {dayjs(val).format('DD.MM.YYYY')}
        </span>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: AdminTouristItem) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedTourist(record)}
            className="bg-slate-800 text-sky-400 border-slate-700 hover:text-sky-300 hover:border-sky-500 text-xs font-medium"
          >
            Batafsil
          </Button>
          <Popconfirm
            title="Turistni o'chirish"
            description="Ushbu turistni bazadan butunlay o'chirishga ishonchingiz komilmi? Uning barcha buyurtmalari ham o'chadi."
            okText="Ha, o'chirish"
            cancelText="Yo'q"
            okType="danger"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button
              size="small"
              danger
              type="text"
              icon={<DeleteOutlined />}
              className="hover:bg-rose-500/20"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <UserOutlined className="text-sky-400" /> Turistlar Boshqaruvi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Platformada ro'yxatdan o'tgan barcha sayyohlar, ularning buyurtmalari va sarflangan mablag'lari
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Ism, email yoki telefon..."
            allowClear
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            className="w-64"
          />
          <Button
            icon={<ReloadOutlined className={isFetching ? 'animate-spin' : ''} />}
            onClick={() => refetch()}
            loading={isFetching}
            className="bg-slate-800 text-slate-200 border-slate-700 hover:text-sky-400"
          />
        </div>
      </div>

      <div className="bg-[#131A22] rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <Table
          dataSource={data?.data || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1050 }}
          pagination={{
            current: page,
            pageSize: 10,
            total: data?.pagination.total || 0,
            onChange: (p) => setPage(p),
            showTotal: (total) => `Jami: ${total} ta turist`,
          }}
          className="dark-table"
        />
      </div>

      {/* Turist Profili va Buyurtmalar tarixi Modali */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
            <UserOutlined className="text-sky-400" />
            <span>Turist Profili va Buyurtmalar Tarixi</span>
          </div>
        }
        open={!!selectedTourist}
        onCancel={() => setSelectedTourist(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedTourist(null)} className="bg-slate-800 text-slate-300 border-slate-700">
            Yopish
          </Button>,
        ]}
        width={750}
        centered
        className="dark-modal"
      >
        {selectedTourist && (
          <div className="space-y-5 pt-2 max-h-[75vh] overflow-y-auto pr-1">
            {/* User Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="flex items-center gap-4">
                <Avatar
                  size={54}
                  src={selectedTourist.avatar}
                  icon={<UserOutlined />}
                  className="bg-sky-600/30 text-sky-300 border border-sky-500/40 text-2xl flex-shrink-0"
                />
                <div>
                  <div className="text-base font-bold text-white">{selectedTourist.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MailOutlined className="text-slate-500" />
                    <a href={`mailto:${selectedTourist.email}`} className="text-slate-300 hover:text-sky-400">
                      {selectedTourist.email}
                    </a>
                  </div>
                  {selectedTourist.phone && (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <PhoneOutlined className="text-slate-500" />
                      <a href={`tel:${selectedTourist.phone}`} className="text-sky-400 font-medium">
                        {selectedTourist.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {selectedTourist.telegramHandle && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  href={`https://t.me/${selectedTourist.telegramHandle.replace('@', '')}`}
                  target="_blank"
                  className="bg-sky-600 hover:bg-sky-500 border-none text-xs"
                >
                  Telegram
                </Button>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
                  <DollarOutlined />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Jami Sarflangan</div>
                  <div className="text-base font-bold text-emerald-400">
                    ${selectedTourist.totalSpent.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-lg">
                  <ShoppingOutlined />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Jami Buyurtmalar</div>
                  <div className="text-base font-bold text-white">
                    {selectedTourist.bookingsCount} ta
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
                  <CalendarOutlined />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Ro'yxatdan o'tgan</div>
                  <div className="text-xs font-semibold text-slate-200">
                    {dayjs(selectedTourist.createdAt).format('DD.MM.YYYY')}
                  </div>
                </div>
              </div>
            </div>

            {/* Buyurtmalar Tarixi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Turist Buyurtmalari ({selectedTourist.bookings?.length || 0})
                </span>
              </div>

              {selectedTourist.bookings && selectedTourist.bookings.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedTourist.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 bg-slate-900/50 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <CompassOutlined className="text-amber-400" />
                          <span className="text-sm font-bold text-white">
                            {b.experience?.title || 'Ekskursiya'}
                          </span>
                          {b.experience?.city && (
                            <span className="text-xs text-amber-400">({b.experience.city})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(b.status)}
                          {getPaymentBadge(b.paymentStatus)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 pt-1">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Voucher Kori:</span>
                          <span className="font-mono font-semibold text-sky-400">{b.voucherCode}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Sayohatchilar:</span>
                          <span className="font-semibold text-white">{b.participantsCount} kishi</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Tur Sanasi:</span>
                          <span className="font-semibold text-slate-200">
                            {b.availableDate?.date ? dayjs(b.availableDate.date).format('DD-MMM YYYY') : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Summa:</span>
                          <span className="font-bold text-emerald-400 text-sm">${Number(b.totalPrice).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-6 bg-slate-900/30 rounded-xl border border-slate-800/60">
                  Ushbu turist hali birorta ham buyurtma qilmagan.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTourists;
