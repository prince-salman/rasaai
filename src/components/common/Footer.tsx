import React from 'react';
import { ShieldCheck, Award, FileSpreadsheet, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/80 pt-10 pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-white tracking-tight">RASA <span className="text-teal-400">AI</span></span>
            <span className="bg-teal-950 text-teal-400 border border-teal-800/60 text-[10px] px-1.5 py-0.5 rounded font-mono">v1.0</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs">
            Dual-Engine Deep Vision and Machine Learning Framework untuk Standardisasi Mutu dan Konsistensi Tekstur Produk UMKM Kuliner.
          </p>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold pt-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>AIoT Edge Mini-Dome Chamber</span>
          </div>
        </div>

        {/* Col 2: Author Info */}
        <div className="space-y-2">
          <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Tim Peneliti & Pengusul</h4>
          <ul className="space-y-1.5 text-slate-300">
            <li className="flex flex-col">
              <span className="font-semibold text-white">Muhamad Salman</span>
              <span className="text-[11px] text-slate-400">NIM: 001202600008 (Ketua Tim - Informatika)</span>
            </li>
            <li className="flex flex-col">
              <span className="font-semibold text-white">Immanuel Elvando Kenjam</span>
              <span className="text-[11px] text-slate-400">NIM: 001202600066 (Anggota I - Informatika)</span>
            </li>
            <li className="flex flex-col">
              <span className="font-semibold text-white">Citra Ayu Setyoningputri</span>
              <span className="text-[11px] text-slate-400">NIM: 021202600020 (Anggota II - Aktuaria)</span>
            </li>
          </ul>
        </div>

        {/* Col 3: Academic Institution */}
        <div className="space-y-2">
          <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Afiliasi Akademik</h4>
          <p className="text-slate-300 font-semibold">President University</p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Fakultas Kecerdasan Buatan dan Manufaktur Cerdas & Fakultas Bisnis<br />
            Kawasan Industri Jababeka, Cikarang, Indonesia (2026)
          </p>
          <div className="flex items-center gap-1.5 text-teal-400 pt-1">
            <Award className="w-3.5 h-3.5" />
            <span className="font-medium">Sub-Tema: Innovation & Digital Economy</span>
          </div>
        </div>

        {/* Col 4: Compliance & Digital Traceability */}
        <div className="space-y-2">
          <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Kepatuhan & Sertifikasi</h4>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Data pengujian batch tersinkronisasi digital untuk mendukung proses audit dan percepatan perizinan:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-400" /> SNI 01-2973
            </span>
            <span className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-400" /> BPOM MD
            </span>
            <span className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3 text-teal-400" /> HACCP
            </span>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-slate-900 pt-5 flex flex-wrap items-center justify-between gap-3 text-slate-500 text-[11px]">
        <p>? 2026 RASA AI ? President University. Hak Cipta Dilindungi.</p>
        <p>Dirancang untuk memajukan UMKM Kuliner Indonesia menuju Smart Food Production.</p>
      </div>
    </footer>
  );
};
