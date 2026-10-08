import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Input, Button, Modal, InputNumber, message, Tag, Avatar, Space } from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  UserOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { getAdminGuides, updateGuideCommission, type AdminGuideItem } from '../../services/admin.api';

export const AdminGuides: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedGuide, setSelectedGuide] = useState<AdminGuideItem | null>(null);
  const [newCommission, setNewCommission] = useState<number>(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-guides', page, search],
    queryFn: () => getAdminGuides({ page, limit: 10, search: search.trim() || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) => updateGuideCommission(id, rate),
    onSuccess: () => {
      message.success('Gid komissiya foizi muvaffaqiyatli yangilandi');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-guides'] });
    },
    onError: () => {
      message.error('Komissiyani yangilashda xatolik yuz berdi');
    },
  });

  const handleEditCommission = (guide: AdminGuideItem) => {
    setSelectedGuide(guide);
    setNewCommission(guide.commissionRate);
    setIsModalOpen(true);
  };

  const handleSaveCommission = () => {
    if (!selectedGuide) return;
    updateMutation.mutate({ id: selectedGuide.id, rate: newCommission });
  };

  const columns = [
    {
      title: 'Gid',
      key: 'name',
      render: (_: any, record: AdminGuideItem) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} icon={<UserOutlined />} className="bg-amber-600" />
          <div>
            <div className="font-bold text-white text-sm">{record.name}</div>
            <div className="text-xs text-slate-400">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      render: (val: string | null) => val || <span className="text-slate-500">—</span>,
    },
    {
      title: 'Turlar soni',
      key: 'experiencesCount',
      render: (_: any, record: AdminGuideItem) => (
        <Tag color="cyan">
          {record.activeExperiencesCount} faol / {record.experiencesCount} jami
        </Tag>
      ),
    },
    {
      title: 'Buyurtmalar',
      dataIndex: 'bookingsCount',
      key: 'bookingsCount',
      render: (val: number) => <span className="font-semibold text-slate-200">{val} ta</span>,
    },
    {
      title: 'Jami Tushumi',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (val: number) => <span className="font-bold text-emerald-400">${val.toLocaleString()}</span>,
    },
    {
      title: 'Komissiya Stavkasi',
      key: 'commissionRate',
      render: (_: any, record: AdminGuideItem) => (
        <div className="flex items-center gap-2">
          <Tag color="gold" className="font-bold text-xs px-2 py-0.5">
            {record.commissionRate}%
          </Tag>
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditCommission(record)}
            className="text-slate-400 hover:text-amber-400"
          />
        </div>
      ),
    },
    {
      title: 'Ro\'yxatdan o\'tgan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => (
        <span className="text-xs text-slate-400">{new Date(val).toLocaleDateString()}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <TeamOutlined className="text-amber-400" /> Gidlar Boshqaruvi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Barcha ro'yxatdan o'tgan gidlar, ularning faoliyati va komissiya stavkalarini boshqarish
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
            showTotal: (total) => `Jami: ${total} ta gid`,
          }}
          className="dark-table"
        />
      </div>

      {/* Komissiya tahrirlash modali */}
      <Modal
        title="Gid komissiya foizini o'zgartirish"
        open={isModalOpen}
        onOk={handleSaveCommission}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={updateMutation.isPending}
        okText="Saqlash"
        cancelText="Bekor qilish"
        centered
        className="dark-modal"
      >
        <div className="py-4 space-y-3">
          <p className="text-xs text-slate-300">
            <strong>{selectedGuide?.name}</strong> uchun platforma komissiyasi stavkasini kiriting:
          </p>
          <div className="flex items-center gap-3">
            <InputNumber
              min={0}
              max={100}
              value={newCommission}
              onChange={(val) => setNewCommission(val || 0)}
              addonAfter="%"
              className="w-full"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Standart platforma stavkasi: 10%. Ushbu foiz kelgusi barcha buyurtmalar hisob-kitobida aks etadi.
          </p>
        </div>
      </Modal>
    </div>
  );
};
export default AdminGuides;
