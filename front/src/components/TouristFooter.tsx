import React from 'react';
import { Link } from 'react-router-dom';
import {
  SafetyCertificateOutlined,
  LockOutlined,
  EnvironmentOutlined,
  MailOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import logoImg from '../assets/logo.png';

export const TouristFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0a0e14] border-t border-slate-800/80 text-slate-400 text-xs mt-16 font-sans">
      {/* Upper Footer: 4-Column Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Brand & Description */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img
                src={logoImg}
                alt="TripUz"
                className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_2px_10px_rgba(217,119,6,0.25)]"
              />
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              O‘zbekistonning tarixiy shaharlari bo‘ylab eng sara ekskursiyalar va litsenziyaga ega mahalliy gidlar bilan unutilmas sayohatlar uchun ishonchli marketplace.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 w-fit">
              <LockOutlined /> <span>256-bit SSL Xavfsiz to‘lovlar</span>
            </div>
          </div>

          {/* Column 2: Legal Details (Yuridik Ma'lumotlar) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif border-b border-slate-800 pb-2">
              Yuridik Ma'lumotlar
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block text-[11px]">Kompaniya nomi:</span>
                <strong className="text-white">«TRIPHUB»</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">STIR (INN):</span>
                <span className="font-mono text-amber-400 font-bold">313 386 937</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Yuridik manzil:</span>
                <span className="text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <EnvironmentOutlined className="text-amber-400 flex-shrink-0" />
                  Sirdaryo viloyati, O‘zbekiston
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Legal Documents & Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif border-b border-slate-800 pb-2">
              Hujjatlar & Qoidalar
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to="/terms"
                  className="text-slate-300 hover:text-amber-400 flex items-center gap-2 transition-colors"
                >
                  <FileTextOutlined className="text-amber-500" />
                  <span>Ommaviy Oferta (Public Offer)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-slate-300 hover:text-amber-400 flex items-center gap-2 transition-colors"
                >
                  <SafetyCertificateOutlined className="text-sky-400" />
                  <span>Maxfiylik Siyosati (Privacy Policy)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/experiences"
                  className="text-slate-300 hover:text-amber-400 transition-colors"
                >
                  Turlar va Ekskursiyalar
                </Link>
              </li>
              <li>
                <Link
                  to="/my-bookings"
                  className="text-slate-300 hover:text-amber-400 transition-colors"
                >
                  Mening Buyurtmalarim
                </Link>
              </li>
              <li>
                <Link
                  to="/guide/login"
                  className="text-amber-400/90 hover:text-amber-300 transition-colors"
                >
                  Gidlar uchun portal →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: To'lov Tizimlari & Aloqa */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif border-b border-slate-800 pb-2">
              To'lov Tizimlari
            </h4>
            <p className="text-[11px] text-slate-400">
              Saytda to‘lovlar O‘zbek so‘mida (UZS) milliy va xalqaro to‘lov tizimlari orqali xavfsiz qabul qilinadi:
            </p>
            
            {/* Payment Method Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 bg-[#161F28] border border-cyan-500/40 text-cyan-400 rounded-lg font-bold text-xs">
                Payme
              </span>
              <span className="px-2.5 py-1 bg-[#161F28] border border-blue-500/40 text-blue-400 rounded-lg font-bold text-xs">
                Click
              </span>
              <span className="px-2.5 py-1 bg-[#161F28] border border-purple-500/40 text-purple-400 rounded-lg font-bold text-xs">
                Uzum Bank
              </span>
              <span className="px-2.5 py-1 bg-[#161F28] border border-slate-700 text-slate-300 rounded-lg font-medium text-xs">
                Uzcard / Humo
              </span>
              <span className="px-2.5 py-1 bg-[#161F28] border border-slate-700 text-slate-300 rounded-lg font-medium text-xs">
                Visa / MasterCard
              </span>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <MailOutlined className="text-slate-500" />
                <a href="mailto:info@tripuz.uz" className="text-slate-300 hover:text-amber-400">
                  info@tripuz.uz
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Lower Footer: Copyright & Legal Notice */}
      <div className="border-t border-slate-900 bg-[#080B10] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 text-center sm:text-left">
          <div>
            © {currentYear} <strong className="text-slate-400">«TRIPHUB»</strong> (STIR: 313386937). Barcha huquqlar himoyalangan.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/terms" className="hover:text-amber-400 transition-colors">
              Oferta
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-amber-400 transition-colors">
              Maxfiylik
            </Link>
            <span>•</span>
            <span className="text-slate-500">Narxlar: UZS / USD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default TouristFooter;
