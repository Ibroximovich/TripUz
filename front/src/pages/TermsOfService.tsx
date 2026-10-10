import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Divider } from 'antd';
import { ArrowLeftOutlined, SafetyCertificateOutlined, FileTextOutlined } from '@ant-design/icons';
import { TouristHeader } from '../components/TouristHeader';
import { TouristFooter } from '../components/TouristFooter';

export const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Ommaviy Oferta (Foydalanish Shartlari) | TripUz";
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
              <Tag color="gold" className="font-semibold text-xs px-2.5 py-0.5">
                Rasmiy Huquqiy Hujjat
              </Tag>
              <span className="text-xs text-slate-400">Oxirgi yangilanish: 2026-yil</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-black text-white m-0">
              Ommaviy Oferta Shartnomasi (Public Offer)
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed m-0">
              Mazkur hujjat «TRIPHUB» tomonidan taqdim etilayotgan TripUz platformasi xizmatlaridan foydalanish bo‘yicha rasmiy ommaviy taklif hisoblanadi.
            </p>
          </div>

          {/* Rekvizitlar Box */}
          <div className="bg-[#0F1419] border border-amber-500/30 rounded-2xl p-5 space-y-2 text-xs">
            <div className="text-amber-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <SafetyCertificateOutlined /> Ijrochi Ma'lumotlari:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
              <div><strong>Yuridik kompaniya nomi:</strong> «TRIPHUB»</div>
              <div><strong>STIR (INN):</strong> 313 386 937</div>
              <div><strong>Yuridik manzil:</strong> Sirdaryo viloyati, O‘zbekiston</div>
              <div><strong>Platforma:</strong> tripuz.uz (TripUz Marketplace)</div>
            </div>
          </div>

          {/* Moddalar */}
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white font-serif m-0">1. Umumiy qoidalar</h2>
              <p>
                1.1. Mazkur Ommaviy oferta (keyingi o‘rinlarda — «Shartnoma») O‘zbekiston Respublikasi Fuqarolik kodeksining 367 va 369-moddalariga muvofiq, «TRIPHUB» (keyingi o‘rinlarda — «Kompaniya» yoki «Platforma») tomonidan jismoniy va yuridik shaxslarga (keyingi o‘rinlarda — «Foydalanuvchi» yoki «Turist») TripUz veb-sayti orqali turizm va ekskursiya xizmatlarini bron qilish bo‘yicha tuziladigan rasmiy shartnoma hisoblanadi.
              </p>
              <p>
                1.2. Foydalanuvchi saytda ro‘yxatdan o‘tganda, tur tanlaganda yoki buyurtma berganda mazkur Shartnoma shartlarini to‘liq va shartsiz qabul qilgan (aksept qilgan) hisoblanadi.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white font-serif m-0">2. Xizmatlar tavsifi va buyurtma berish</h2>
              <p>
                2.1. Platforma mustaqil gidlar va turoperatorlar tomonidan taqdim etiladigan ekskursiyalar, tarixiy shaharlar bo‘ylab sayohatlar va madaniy dasturlarni tanlash, bron qilish hamda to‘lovlarni qabul qilish bo‘yicha vositachilik axborot xizmatlarini ko‘rsatadi.
              </p>
              <p>
                2.2. Foydalanuvchi o‘zi xohlagan turni, sanani, ishtirokchilar sonini tanlab, o‘zining haqiqiy aloqa ma’lumotlarini (ism, familiya, telefon raqam, elektron pochta) kiritgan holda buyurtma rasmiylashtiradi.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white font-serif m-0">3. Narxlar va to‘lov tartibi</h2>
              <p>
                3.1. Saytdagi barcha xizmatlar narxi O‘zbekiston Respublikasining milliy valyutasi — <strong>O‘zbek so‘mida (UZS)</strong> ko‘rsatiladi hamda chet ellik sayyohlar qulayligi uchun ekvivalent dollar (USD) qiymati taqdim etilishi mumkin.
              </p>
              <p>
                3.2. To‘lovlar O‘zbekiston Respublikasining vakolatli to‘lov tizimlari (Payme, Click, Uzum, bank kartalari) orqali naqdsiz shaklda, 100% xavfsiz shifrlangan kanallar orqali qabul qilinadi.
              </p>
              <p>
                3.3. To‘lov muvaffaqiyatli amalga oshirilgandan so‘ng Foydalanuvchiga elektron vaucher va buyurtma tasdig‘i taqdim etiladi.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white font-serif m-0">4. Buyurtmani bekor qilish va to‘lovni qaytarish (Refund Policy)</h2>
              <p>
                4.1. Foydalanuvchi turni belgilangan sanadan kamida 24 soat oldin bekor qilgan taqdirda, to‘langan mablag‘ to‘lov amalga oshirilgan bank kartasiga to‘liq (yoki xizmat shartlarida ko‘rsatilgan minimal komissiya chegirilgan holda) qaytariladi.
              </p>
              <p>
                4.2. Gid yoki tashkilotchi sababli tur bekor bo‘lsa, to‘lov summasi 100% miqdorda Foydalanuvchiga qaytariladi yoki uning roziligi bilan boshqa sanaga ko‘chiriladi.
              </p>
              <p>
                4.3. Tur boshlanishiga 24 soatdan kam vaqt qolganda Foydalanuvchi tomonidan bekor qilinganda yoki Foydalanuvchi belgilangan vaqtda kelmagan holatlarda to‘lov qaytarilmasligi mumkin.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white font-serif m-0">5. Tomonlarning huquq va majburiyatlari</h2>
              <p>
                5.1. Kompaniya platformaning uzluksiz ishlashini, to‘lovlarning xavfsizligini va ma’lumotlarning maxfiyligini ta’minlash majburiyatini oladi.
              </p>
              <p>
                5.2. Foydalanuvchi buyurtma berish paytida to‘g‘ri ma’lumotlarni kiritish, xavfsizlik qoidalariga rioya qilish va belgilangan vaqtda uchrashuv joyida bo‘lish majburiyatini oladi.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white font-serif m-0">6. Nizolarni hal etish tartibi</h2>
              <p>
                6.1. Mazkur Shartnoma bo‘yicha kelib chiqadigan barcha nizolar muzokaralar yo‘li bilan hal etiladi.
              </p>
              <p>
                6.2. O‘zaro kelishuvga erishilmagan taqdirda, nizolar O‘zbekiston Respublikasining amaldagi qonunchiligiga muvofiq tegishli sudda ko‘rib chiqiladi.
              </p>
            </section>
          </div>
        </div>
      </main>

      <TouristFooter />
    </div>
  );
};

export default TermsOfService;
