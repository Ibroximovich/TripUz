import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag } from 'antd';
import { ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import { TouristHeader } from '../components/TouristHeader';
import { TouristFooter } from '../components/TouristFooter';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Maxfiylik Siyosati (Privacy Policy) | TripUz";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between selection:bg-[#C2703D] selection:text-white">
      <TouristHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white pl-0 flex items-center gap-2"
        >
          Orqaga qaytish
        </Button>

        <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="border-b border-slate-800 pb-6 space-y-3">
            <div className="flex items-center gap-2">
              <Tag color="cyan" className="font-semibold text-xs px-2.5 py-0.5">
                Shaxsiy Ma'lumotlarni Himoya Qilish
              </Tag>
              <span className="text-xs text-slate-400">Oxirgi yangilanish: 2026-yil</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-black text-white m-0">
              Maxfiylik Siyosati (Privacy Policy)
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed m-0">
              Mazkur Maxfiylik siyosati «TRIPHUB» tomonidan boshqariladigan TripUz platformasida foydalanuvchilarning shaxsiy ma’lumotlarini to‘plash, qayta ishlash va xavfsizligini ta’minlash tartibini belgilaydi.
            </p>
          </div>

          {/* Rekvizitlar Box */}
          <div className="bg-[#0F1419] border border-sky-500/30 rounded-2xl p-5 space-y-2 text-xs">
            <div className="text-sky-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <LockOutlined /> Mas'ul Yuridik Shaxs:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
              <div><strong>Kompaniya:</strong> «TRIPHUB»</div>
              <div><strong>STIR (INN):</strong> 313 386 937</div>
              <div><strong>Manzil:</strong> Sirdaryo viloyati, O‘zbekiston</div>
              <div><strong>Elektron aloqa:</strong> info@tripuz.uz</div>
            </div>
          </div>

          {/* Moddalar */}
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white font-serif m-0">1. Umumiy qoidalar</h2>
              <p>
                1.1. Mazkur siyosat O‘zbekiston Respublikasining 2019-yil 2-iyuldagi «Shaxsga doir ma’lumotlar to‘g‘risida»gi O‘RQ-547-son Qonuni talablariga to‘liq mos ravishda ishlab chiqilgan.
              </p>
              <p>
                1.2. TripUz veb-saytidan foydalanish yoki xizmatlarni bron qilish orqali Foydalanuvchi o‘zining shaxsiy ma’lumotlarini qayta ishlashga rozilik beradi.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white font-serif m-0">2. Qanday ma’lumotlar to‘planadi?</h2>
              <p>Platformada quyidagi ma’lumotlar to‘planishi mumkin:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
                <li>Foydalanuvchining ismi, familiyasi;</li>
                <li>Elektron pochta manzili (email);</li>
                <li>Telefon raqami;</li>
                <li>Google hisobi orqali avtorizatsiyadan o‘tishdagi profil ma’lumotlari;</li>
                <li>Bron qilingan sayohatlar tarixi va to‘lov tafsilotlari (to‘lov kartalari ma’lumotlari platformada SAQLANMAYDI, ular to‘g‘ridan-to‘g‘ri litsenziyaga ega to‘lov shlyuzlari tomonidan shifrlanadi).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white font-serif m-0">3. Ma’lumotlardan foydalanish maqsadlari</h2>
              <p>Shaxsiy ma’lumotlar quyidagi maqsadlarda qayta ishlanadi:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
                <li>Ekskursiyalarni muvaffaqiyatli bron qilish va vaucher taqdim etish;</li>
                <li>Gid va turist o‘rtasida sayohat vaqti va uchrashuv joyi bo‘yicha tezkor aloqa o‘rnatish;</li>
                <li>Xizmatlar to‘lovini amalga oshirish va moliyaviy hisob-kitoblarni yuritish;</li>
                <li>Foydalanuvchilarni qo‘llab-quvvatlash va xizmat sifatini oshirish.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white font-serif m-0">4. Ma’lumotlar xavfsizligi</h2>
              <p>
                4.1. «TRIPHUB» foydalanuvchilarning shaxsiy ma’lumotlarini ruxsatsiz kirish, o‘zgartirish, oshkor qilish yoki yo‘q qilishdan himoya qilish uchun barcha texnik va tashkiliy xavfsizlik choralarini (SSL shifrlash, xavfsiz server protokollari) ko‘radi.
              </p>
              <p>
                4.2. Shaxsiy ma’lumotlar O‘zbekiston Respublikasi qonunlarida nazarda tutilgan holatlardan tashqari hech qanday uchinchi shaxslarga berilmaydi yoki sotilmaydi.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white font-serif m-0">5. Foydalanuvchilarning huquqlari</h2>
              <p>
                Har bir foydalanuvchi o‘zining shaxsiy ma’lumotlarini bilish, ularni to‘g‘rilash yoki tizimdan butunlay o‘chirib tashlashni talab qilish huquqiga ega. Buning uchun platforma ma’muriyatiga (info@tripuz.uz) murojaat qilish kifoya.
              </p>
            </section>
          </div>
        </div>
      </main>

      <TouristFooter />
    </div>
  );
};

export default PrivacyPolicy;
