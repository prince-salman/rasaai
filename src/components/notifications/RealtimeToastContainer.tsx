import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X, ExternalLink, BellRing } from 'lucide-react';
import { NotificationItem } from '../../types';

interface RealtimeToastContainerProps {
  toast: NotificationItem | null;
  onClose: () => void;
  onView: () => void;
}

export const RealtimeToastContainer: React.FC<RealtimeToastContainerProps> = ({
  toast,
  onClose,
  onView
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const duration = 5000;
    const intervalTime = 50;
    const decrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isDeviation = toast.type === 'DEVIATION';
  const isWarning = toast.type === 'WARNING';
  const isNormal = toast.type === 'NORMAL';

  return (
    <div className="fixed top-16 right-4 sm:right-6 z-50 max-w-sm w-full transition-all duration-300 animate-in slide-in-from-top-4 fade-in">
      <div className={`rounded-2xl shadow-2xl backdrop-blur-xl border p-4 overflow-hidden relative ${
        isDeviation 
          ? 'bg-rose-950/95 border-rose-500/70 text-white shadow-rose-950/50' 
          : isWarning
          ? 'bg-amber-950/95 border-amber-500/70 text-white shadow-amber-950/50'
          : 'bg-slate-900/95 border-teal-500/70 text-white shadow-teal-950/50'
      }`}>
        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg flex items-center justify-center ${
              isDeviation ? 'bg-rose-500/30 text-rose-300' :
              isWarning ? 'bg-amber-500/30 text-amber-300' :
              'bg-teal-500/30 text-teal-300'
            }`}>
              {isDeviation && <AlertCircle className="w-4 h-4 animate-bounce" />}
              {isWarning && <AlertTriangle className="w-4 h-4" />}
              {isNormal && <CheckCircle2 className="w-4 h-4" />}
            </span>

            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isDeviation ? 'bg-rose-900/80 text-rose-200 border-rose-700' :
              isWarning ? 'bg-amber-900/80 text-amber-200 border-amber-700' :
              'bg-teal-900/80 text-teal-200 border-teal-700'
            }`}>
              {isDeviation ? '🚨 DEVIASI MUTU!' : isWarning ? '⚠️ PERHATIAN MUTU' : '✨ BATCH LOLOS'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-300 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Real-Time
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="Tutup Notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="pt-2.5 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs font-bold leading-snug text-white">
              {toast.title}
            </h4>
            {toast.score !== undefined && (
              <span className={`text-xs font-black px-2 py-0.5 rounded-md font-mono flex-shrink-0 ${
                isDeviation ? 'bg-rose-500 text-white' :
                isWarning ? 'bg-amber-500 text-slate-950' :
                'bg-teal-500 text-slate-950'
              }`}>
                {toast.score}/100
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {toast.message}
          </p>

          {toast.branchName && (
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>📍 {toast.branchName}</span>
              <span className="font-mono">{toast.timestamp}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={() => {
              onView();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white transition-all"
          >
            <span>Buka Dasbor Mutu</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Progress Timer Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div 
            className={`h-full transition-all duration-75 ${
              isDeviation ? 'bg-rose-400' : isWarning ? 'bg-amber-400' : 'bg-teal-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
