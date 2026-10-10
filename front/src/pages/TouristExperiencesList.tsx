import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  Tag,
  Avatar,
  Select,
  Empty,
  Skeleton,
  Alert,
  DatePicker,
} from 'antd';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  FilterOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { TouristHeader } from '../components/TouristHeader';
import { TouristFooter } from '../components/TouristFooter';
import { ExperienceImageSlider } from './GuideDashboard';
import { getPublicExperiences } from '../services/tourist.api';
import type { Experience } from '../types/experience';
import { getExpTitle, getExpDescription, formatLanguageName } from '../types/experience';

const USD_TO_UZS_RATE = 12800;

export const TouristExperiencesList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<string>('price_asc');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  // Set page title dynamically
  useEffect(() => {
    document.title = t('meta.catalog_title');
  }, [t]);

  // React Query fetching GET /api/experiences
  const {
    data: experiences = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Experience[]>({
    queryKey: ['experiences-catalog', selectedCity, sortOrder, i18n.language],
    queryFn: async () => {
      const cityFilter = selectedCity === 'ALL' ? undefined : selectedCity;
      const sortParam =
        sortOrder === 'price_asc'
          ? 'price_asc'
          : sortOrder === 'price_desc'
          ? 'price_desc'
          : undefined;
      const res = await getPublicExperiences({ city: cityFilter, sort: sortParam });
      if (!res.success) {
        throw new Error(res.message || t('common.load_failed'));
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return (res.data as any)?.experiences || [];
    },
  });

  // Set of dates (YYYY-MM-DD) that have scheduled slots across all tours
  const availableTourDates = React.useMemo(() => {
    const dates = new Set<string>();
    experiences.forEach((exp) => {
      exp.availableDates?.forEach((slot) => {
        if (slot?.date) {
          dates.add(dayjs(slot.date).format('YYYY-MM-DD'));
        }
      });
    });
    return dates;
  }, [experiences]);

  // Filter experiences by selected date
  const filteredExperiences = React.useMemo(() => {
    if (!selectedDate) return experiences;
    const target = selectedDate.format('YYYY-MM-DD');
    return experiences.filter((exp) =>
      exp.availableDates?.some(
        (slot) => slot?.date && dayjs(slot.date).format('YYYY-MM-DD') === target
      )
    );
  }, [experiences, selectedDate]);

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between selection:bg-[#C2703D] selection:text-white">
      {/* Top Navigation */}
      <TouristHeader />

      {/* Main Catalog Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Page Banner Header */}
        <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C2703D]/15 border border-[#C2703D]/30 text-amber-300 text-xs font-semibold">
              <StarOutlined /> {t('catalog.badge')}
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-extrabold text-white m-0 tracking-tight">
              {t('catalog.title')}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl m-0 leading-relaxed">
              {t('catalog.subtitle')}
            </p>
          </div>
        </div>

        {/* Filter and Price Sorting Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#161F28] p-4 sm:px-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            {/* City Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FilterOutlined className="text-[#C2703D]" /> {t('common.filter_by_city')}
              </span>
              <Select
                value={selectedCity}
                onChange={setSelectedCity}
                popupClassName="dark-select-dropdown"
                className="custom-lang-select bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl text-xs w-44"
                options={[
                  { value: 'ALL', label: `🕌 ${t('common.all_cities')}` },
                  { value: 'Samarqand', label: `🕌 ${t('cities.Samarqand')}` },
                  { value: 'Buxoro', label: `🏰 ${t('cities.Buxoro')}` },
                  { value: 'Toshkent', label: `🏙️ ${t('cities.Toshkent')}` },
                  { value: 'Xiva', label: `🏛️ ${t('cities.Xiva')}` },
                ]}
              />
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CalendarOutlined className="text-[#C2703D]" /> {t('common.filter_by_date')}
              </span>
              <DatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                placeholder={t('common.choose_date')}
                format="DD.MM.YYYY"
                allowClear
                popupClassName="dark-calendar-dropdown"
                className="custom-date-picker bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl text-xs w-40 h-8"
                cellRender={(current, info) => {
                  if (info.type !== 'date') return info.originNode;
                  const dateStr = dayjs(current).format('YYYY-MM-DD');
                  const hasTour = availableTourDates.has(dateStr);
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {info.originNode}
                      {hasTour && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#C2703D] pointer-events-none" />
                      )}
                    </div>
                  );
                }}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              {t('common.sort_by')}
            </span>
            <Select
              value={sortOrder}
              onChange={setSortOrder}
              popupClassName="dark-select-dropdown"
              className="custom-lang-select bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl text-xs w-52"
              options={[
                { value: 'price_asc', label: `💵 ${t('common.price_asc')}` },
                { value: 'price_desc', label: `💎 ${t('common.price_desc')}` },
              ]}
            />
          </div>
        </div>

        {/* Active Date Filter Notice */}
        {selectedDate && (
          <div className="flex items-center justify-between bg-[#161F28] border border-[#C2703D]/40 px-4 py-2.5 rounded-2xl text-xs shadow-sm">
            <span className="text-slate-300 flex items-center gap-2 flex-wrap">
              <CalendarOutlined className="text-[#C2703D]" />
              {t('catalog.filter_active')}{' '}
              <strong className="text-amber-400 font-semibold">{selectedDate.format('DD.MM.YYYY')}</strong>
              <span className="text-slate-500">({filteredExperiences.length} {t('common.tours_count_short')})</span>
            </span>
            <Button
              size="small"
              type="text"
              onClick={() => setSelectedDate(null)}
              className="text-slate-400 hover:text-white text-xs font-semibold h-auto p-0"
            >
              ✕ {t('common.clear_filter')}
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <Card key={idx} className="bg-[#161F28] border-slate-800 rounded-3xl p-4">
                <Skeleton.Image className="w-full h-52 rounded-2xl mb-4" active />
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="py-12 max-w-xl mx-auto">
            <Alert
              type="error"
              showIcon
              message={<span className="font-bold text-sm">{t('common.load_failed')}</span>}
              description={
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-slate-300 m-0">
                    {(error as Error)?.message || t('common.connection_error')}
                  </p>
                  <Button
                    type="primary"
                    danger
                    icon={<ReloadOutlined />}
                    onClick={() => refetch()}
                    className="rounded-xl text-xs font-bold"
                  >
                    {t('common.retry')}
                  </Button>
                </div>
              }
              className="bg-red-950/40 border-red-900/60 rounded-2xl p-4"
            />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredExperiences.length === 0 && (
          <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-12 text-center">
            <Empty
              description={
                <div className="space-y-1">
                  <span className="text-slate-300 font-bold text-base block">
                    {selectedDate
                      ? t('catalog.no_tours_for_date')
                      : t('catalog.no_tours_found')}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {selectedDate
                      ? t('catalog.try_another_date')
                      : t('catalog.no_tours_subtitle')}
                  </span>
                </div>
              }
              className="py-6"
            >
              {selectedDate && (
                <Button
                  onClick={() => setSelectedDate(null)}
                  className="mt-2 bg-[#C2703D] hover:bg-[#A85B2D] text-white border-none rounded-xl text-xs font-semibold px-4"
                >
                  {t('catalog.show_all_dates')}
                </Button>
              )}
            </Empty>
          </div>
        )}

        {/* Experiences Cards Grid (Mobile-First 1-col, Tablet 2-col, Desktop 3-col) */}
        {!isLoading && !isError && filteredExperiences.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperiences.map((exp) => {
              const displayPrice = exp.priceUsd || exp.price;
              const uzsEstimate = Math.round((exp.priceUzs || (displayPrice * USD_TO_UZS_RATE)));
              const title = getExpTitle(exp, i18n.language);
              const desc = getExpDescription(exp, i18n.language);

              return (
                <Card
                  key={exp.id}
                  onClick={() => navigate(`/experiences/${exp.id}`)}
                  className="bg-[#161F28] border-slate-800 rounded-3xl overflow-hidden hover:border-[#C2703D]/60 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
                >
                  {/* Image Slider with Floating Price Tag */}
                  <ExperienceImageSlider
                    images={exp.images}
                    title={title}
                    heightClass="h-56"
                    badgeContent={
                      <Tag className="font-bold border-none bg-[#0F1419]/90 text-amber-300 backdrop-blur-md px-3 py-1 rounded-xl text-xs shadow-md">
                        🕌 {t(`cities.${exp.location || exp.city}`, exp.location || exp.city)}
                      </Tag>
                    }
                    priceBadge={
                      <div className="bg-[#0F1419]/95 border border-amber-400/40 text-white font-black text-xs px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-xl text-right">
                        <div className="text-amber-400 font-bold text-sm tracking-tight">
                          {uzsEstimate.toLocaleString()} UZS
                        </div>
                        <div className="text-[10px] text-slate-300 font-normal">
                          (${displayPrice} USD)
                        </div>
                      </div>
                    }
                  />

                  <div className="space-y-4 flex-1 flex flex-col justify-between p-1">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-white leading-snug line-clamp-2 m-0 group-hover:text-amber-400 transition-colors">
                        {title}
                      </h3>
                      <p className="text-slate-400 text-xs line-clamp-2 mt-2 m-0 leading-relaxed">
                        {desc}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 bg-[#0F1419] p-2.5 rounded-xl border border-slate-800 text-slate-300">
                          <ClockCircleOutlined className="text-[#C2703D]" />
                          <span>{exp.durationHours || exp.duration} {t('common.hours')}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#0F1419] p-2.5 rounded-xl border border-slate-800 text-slate-300 truncate">
                          <EnvironmentOutlined className="text-amber-400 flex-shrink-0" />
                          <span className="truncate">{t(`cities.${exp.location || exp.city}`, exp.location || exp.city)}</span>
                        </div>
                      </div>

                      {/* Nearest Date Chip */}
                      {exp.availableDates && exp.availableDates.length > 0 && (
                        <div className="flex items-center gap-2 bg-[#0F1419] p-2.5 rounded-xl border border-amber-500/25 text-amber-300 text-xs">
                          <CalendarOutlined className="text-amber-400 flex-shrink-0" />
                          <span>{t('common.nearest_date')}: <strong className="text-white font-semibold">{dayjs(exp.availableDates[0].date).format('DD.MM.YYYY')}</strong></span>
                        </div>
                      )}

                      {/* Language Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                        {(Array.isArray(exp.languages) ? exp.languages : ["O'zbekcha"]).map((lang, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-[#0F1419] px-2.5 py-1 rounded-xl border border-slate-800 text-slate-300 text-[11px]">
                            🌐 {formatLanguageName(lang, t)}
                          </span>
                        ))}
                      </div>

                      {/* Guide Name and View Details CTA */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            size={28}
                            src={(exp as any).guide?.avatarUrl || (exp as any).guide?.avatar}
                            icon={<UserOutlined />}
                            className="bg-[#C2703D] border border-amber-400/60 flex-shrink-0"
                          />
                          <span className="text-xs sm:text-sm text-slate-200 font-semibold truncate max-w-[130px]">
                            {(exp as any).guide?.name || t('common.local_guide')}
                          </span>
                        </div>
                        <Button
                          type="primary"
                          size="small"
                          icon={<ArrowRightOutlined />}
                          className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl text-xs px-3.5 h-8 flex-shrink-0"
                        >
                          {t('common.view')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

      </main>

      {/* Comprehensive Legal Footer */}
      <TouristFooter />
    </div>
  );
};

export default TouristExperiencesList;
