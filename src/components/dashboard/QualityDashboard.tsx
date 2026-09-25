import React, { useState, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  Store, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Download, 
  Filter, 
  Search,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Flame,
  MessageSquare,
  FileCheck2,
  RefreshCw,
  Camera,
  Trash2,
  RotateCcw,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { Branch, BatchRecord } from '../../types';
import { SEVEN_DAY_TREND } from '../../data/initialData';

interface QualityDashboardProps {
  branches: Branch[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  batches: BatchRecord[];
  onOpenScanner: () => void;
  showDeviationModal: boolean;
  setShowDeviationModal: (show: boolean) => void;
  onClearBatches?: () => void;
  onResetDemoBatches?: () => void;
  onNotify?: (notif: { type: 'NORMAL' | 'WARNING' | 'DEVIATION'; title: string; message: string; score?: number }) => void;
}

export const QualityDashboard: React.FC<QualityDashboardProps> = ({
  branches,
  selectedBranchId,
  setSelectedBranchId,
  batches,
  onOpenScanner,
  showDeviationModal,
  setShowDeviationModal,
  onClearBatches,
  onResetDemoBatches,
  onNotify
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'WARNING' | 'DEVIATION'>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'batches'>('overview');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  // Filter branches
  const filteredBranches = branches.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesSelected = selectedBranchId === 'all' || b.id === selectedBranchId;
    return matchesSearch && matchesStatus && matchesSelected;
  });

  // Calculate dynamic stats
  const totalBranches = branches.length;
  const avgScore = (branches.reduce((acc, curr) => acc + curr.lastScore, 0) / (totalBranches || 1)).toFixed(1);
  const totalDeviations = branches.filter(b => b.status === 'DEVIATION' || b.status === 'WARNING').length;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-teal-500/40 p-2.5 rounded-lg shadow-xl text-xs backdrop-blur-md">
          <p className="font-bold text-white mb-1">{data.fullDay || label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            <span className="text-slate-300">Skor Tekstur:</span>
            <span className="font-bold text-teal-300 text-sm">{data.score}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Total {data.batches} sampel diuji</p>
        </div>
      );
    }
    return null;
  };

  // Export Excel Spreadsheet (.xls with native HTML table formatting, borders, colors & proper columns)
  const handleExportExcel = () => {
    if (!batches || batches.length === 0) {
      alert("Belum ada data batch untuk diunduh.");
      return;
    }

    const exportDateStr = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });
    const totalCount = batches.length;
    const passCount = batches.filter(b => b.status === 'NORMAL').length;
    const warningCount = batches.filter(b => b.status === 'WARNING').length;
    const devCount = batches.filter(b => b.status === 'DEVIATION').length;
    const complianceRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 100;
    const avgScore = (batches.reduce((acc, curr) => acc + curr.crispnessScore, 0) / (totalCount || 1)).toFixed(1);

    const escapeHtml = (val: any) => {
      const s = val === null || val === undefined ? '' : String(val);
      return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    const excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Rekam Mutu CPPOB</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; margin: 0; padding: 0; }
    table { border-collapse: collapse; width: 100%; }
    th { background-color: #0f766e; color: #ffffff; font-weight: bold; font-size: 10pt; border: 1px solid #0d9488; padding: 10px 8px; text-align: center; vertical-align: middle; }
    td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 10pt; vertical-align: middle; }
    .header-main { background-color: #0f766e; color: #ffffff; font-size: 14pt; font-weight: bold; text-align: center; padding: 12px; border: 1px solid #0f766e; }
    .header-sub { background-color: #115e59; color: #ccfbf1; font-size: 9.5pt; text-align: center; padding: 6px; border: 1px solid #115e59; }
    .header-meta { background-color: #f1f5f9; color: #334155; font-size: 9pt; padding: 6px 10px; border: 1px solid #cbd5e1; }
    .kpi-title { background-color: #f8fafc; color: #64748b; font-size: 8.5pt; font-weight: bold; text-transform: uppercase; text-align: center; border: 1px solid #cbd5e1; padding: 6px; }
    .kpi-val { background-color: #ffffff; color: #0f172a; font-size: 11pt; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; padding: 6px; }
    .status-normal { background-color: #d1fae5; color: #065f46; font-weight: bold; text-align: center; border: 1px solid #86efac; }
    .status-warning { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; border: 1px solid #fde68a; }
    .status-dev { background-color: #fee2e2; color: #991b1b; font-weight: bold; text-align: center; border: 1px solid #fca5a5; }
    .score-green { color: #059669; font-weight: bold; text-align: center; }
    .score-amber { color: #d97706; font-weight: bold; text-align: center; }
    .score-red { color: #dc2626; font-weight: bold; text-align: center; }
    .row-even { background-color: #f8fafc; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-mono { font-family: 'Consolas', 'Courier New', monospace; }
  </style>
</head>
<body>
  <table>
    <colgroup>
      <col width="45" />
      <col width="120" />
      <col width="170" />
      <col width="140" />
      <col width="170" />
      <col width="130" />
      <col width="110" />
      <col width="120" />
      <col width="120" />
      <col width="110" />
      <col width="110" />
      <col width="160" />
      <col width="140" />
      <col width="340" />
    </colgroup>
    <tr>
      <td colspan="14" class="header-main">LAPORAN RESMI REKAM MUTU &amp; KONSISTENSI TEKSTUR PANGAN</td>
    </tr>
    <tr>
      <td colspan="14" class="header-sub">SISTEM AUDIT RASA AI &bull; STANDAR ACUAN: SNI 7388:2009 &amp; CPPOB BPOM RI NO. 22/2021 (KLAUSUL 8 &amp; 14)</td>
    </tr>
    <tr>
      <td colspan="7" class="header-meta"><strong>Waktu Unduh:</strong> ${exportDateStr}</td>
      <td colspan="7" class="header-meta" style="text-align: right;"><strong>Instrumen:</strong> Mini-Dome Inspection Chamber v2.4 (Dual-Engine AI)</td>
    </tr>
    <tr>
      <td colspan="3" class="kpi-title">TOTAL BATCH DIUJI</td>
      <td colspan="3" class="kpi-title">TINGKAT KEPATUHAN MUTU</td>
      <td colspan="3" class="kpi-title">LOLOS STANDAR (NORMAL)</td>
      <td colspan="3" class="kpi-title">PERLU PANTAUAN (WARNING)</td>
      <td colspan="2" class="kpi-title">DEVIASI MUTU (GAGAL)</td>
    </tr>
    <tr>
      <td colspan="3" class="kpi-val">${totalCount} Batch</td>
      <td colspan="3" class="kpi-val" style="color: #0f766e;">${complianceRate}%</td>
      <td colspan="3" class="kpi-val" style="color: #059669;">${passCount} Batch</td>
      <td colspan="3" class="kpi-val" style="color: #d97706;">${warningCount} Batch</td>
      <td colspan="2" class="kpi-val" style="color: #dc2626;">${devCount} Batch</td>
    </tr>
    <tr style="height: 12px;">
      <td colspan="14" style="border: none; background: transparent;"></td>
    </tr>
    <thead>
      <tr>
        <th>No</th>
        <th>ID Batch</th>
        <th>Nama Cabang</th>
        <th>Waktu Pengujian</th>
        <th>Menu Masakan</th>
        <th>Kategori</th>
        <th>Skor (0-100)</th>
        <th>Kekerasan TPA</th>
        <th>Deviasi Warna (&Delta;E)</th>
        <th>Pori Kerenyahan (Df)</th>
        <th>Suhu Makanan</th>
        <th>Status Mutu</th>
        <th>Petugas QC</th>
        <th>Catatan &amp; Preskripsi Tindakan Dapur</th>
      </tr>
    </thead>
    <tbody>
      ${batches.map((b, idx) => {
        const isEven = idx % 2 === 1;
        const rowClass = isEven ? 'row-even' : '';
        const statusClass = b.status === 'NORMAL' ? 'status-normal' : b.status === 'WARNING' ? 'status-warning' : 'status-dev';
        const statusLabel = b.status === 'NORMAL' ? 'LOLOS (Standar)' : b.status === 'WARNING' ? 'PERINGATAN (Pantau)' : 'DEVIASI (Gagal)';
        const scoreClass = b.crispnessScore >= 85 ? 'score-green' : b.crispnessScore >= 75 ? 'score-amber' : 'score-red';
        const note = b.feedback || (b.status === 'NORMAL' ? 'Tekstur krispi & warna keemasan konsisten' : b.status === 'WARNING' ? 'Mendekati batas toleransi kerenyahan' : 'Tekstur alot/lembek atau warna terlalu gelap. Perlu kalibrasi api/minyak.');

        return `
        <tr class="${rowClass}">
          <td class="text-center">${idx + 1}</td>
          <td class="text-center font-mono"><strong>${escapeHtml(b.id)}</strong></td>
          <td class="text-left"><strong>${escapeHtml(b.branchName)}</strong></td>
          <td class="text-center">${escapeHtml(b.timestamp)}</td>
          <td class="text-left"><strong>${escapeHtml(b.sampleName)}</strong></td>
          <td class="text-center">${escapeHtml(b.category)}</td>
          <td class="${scoreClass}">${b.crispnessScore}</td>
          <td class="text-right font-mono">${b.hardnessN} N</td>
          <td class="text-right font-mono">${b.deltaE}</td>
          <td class="text-right font-mono">${b.df}</td>
          <td class="text-right font-mono">${b.tempC} &deg;C</td>
          <td class="${statusClass}">${statusLabel}</td>
          <td class="text-left">${escapeHtml(b.operator || 'Staff QC Cabang')}</td>
          <td class="text-left">${escapeHtml(note)}</td>
        </tr>`;
      }).join('')}
    </tbody>
    <tfoot>
      <tr style="background-color: #f1f5f9; font-weight: bold;">
        <td colspan="6" class="text-left" style="padding: 9px 10px;">RATA-RATA SKOR KONSISTENSI SELURUH SAMPEL</td>
        <td class="text-center" style="color: #0f766e; font-size: 11pt;">${avgScore}</td>
        <td colspan="7" class="text-left" style="color: #475569;">Kesimpulan Audit: ${complianceRate >= 80 ? 'MEMENUHI SYARAT AUDIT CPPOB BPOM RI' : 'PERLU TINDAKAN KOREKTIF PADA PROSES GORENG'}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekam_Mutu_RASA_AI_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onNotify?.({
      type: 'NORMAL',
      title: '📊 Rekam Mutu Excel Berhasil Diunduh',
      message: `Tabel rekam mutu bergaris rapi & berwarna (${batches.length} batch) telah diunduh dalam format Microsoft Excel (.xls).`
    });
  };

  // Export CSV Report (Clean, balanced 14-column structure with UTF-8 BOM)
  const handleExportCSV = () => {
    if (!batches || batches.length === 0) {
      alert("Belum ada data batch untuk diunduh.");
      return;
    }

    const exportDateStr = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });
    const totalCount = batches.length;
    const passCount = batches.filter(b => b.status === 'NORMAL').length;
    const warningCount = batches.filter(b => b.status === 'WARNING').length;
    const devCount = batches.filter(b => b.status === 'DEVIATION').length;
    const complianceRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 100;

    const escapeCsv = (val: any) => {
      const s = val === null || val === undefined ? '' : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };

    // Pad row with empty cells up to 14 columns so CSV column counts are always perfectly uniform
    const padRow = (firstCell: string) => {
      const row = [escapeCsv(firstCell)];
      while (row.length < 14) row.push('""');
      return row;
    };

    const metadataRows = [
      padRow('LAPORAN RESMI REKAM MUTU & KONSISTENSI TEKSTUR PANGAN (RASA AI)'),
      padRow('Standar Acuan: SNI 7388:2009 & CPPOB BPOM RI No. 22/2021 (Klausul 8 & 14)'),
      padRow(`Waktu Pengunduhan: ${exportDateStr}`),
      padRow(`Ringkasan: Total Batch: ${totalCount} | Lolos: ${passCount} (${complianceRate}%) | Perlu Perhatian: ${warningCount} | Deviasi: ${devCount}`),
      padRow('') // blank spacer row with 14 empty columns
    ];

    const headers = [
      'No',
      'ID Batch',
      'Nama Cabang',
      'Waktu Pengujian',
      'Menu Masakan',
      'Kategori',
      'Skor Kerenyahan (0-100)',
      'Kekerasan TPA (Newton)',
      'Deviasi Warna (Delta E)',
      'Pori Kerenyahan (Df)',
      'Suhu Makanan (°C)',
      'Status Mutu',
      'Petugas QC',
      'Catatan & Rekomendasi Preskriptif'
    ].map(escapeCsv);

    const dataRows = batches.map((b, idx) => {
      const statusText = b.status === 'NORMAL' ? 'LOLOS (Sesuai Standar)' :
                         b.status === 'WARNING' ? 'PERINGATAN (Perlu Perhatian)' :
                         'DEVIASI (Gagal Standar)';
      
      const note = b.feedback || (b.status === 'NORMAL' ? 'Tekstur krispi & warna keemasan sempurna' :
                   b.status === 'WARNING' ? 'Mendekati batas toleransi kerenyahan' :
                   'Tekstur terlalu alot/gosong atau lembek. Perlu kalibrasi api/minyak.');

      return [
        idx + 1,
        b.id,
        b.branchName,
        b.timestamp,
        b.sampleName,
        b.category,
        b.crispnessScore,
        `${b.hardnessN} N`,
        b.deltaE,
        b.df,
        `${b.tempC} °C`,
        statusText,
        b.operator || 'Staff QC',
        note
      ].map(escapeCsv);
    });

    const csvContent = [
      ...metadataRows.map(row => row.join(',')),
      headers.join(','),
      ...dataRows.map(row => row.join(','))
    ].join('\r\n');

    // Create UTF-8 BOM Blob so Excel on Windows opens with correct encoding and neat columns
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekam_Mutu_RASA_AI_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onNotify?.({
      type: 'NORMAL',
      title: '📥 Rekam Mutu CSV Berhasil Diunduh',
      message: `Data rekam mutu (${batches.length} batch) telah diunduh dalam format CSV terstruktur 14 kolom.`
    });
  };

  const deviatingBranch = branches.find(b => b.recentDeviationsCount >= 3);

  return (
    <div className="space-y-6">

      {/* Real Inspection Launch Banner */}
      <div className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-emerald-950/50 border border-teal-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 flex-shrink-0">
            <Camera className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-700">
                Pindai Makanan Asli Anda
              </span>
              <span className="text-[11px] text-slate-400">• Kamera HP & Analisis Piksel Canvas Riil</span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5">
              Ingin menguji kerenyahan makanan Anda sendiri?
            </p>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Data di bawah ini mencakup 12 cabang sebagai simulasi baseline operasional. Anda dapat langsung menguji makanan riil milik Anda sendiri via <strong>Kamera HP</strong> atau <strong>Upload Foto</strong> di Simulator Kubah!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" />
            <span>Nyalakan Kamera & Pindai Sekarang</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WhatsApp Deviation Alert Banner (Hanya muncul jika benar-benar ada cabang yang deviasi beruntun) */}
      {deviatingBranch && (
        <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/40 border border-rose-600/40 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-900/60 border border-rose-500/50 flex items-center justify-center text-rose-400 flex-shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                  Peringatan Dini QC Otomatis
                </span>
                <span className="text-[11px] text-slate-400">• Protokol Mitigasi Dapur</span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">
                {deviatingBranch.name} mendeteksi 3 batch berturut-turut di luar batas mutu (Skor {deviatingBranch.lastScore} &lt; 80).
              </p>
              <p className="text-xs text-slate-400">
                Notifikasi preskriptif telah terkirim via WhatsApp API ke Manajer Operasional dan Kepala Dapur.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowDeviationModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Lihat Log WhatsApp</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
            >
              <span>Uji Kalibrasi Sampel</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header corresponding to Lampiran L.1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
            <h2 className="text-2xl font-black text-white tracking-tight">Dashboard Monitoring Mutu</h2>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Ringkasan kualitas tekstur produk lintas cabang ? update real-time
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSubTab === 'overview'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ikhtisar Cabang
            </button>
            <button
              onClick={() => setActiveSubTab('batches')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSubTab === 'batches'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Log Batch ({batches.length})
            </button>
          </div>

          {/* Export Dropdown Menu */}
          <div className="relative" ref={exportDropdownRef}>
            <div className="inline-flex rounded-xl shadow-sm border border-slate-700/80 bg-slate-900 overflow-hidden">
              <button
                onClick={handleExportExcel}
                disabled={batches.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Unduh Rekam Mutu Bergaris Rapi & Berwarna (Format Excel .xls)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Unduh Rekam Mutu (Excel)</span>
                <span className="sm:hidden">Excel</span>
              </button>
              <button
                onClick={() => setShowExportDropdown(prev => !prev)}
                disabled={batches.length === 0}
                className="px-2 py-2 border-l border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                title="Pilih Format Unduh (Excel / CSV)"
                aria-label="Pilihan format ekspor"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportDropdown ? 'rotate-180 text-teal-400' : ''}`} />
              </button>
            </div>

            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pilih Format Rekam Mutu
                </div>
                <button
                  onClick={() => {
                    handleExportExcel();
                    setShowExportDropdown(false);
                  }}
                  className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors group"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-400 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Microsoft Excel (.xls)</span>
                      <span className="text-[9px] bg-teal-950 text-teal-300 border border-teal-800 px-1.5 py-0.5 rounded font-semibold">Rapi & Berwarna</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Tabel bergaris rapi, kolom pas, warna status hijau/kuning/merah, siap cetak audit CPPOB/SNI.
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    handleExportCSV();
                    setShowExportDropdown(false);
                  }}
                  className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors group"
                >
                  <Download className="w-4 h-4 text-slate-400 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>File CSV Baku (.csv)</span>
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">14 Kolom Pas</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Format data koma standar dengan UTF-8 BOM untuk olah data teknis atau database.
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards matching Lampiran L.1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Skor Tekstur Rata-rata */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Skor Tekstur Rata-rata</span>
            <span className="p-2 rounded-xl bg-teal-950/80 text-teal-400 border border-teal-800/40">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-4xl font-extrabold text-white tracking-tight">{avgScore}</span>
            <span className="text-slate-500 text-lg font-semibold ml-1">/100</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
              +2.1%
            </span>
            <span className="text-slate-400">dari minggu lalu</span>
          </div>
        </div>

        {/* Card 2: Cabang Terpantau */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cabang Terpantau</span>
            <span className="p-2 rounded-xl bg-sky-950/80 text-sky-400 border border-sky-800/40">
              <Store className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-4xl font-extrabold text-white tracking-tight">{totalBranches}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>dari {totalBranches} cabang aktif terhubung AIoT</span>
          </div>
        </div>

        {/* Card 3: Deviasi Terdeteksi */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Deviasi Terdeteksi</span>
            <span className="p-2 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/40">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-4xl font-extrabold text-rose-400 tracking-tight">{totalDeviations}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
              perlu ditinjau
            </span>
            <span className="text-slate-400">kepatuhan suhu & durasi goreng</span>
          </div>
        </div>

      </div>

      {activeSubTab === 'overview' ? (
        <>
          {/* 7-Day Trend Chart matching Lampiran L.1 */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Tren Skor Tekstur ? 7 Hari Terakhir</h3>
                <p className="text-xs text-slate-400">Korelasi konsistensi mutu kerenyahan antargerai per hari</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                  <span className="text-slate-300 font-medium">Skor Tekstur Harian</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-dashed bg-slate-500"></span>
                  <span className="text-slate-400">Ambang Baku (80)</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SEVEN_DAY_TREND} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    ticks={[0, 20, 40, 60, 80, 100]} 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Standar Min (80)', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#14b8a6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#scoreGradient)" 
                    dot={{ fill: '#14b8a6', r: 4, strokeWidth: 2, stroke: '#042f2e' }}
                    activeDot={{ r: 6, fill: '#5eead4' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Branch Status Table matching Lampiran L.1 */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Status Cabang</h3>
                <p className="text-xs text-slate-400">Pemantauan kepatuhan resep dan stabilitas gorengan tiap outlet</p>
              </div>

              {/* Filters */}
              <div className="flex items-center flex-wrap gap-2.5">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari cabang..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-teal-500 w-36 sm:w-48 transition-all"
                  />
                </div>

                {/* Status Pills */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setStatusFilter('NORMAL')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      statusFilter === 'NORMAL' ? 'bg-emerald-950 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setStatusFilter('WARNING')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      statusFilter === 'WARNING' ? 'bg-amber-950 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Perlu Dipantau
                  </button>
                  <button
                    onClick={() => setStatusFilter('DEVIATION')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      statusFilter === 'DEVIATION' ? 'bg-rose-950 text-rose-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Deviasi
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Nama Cabang</th>
                    <th className="py-3 px-4 font-semibold">Lokasi</th>
                    <th className="py-3 px-4 font-semibold text-center">Skor Terakhir</th>
                    <th className="py-3 px-4 font-semibold text-center">Status Mutu</th>
                    <th className="py-3 px-4 font-semibold">Batch Hari Ini</th>
                    <th className="py-3 px-4 font-semibold">Update Terakhir</th>
                    <th className="py-3 px-4 font-semibold text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredBranches.map((branch) => {
                    return (
                      <tr key={branch.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>{branch.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{branch.location}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-extrabold text-sm ${
                            branch.lastScore >= 85 ? 'text-emerald-400' :
                            branch.lastScore >= 80 ? 'text-teal-300' :
                            branch.lastScore >= 75 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {branch.lastScore}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {branch.status === 'NORMAL' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Normal
                            </span>
                          )}
                          {branch.status === 'WARNING' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Perlu Dipantau
                            </span>
                          )}
                          {branch.status === 'DEVIATION' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                              Deviasi
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono">
                          {branch.activeBatchesToday} batch
                        </td>
                        <td className="py-3 px-4 text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{branch.lastUpdate}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedBranchId(branch.id);
                              onOpenScanner();
                            }}
                            className="text-xs text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1 hover:underline"
                          >
                            <span>Tes Sampel</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Sub-tab: Batch Records */
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Log Pengujian Batch Real-Time</h3>
              <p className="text-xs text-slate-400">Telemetri MQTT langsung dari Mini-Dome Inspection Chamber tiap cabang</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onClearBatches && batches.length > 0 && (
                <button
                  onClick={onClearBatches}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/70 hover:border-rose-700 text-rose-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
                  title="Kosongkan data simulasi baseline untuk mulai mencatat pengujian riil Anda sendiri"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Hapus Data Demo</span>
                </button>
              )}
              {onResetDemoBatches && (
                <button
                  onClick={onResetDemoBatches}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
                  title="Kembalikan data baseline 12 cabang dari naskah essay"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                  <span>Reset Demo 12 Cabang</span>
                </button>
              )}
              <button
                onClick={handleExportExcel}
                disabled={batches.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-slate-950 text-xs font-bold rounded-lg transition-all ${
                  batches.length === 0 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-teal-500 hover:bg-teal-400'
                }`}
                title="Ekspor Arsip Rekam Mutu Lengkap & Rapi (Format Excel .xls)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Ekspor Arsip Excel (.xls)</span>
              </button>
            </div>
          </div>

          {batches.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Belum Ada Catatan Uji Makanan</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Data simulasi telah dikosongkan. Silakan buka menu <strong>Simulator Kubah</strong> untuk memindai sampel gorengan asli milik Anda menggunakan Kamera HP atau Unggah Foto!
              </p>
              <button
                onClick={onOpenScanner}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Simulator & Pindai Makanan Anda</span>
              </button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">ID Batch</th>
                  <th className="py-3 px-4 font-semibold">Cabang</th>
                  <th className="py-3 px-4 font-semibold">Waktu Uji</th>
                  <th className="py-3 px-4 font-semibold">Sampel</th>
                  <th className="py-3 px-4 font-semibold text-center">Indeks Kerenyahan</th>
                  <th className="py-3 px-4 font-semibold text-center">Kekerasan (N)</th>
                  <th className="py-3 px-4 font-semibold text-center">Delta E</th>
                  <th className="py-3 px-4 font-semibold text-center">Fraktal (Df)</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-teal-400 font-semibold">{b.id}</td>
                    <td className="py-3 px-4 text-white font-medium">{b.branchName}</td>
                    <td className="py-3 px-4 text-slate-400">{b.timestamp}</td>
                    <td className="py-3 px-4 text-slate-300">{b.sampleName}</td>
                    <td className="py-3 px-4 text-center font-bold text-white">{b.crispnessScore}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-300">{b.hardnessN} N</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-300">{b.deltaE}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-300">{b.df}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'NORMAL' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        b.status === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* WhatsApp Deviation Simulation Modal */}
      {showDeviationModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeviationModal(false); }}
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
        >
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Log Notifikasi WhatsApp Dapur</h3>
              </div>
              <button 
                onClick={() => setShowDeviationModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Tutup
              </button>
            </div>

            {/* Chat Bubble Simulation */}
            <div className="bg-[#0b141a] p-4 rounded-xl border border-slate-800 space-y-3 font-sans text-xs">
              <div className="bg-[#005c4b] text-slate-100 p-3 rounded-lg rounded-tl-none shadow space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-teal-200">
                  <span className="font-bold">?? SISTEM RASA AI ALERT (Cabang Cikarang)</span>
                  <span>12:16 WIB</span>
                </div>
                <p className="leading-relaxed">
                  <strong>PERHATIAN KEPALA DAPUR:</strong> Terdeteksi <strong>3 batch berturut-turut</strong> di bawah ambang batas kerenyahan (Skor rata-rata: <strong>74 / 100</strong>, Hardness: <strong>16.2 N</strong>).
                </p>
                <div className="bg-black/20 p-2 rounded text-[11px] space-y-0.5">
                  <p>? <strong>Penyebab:</strong> Suhu minyak penggorengan drop ke 148?C (standar 165?C).</p>
                  <p>? <strong>Tindakan Preskriptif:</strong> Naikkan burner kompor +1 tingkat, tunggu hingga indikator termal menyala hijau sebelum memasukkan ayam batch berikutnya.</p>
                </div>
                <div className="text-[10px] text-emerald-200 text-right">?? Terkirim ke Manajer Dapur</div>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p>?? <em>Fitur ini adalah implementasi BAB 2.3.1 essay untuk mitigasi deviasi mutu sebelum produk sampai ke tangan konsumen.</em></p>
            </div>

            <button
              onClick={() => setShowDeviationModal(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-all"
            >
              Saya Memahami, Tutup Alert
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
