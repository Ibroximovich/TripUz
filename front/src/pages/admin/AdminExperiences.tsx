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
  Form,
  InputNumber,
  Tabs,
  Upload,
  Radio,
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
  PlusOutlined,
  UploadOutlined,
  CloseOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import {
  getAdminExperiences,
  updateExperienceStatus,
  deleteExperience,
  createAdminExperience,
  getAdminGuides,
} from '../../services/admin.api';
import { uploadExperienceImages } from '../../services/guide.api';

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

  // States for creating tour on behalf of guide
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [submittingTour, setSubmittingTour] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const [guideMode, setGuideMode] = useState<'existing' | 'new'>('existing');

  // Fetch guides list for selection dropdown
  const { data: guidesData } = useQuery({
    queryKey: ['admin-guides-for-select'],
    queryFn: () => getAdminGuides({ limit: 100 }),
  });
  const guidesList = guidesData?.data || [];

  const handleUploadImage = async (file: File) => {
    if (imageUrls.length >= 5) {
      message.warning("Ko'pi bilan 5 ta rasm yuklash mumkin");
      return false;
    }
    setUploadingImages(true);
    try {
      const res = await uploadExperienceImages([file]);
      if (res.success && res.data?.urls?.[0]) {
        setImageUrls((prev) => [...prev, res.data!.urls[0]]);
        message.success("Rasm yuklandi!");
      } else {
        throw new Error(res.message || "Rasm yuklashda xatolik");
      }
    } catch (err: any) {
      message.error(err.message || "Rasm yuklashda xatolik yuz berdi");
    } finally {
      setUploadingImages(false);
    }
    return false;
  };

  const handleAddCustomImageUrl = () => {
    if (!customImageUrl.trim()) return;
    if (imageUrls.length >= 5) {
      message.warning("Ko'pi bilan 5 ta rasm yuklash mumkin");
      return;
    }
    setImageUrls((prev) => [...prev, customImageUrl.trim()]);
    setCustomImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateExperience = async (values: any) => {
    if (imageUrls.length === 0) {
      message.error("Kamida 1 ta rasm yuklanishi shart!");
      return;
    }
    setSubmittingTour(true);
    try {
      const mainTitle = values.title_uz || values.title_en || values.title_ru || '';
      const mainDesc = values.description_uz || values.description_en || values.description_ru || '';
      const mainMp = values.meetingPointText_uz || values.meetingPointText_en || values.meetingPointText_ru || values.meetingPoint || '';

      const payload: any = {
        title: mainTitle,
        title_uz: values.title_uz || mainTitle,
        title_en: values.title_en || mainTitle,
        title_ru: values.title_ru || mainTitle,
        description: mainDesc,
        description_uz: values.description_uz || mainDesc,
        description_en: values.description_en || mainDesc,
        description_ru: values.description_ru || mainDesc,
        city: values.city || 'Samarqand',
        priceUsd: Number(values.priceUsd),
        price: Number(values.priceUsd),
        durationHours: Number(values.durationHours) || 3,
        duration: `${Number(values.durationHours) || 3} soat`,
        meetingPoint: mainMp,
        meetingPointText: mainMp,
        meetingPointText_uz: values.meetingPointText_uz || mainMp,
        meetingPointText_en: values.meetingPointText_en || mainMp,
        meetingPointText_ru: values.meetingPointText_ru || mainMp,
        meetingPointMapUrl: values.meetingPointMapUrl || '',
        languages: values.languages && values.languages.length > 0 ? values.languages : ["O'zbekcha"],
        images: imageUrls,
      };

      if (guideMode === 'existing') {
        payload.guideId = values.guideId;
      } else {
        payload.newGuideName = values.newGuideName;
        payload.newGuideEmail = values.newGuideEmail;
        payload.newGuidePhone = values.newGuidePhone;
        payload.newGuideTelegram = values.newGuideTelegram;
      }

      const res = await createAdminExperience(payload);
      if (res.success) {
        message.success(
          guideMode === 'new'
            ? "Yangi gid yaratildi va tur muvaffaqiyatli unga biriktirildi!"
            : "Tur muvaffaqiyatli yaratildi va tanlangan gid kabinetiga biriktirildi!"
        );
        setIsCreateModalOpen(false);
        createForm.resetFields();
        setImageUrls([]);
        queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        refetch();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Turni yaratishda xatolik yuz berdi";
      message.error(errorMsg);
    } finally {
      setSubmittingTour(false);
    }
  };

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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              createForm.resetFields();
              setImageUrls([]);
              setIsCreateModalOpen(true);
            }}
            className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl shadow-lg"
          >
            Gid nomidan tur qo'shish
          </Button>

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

      {/* Gid nomidan tur qo'shish modali */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-white font-bold text-lg border-b border-slate-800 pb-3">
            <PlusOutlined className="text-amber-400" />
            <span>Gid Nomidan Yangi Tur Qo'shish</span>
          </div>
        }
        open={isCreateModalOpen}
        onCancel={() => !submittingTour && setIsCreateModalOpen(false)}
        footer={null}
        width={800}
        centered
        className="dark-modal"
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateExperience}
          initialValues={{
            city: 'Samarqand',
            durationHours: 3,
            priceUsd: 30,
            languages: ["O'zbekcha"],
          }}
          className="pt-2 max-h-[75vh] overflow-y-auto pr-2 space-y-4"
        >
          {/* Gidni tanlash yoki Yangi gid kiritish */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                * Ushbu tur qaysi gid nomidan yaratilsin?
              </span>
              <Radio.Group
                value={guideMode}
                onChange={(e) => setGuideMode(e.target.value)}
                size="small"
                buttonStyle="solid"
              >
                <Radio.Button value="existing">Mavjud Gidlar Ro'yxatidan</Radio.Button>
                <Radio.Button value="new">+ Yangi Gid Kiritish</Radio.Button>
              </Radio.Group>
            </div>

            {guideMode === 'existing' ? (
              <Form.Item
                name="guideId"
                rules={[{ required: guideMode === 'existing', message: 'Iltimos, gidni tanlang!' }]}
                className="mb-0"
              >
                <Select
                  showSearch
                  placeholder="Gidni ismi, telefoni yoki emaili orqali qidiring..."
                  optionFilterProp="label"
                  className="w-full"
                  options={guidesList.map((g) => ({
                    value: g.id,
                    label: `${g.name} ${g.phone ? `(${g.phone})` : ''} - ${g.email}`,
                  }))}
                />
              </Form.Item>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="text-xs text-slate-400">
                  Gid hali saytda ro'yxatdan o'tmagan bo'lsa, ma'lumotlarini kiriting. Tizim unga avtomatik profil ochadi va turni unga biriktiradi.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Form.Item
                    name="newGuideName"
                    label={<span className="text-slate-300 text-xs">Gidning To'liq Ismi *</span>}
                    rules={[{ required: guideMode === 'new', message: 'Gid ismini kiriting!' }]}
                    className="mb-0"
                  >
                    <Input placeholder="Masalan: Sardor Rustamov" />
                  </Form.Item>

                  <Form.Item
                    name="newGuideEmail"
                    label={<span className="text-slate-300 text-xs">Gidning Emaili *</span>}
                    rules={[
                      { required: guideMode === 'new', message: 'Email manzilini kiriting!' },
                      { type: 'email', message: "To'g'ri email formatini kiriting!" },
                    ]}
                    className="mb-0"
                  >
                    <Input placeholder="Masalan: sardor.guide@gmail.com" />
                  </Form.Item>

                  <Form.Item
                    name="newGuidePhone"
                    label={<span className="text-slate-300 text-xs">Telefon Raqami (ixtiyoriy)</span>}
                    className="mb-0"
                  >
                    <Input placeholder="+998 90 123 45 67" />
                  </Form.Item>

                  <Form.Item
                    name="newGuideTelegram"
                    label={<span className="text-slate-300 text-xs">Telegram Usernami (ixtiyoriy)</span>}
                    className="mb-0"
                  >
                    <Input placeholder="@sardor_guide" />
                  </Form.Item>
                </div>
              </div>
            )}
          </div>

          {/* Umumiy ma'lumotlar: Shahar, Narx, Davomiylik, Tillar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Form.Item
              name="city"
              label={<span className="text-slate-300 text-xs font-semibold">Shahar</span>}
              rules={[{ required: true, message: 'Shaharni tanlang!' }]}
            >
              <Select
                options={[
                  { label: 'Samarqand', value: 'Samarqand' },
                  { label: 'Buxoro', value: 'Buxoro' },
                  { label: 'Xiva', value: 'Xiva' },
                  { label: 'Toshkent', value: 'Toshkent' },
                  { label: 'Shahrisabz', value: 'Shahrisabz' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="priceUsd"
              label={<span className="text-slate-300 text-xs font-semibold">Narxi ($ USD bir kishi uchun)</span>}
              rules={[{ required: true, message: 'Narxni kiriting!' }]}
            >
              <InputNumber min={1} max={10000} prefix="$" className="w-full" />
            </Form.Item>

            <Form.Item
              name="durationHours"
              label={<span className="text-slate-300 text-xs font-semibold">Davomiyligi (soat)</span>}
              rules={[{ required: true, message: 'Davomiylikni kiriting!' }]}
            >
              <InputNumber min={0.5} max={72} step={0.5} suffix="soat" className="w-full" />
            </Form.Item>
          </div>

          <Form.Item
            name="languages"
            label={<span className="text-slate-300 text-xs font-semibold">Tur o'tkaziladigan tillar</span>}
          >
            <Select
              mode="multiple"
              placeholder="Tillar tanlang"
              options={[
                { label: "O'zbekcha", value: "O'zbekcha" },
                { label: "English", value: "English" },
                { label: "Русский", value: "Русский" },
                { label: "Français", value: "Français" },
                { label: "Deutsch", value: "Deutsch" },
                { label: "Español", value: "Español" },
                { label: "Türkçe", value: "Türkçe" },
              ]}
            />
          </Form.Item>

          {/* Multilingual Tabs for Title and Description */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Tur Nomi va Tavsifi (Ko'p tillilik)
            </div>
            <Tabs
              defaultActiveKey="uz"
              items={[
                {
                  key: 'uz',
                  label: "🇺🇿 O'zbekcha",
                  children: (
                    <div className="space-y-3 pt-2">
                      <Form.Item
                        name="title_uz"
                        label={<span className="text-slate-300 text-xs">Tur nomi (O'zbekcha)</span>}
                        rules={[{ required: true, message: "Tur nomi kiritilishi shart" }]}
                      >
                        <Input placeholder="Masalan: Samarqand bo'ylab tarixiy sayohat" />
                      </Form.Item>
                      <Form.Item
                        name="description_uz"
                        label={<span className="text-slate-300 text-xs">Tur tavsifi (O'zbekcha)</span>}
                        rules={[{ required: true, message: "Tavsif kiritilishi shart" }]}
                      >
                        <Input.TextArea rows={3} placeholder="Tur haqida batafsil ma'lumot..." />
                      </Form.Item>
                      <Form.Item
                        name="meetingPointText_uz"
                        label={<span className="text-slate-300 text-xs">Uchrashuv joyi (O'zbekcha)</span>}
                        rules={[{ required: true, message: "Uchrashuv joyi kiritilishi shart" }]}
                      >
                        <Input placeholder="Masalan: Registon maydoni bosh kirish qismi" />
                      </Form.Item>
                    </div>
                  ),
                },
                {
                  key: 'en',
                  label: "🇬🇧 English",
                  children: (
                    <div className="space-y-3 pt-2">
                      <Form.Item
                        name="title_en"
                        label={<span className="text-slate-300 text-xs">Tour Title (English)</span>}
                      >
                        <Input placeholder="e.g.: Historical Walking Tour in Samarkand" />
                      </Form.Item>
                      <Form.Item
                        name="description_en"
                        label={<span className="text-slate-300 text-xs">Tour Description (English)</span>}
                      >
                        <Input.TextArea rows={3} placeholder="Detailed tour overview for international tourists..." />
                      </Form.Item>
                      <Form.Item
                        name="meetingPointText_en"
                        label={<span className="text-slate-300 text-xs">Meeting Point (English)</span>}
                      >
                        <Input placeholder="e.g.: Registan Square main entrance" />
                      </Form.Item>
                    </div>
                  ),
                },
                {
                  key: 'ru',
                  label: "🇷🇺 Русский",
                  children: (
                    <div className="space-y-3 pt-2">
                      <Form.Item
                        name="title_ru"
                        label={<span className="text-slate-300 text-xs">Название тура (Русский)</span>}
                      >
                        <Input placeholder="Например: Историческая прогулка по Самарканду" />
                      </Form.Item>
                      <Form.Item
                        name="description_ru"
                        label={<span className="text-slate-300 text-xs">Описание тура (Русский)</span>}
                      >
                        <Input.TextArea rows={3} placeholder="Подробное описание программы тура..." />
                      </Form.Item>
                      <Form.Item
                        name="meetingPointText_ru"
                        label={<span className="text-slate-300 text-xs">Место встречи (Русский)</span>}
                      >
                        <Input placeholder="Например: Главный вход на площадь Регистан" />
                      </Form.Item>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {/* Google Maps link */}
          <Form.Item
            name="meetingPointMapUrl"
            label={<span className="text-slate-300 text-xs">Google Maps havolasi (ixtiyoriy)</span>}
          >
            <Input placeholder="https://maps.google.com/?q=..." />
          </Form.Item>

          {/* Rasmlar yuklash */}
          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tur Rasmlari ({imageUrls.length} / 5) *
              </span>
              {uploadingImages && <span className="text-xs text-amber-400 animate-pulse">Yuklanmoqda...</span>}
            </div>

            {/* Uploaded Thumbnails */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700 h-20">
                    <img src={url} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white p-1 rounded-full text-xs transition"
                    >
                      <CloseOutlined />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imageUrls.length < 5 && (
              <div className="space-y-2 pt-2">
                <Upload
                  beforeUpload={handleUploadImage}
                  showUploadList={false}
                  accept="image/*"
                  disabled={uploadingImages}
                >
                  <Button icon={<UploadOutlined />} loading={uploadingImages} className="bg-slate-800 text-slate-200 border-slate-700">
                    Kompyuterdan rasm yuklash
                  </Button>
                </Upload>

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Yoki rasm URL manzilini kiriting..."
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    onPressEnter={handleAddCustomImageUrl}
                    size="small"
                  />
                  <Button size="small" onClick={handleAddCustomImageUrl} className="bg-slate-800 text-slate-200 border-slate-700">
                    Qo'shish
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              onClick={() => setIsCreateModalOpen(false)}
              disabled={submittingTour}
              className="bg-slate-800 text-slate-300 border-slate-700"
            >
              Bekor qilish
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingTour}
              className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold text-white shadow-lg"
            >
              Turni yaratish va Gidga biriktirish
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminExperiences;
