import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

export const RoiCalculator: React.FC = () => {
  // Financial parameters based on BAB 3.2
  const [numBranches, setNumBranches] = useState<number>(3); // Default: 3 cabang
  const [revenuePerBranch, setRevenuePerBranch] = useState<number>(300000000); // Rp 300 Juta/cabang
  const [costPerUnit, setCostPerUnit] = useState<number>(1400000); // Rp 1.400.000 / unit
  const [installationCost, setInstallationCost] = useState<number>(1500000); // Rp 1.500.000 total
  const [wasteReductionPct, setWasteReductionPct] = useState<number>(35); // 35% pengurangan produk cacat
  const [profitMarginIncreasePct, setProfitMarginIncreasePct] = useState<number>(22); // 22% kenaikan margin

  // Calculations:
  // CAPEX = (numBranches * costPerUnit) + installationCost
  const capex = numBranches * costPerUnit + installationCost;

  // OPEX = Rp 400.000 / month (server & maintenance)
  const opexMonthly = 400000;

  // Monthly net benefits estimated in paper for 3 branches @ 300M revenue was Rp 11.400.000
  // Scaled proportionally:
  const baseScaleFactor = (numBranches / 3) * (revenuePerBranch / 300000000) * (wasteReductionPct / 35);
  const netMonthlyBenefit = Math.round(11400000 * baseScaleFactor);

  // Payback Period (in months) = CAPEX / Net Benefit
  const paybackMonths = netMonthlyBenefit > 0 ? (capex / netMonthlyBenefit) : 0;
  const paybackDays = Math.round(paybackMonths * 30);

  const resetToPaperDefaults = () => {
    setNumBranches(3);
    setRevenuePerBranch(300000000);
    setCostPerUnit(1400000);
    setInstallationCost(1500000);
    setWasteReductionPct(35);
    setProfitMarginIncreasePct(22);
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-950 text-teal-400 border border-teal-800/50">
              <Calculator className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Kalkulator Kelayakan Finansial & Payback Period
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Simulasi bisnis dan pembuktian periode pengembalian modal ~15 hari (BAB 3.2 Dampak dan Keberlanjutan Gagasan)
          </p>
        </div>

        <button
          onClick={resetToPaperDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-all self-start"
        >
          <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
          <span>Reset ke Parameter Naskah (3 Cabang)</span>
        </button>
      </div>

      {/* Payback Hero Highlight */}
      <div className="bg-gradient-to-r from-teal-950/90 via-slate-900 to-emerald-950/70 border border-teal-500/50 rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
            <Sparkles className="w-4 h-4" />
            <span>Hasil Kalkulasi Payback Period (Periode Pengembalian Modal)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">{paybackDays}</span>
            <span className="text-2xl font-bold text-teal-300">Hari</span>
            <span className="text-slate-400 text-sm ml-2">
              (? {paybackMonths.toFixed(1)} Bulan)
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl pt-1">
            Investasi pengadaan alat RASA AI kembali modal hanya dalam tempo kurang lebih setengah bulan berkat penghematan bahan pangan gagal olah (zero food waste) dan efisiensi waktu uji.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2 text-xs min-w-[240px]">
          <div className="flex justify-between text-slate-400">
            <span>Total Modal Awal (CAPEX):</span>
            <strong className="text-white">{formatIDR(capex)}</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Manfaat Bersih / Bulan:</span>
            <strong className="text-emerald-400">{formatIDR(netMonthlyBenefit)}</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>OPEX Cloud & Maint.:</span>
            <strong className="text-slate-300">{formatIDR(opexMonthly)}/bln</strong>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Financial Formula */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Input Parameters Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Parameter Skala Usaha UMKM
          </h3>

          {/* Slider 1: Jumlah Cabang */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-semibold">Jumlah Cabang Dapur:</span>
              <span className="font-bold text-teal-400 font-mono text-sm">{numBranches} Cabang</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="25" 
              value={numBranches} 
              onChange={(e) => setNumBranches(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Slider 2: Omzet per Cabang */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-semibold">Omzet Rata-rata per Cabang / Bulan:</span>
              <span className="font-bold text-white font-mono">{formatIDR(revenuePerBranch)}</span>
            </div>
            <input 
              type="range" 
              min="50000000" 
              max="1000000000" 
              step="25000000"
              value={revenuePerBranch} 
              onChange={(e) => setRevenuePerBranch(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Slider 3: Penekanan Food Waste */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-semibold">Estimasi Penurunan Produk Cacat / Melempem:</span>
              <span className="font-bold text-emerald-400 font-mono">{wasteReductionPct}%</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="60" 
              value={wasteReductionPct} 
              onChange={(e) => setWasteReductionPct(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Estimasi naskah essay: 35% penekanan angka produk cacat</span>
          </div>

          {/* Biaya per Unit */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Harga 1 Unit Chamber:</span>
              <span className="font-bold text-white">{formatIDR(costPerUnit)}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Instalasi & Training:</span>
              <span className="font-bold text-white">{formatIDR(installationCost)}</span>
            </div>
          </div>
        </div>

        {/* Formula Explanation & Paper Citation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Formula Perhitungan (BAB 3.2 Naskah)
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono space-y-2 text-slate-300">
            <p className="text-teal-400 font-bold">Payback Period = Total Investasi Awal ? Manfaat Bersih Bulanan</p>
            <p className="text-[11px] text-slate-400">
              = {formatIDR(capex)} ? {formatIDR(netMonthlyBenefit)}
            </p>
            <p className="text-sm font-bold text-emerald-400">
              ? {paybackMonths.toFixed(2)} Bulan ({paybackDays} Hari)
            </p>
          </div>

          <div className="space-y-2 text-slate-300 leading-relaxed">
            <p>
              ?? <strong>Rincian Skenario Operasional:</strong>
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-slate-400 text-[11px]">
              <li>
                <strong>CAPEX Awal:</strong> Pengadaan {numBranches} unit Mini-Dome Chamber (@ {formatIDR(costPerUnit)}) + biaya instalasi sistem & pelatihan juru masak sebesar {formatIDR(installationCost)}.
              </li>
              <li>
                <strong>Penghematan Bahan:</strong> Pencegahan pemborosan minyak goreng dan tepung gagal olah sejak batch pertama menyumbang peningkatan margin keuntungan rata-rata 22%.
              </li>
              <li>
                <strong>Skema Sewa Perangkat:</strong> Di masa mendatang, UMKM mikro dapat memilih skema sewa bulanan Rp150.000/bulan sehingga pengusaha tidak terbebani modal awal sama sekali.
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
