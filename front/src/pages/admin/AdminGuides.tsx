import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Input,
  Button,
  Modal,
  InputNumber,
  message,
  Tag,
  Avatar,
  Space,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  UserOutlined,
  ReloadOutlined,
  TeamOutlined,
  EyeOutlined,
  PhoneOutlined,
  MailOutlined,
  SendOutlined,
  DollarOutlined,
  CompassOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { getAdminGuides, updateGuideCommission, type AdminGuideItem } from '../../services/admin.api';

export const AdminGuides: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedGuide, setSelectedGuide] = useState<AdminGuideItem | null>(null);
  const [profileGuide, setProfileGuide] = useState<AdminGuideItem | null>(null);
  const [newCommission, setNewCommission] = useState<number>(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-guides', page, search],
    queryFn: () => getAdminGuides({ page, limit: 10, search: search.trim() || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) => updateGuideCommission(id, rate),
    onSuccess: (_, variables) => {
      message.success('Gid komissiya foizi muvaffaqiyatli yangilandi');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-guides'] });
      if (profileGuide && profileGuide.id === variables.id) {
        setProfileGuide((prev) => (prev ? { ...prev, commissionRate: variables.rate } : null));
      }
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
        <div
          onClick={() => setProfileGuide(record)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            className="bg-amber-600/40 text-amber-300 border border-amber-500/40 group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
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
          <a href={`tel:${val}`} className="text-sky-400 text-xs hover:underline">
            {val}
          </a>
        ) : (
          <span className="text-slate-500 text-xs">—</span>
        ),
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
      title: 'Amallar',
      key: 'actions',
      render: (_: any, record: AdminGuideItem) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setProfileGuide(record)}
          className="bg-slate-800 text-sky-400 border-slate-700 hover:text-sky-300 hover:border-sky-500"
        >
          Profil
        </Button>
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

      {/* GID PROFILI MODALI */}
      <Modal
        title={
          <span className="text-lg font-bold text-white flex items-center gap-2">
            <UserOutlined className="text-amber-400" /> Gid Profili va Faoliyati
          </span>
        }
        open={!!profileGuide}
        onCancel={() => setProfileGuide(null)}
        footer={[
          <Button key="close" onClick={() => setProfileGuide(null)}>
            Yopish
          </Button>,
          profileGuide && (
            <Button
              key="edit-comm"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                const g = profileGuide;
                setProfileGuide(null);
                handleEditCommission(g);
              }}
              className="bg-amber-600 hover:bg-amber-500 border-none"
            >
              Komissiyani o'zgartirish
            </Button>
          ),
        ]}
        width={650}
        centered
        className="dark-modal"
      >
        {profileGuide && (
          <div className="space-y-5 pt-2 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header info */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  size={60}
                  src={profileGuide.avatar}
                  icon={<UserOutlined />}
                  className="bg-amber-600/30 text-amber-300 border border-amber-500/40 text-2xl"
                />
                <div>
                  <div className="text-base font-bold text-white">{profileGuide.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MailOutlined className="text-slate-500" />
                    <a href={`mailto:${profileGuide.email}`} className="text-slate-300 hover:text-amber-400">
                      {profileGuide.email}
                    </a>
                  </div>
                  {profileGuide.phone && (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <PhoneOutlined className="text-slate-500" />
                      <a href={`tel:${profileGuide.phone}`} className="text-sky-400 font-medium">
                        {profileGuide.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {profileGuide.telegramHandle && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  href={`https://t.me/${profileGuide.telegramHandle.replace('@', '')}`}
                  target="_blank"
                  className="bg-sky-600 hover:bg-sky-500 border-none"
                >
                  Telegram
                </Button>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Jami Tushum</div>
                <div className="text-base font-bold text-emerald-400 mt-1">
                  ${profileGuide.totalRevenue.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Buyurtmalar</div>
                <div className="text-base font-bold text-white mt-1">
                  {profileGuide.bookingsCount} ta
                </div>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Turlar (Faol/Jami)</div>
                <div className="text-base font-bold text-sky-400 mt-1">
                  {profileGuide.activeExperiencesCount} / {profileGuide.experiencesCount}
                </div>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Komissiya</div>
                <div className="text-base font-bold text-amber-400 mt-1">
                  {profileGuide.commissionRate}%
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">So'zlashuv tillari:</span>
                <span className="text-slate-200 font-medium">{profileGuide.language || "O'zbekcha"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Ro'yxatdan o'tgan sana:</span>
                <span className="text-slate-200 font-medium">
                  {new Date(profileGuide.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Gid ID:</span>
                <span className="text-slate-500 font-mono text-[11px]">{profileGuide.id}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

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
