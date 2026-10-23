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
  Avatar,
  Image,
  Form,
  InputNumber,
  Tabs,
  Upload,
  Radio,
  DatePicker,
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
  ExportOutlined,
  PlusOutlined,
  UploadOutlined,
  CloseOutlined,
  CalendarOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getAdminExperiences,
  updateExperienceStatus,
  deleteExperience,
  createAdminExperience,
  updateAdminExperience,
  getAdminGuides,
  addExperienceDate,
  deleteExperienceDate,
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
    onSuccess: (_, variables) => {
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
  const [newGuideAvatarUrl, setNewGuideAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // States for editing tour
  const [editingExp, setEditingExp] = useState<any | null>(null);
  const [editForm] = Form.useForm();
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [uploadingEditImages, setUploadingEditImages] = useState(false);
  const [customEditImageUrl, setCustomEditImageUrl] = useState('');

  const openEditModal = (record: any) => {
    setEditingExp(record);
    const existingImages = Array.isArray(record.images)
      ? [...record.images]
      : (record.images ? [record.images] : []);
    setEditImageUrls(existingImages);
    setCustomEditImageUrl('');

    editForm.setFieldsValue({
      city: record.city || 'Samarqand',
      priceUsd: Number(record.priceUsd ?? record.price ?? 30),
      durationHours: Number(record.durationHours) || (record.duration ? parseFloat(record.duration) : 3),
      languages: Array.isArray(record.languages) && record.languages.length > 0 ? record.languages : ["O'zbekcha"],
      title_uz: record.title_uz || record.title || '',
      title_en: record.title_en || '',
      title_ru: record.title_ru || '',
      description_uz: record.description_uz || record.description || '',
      description_en: record.description_en || '',
      description_ru: record.description_ru || '',
      meetingPointText_uz: record.meetingPointText_uz || record.meetingPointText || record.meetingPoint || '',
      meetingPointText_en: record.meetingPointText_en || '',
      meetingPointText_ru: record.meetingPointText_ru || '',
      meetingPointMapUrl: record.meetingPointMapUrl || '',
    });
  };

  const handleUploadEditImage = async (file: File) => {
    if (editImageUrls.length >= 5) {
      message.warning("Ko'pi bilan 5 ta rasm yuklash mumkin");
      return false;
    }
    setUploadingEditImages(true);
    try {
      const res = await uploadExperienceImages([file]);
      if (res.success && res.data?.urls?.[0]) {
        setEditImageUrls((prev) => [...prev, res.data!.urls[0]]);
        message.success("Rasm yuklandi!");
      } else {
        throw new Error(res.message || "Rasm yuklashda xatolik");
      }
    } catch (err: any) {
      message.error(err.message || "Rasm yuklashda xatolik yuz berdi");
    } finally {
      setUploadingEditImages(false);
    }
    return false;
  };

  const handleAddCustomEditImageUrl = () => {
    if (!customEditImageUrl.trim()) return;
    if (editImageUrls.length >= 5) {
      message.warning("Ko'pi bilan 5 ta rasm yuklash mumkin");
      return;
    }
    setEditImageUrls((prev) => [...prev, customEditImageUrl.trim()]);
    setCustomEditImageUrl('');
  };

  const handleRemoveEditImage = (index: number) => {
    setEditImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExperience = async (values: any) => {
    if (!editingExp) return;
    if (editImageUrls.length === 0) {
      message.error("Kamida 1 ta rasm yuklanishi shart!");
      return;
    }
    setSubmittingEdit(true);
    try {
      const mainTitle = values.title_uz || values.title_en || values.title_ru || editingExp.title || '';
      const mainDesc = values.description_uz || values.description_en || values.description_ru || editingExp.description || '';
      const mainMp = values.meetingPointText_uz || values.meetingPointText_en || values.meetingPointText_ru || values.meetingPointMapUrl || '';

      const payload: any = {
        title: mainTitle,
        title_uz: values.title_uz || mainTitle,
        title_en: values.title_en || '',
        title_ru: values.title_ru || '',
        description: mainDesc,
        description_uz: values.description_uz || mainDesc,
        description_en: values.description_en || '',
        description_ru: values.description_ru || '',
        city: values.city || 'Samarqand',
        priceUsd: Number(values.priceUsd),
        price: Number(values.priceUsd),
        durationHours: Number(values.durationHours) || 3,
        duration: `${Number(values.durationHours) || 3} soat`,
        meetingPoint: mainMp,
        meetingPointText: mainMp,
        meetingPointText_uz: values.meetingPointText_uz || mainMp,
        meetingPointText_en: values.meetingPointText_en || '',
        meetingPointText_ru: values.meetingPointText_ru || '',
        meetingPointMapUrl: values.meetingPointMapUrl || '',
        languages: values.languages && values.languages.length > 0 ? values.languages : ["O'zbekcha"],
        images: editImageUrls,
      };

      const res = await updateAdminExperience(editingExp.id, payload);
      if (res.success) {
        message.success("Tur ma'lumotlari muvaffaqiyatli yangilandi!");
        setEditingExp(null);
        queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        if (selectedExp && selectedExp.id === editingExp.id) {
          setSelectedExp((prev: any) => ({ ...prev, ...payload }));
        }
        refetch();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Turni yangilashda xatolik yuz berdi";
      message.error(errorMsg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // States for date management
  const [datesModalExp, setDatesModalExp] = useState<any | null>(null);
  const [selectedNewDate, setSelectedNewDate] = useState<dayjs.Dayjs | null>(null);
  const [newDateCapacity, setNewDateCapacity] = useState<number>(10);
  const [addingDate, setAddingDate] = useState(false);

  const handleAddDate = async (expId: string) => {
    if (!selectedNewDate) {
      message.warning("Iltimos, sanani tanlang!");
      return;
    }
    setAddingDate(true);
    try {
      const res = await addExperienceDate(expId, {
        date: selectedNewDate.toISOString(),
        maxCapacity: newDateCapacity,
        slots: newDateCapacity,
      });
      if (res.success) {
        message.success("Yangi sana muvaffaqiyatli qo'shildi!");
        setSelectedNewDate(null);
        queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });

        if (datesModalExp && datesModalExp.id === expId) {
          setDatesModalExp((prev: any) => ({
            ...prev,
            availableDates: [...(prev.availableDates || []), res.data],
          }));
        }
        if (selectedExp && selectedExp.id === expId) {
          setSelectedExp((prev: any) => ({
            ...prev,
            availableDates: [...(prev.availableDates || []), res.data],
          }));
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Sana qo'shishda xatolik yuz berdi");
    } finally {
      setAddingDate(false);
    }
  };

  const handleDeleteDate = async (expId: string, dateId: string) => {
    try {
      const res = await deleteExperienceDate(dateId);
      if (res.success) {
        message.success("Sana muvaffaqiyatli o'chirildi");
        queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });

        if (datesModalExp && datesModalExp.id === expId) {
          setDatesModalExp((prev: any) => ({
            ...prev,
            availableDates: (prev.availableDates || []).filter((d: any) => d.id !== dateId),
          }));
        }
        if (selectedExp && selectedExp.id === expId) {
          setSelectedExp((prev: any) => ({
            ...prev,
            availableDates: (prev.availableDates || []).filter((d: any) => d.id !== dateId),
          }));
        }
      }
    } catch (err: any) {
      message.error("Sanani o'chirishda xatolik yuz berdi");
    }
  };

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
        if (newGuideAvatarUrl) payload.newGuideAvatar = newGuideAvatarUrl;
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
        setNewGuideAvatarUrl(null);
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
      width: 240,
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
      width: 220,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <Avatar
            size="small"
            src={record.guide?.avatar}
            icon={<UserOutlined />}
            className="bg-amber-600/30 text-amber-300 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">{record.guide?.name}</div>
            <div className="text-[11px] text-slate-400 truncate">{record.guide?.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Narxi',
      key: 'price',
      width: 90,
      render: (_: any, record: any) => (
        <div className="font-bold text-emerald-400">
          ${Number(record.priceUsd || record.price).toLocaleString()}
        </div>
      ),
    },
    {
      title: 'Buyurtmalar',
      key: 'bookings',
      width: 140,
      render: (_: any, record: any) => (
        <Tag color="blue">{record._count?.bookings || 0} ta buyurtma</Tag>
      ),
    },
    {
      title: 'Holati',
      key: 'isActive',
      width: 110,
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
      width: 320,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Button
            size="small"
            icon={<CalendarOutlined />}
            onClick={() => setDatesModalExp(record)}
            className="bg-slate-800 text-amber-400 border-slate-700 hover:text-amber-300 hover:border-amber-500 text-xs font-medium"
          >
            Sanalar ({record.availableDates?.length ?? record._count?.availableDates ?? 0})
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            className="bg-slate-800 text-sky-400 border-slate-700 hover:text-sky-300 hover:border-sky-500 text-xs font-medium"
          >
            Tahrirlash
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedExp(record)}
            className="bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-500 text-xs font-medium"
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
          scroll={{ x: 1150 }}
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
              key="edit"
              icon={<EditOutlined />}
              onClick={() => {
                const exp = selectedExp;
                setSelectedExp(null);
                openEditModal(exp);
              }}
              className="bg-sky-600 hover:bg-sky-500 text-white border-none"
            >
              Tahrirlash
            </Button>
          ),
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

            {/* Sanalar va bandliklar bo'limi */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarOutlined className="text-amber-400" /> Mavjud Sanalar va Bo'sh Joylar
                </span>
                <span className="text-xs text-slate-400">
                  Jami: {selectedExp.availableDates?.length || 0} ta sana
                </span>
              </div>

              {/* Yangi sana qo'shish formasi */}
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-wrap items-center gap-3">
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Yangi sana va vaqt"
                  value={selectedNewDate}
                  onChange={(val) => setSelectedNewDate(val)}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  className="w-52"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Joy:</span>
                  <InputNumber
                    min={1}
                    max={100}
                    value={newDateCapacity}
                    onChange={(val) => setNewDateCapacity(val || 10)}
                    className="w-20"
                  />
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddDate(selectedExp.id)}
                  loading={addingDate}
                  className="bg-amber-600 hover:bg-amber-500 border-none text-xs"
                >
                  Sana qo'shish
                </Button>
              </div>

              {/* Mavjud sanalar ro'yxati */}
              {selectedExp.availableDates && selectedExp.availableDates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {selectedExp.availableDates.map((d: any) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-2.5 bg-slate-800/40 border border-slate-700/50 rounded-lg"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {dayjs(d.date).format('DD.MM.YYYY, HH:mm')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Joylar: <span className="text-emerald-400 font-medium">{d.slots - (d.bookedCount || 0)}</span> / {d.maxCapacity || d.slots} ta
                        </div>
                      </div>
                      <Popconfirm
                        title="Sanani o'chirish"
                        description="Haqiqatan ham ushbu sanani o'chirmoqchimisiz?"
                        okText="O'chirish"
                        cancelText="Bekor qilish"
                        okType="danger"
                        onConfirm={() => handleDeleteDate(selectedExp.id, d.id)}
                      >
                        <Button
                          size="small"
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          className="hover:bg-rose-500/20 text-xs"
                        />
                      </Popconfirm>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-2">
                  Ushbu turda hozircha sanalar mavjud emas. Yuqoridagi forma orqali yangi sana qo'shing.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* SANALAR BOSHQARUVI MODALI (JADVALDAN TEZKOR OCHISH) */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
            <CalendarOutlined className="text-amber-400" />
            <span>Turni Sanalari va Joylarini Boshqarish</span>
          </div>
        }
        open={!!datesModalExp}
        onCancel={() => {
          setDatesModalExp(null);
          setSelectedNewDate(null);
        }}
        footer={[
          <Button key="close" onClick={() => { setDatesModalExp(null); setSelectedNewDate(null); }}>
            Yopish
          </Button>,
        ]}
        width={600}
        centered
        className="dark-modal"
      >
        {datesModalExp && (
          <div className="space-y-4 pt-2">
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">{datesModalExp.title}</div>
                <div className="text-xs text-amber-400">{datesModalExp.city} • ${Number(datesModalExp.priceUsd || datesModalExp.price)}</div>
              </div>
              <Tag color="cyan">{datesModalExp.availableDates?.length || 0} ta sana</Tag>
            </div>

            {/* Yangi sana qo'shish */}
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Yangi Ekskursiya Sanasini Qo'shish</div>
              <div className="flex flex-wrap items-center gap-3">
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Sana va vaqtni tanlang"
                  value={selectedNewDate}
                  onChange={(val) => setSelectedNewDate(val)}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  className="flex-1 min-w-[200px]"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Maks. joy:</span>
                  <InputNumber
                    min={1}
                    max={100}
                    value={newDateCapacity}
                    onChange={(val) => setNewDateCapacity(val || 10)}
                    className="w-20"
                  />
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddDate(datesModalExp.id)}
                  loading={addingDate}
                  className="bg-amber-600 hover:bg-amber-500 border-none"
                >
                  Qo'shish
                </Button>
              </div>
            </div>

            {/* Ro'yxat */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Mavjud Sanalar Ro'yxati ({datesModalExp.availableDates?.length || 0})
              </div>
              {datesModalExp.availableDates && datesModalExp.availableDates.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {datesModalExp.availableDates.map((d: any) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <CalendarOutlined />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {dayjs(d.date).format('DD-MMMM, YYYY — HH:mm')}
                          </div>
                          <div className="text-xs text-slate-400">
                            Bo'sh joylar: <span className="text-emerald-400 font-bold">{d.slots - (d.bookedCount || 0)}</span> ta / jami {d.maxCapacity || d.slots} ta
                          </div>
                        </div>
                      </div>
                      <Popconfirm
                        title="Sanani o'chirish"
                        description="Haqiqatan ham ushbu sanani o'chirmoqchimisiz?"
                        okText="O'chirish"
                        cancelText="Bekor qilish"
                        okType="danger"
                        onConfirm={() => handleDeleteDate(datesModalExp.id, d.id)}
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
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-6 bg-slate-900/30 rounded-xl border border-slate-800/60">
                  Ushbu turda hozircha sanalar mavjud emas. Yuqoridagi orqali yangi sana qo'shing.
                </div>
              )}
            </div>
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

                {/* Gid Profil Rasmi */}
                <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {newGuideAvatarUrl ? (
                      <img src={newGuideAvatarUrl} alt="Gid rasmi" className="w-full h-full object-cover" />
                    ) : (
                      <UserOutlined className="text-2xl text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-300">Gidning Profil Rasmi (ixtiyoriy)</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Upload
                        beforeUpload={async (file) => {
                          setUploadingAvatar(true);
                          try {
                            const res = await uploadExperienceImages([file as File]);
                            if (res.success && res.data?.urls?.[0]) {
                              setNewGuideAvatarUrl(res.data.urls[0]);
                              message.success("Gid rasmi yuklandi!");
                            }
                          } catch {
                            message.error("Rasm yuklashda xatolik");
                          } finally {
                            setUploadingAvatar(false);
                          }
                          return false;
                        }}
                        showUploadList={false}
                        accept="image/*"
                        disabled={uploadingAvatar}
                      >
                        <Button size="small" icon={<UploadOutlined />} loading={uploadingAvatar} className="bg-slate-800 text-slate-200 border-slate-700 text-xs">
                          Rasm yuklash
                        </Button>
                      </Upload>
                      {newGuideAvatarUrl && (
                        <Button size="small" type="text" danger onClick={() => setNewGuideAvatarUrl(null)} className="text-xs">
                          O'chirish
                        </Button>
                      )}
                    </div>
                  </div>
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

      {/* Turni tahrirlash modali */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-white font-bold text-lg border-b border-slate-800 pb-3">
            <EditOutlined className="text-sky-400" />
            <span>Turni Tahrirlash: {editingExp?.title}</span>
          </div>
        }
        open={!!editingExp}
        onCancel={() => !submittingEdit && setEditingExp(null)}
        footer={null}
        width={800}
        centered
        className="dark-modal"
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateExperience}
          className="pt-2 max-h-[75vh] overflow-y-auto pr-2 space-y-4"
        >
          {/* Umumiy ma'lumotlar: Shahar, Narx, Davomiylik */}
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
              Tur Nomi, Tavsifi va Uchrashuv Joyi (Ko'p tillilik)
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
                Tur Rasmlari ({editImageUrls.length} / 5) *
              </span>
              {uploadingEditImages && <span className="text-xs text-amber-400 animate-pulse">Yuklanmoqda...</span>}
            </div>

            {/* Uploaded Thumbnails */}
            {editImageUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {editImageUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700 h-20">
                    <img src={url} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveEditImage(idx)}
                      className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white p-1 rounded-full text-xs transition"
                    >
                      <CloseOutlined />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {editImageUrls.length < 5 && (
              <div className="space-y-2 pt-2">
                <Upload
                  beforeUpload={handleUploadEditImage}
                  showUploadList={false}
                  accept="image/*"
                  disabled={uploadingEditImages}
                >
                  <Button icon={<UploadOutlined />} loading={uploadingEditImages} className="bg-slate-800 text-slate-200 border-slate-700">
                    Kompyuterdan rasm yuklash
                  </Button>
                </Upload>

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Yoki rasm URL manzilini kiriting..."
                    value={customEditImageUrl}
                    onChange={(e) => setCustomEditImageUrl(e.target.value)}
                    onPressEnter={handleAddCustomEditImageUrl}
                    size="small"
                  />
                  <Button size="small" onClick={handleAddCustomEditImageUrl} className="bg-slate-800 text-slate-200 border-slate-700">
                    Qo'shish
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              onClick={() => setEditingExp(null)}
              disabled={submittingEdit}
              className="bg-slate-800 text-slate-300 border-slate-700"
            >
              Bekor qilish
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingEdit}
              className="bg-sky-600 hover:bg-sky-500 border-none font-bold text-white shadow-lg"
            >
              O'zgarishlarni saqlash
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminExperiences;
