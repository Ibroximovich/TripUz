import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Input,
  Button,
  Tag,
  Switch,
  Modal,
  Select,
  message,
  Popconfirm,
  Descriptions,
  Divider,
  Avatar,
  Image,
} from 'antd';
import {
  CompassOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  UserOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { getAdminExperiences, updateExperienceStatus, deleteExperience } from '../../services/admin.api';

export const AdminExperiences: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedExp, setSelectedExp] = useState<any | null>(null);

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
    onSuccess: (updatedExp, variables) => {
      message.success(
        variables.isActive ? 'Tur muvaffaqiyatli faollashtirildi' : 'Tur yashirildi'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (selectedExp && selectedExp.id === variables.id) {
        setSelectedExp((prev: any) => ({ ...prev, isActive: variables.isActive }));
      }
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
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedExp(null);
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
            Shahar: <span className="text-amber-400 font-medium">{record.city}</span> • {record.durationHours || record.duration} soat
          </div>
        </div>
      ),
    },
    {
      title: 'Gid',
      key: 'guide',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <Avatar
            size="small"
            src={record.guide?.avatar}
            icon={<UserOutlined />}
            className="bg-amber-600/30 text-amber-300"
          />
          <div>
            <div className="text-xs font-semibold text-slate-200">{record.guide?.name}</div>
            <div className="text-[11px] text-slate-400">{record.guide?.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Narxi',
      key: 'price',
      render: (_: any, record: any) => (
        <div className="font-bold text-emerald-400">
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
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedExp(record)}
            className="bg-slate-800 text-sky-400 border-slate-700 hover:text-sky-300 hover:border-sky-500"
          >
            Ko'rish
          </Button>
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

      {/* DETAIL MODAL */}
      <Modal
        title={
          <div className="flex items-center justify-between pr-8">
            <span className="text-lg font-bold text-white flex items-center gap-2">
              <CompassOutlined className="text-amber-400" /> Tur Tafsilotlari va Moderatsiya
            </span>
            {selectedExp && (
              <Tag color={selectedExp.isActive ? 'green' : 'red'}>
                {selectedExp.isActive ? 'FAOL' : 'YASHIRILGAN'}
              </Tag>
            )}
          </div>
        }
        open={!!selectedExp}
        onCancel={() => setSelectedExp(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedExp(null)}>
            Yopish
          </Button>,
          selectedExp && (
            <Button
              key="view-site"
              type="primary"
              icon={<ExportOutlined />}
              href={`/experiences/${selectedExp.id}`}
              target="_blank"
              className="bg-amber-600 hover:bg-amber-500 border-none"
            >
              Mijoz ko'rinishida ochish
            </Button>
          ),
        ]}
        width={750}
        centered
        className="dark-modal"
      >
        {selectedExp && (
          <div className="space-y-6 pt-2 max-h-[75vh] overflow-y-auto pr-2">
            {/* Gallery Images */}
            {selectedExp.images && selectedExp.images.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Tur Rasmlari ({selectedExp.images.length})
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <Image.PreviewGroup>
                    {selectedExp.images.map((img: string, idx: number) => (
                      <Image
                        key={idx}
                        src={img}
                        alt={`tour-img-${idx}`}
                        className="rounded-lg object-cover h-24 w-full border border-slate-700/60"
                        fallback="https://placehold.co/300x200/131a22/amber?text=Rasm+yoq"
                      />
                    ))}
                  </Image.PreviewGroup>
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <DollarOutlined className="text-emerald-400" /> Narxi
                </div>
                <div className="text-base font-bold text-emerald-400 mt-1">
                  ${Number(selectedExp.priceUsd || selectedExp.price).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ClockCircleOutlined className="text-sky-400" /> Davomiyligi
                </div>
                <div className="text-base font-bold text-white mt-1">
                  {selectedExp.durationHours || selectedExp.duration || '—'} soat
                </div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <EnvironmentOutlined className="text-amber-400" /> Shahar
                </div>
                <div className="text-base font-bold text-amber-400 mt-1">
                  {selectedExp.city || '—'}
                </div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <TeamOutlined className="text-purple-400" /> Guruh hajmi
                </div>
                <div className="text-base font-bold text-white mt-1">
                  max {selectedExp.maxGroupSize || 10} kishi
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-2">{selectedExp.title}</h2>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedExp.description || 'Tavsif mavjud emas.'}
              </div>
            </div>

            {/* Guide Info */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  size={48}
                  src={selectedExp.guide?.avatar}
                  icon={<UserOutlined />}
                  className="bg-amber-600/30 text-amber-300 border border-amber-500/40"
                />
                <div>
                  <div className="text-xs text-slate-400">Gid (Muallif)</div>
                  <div className="text-sm font-bold text-white">{selectedExp.guide?.name}</div>
                  <div className="text-xs text-slate-400">{selectedExp.guide?.email}</div>
                  {selectedExp.guide?.phone && (
                    <div className="text-xs text-amber-400">{selectedExp.guide?.phone}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-slate-400">Moderatsiya holati:</span>
                <Switch
                  checkedChildren="Faol"
                  unCheckedChildren="Yashirilgan"
                  checked={selectedExp.isActive}
                  loading={toggleStatusMutation.isPending}
                  onChange={(checked) =>
                    toggleStatusMutation.mutate({ id: selectedExp.id, isActive: checked })
                  }
                />
              </div>
            </div>

            {/* Includes & Itinerary */}
            {(selectedExp.includes || selectedExp.itinerary || selectedExp.meetingPoint) && (
              <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                {selectedExp.meetingPoint && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase">Uchrashuv joyi</div>
                    <div className="text-sm text-slate-200 mt-1">{selectedExp.meetingPoint}</div>
                  </div>
                )}
                {selectedExp.includes && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase">Narxga kiritilgan</div>
                    <div className="text-sm text-slate-200 mt-1">{selectedExp.includes}</div>
                  </div>
                )}
                {selectedExp.itinerary && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase">Marshrut dasturi</div>
                    <div className="text-sm text-slate-200 mt-1 whitespace-pre-line">{selectedExp.itinerary}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminExperiences;
