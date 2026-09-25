import React, { useState } from 'react';
import { 
  Activity, 
  Scan, 
  Calculator, 
  Radio,
  Bell, 
  Store,
  Smartphone,
  Copy,
  Check,
  X,
  Wifi
} from 'lucide-react';
import { Branch } from '../../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'scanner' | 'roi';
  setActiveTab: (tab: 'dashboard' | 'scanner' | 'roi') => void;
  branches: Branch[];
  selectedBranch: string;
  setSelectedBranch: (id: string) => void;
  isLiveStreaming: boolean;
  setIsLiveStreaming: (val: boolean | ((prev: boolean) => boolean)) => void;
  hasDeviationAlert: boolean;
  unreadAlertsCount?: number;
  onAlertClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  branches,
  selectedBranch,
  setSelectedBranch,
  isLiveStreaming,
  setIsLiveStreaming,
  hasDeviationAlert,
  unreadAlertsCount = 0,
  onAlertClick
}) => {
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const localUrl = 'http://10.112.59.42:3000';
  const onlineTunnelUrl = 'https://rasa-ai-food.loca.lt';
  const tunnelPassword = '182.2.177.132';

  const handleCopyIp = () => {
    navigator.clipboard.writeText(tunnelPassword);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        {/* Top Banner for President University */}
        <div className="bg-gradient-to-r from-teal-950/60 via-slate-900/40 to-slate-950 border-b border-teal-900/40 px-4 py-1.5 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/president_univ_logo.png" 
              alt="President University" 
              className="h-5 w-auto object-contain brightness-110"
            />
            <span className="font-semibold text-slate-300">President University</span>
            <span className="text-slate-600">•</span>
            <span className="text-teal-400 font-medium">Sub-Tema: Innovation & Digital Economy</span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-slate-400">Kerangka: <strong className="text-slate-200">Dual-Engine Deep Vision & ML</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Target Akurasi: <strong className="text-emerald-400">R² = 0.934</strong></span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <div className="relative group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 via-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 ring-1 ring-teal-300/30">
                <Scan className="w-6 h-6 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                  RASA <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">AI</span>
                </h1>
                <span className="bg-teal-950 text-teal-400 border border-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                  AIoT Cloud QC
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Standardisasi Mutu & Konsistensi Tekstur UMKM Kuliner</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-900/90 border border-slate-800/80 rounded-xl p-1 shadow-inner gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dasbor Mutu</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Simulator Kubah</span>
            </button>

            <button
              onClick={() => setActiveTab('roi')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'roi'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kalkulator ROI</span>
              <span className="sm:hidden">ROI</span>
            </button>
          </nav>

          {/* Right Controls: Mobile Access, Branch Filter, Live Stream, Alerts */}
          <div className="flex items-center gap-2">
            
            {/* Mobile Link Helper Button */}
            <button
              onClick={() => setShowMobileModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-950/80 border border-teal-700/60 text-teal-300 hover:bg-teal-900/80 text-xs font-semibold transition-all"
              title="Panduan Buka di HP"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Akses HP</span>
            </button>

            {/* Branch Select */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
              <Store className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-slate-200 font-medium outline-none cursor-pointer text-xs"
              >
                <option value="all" className="bg-slate-900 text-white">Semua Cabang (12)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Realtime Standby Status Badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-emerald-950/60 border-emerald-500/40 text-emerald-400 select-none"
              title="Sistem Siaga Real-Time: Notifikasi & Audio akan aktif secara real-time saat Anda memindai sampel makanan di Simulator Kubah"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden lg:inline">Realtime Siaga</span>
            </div>

            {/* Deviation Alert Bell */}
            <button
              onClick={onAlertClick}
              className={`relative p-2 rounded-lg border transition-all ${
                unreadAlertsCount > 0
                  ? 'bg-rose-950/70 border-rose-500/70 text-rose-300 hover:bg-rose-900/80 shadow-lg shadow-rose-950/50'
                  : hasDeviationAlert
                  ? 'bg-rose-950/60 border-rose-600/60 text-rose-400 hover:bg-rose-900/60'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Pusat Notifikasi Kendali Mutu Real-Time"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full border-2 border-slate-950 animate-pulse">
                  {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                </span>
              ) : hasDeviationAlert ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              ) : null}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Access Modal */}
      {showMobileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-teal-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-teal-400 font-bold">
                <Smartphone className="w-5 h-5" />
                <h3 className="text-base text-white">Panduan Membuka Web di HP / Smartphone</h3>
              </div>
              <button 
                onClick={() => setShowMobileModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 max-h-[70vh] overflow-y-auto pr-1">
              
              {/* Option 1: Online Public Tunnel (Any Network) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-teal-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-300 text-xs uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                    Opsi 1: Akses Online Global (Bisa dari Kuota / Paket Data HP)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-400 border border-teal-800">Direkomendasikan</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Buka tautan ini di browser HP Anda (Chrome / Safari):
                </p>
                <div className="flex items-center justify-between bg-slate-900 border border-teal-500/40 px-3 py-2 rounded-lg font-mono text-xs text-teal-300">
                  <a href={onlineTunnelUrl} target="_blank" rel="noreferrer" className="underline hover:text-teal-200">
                    {onlineTunnelUrl}
                  </a>
                  <button 
                    onClick={() => handleCopyUrl(onlineTunnelUrl)}
                    className="flex items-center gap-1 text-[11px] bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold px-2 py-1 rounded transition-all"
                  >
                    {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-slate-950" />}
                    <span>{copiedUrl ? 'Tersalin' : 'Salin URL'}</span>
                  </button>
                </div>

                <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1">
                  <p className="text-[11px] text-slate-300">
                    🔑 <strong>Layar Verifikasi Terowongan:</strong> Jika diminta password terowongan (*Tunnel Password*), ketikkan IP publik berikut:
                  </p>
                  <div className="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded font-mono font-bold text-teal-400 text-xs">
                    <span>{tunnelPassword}</span>
                    <button 
                      onClick={handleCopyIp}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded"
                    >
                      {copiedIp ? 'Tersalin' : 'Salin Password IP'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Option 2: Local Hotspot */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 text-xs uppercase flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-sky-400" />
                  Opsi 2: Akses Hotspot Lokal HP (Ultra Cepat)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Jika Anda menyalakan <strong>Hotspot Seluler HP</strong> dan menghubungkan laptop ke hotspot tersebut:
                </p>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg font-mono text-xs text-sky-300">
                  <span>{localUrl}</span>
                  <button 
                    onClick={() => handleCopyUrl(localUrl)}
                    className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded transition-all"
                  >
                    <span>Salin</span>
                  </button>
                </div>
                <p className="text-[10px] text-amber-400/90">
                  ⚠️ <em>Catatan:</em> Jika menggunakan Wi-Fi kampus President University, sistem jaringan kampus sering mengaktifkan isolasi perangkat. Gunakan Opsi 1 di atas jika Opsi 2 tidak merespons.
                </p>
              </div>

            </div>

            <button
              onClick={() => setShowMobileModal(false)}
              className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-teal-500/20"
            >
              Saya Mengerti, Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
