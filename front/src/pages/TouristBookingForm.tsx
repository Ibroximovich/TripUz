import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Tag,
  Skeleton,
  Alert,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LockOutlined,
  PhoneOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { TouristHeader } from '../components/TouristHeader';
import { TouristFooter } from '../components/TouristFooter';
import { useAuthStore } from '../store/useAuthStore';
import { getPublicExperienceById, createTouristBooking } from '../services/tourist.api';
import type { Experience, AvailableDate } from '../types/experience';
import { getExpTitle } from '../types/experience';
import { getActiveReferral } from '../utils/referral';

const USD_TO_UZS_RATE = 12800;

export const TouristBookingForm: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { experienceId } = useParams<{ experienceId: string }>();
  const [searchParams] = useSearchParams();
  const slotId = searchParams.get('slot');

  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [form] = Form.useForm();
  const [numPeople, setNumPeople] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [pendingValues, setPendingValues] = useState<any>(null);

  // Set page title
  useEffect(() => {
    document.title = t('meta.booking_title');
  }, [t]);

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Check slot parameter
  useEffect(() => {
    if (!slotId && experienceId) {
      navigate(`/experiences/${experienceId}`);
    }
  }, [slotId, experienceId, navigate]);

  // Fetch experience details
  const {
    data: experience,
    isLoading,
    isError,
  } = useQuery<Experience | null>({
    queryKey: ['experience-booking-form', experienceId, i18n.language],
    queryFn: async () => {
      if (!experienceId) return null;
      const res = await getPublicExperienceById(experienceId);
      if (!res.success || !res.data) {
        throw new Error(res.message || t('booking.not_found_title'));
      }
      return res.data;
    },
    enabled: !!experienceId,
  });

  // Find target selected slot
  const selectedSlot: AvailableDate | undefined = experience?.availableDates?.find(
    (s) => s.id === slotId
  );

  const maxCap = selectedSlot?.maxCapacity || selectedSlot?.slots || 10;
  const currentBooked = selectedSlot?.bookedCount || 0;
  const remainingSlots = Math.max(0, maxCap - currentBooked);

  // Live Price Calculation
  const unitPrice = Number(experience?.priceUsd || experience?.price || 0);
  const basePrice = unitPrice * numPeople;
  const touristServiceFee = Math.round(basePrice * 0.10 * 100) / 100;
  const totalPrice = basePrice + touristServiceFee;

  const depositUzs = Math.round((totalPrice * USD_TO_UZS_RATE) / 2);
  const depositUsd = (totalPrice / 2).toFixed(2);
  const remainingUzs = Math.round((totalPrice * USD_TO_UZS_RATE) / 2);
  const remainingUsd = (totalPrice / 2).toFixed(2);

  const lang = (i18n.language || 'uz').slice(0, 2);

  const modalTexts = {
    uz: {
      badge: "Xavfsiz va Kafolatlangan Bron",
      title: "Joyni kafolatlash va 50% depozit qoidasi",
      intro: "Ekskursiyada joyingizni rasman kafolatlash uchun umumiy summaning 50% miqdorida oldindan depozit to'lanadi. Qolgan 50% qismini esa sayohat kuni bevosita gidga to'laysiz.",
      depositTitle: "Oldindan to'lov (50% Depozit)",
      remainingTitle: "Tur kuni to'lanadi (50% Naqd)",
      nextStepTitle: "Nima qilish kerak?",
      nextStepDesc: "Quyida ko'rsatilgan gid bilan bog'laning (Telegram yoki telefon orqali) va 50% depozit to'lovini amalga oshiring. Shundan so'ng gidingiz buyurtmangizni darhol tasdiqlaydi.",
      guideLabel: "Gid",
      phoneLabel: "Telefon raqami",
      telegramBtn: "Telegram orqali yozish",
      callBtn: "Qo'ng'iroq qilish",
      confirmBtn: "Tushundim, buyurtmani yuborish",
      cancelBtn: "Orqaga qaytish",
    },
    en: {
      badge: "Safe & Guaranteed Booking",
      title: "Booking Guarantee & 50% Deposit Policy",
      intro: "To guarantee and secure your spot for this tour, a 50% advance deposit is required. The remaining 50% will be paid directly to your guide on the day of the tour.",
      depositTitle: "Advance Payment (50% Deposit)",
      remainingTitle: "Pay on Tour Day (50% Cash)",
      nextStepTitle: "Next Step — Contact Your Guide:",
      nextStepDesc: "Please contact your guide directly using the contact details below (Telegram or Phone) to arrange the 50% deposit. Once received, your guide will confirm your reservation.",
      guideLabel: "Guide",
      phoneLabel: "Phone Number",
      telegramBtn: "Contact via Telegram",
      callBtn: "Call Guide",
      confirmBtn: "Understood, Confirm Booking",
      cancelBtn: "Go Back",
    },
    ru: {
      badge: "Безопасное бронирование",
      title: "Гарантия бронирования и 50% предоплата",
      intro: "Для гарантированного закрепления места на экскурсии требуется внести 50% предоплату (депозит). Оставшиеся 50% оплачиваются гиду в день проведения экскурсии.",
      depositTitle: "Предоплата (50% Депозит)",
      remainingTitle: "Оплата в день тура (50% Наличными)",
      nextStepTitle: "Что нужно сделать?",
      nextStepDesc: "Пожалуйста, свяжитесь с вашим гидом по контактам ниже (Telegram или телефон) для перевода 50% депозита. После этого гид подтвердит ваше бронирование.",
      guideLabel: "Гид",
      phoneLabel: "Номер телефона",
      telegramBtn: "Написать в Telegram",
      callBtn: "Позвонить гиду",
      confirmBtn: "Понятно, отправить бронь",
      cancelBtn: "Назад",
    },
  };

  const currentModalText = modalTexts[lang as 'uz' | 'en' | 'ru'] || modalTexts.uz;

  const guideName = experience?.guide?.name || "TripUz Gidi";
  const guidePhone = experience?.guide?.phone;
  const guideTgHandle = experience?.guide?.telegramHandle?.replace(/^@/, '');
  const tgUrl = guideTgHandle ? `https://t.me/${guideTgHandle}` : null;

  // Auto fill form with user info
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        touristName: user.name || '',
        touristEmail: user.email || '',
        touristPhone: (user as any).phone || '',
        numPeople: 1,
      });
    }
  }, [user, form]);

  const handleSubmitBooking = (values: any) => {
    if (!experienceId || !slotId) return;

    if (numPeople > remainingSlots) {
      setServerError(t('booking.error_only_spots', { count: remainingSlots }));
      return;
    }

    setPendingValues(values);
    setIsDepositModalOpen(true);
  };

  const handleConfirmBookingWithDeposit = async () => {
    if (!experienceId || !slotId || !pendingValues) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const activeReferral = getActiveReferral();
      const payload = {
        experienceId,
        slotId,
        numPeople,
        touristName: pendingValues.touristName,
        touristEmail: pendingValues.touristEmail,
        touristPhone: pendingValues.touristPhone || '',
        referralCode: activeReferral || undefined,
      };

      const res = await createTouristBooking(payload);

      if (res.success && res.data) {
        setIsDepositModalOpen(false);
        navigate('/my-bookings');
      } else {
        throw new Error(res.message || t('booking.creating_error'));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t('common.server_error');
      setServerError(msg);
      setIsDepositModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between">
        <TouristHeader />
        <div className="max-w-4xl mx-auto px-4 py-12 w-full space-y-6">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  if (isError || !experience || !selectedSlot) {
    return (
      <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between">
        <TouristHeader />
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl font-bold font-serif text-white">{t('booking.not_found_title')}</h2>
          <p className="text-slate-400 text-sm">
            {t('booking.not_found_subtitle')}
          </p>
          <Button
            type="primary"
            onClick={() => navigate('/experiences')}
            className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl"
          >
            {t('common.back_to_tours')}
          </Button>
        </div>
      </div>
    );
  }

  const expTitle = getExpTitle(experience, i18n.language);

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between selection:bg-[#C2703D] selection:text-white">
      {/* Top Header */}
      <TouristHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="bg-[#161F28] border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs"
          >
            {t('common.back')}
          </Button>
          <Tag className="bg-[#161F28] border-slate-800 text-amber-400 font-bold px-3 py-1 rounded-xl text-xs">
            🕌 {t(`cities.${experience.location || experience.city}`, experience.location || experience.city)}
          </Tag>
        </div>

        {/* Header Banner */}
        <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-2 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C2703D]/15 border border-[#C2703D]/30 text-amber-300 text-xs font-semibold">
            <SafetyCertificateOutlined /> {t('booking.secure_badge')}
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-extrabold text-white m-0">
            {t('booking.page_title')}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm m-0">
            {t('booking.page_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-7 bg-[#161F28] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            {serverError && (
              <Alert
                type="error"
                message={t('common.error_title')}
                description={serverError}
                showIcon
                closable
                onClose={() => setServerError(null)}
                className="bg-red-950/40 border-red-800 text-red-200 text-xs rounded-2xl"
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmitBooking}
              className="space-y-4"
            >
              <Form.Item
                name="numPeople"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">{t('booking.participants_label')}</span>}
                rules={[{ required: true, message: t('booking.participants_required') }]}
              >
                <InputNumber
                  min={1}
                  max={remainingSlots}
                  value={numPeople}
                  onChange={(val) => setNumPeople(Number(val) || 1)}
                  className="w-full bg-[#0F1419] border-slate-800 text-white rounded-xl text-base py-1"
                />
              </Form.Item>
              <div className="text-xs text-amber-400 font-semibold -mt-2 mb-2">
                {t('booking.remaining_slots', { count: remainingSlots })}
              </div>

              <Form.Item
                name="touristName"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">{t('booking.name_label')}</span>}
                rules={[{ required: true, message: t('booking.name_required') }]}
              >
                <Input
                  prefix={<UserOutlined className="text-slate-500 mr-1" />}
                  placeholder="Masalan: Jasur Rahimov"
                  className="bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl py-2"
                />
              </Form.Item>

              <Form.Item
                name="touristEmail"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">{t('booking.email_label')}</span>}
                rules={[
                  { required: true, message: t('booking.email_required') },
                  { type: 'email', message: t('booking.email_invalid') },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-slate-500 mr-1" />}
                  placeholder="name@domain.com"
                  className="bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl py-2"
                />
              </Form.Item>

              <Form.Item
                name="touristPhone"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">{t('booking.phone_label')}</span>}
              >
                <Input
                  prefix={<PhoneOutlined className="text-slate-500 mr-1" />}
                  placeholder="+998 90 123 45 67"
                  className="bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl py-2"
                />
              </Form.Item>

              <div className="pt-4 border-t border-slate-800">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={submitting}
                  icon={<CheckCircleOutlined />}
                  className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl h-12 text-sm shadow-xl"
                >
                  {Math.round(totalPrice * USD_TO_UZS_RATE).toLocaleString()} UZS (${totalPrice.toFixed(2)}) — Buyurtmani tasdiqlash
                </Button>
              </div>
            </Form>
          </div>

          {/* Right Column: Tour Summary Card */}
          <div className="lg:col-span-5 bg-[#161F28] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="text-lg font-serif font-bold text-white m-0 border-b border-slate-800 pb-4">
              {t('booking.trip_info')}
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">{t('booking.tour_name')}</span>
                <span className="text-base font-serif font-bold text-white block mt-0.5">{expTitle}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#0F1419] p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('booking.tour_datetime')}</span>
                  <span className="text-amber-400 font-bold block mt-0.5">
                    {dayjs(selectedSlot.date).format('DD.MM.YYYY HH:mm')}
                  </span>
                </div>
                <div className="bg-[#0F1419] p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('booking.tour_duration')}</span>
                  <span className="text-slate-200 font-bold block mt-0.5">
                    {experience.durationHours || experience.duration} {t('booking.hours_unit')}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-[#0F1419] p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>{t('booking.price_base', { unit: unitPrice, count: numPeople })}</span>
                  <span className="font-semibold text-white">${basePrice.toFixed(2)} USD</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>{t('booking.price_service_fee')}</span>
                  <span>+${touristServiceFee.toFixed(2)} USD</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-sm">
                  <span className="text-white">{t('booking.price_total')}</span>
                  <div className="text-right">
                    <span className="text-amber-400 font-serif text-lg block">
                      {Math.round(totalPrice * USD_TO_UZS_RATE).toLocaleString()} UZS
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      (${totalPrice.toFixed(2)} USD)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#0F1419] rounded-2xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <LockOutlined className="text-emerald-400 text-base flex-shrink-0" />
                <span>{t('booking.security_note')}</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 50% Deposit & Guide Contact Modal */}
      <Modal
        open={isDepositModalOpen}
        onCancel={() => !submitting && setIsDepositModalOpen(false)}
        footer={null}
        centered
        width={540}
        destroyOnClose
        styles={{
          container: {
            backgroundColor: '#161F28',
            borderRadius: '24px',
            border: '1px solid #334155',
            color: '#F8FAFC',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          },
          mask: {
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
          },
        }}
      >
        <div className="space-y-5 pt-1">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <SafetyCertificateOutlined className="text-sm" />
              <span>{currentModalText.badge}</span>
            </div>
            <h2 className="text-xl font-serif font-black text-white m-0 tracking-tight">
              {currentModalText.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed m-0">
              {currentModalText.intro}
            </p>
          </div>

          {/* Deposit Breakdown Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#0F1419] rounded-2xl border border-slate-800">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] sm:text-[11px] uppercase font-bold text-amber-400 block tracking-wider">
                💳 {currentModalText.depositTitle}
              </span>
              <div className="text-base sm:text-lg font-black text-white mt-1">
                {depositUzs.toLocaleString()} UZS
              </div>
              <div className="text-[11px] text-amber-300 font-semibold">
                (${depositUsd} USD)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                🤝 {currentModalText.remainingTitle}
              </span>
              <div className="text-base sm:text-lg font-black text-slate-200 mt-1">
                {remainingUzs.toLocaleString()} UZS
              </div>
              <div className="text-[11px] text-slate-400 font-semibold">
                (${remainingUsd} USD)
              </div>
            </div>
          </div>

          {/* Guide Contact Details */}
          <div className="bg-[#0F1419] rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-start gap-2">
              <InfoCircleOutlined className="text-amber-400 text-base mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 m-0">
                  {currentModalText.nextStepTitle}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed m-0">
                  {currentModalText.nextStepDesc}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-sm overflow-hidden flex-shrink-0">
                  {experience?.guide?.avatarUrl ? (
                    <img
                      src={experience.guide.avatarUrl}
                      alt={guideName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserOutlined />
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {currentModalText.guideLabel}
                  </span>
                  <span className="text-sm font-bold text-white block">
                    {guideName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {guidePhone && (
                  <a
                    href={`tel:${guidePhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    <PhoneOutlined className="text-emerald-400" />
                    <span>{guidePhone}</span>
                  </a>
                )}
                {tgUrl && (
                  <a
                    href={tgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] text-xs font-bold border border-[#229ED9]/40 transition"
                  >
                    <SendOutlined />
                    <span>Telegram</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 pt-2">
            <Button
              type="default"
              block
              onClick={() => setIsDepositModalOpen(false)}
              disabled={submitting}
              className="bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700 font-semibold rounded-xl h-11 text-xs sm:text-sm"
            >
              {currentModalText.cancelBtn}
            </Button>

            <Button
              type="primary"
              block
              loading={submitting}
              onClick={handleConfirmBookingWithDeposit}
              icon={<CheckCircleOutlined />}
              className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl h-11 text-xs sm:text-sm shadow-lg text-white"
            >
              {currentModalText.confirmBtn}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Comprehensive Legal Footer */}
      <TouristFooter />
    </div>
  );
};

export default TouristBookingForm;
