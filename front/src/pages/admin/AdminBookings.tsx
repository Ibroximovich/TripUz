import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Input, Button, Tag, Select, Modal, message } from 'antd';
import {
  BookOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { getAdminBookings, updateBookingStatus } from '../../services/admin.api';

export const AdminBookings: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

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
    onSuccess: () => {
      message.success('Buyurtma holati muvaffaqiyatli yangilandi');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
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
      render: (val: string) => (
        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          {val}
        </span>
      ),
    },
    {
      title: 'Turist',
      key: 'user',
      render: (_: any, record: any) => (
        <div>
          <div className="font-bold text-white text-xs">{record.user?.name}</div>
          <div className="text-[11px] text-slate-400">{record.user?.email}</div>
          {record.user?.phone && (
            <div className="text-[10px] text-slate-500">{record.user?.phone}</div>
          )}
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
            Gid: <span className="text-slate-300">{record.experience?.guide?.name}</span>
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
            {record.availableDate?.date
              ? new Date(record.availableDate.date).toLocaleDateString()
              : '—'}
          </div>
          <div className="text-slate-400 text-[11px]">
            {record.participantsCount} kishi
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
    </div>
  );
};
export default AdminBookings;
