import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Input, Button, Tag, Switch, Modal, Select, message, Popconfirm } from 'antd';
import {
  CompassOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { getAdminExperiences, updateExperienceStatus, deleteExperience } from '../../services/admin.api';

export const AdminExperiences: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-experiences', page, search, city],
    queryFn: () =>
      getAdminExperiences({
        page,
        limit: 10,
        search: search.trim() || undefined,
        city,
      }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateExperienceStatus(id, isActive),
    onSuccess: (_, variables) => {
      message.success(
        variables.isActive ? 'Tur muvaffaqiyatli faollashtirildi' : 'Tur yashirildi'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
    },
    onError: () => {
      message.error('Tur holatini o\'zgartirishda xatolik yuz berdi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExperience(id),
    onSuccess: () => {
      message.success('Tur muvaffaqiyatli o\'chirildi yoki yashirildi');
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
    },
    onError: () => {
      message.error('Turni o\'chirishda xatolik yuz berdi');
    },
  });

  const columns = [
    {
      title: 'Tur Nomi',
      key: 'title',
      render: (_: any, record: any) => (
        <div className="max-w-xs">
          <div className="font-bold text-white text-sm truncate">{record.title}</div>
          <div className="text-xs text-slate-400">
            Shahar: <span className="text-amber-400 font-medium">{record.city}</span> • {record.duration}
          </div>
        </div>
      ),
    },
    {
      title: 'Gid',
      key: 'guide',
      render: (_: any, record: any) => (
        <div>
          <div className="text-xs font-semibold text-slate-200">{record.guide?.name}</div>
          <div className="text-[11px] text-slate-400">{record.guide?.email}</div>
        </div>
      ),
    },
    {
      title: 'Narxi',
      key: 'price',
      render: (_: any, record: any) => (
        <div className="font-bold text-white">
          ${Number(record.priceUsd || record.price).toLocaleString()}
        </div>
      ),
    },
    {
      title: 'Buyurtmalar',
      key: 'bookings',
      render: (_: any, record: any) => (
        <Tag color="blue">{record._count?.bookings || 0} ta buyurtma</Tag>
      ),
    },
    {
      title: 'Holati',
      key: 'isActive',
      render: (_: any, record: any) => (
        <Switch
          checkedChildren="Faol"
          unCheckedChildren="Yashirilgan"
          checked={record.isActive}
          loading={toggleStatusMutation.isPending}
          onChange={(checked) =>
            toggleStatusMutation.mutate({ id: record.id, isActive: checked })
          }
        />
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <Popconfirm
            title="Turni o'chirish"
            description="Ushbu turni o'chirishga ishonchingiz komilmi?"
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
            <CompassOutlined className="text-sky-400" /> Turlarni Moderatsiya Qilish
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gidlar tomonidan kiritilgan barcha ekskursiyalarni ko'rish, yashirish yoki boshqarish
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            placeholder="Shahar"
            allowClear
            value={city}
            onChange={(val) => {
              setCity(val);
              setPage(1);
            }}
            className="w-36"
            options={[
              { label: 'Samarqand', value: 'Samarqand' },
              { label: 'Buxoro', value: 'Buxoro' },
              { label: 'Xiva', value: 'Xiva' },
              { label: 'Toshkent', value: 'Toshkent' },
            ]}
          />
          <Input.Search
            placeholder="Tur nomi bo'yicha..."
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
            showTotal: (total) => `Jami: ${total} ta tur`,
          }}
          className="dark-table"
        />
      </div>
    </div>
  );
};
export default AdminExperiences;
