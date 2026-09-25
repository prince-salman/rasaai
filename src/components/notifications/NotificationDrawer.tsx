import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  MessageSquare, 
  Copy, 
  Check, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { NotificationItem, Branch } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification?: (item: NotificationItem) => void;
  onViewDashboard: () => void;
  branches: Branch[];
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
  onViewDashboard,
  branches
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ALERTS' | 'PASSED'>('ALL');
  const [selectedWhatsAppAlert, setSelectedWhatsAppAlert] = useState<NotificationItem | null>(null);
  const [copiedWA, setCopiedWA] = useState(false);

  if (!isOpen) return null;

  const filteredList = notifications.filter(item => {
    if (activeFilter === 'ALERTS') return item.type === 'DEVIATION' || item.type === 'WARNING';
    if (activeFilter === 'PASSED') return item.type === 'NORMAL';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleCopyWhatsApp = (item: NotificationItem) => {
    const waText = `🚨 *PERINGATAN RESMI RASA AI - QC DAPUR* 🚨\n\n` +
      `Lokasi: *${item.branchName || 'Dapur Cabang'}*\n` +
      `Waktu: *${item.timestamp}*\n` +
      `Status: *DEVIASI MUTU (${item.score || 0}/100)*\n` +
      `Masalah: ${item.message}\n\n` +
      `*Instruksi Koki / Tim Dapur:*\n` +
      `1. Segera periksa suhu minyak dan api kompor.\n` +
      `2. Pisahkan batch ini, jangan disajikan ke pelanggan.\n` +
      `3. Kalibrasi ulang waktu penggorengan untuk batch berikutnya.\n\n` +
      `_Sistem AIoT Kendali Mutu RASA AI - Standar SNI & CPPOB BPOM_`;

    navigator.clipboard.writeText(waText);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header Drawer */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Pusat Notifikasi Mutu</h3>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.2 rounded-full">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live AIoT Telemetry Aktif</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Action Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('ALERTS')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'ALERTS'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Peringatan ({notifications.filter(n => n.type === 'DEVIATION' || n.type === 'WARNING').length})
            </button>
            <button
              onClick={() => setActiveFilter('PASSED')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeFilter === 'PASSED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lolos ({notifications.filter(n => n.type === 'NORMAL').length})
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="p-1.5 text-xs text-slate-400 hover:text-teal-400 rounded-lg hover:bg-slate-800 transition-all"
                title="Tandai Semua Sudah Dibaca"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1.5 text-xs text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all"
                title="Hapus Riwayat Notifikasi"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Bell className="w-8 h-8 opacity-40 text-teal-400" />
              <p className="text-xs font-semibold text-slate-400">Belum ada riwayat notifikasi</p>
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                Notifikasi dan alarm audio akan muncul secara <strong>real-time</strong> saat Anda memindai foto makanan atau menguji sampel batch di <strong>Simulator Kubah</strong>.
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isDev = item.type === 'DEVIATION';
              const isWarn = item.type === 'WARNING';

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    !item.read ? 'ring-1 ring-teal-500/30' : ''
                  } ${
                    isDev
                      ? 'bg-rose-950/40 border-rose-800/60 hover:border-rose-600/80'
                      : isWarn
                      ? 'bg-amber-950/40 border-amber-800/60 hover:border-amber-600/80'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded-md ${
                        isDev ? 'bg-rose-500/20 text-rose-400' :
                        isWarn ? 'bg-amber-500/20 text-amber-400' :
                        'bg-teal-500/20 text-teal-400'
                      }`}>
                        {isDev && <AlertCircle className="w-3.5 h-3.5" />}
                        {isWarn && <AlertTriangle className="w-3.5 h-3.5" />}
                        {!isDev && !isWarn && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </span>

                      <span className="text-xs font-bold text-white">
                        {item.title}
                      </span>
                    </div>

                    {item.score !== undefined && (
                      <span className={`text-[11px] font-black font-mono px-1.5 py-0.5 rounded ${
                        isDev ? 'bg-rose-500/20 text-rose-300' :
                        isWarn ? 'bg-amber-500/20 text-amber-300' :
                        'bg-teal-500/20 text-teal-300'
                      }`}>
                        {item.score}/100
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-medium text-slate-400">📍 {item.branchName || 'Dapur'}</span>
                    <span className="font-mono">{item.timestamp}</span>
                  </div>

                  {/* SOP WhatsApp Trigger for Deviations */}
                  {isDev && (
                    <div className="mt-2 pt-2 border-t border-rose-900/40 flex items-center justify-between">
                      <span className="text-[10px] text-rose-300 font-semibold">
                        SOP Tindakan Cepat (Lampiran L.1):
                      </span>
                      <button
                        onClick={() => handleCopyWhatsApp(item)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-rose-600/80 hover:bg-rose-500 text-white text-[10px] font-bold transition-all shadow"
                      >
                        {copiedWA ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-300" />
                            <span>Pesan WA Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3 h-3" />
                            <span>Kirim Peringatan WA</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onViewDashboard();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <span>Buka Dasbor Mutu Cabang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
