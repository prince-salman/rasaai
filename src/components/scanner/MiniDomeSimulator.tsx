import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, 
  Sparkles, 
  Thermometer, 
  Layers, 
  Cpu, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  ArrowRight, 
  Info, 
  Camera, 
  Play, 
  RefreshCw, 
  Gauge, 
  Printer, 
  VideoOff, 
  SwitchCamera,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X
} from 'lucide-react';
import { FoodProfile, VisionAnalysisResult, Branch, BatchRecord, FoodValidationResult } from '../../types';
import { FOOD_PROFILES } from '../../data/initialData';
import { runDualEngineAnalysis, validateFoodSample } from '../../utils/visionEngine';
import { playDeviationAlert } from '../../utils/audioAlert';

interface MiniDomeSimulatorProps {
  branches: Branch[];
  selectedBranchId: string;
  onAddBatchRecord: (record: BatchRecord) => void;
  onViewDashboard: () => void;
}

export const MiniDomeSimulator: React.FC<MiniDomeSimulatorProps> = ({
  branches,
  selectedBranchId,
  onAddBatchRecord,
  onViewDashboard
}) => {
  const [selectedProfile, setSelectedProfile] = useState<FoodProfile>(FOOD_PROFILES[0]);
  const [activeBranchId, setActiveBranchId] = useState(selectedBranchId === 'all' ? 'cikarang' : selectedBranchId);
  const [customImage, setCustomImage] = useState<string | null>(null);

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhaseText, setScanPhaseText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null);
  const [viewMode, setViewMode] = useState<'normal' | 'pore-fractal' | 'cielab'>('normal');
  const [isSynced, setIsSynced] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [foodValidationError, setFoodValidationError] = useState<FoodValidationResult | null>(null);

  // Close print modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPrintModal) {
        setShowPrintModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPrintModal]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentImageSrc = customImage || selectedProfile.sampleImage;

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) stopCamera();

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (e) {
        // Fallback constraint for devices without facingMode or strict constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setCustomImage(null);

      // Connect stream to video if already mounted
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('getUserMedia error:', err);
      setCameraError('Izin kamera ditolak di browser. Anda bisa gunakan tombol "Kamera Bawaan HP" atau "Upload File" di bawah.');
      setIsCameraActive(false);
    }
  };

  // Ensure video element plays the stream whenever isCameraActive becomes true
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isCameraActive]);

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) setTimeout(() => startCamera(), 100);
  };

  const captureLiveCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      console.warn("Video or canvas ref not ready");
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use actual dimensions of the camera stream
    const vw = video.videoWidth || 360;
    const vh = video.videoHeight || 360;
    const minDim = Math.min(vw, vh);
    const sx = (vw - minDim) / 2;
    const sy = (vh - minDim) / 2;

    canvas.width = 360;
    canvas.height = 360;
    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, canvas.width, canvas.height);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCustomImage(dataUrl);
    } catch (err) {
      console.error("Capture dataURL error:", err);
    }

    stopCamera();
    setAnalysisResult(null);
    setFoodValidationError(null);
    setIsSynced(false);
  };

  useEffect(() => {
    if (isCameraActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = () => {
      canvas.width = 360;
      canvas.height = 360;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (viewMode === 'pore-fractal') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const isPore = lum < 120 || (Math.abs(d[i] - d[i + 1]) > 22 && lum < 165);
          if (isPore) {
            d[i] = 16;
            d[i + 1] = 230;
            d[i + 2] = 190;
          } else {
            d[i] = 15;
            d[i + 1] = 23;
            d[i + 2] = 42;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (viewMode === 'cielab') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, d[i] * 1.22);
          d[i + 1] = Math.min(255, d[i + 1] * 0.96);
          d[i + 2] = Math.max(0, d[i + 2] * 0.42);
        }
        ctx.putImageData(imgData, 0, 0);
      }
    };
  }, [currentImageSrc, viewMode, isCameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleTriggerScan = () => {
    if (isScanning) return;
    if (isCameraActive) captureLiveCamera();

    setIsScanning(true);
    setScanProgress(0);
    setAnalysisResult(null);
    setFoodValidationError(null);
    setIsSynced(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const duration = 3800;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setScanProgress(progress);

      if (progress < 25) {
        setScanPhaseText('🔍 Memeriksa keabsahan sampel makanan (filter anti-wajah & objek non-pangan)...');
      } else if (progress < 50) {
        setScanPhaseText('🎨 Memeriksa warna dan tingkat kematangan kerak...');
      } else if (progress < 75) {
        setScanPhaseText('🔍 Memeriksa pori-pori dan tekstur kerenyahan...');
      } else if (progress < 92) {
        setScanPhaseText('⚙️ Menghitung skor kerenyahan & keempukan...');
      } else {
        setScanPhaseText('✅ Menyimpan hasil pemeriksaan mutu...');
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        setIsScanning(false);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Pre-Flight: Validasi ketat bahwa gambar adalah makanan kuliner (bukan wajah/orang/benda non-makanan)
        validateFoodSample(canvas, imgData).then((validation) => {
          if (!validation.isValid) {
            setFoodValidationError(validation);
            setAnalysisResult(null);
            setIsSynced(false);
            playDeviationAlert();
            return;
          }

          setFoodValidationError(null);
          const simTemp = Math.round((78.2 + (Math.random() * 2 - 1)) * 10) / 10;
          const result = runDualEngineAnalysis(
            imgData,
            selectedProfile,
            simTemp
          );
          setAnalysisResult(result);

          const currentBranch = branches.find(b => b.id === activeBranchId) || branches[0];
          const newRecord: BatchRecord = {
            id: `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
            branchId: currentBranch.id,
            branchName: currentBranch.name,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB',
            sampleName: selectedProfile.name,
            category: selectedProfile.category,
            crispnessScore: result.crispnessIndex,
            hardnessN: result.hardnessNewtons,
            deltaE: result.deltaE,
            df: result.fractalDimension,
            tempC: result.infraredTempC,
            browningIndex: result.browningIndex,
            status: result.qualityStatus,
            operator: 'Operator AIoT Cabang',
            feedback: result.feedback
          };

          onAddBatchRecord(newRecord);
          setIsSynced(true);
        });
      }
    }, 75);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
        setAnalysisResult(null);
        setFoodValidationError(null);
        setIsSynced(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Safe Print Certificate with sanitized filename
  const handlePrintCertificate = () => {
    try {
      const originalTitle = document.title;
      const cleanName = (selectedProfile?.name || 'Sampel').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      document.title = `Laporan_Audit_Mutu_${cleanName}_${dateStr}`;
      
      window.print();
      
      setTimeout(() => {
        document.title = originalTitle;
      }, 1500);
    } catch (err) {
      console.error('Gagal memicu dialog cetak:', err);
      handleOpenPrintWindow();
    }
  };

  // Standalone Printable Window Fallback
  const handleOpenPrintWindow = () => {
    if (!analysisResult) return;
    const certElem = document.getElementById('printable-audit-certificate');
    if (!certElem) return;

    try {
      const printWindow = window.open('', '_blank', 'width=850,height=950');
      if (!printWindow) {
        window.print();
        return;
      }
      const cleanName = (selectedProfile?.name || 'Sampel').replace(/[^a-zA-Z0-9]/g, '_');
      
      const clone = certElem.cloneNode(true) as HTMLElement;
      const buttons = clone.querySelector('.print-action-buttons');
      if (buttons) buttons.remove();

      printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan_Audit_Mutu_${cleanName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #ffffff; color: #0f172a; margin: 24px auto; max-width: 800px; }
    @page { size: A4 portrait; margin: 12mm 15mm; }
    @media print { .no-print-toolbar { display: none !important; } body { margin: 0; padding: 0; } }
  </style>
</head>
<body class="p-6 bg-white text-slate-900">
  <div class="no-print-toolbar mb-6 pb-4 border-b border-slate-200 flex items-center justify-between">
    <div class="text-xs text-slate-600 font-medium">
      Pratinjau Lembar Audit Cetak / PDF Resmi RASA AI
    </div>
    <div class="flex gap-2">
      <button onclick="window.print()" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer">
        🖨️ Cetak / Simpan PDF
      </button>
      <button onclick="window.close()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer">
        Tutup
      </button>
    </div>
  </div>
  <div class="space-y-6">
    ${clone.innerHTML}
  </div>
</body>
</html>`);
      printWindow.document.close();
    } catch (err) {
      console.error('Gagal membuka tab cetak:', err);
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Printable-hidden wrapper for all regular interactive simulator controls */}
      <div className="space-y-6 print:hidden">

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-950 text-teal-400 border border-teal-800/50">
              <Scan className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Simulator Mini-Dome Inspection Chamber
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Purwarupa fisik inspeksi mutu non-destruktif berbiaya &lt; Rp1,5 Juta untuk dapur cabang (BAB 2.3 & Gambar L.2)
          </p>
        </div>

        {/* Selected Branch Target */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
          <span className="text-slate-400">Target Cabang:</span>
          <select 
            value={activeBranchId} 
            onChange={(e) => setActiveBranchId(e.target.value)}
            className="bg-transparent text-teal-300 font-bold outline-none cursor-pointer"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                {b.name} ({b.location})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left (Chamber Viewport & Live Cam) + Right (Real Dual-Engine Metrics) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Hardware Chamber & Food Sample (LG: 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Chamber Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
            
            <div className="flex items-center justify-between text-xs mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-bold text-slate-200">Mini-Dome Chamber v1.0</span>
              </div>
              <span className="bg-slate-800 text-teal-400 border border-teal-800/40 text-[10px] font-mono px-2 py-0.5 rounded">
                Sony IMX219 ? 5000K CRI
              </span>
            </div>

            {/* Chamber Viewport with Canvas AND Live Video (Both mounted) */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              
              {/* Live Video Element */}
              <video 
                ref={videoRef} 
                playsInline 
                autoPlay 
                muted 
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {/* Canvas for captured photo and image analysis */}
              <canvas
                ref={canvasRef}
                className={`w-full h-full object-cover ${isCameraActive ? 'hidden' : 'block'}`}
              />

              {/* Guide Overlay when camera is active */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full border-2 border-dashed border-teal-400 animate-pulse flex flex-col items-center justify-center gap-1 bg-teal-950/20">
                    <span className="text-[10px] text-teal-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded shadow">
                      Arahkan Makanan ke Lingkaran Ini
                    </span>
                    <span className="text-[9px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded">
                      Lalu klik "JEPRET FOTO SEKARANG"
                    </span>
                  </div>
                </div>
              )}

              {/* Laser Scanning Animation Overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_20px_#2dd4bf] absolute animate-laser"></div>
                  <div className="absolute inset-0 bg-teal-500/10 backdrop-blur-[1px] animate-pulse"></div>
                </div>
              )}

              {/* Food Validation Error Overlay */}
              {foodValidationError && (
                <div className="absolute inset-0 z-30 bg-rose-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-2 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400 shadow-lg">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider bg-rose-950 px-2.5 py-0.5 rounded border border-rose-700">
                    {foodValidationError.title || 'Bukan Foto Makanan!'}
                  </span>
                  <p className="text-[11px] text-rose-200 max-w-xs leading-tight">
                    {foodValidationError.reason}
                  </p>
                </div>
              )}

              {/* Temp overlay */}
              <div className="absolute top-2 left-2 pointer-events-none z-10 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800/80 text-[10px] text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-3 h-3 text-amber-400" />
                <span>MLX90614: <strong className="text-white">78.5°C</strong></span>
              </div>

              {!isCameraActive && (
                <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between bg-slate-950/90 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-800 text-[11px]">
                  <span className="text-slate-400 text-[10px] hidden sm:inline">Overlay Visual:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewMode('normal')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                        viewMode === 'normal' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Citra Asli
                    </button>
                    <button
                      onClick={() => setViewMode('pore-fractal')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                        viewMode === 'pore-fractal' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pori Rekahan (Df)
                    </button>
                    <button
                      onClick={() => setViewMode('cielab')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                        viewMode === 'cielab' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Gamut CIELAB
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Scanning Progress */}
            {isScanning && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-teal-400 font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memindai... {scanProgress}%</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">&lt; 4 Detik</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400 italic text-center">
                  {scanPhaseText}
                </p>
              </div>
            )}

            {cameraError && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                {cameraError}
              </div>
            )}

            {/* Camera Controls */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!isCameraActive ? (
                <>
                  <button
                    onClick={startCamera}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Nyalakan Kamera Langsung (WebRTC)</span>
                  </button>

                  <button
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                    title="Buka kamera bawaan HP secara langsung"
                  >
                    <Camera className="w-4 h-4 text-teal-400" />
                    <span>Kamera HP (Native)</span>
                  </button>

                  <input 
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCustomUpload}
                    className="hidden"
                  />
                </>
              ) : (
                <>
                  <button
                    onClick={stopCamera}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                  >
                    <VideoOff className="w-4 h-4" />
                    <span>Tutup Cam</span>
                  </button>
                  <button
                    onClick={toggleCameraFacing}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                    title="Ganti Kamera Belakang / Depan"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                  <button
                    onClick={captureLiveCamera}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30"
                  >
                    <Camera className="w-4 h-4 fill-current" />
                    <span>JEPRET FOTO SEKARANG</span>
                  </button>
                </>
              )}
            </div>

            {/* One-Touch Hardware Button */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col items-center">
              <button
                disabled={isScanning}
                onClick={handleTriggerScan}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all ${
                  isScanning 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 hover:from-teal-400 hover:to-emerald-300 text-slate-950 ring-2 ring-teal-400/40 animate-ring-pulse active:scale-[0.98]'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isScanning ? 'Pengujian Sedang Berlangsung...' : 'UJI SAMPEL SEKARANG (ONE-TOUCH ? 4s)'}</span>
              </button>
              <span className="text-[10px] text-slate-500 mt-1.5">
                Tombol fisik kubah otomatis memicu iluminasi cincin 5000K & sensor inframerah
              </span>
            </div>

          </div>

          {/* Food Profile Selector & Custom Upload */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Pilih Profil Mutu Kuliner (SNI & CPPOB)
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
              >
                <Upload className="w-3 h-3" />
                <span>Upload File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomUpload}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {FOOD_PROFILES.map((profile) => {
                const isSelected = selectedProfile.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    onClick={() => {
                      setSelectedProfile(profile);
                      setAnalysisResult(null);
                      setIsSynced(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      isSelected 
                        ? 'bg-teal-950/70 border-teal-500/80 ring-1 ring-teal-500/40' 
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-white line-clamp-1">
                      {profile.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Target: {profile.targetHardnessN} N ? Df {profile.targetDf}
                    </span>
                    <span className="text-[9px] text-teal-400/90 font-semibold truncate">
                      {profile.sniStandard.split('&')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {customImage && (
              <div className="bg-emerald-950/70 border border-emerald-500/80 p-3 rounded-xl flex items-center justify-between text-xs shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <div>
                    <span className="text-emerald-300 font-bold block">Foto Asli Anda Berhasil Dimuat!</span>
                    <span className="text-[10px] text-slate-300">Klik tombol "UJI SAMPEL SEKARANG" di atas</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCustomImage(null);
                    setAnalysisResult(null);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                >
                  Gunakan Preset
                </button>
              </div>
            )}
          </div>

          {/* Hardware Specs & Indonesian BOM Pricing */}
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-200 text-xs">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-teal-400" />
                <span>BOM Hardware Resmi (BAB 2.3.1)</span>
              </span>
              <span className="text-emerald-400 font-mono">Rp 1.385.000 / unit</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>? <strong>Controller:</strong> RPi Zero 2W (Rp360rb)</div>
              <div>? <strong>Kamera:</strong> Sony IMX219 8MP (Rp215rb)</div>
              <div>? <strong>Sensor Suhu:</strong> MLX90614 (Rp165rb)</div>
              <div>? <strong>Lighting:</strong> High-CRI 5000K (Rp95rb)</div>
              <div>? <strong>Housing:</strong> 3D PETG Food-grade (Rp380rb)</div>
              <div>? <strong>Fan + PSU:</strong> Positive Pressure (Rp170rb)</div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Dual-Engine Analysis & TPA Metrics (LG: 7 cols) */}
        <div className="lg:col-span-7 space-y-4">

          {analysisResult ? (
            <div className="space-y-4">
              
              {/* QC Status Hero Banner */}
              <div className={`p-5 rounded-2xl border shadow-xl flex flex-wrap items-center justify-between gap-4 transition-all ${
                analysisResult.qualityStatus === 'NORMAL' 
                  ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/40 border-emerald-500/50' 
                  : analysisResult.qualityStatus === 'WARNING'
                  ? 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-yellow-950/40 border-amber-500/50'
                  : 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-red-950/40 border-rose-500/50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg flex-shrink-0 ${
                    analysisResult.qualityStatus === 'NORMAL' ? 'bg-emerald-400 shadow-emerald-500/30' :
                    analysisResult.qualityStatus === 'WARNING' ? 'bg-amber-400 shadow-amber-500/30' :
                    'bg-rose-500 shadow-rose-500/30'
                  }`}>
                    {analysisResult.qualityStatus === 'NORMAL' && <CheckCircle className="w-8 h-8" />}
                    {analysisResult.qualityStatus === 'WARNING' && <AlertCircle className="w-8 h-8" />}
                    {analysisResult.qualityStatus === 'DEVIATION' && <XCircle className="w-8 h-8" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold tracking-wide px-2.5 py-0.5 rounded-full border ${
                        analysisResult.qualityStatus === 'NORMAL' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700' :
                        analysisResult.qualityStatus === 'WARNING' ? 'bg-amber-950/90 text-amber-300 border-amber-700' :
                        'bg-rose-950/90 text-rose-300 border-rose-700'
                      }`}>
                        {analysisResult.qualityStatus === 'NORMAL' ? 'KUALITAS BAGUS (LOLOS)' :
                         analysisResult.qualityStatus === 'WARNING' ? 'PERLU PERHATIAN' :
                         'TIDAK LOLOS STANDAR'}
                      </span>
                      <span className="text-xs text-slate-400">
                        • Selesai dalam {analysisResult.executionTimeMs} ms
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white mt-1">
                      {analysisResult.qualityStatus === 'NORMAL' ? 'Gorengan Renyah & Matang Pas' :
                       analysisResult.qualityStatus === 'WARNING' ? 'Mendekati Batas Kematangan' :
                       'Gorengan Perlu Diperbaiki'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 font-medium">{analysisResult.feedback}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 block">Skor Kerenyahan</span>
                  <div className="text-4xl font-black text-white">
                    {analysisResult.crispnessIndex}
                    <span className="text-sm font-semibold text-slate-400">/100</span>
                  </div>
                  <span className={`text-[11px] font-bold block mt-0.5 ${
                    analysisResult.crispnessIndex >= 85 ? 'text-emerald-400' :
                    analysisResult.crispnessIndex >= 70 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {analysisResult.crispnessIndex >= 85 ? 'Sangat Renyah' :
                     analysisResult.crispnessIndex >= 70 ? 'Cukup Renyah' : 'Lembek / Alot'}
                  </span>
                </div>
              </div>

              {/* Dua Kartu Pemeriksaan yang Mudah Dipahami */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Kartu 1: Warna & Kematangan */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <span>🎨</span>
                      <span>Pemeriksaan Warna & Kematangan</span>
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      analysisResult.deltaE <= 6.5 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' :
                      analysisResult.deltaE <= 15 ? 'bg-amber-950 text-amber-400 border border-amber-800/60' :
                      'bg-rose-950 text-rose-400 border border-rose-800/60'
                    }`}>
                      {analysisResult.deltaE <= 6.5 ? 'Warna Pas' : analysisResult.deltaE <= 15 ? 'Sedikit Beda' : 'Warna Beda Jauh'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg">
                      <span className="text-slate-400">Warna Kerak Gorengan:</span>
                      <span className="font-bold text-white">
                        {analysisResult.cielab.l < 48 ? 'Kecokelatan Gelap (Hampir Gosong)' :
                         analysisResult.cielab.l > 70 ? 'Kuning Pucat (Kurang Matang)' :
                         'Kuning Keemasan (Golden Crisp)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg">
                      <span className="text-slate-400">Kesesuaian Resep:</span>
                      <span className={`font-bold ${
                        analysisResult.deltaE <= 6.5 ? 'text-emerald-400' :
                        analysisResult.deltaE <= 15 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {analysisResult.deltaE <= 6.5 ? 'Sangat Mirip Resep Asli' :
                         analysisResult.deltaE <= 15 ? 'Ada Sedikit Perbedaan' : 'Beda Jauh dari Resep'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg">
                      <span className="text-slate-400">Suhu Saat Diperiksa:</span>
                      <span className="font-bold text-amber-300">
                        {analysisResult.infraredTempC}°C <span className="text-[11px] font-normal text-slate-400">(Masih Panas & Segar)</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kartu 2: Tekstur & Kerenyahan */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                      <span>🍗</span>
                      <span>Pemeriksaan Tekstur & Kerenyahan</span>
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      analysisResult.hardnessNewtons >= selectedProfile.hardnessMinN &&
                      analysisResult.hardnessNewtons <= selectedProfile.hardnessMaxN
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                    }`}>
                      {analysisResult.hardnessNewtons >= selectedProfile.hardnessMinN &&
                       analysisResult.hardnessNewtons <= selectedProfile.hardnessMaxN
                        ? 'Tekstur Ideal' : 'Tekstur Di Luar Batas'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg">
                      <span className="text-slate-400">Kerenyahan Kulit:</span>
                      <span className="font-bold text-white">
                        {analysisResult.fractalDimension >= 1.80 ? 'Garing Berpori (Minyak Tiris Baik)' : 'Kurang Berpori / Agak Padat'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg">
                      <span className="text-slate-400">Keempukan Saat Digigit:</span>
                      <span className={`font-bold ${
                        analysisResult.hardnessNewtons >= selectedProfile.hardnessMinN &&
                        analysisResult.hardnessNewtons <= selectedProfile.hardnessMaxN
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}>
                        {analysisResult.hardnessNewtons > selectedProfile.hardnessMaxN ? `Terlalu Keras / Alot (${analysisResult.hardnessNewtons} N)` :
                         analysisResult.hardnessNewtons < selectedProfile.hardnessMinN ? `Terlalu Lembek (${analysisResult.hardnessNewtons} N)` :
                         `Pas & Enak Dikunyah (${analysisResult.hardnessNewtons} N)`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg">
                      <span className="text-slate-400">Standar Target Resep:</span>
                      <span className="font-medium text-slate-300">
                        {selectedProfile.hardnessMinN} – {selectedProfile.hardnessMaxN} N ({selectedProfile.name})
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Saran Praktis untuk Koki & Tim Dapur */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Info className="w-4 h-4 text-teal-400" />
                    <span>Saran Praktis untuk Koki & Tim Dapur</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Panduan Langsung
                  </span>
                </div>
                <div className="space-y-2">
                  {analysisResult.prescriptions.map((p: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Akordeon: Data Teknis Laboratorium & Rumus Ilmiah (Opsional, Default Tertutup) */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowTechDetails(prev => !prev)}
                  className="w-full flex items-center justify-between p-3.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-all font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-slate-500" />
                    <span>Rincian Data Teknis Laboratorium & Rumus Ilmiah (Opsional)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-teal-400 font-medium">
                    <span>{showTechDetails ? 'Sembunyikan' : 'Buka Detail Teknis'}</span>
                    {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {showTechDetails && (
                  <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 space-y-3 text-xs">
                    <p className="text-slate-400 text-[11px]">
                      Data parameter ilmiah di bawah ini diproses langsung dari sensor kamera & algoritma Computer Vision untuk keperluan verifikasi laboratorium:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase">CIE L*a*b*</span>
                        <span className="text-slate-200 font-bold">L:{analysisResult.cielab.l} a:{analysisResult.cielab.a} b:{analysisResult.cielab.b}</span>
                      </div>
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase">Delta E* (Deviasi)</span>
                        <span className="text-teal-400 font-bold">ΔE*: {analysisResult.deltaE}</span>
                      </div>
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase">Dimensi Fraktal (Df)</span>
                        <span className="text-sky-400 font-bold">Df: {analysisResult.fractalDimension}</span>
                      </div>
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase">Browning Index (BI)</span>
                        <span className="text-amber-400 font-bold">BI: {analysisResult.browningIndex}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 flex flex-wrap items-center justify-between pt-1 border-t border-slate-800/50">
                      <span>Model ML: XGBoost Texture Profile Analyzer (R² = 0.934)</span>
                      <span>Acuan Regulasi: {analysisResult.sniStandardName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions: Sync & Print Certificate */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 shadow transition-all"
                >
                  <Printer className="w-4 h-4 text-teal-400" />
                  <span>Cetak Laporan Pemeriksaan (PDF / Kertas)</span>
                </button>

                <button
                  onClick={onViewDashboard}
                  className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shadow transition-all"
                >
                  <span>Buka di Dasbor Pemantauan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : foodValidationError ? (
            /* Rejection Card When Non-Food / Face is Detected */
            <div className="bg-gradient-to-br from-rose-950/90 via-slate-900 to-rose-950/60 border-2 border-rose-500/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 flex-shrink-0 shadow-lg shadow-rose-950/50">
                  <XCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-700 px-2.5 py-0.5 rounded-full">
                      Pemeriksaan Ditolak Sistem
                    </span>
                    <span className="text-xs text-rose-400 font-mono font-bold">STATUS: BUKAN MAKANAN</span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {foodValidationError.title || 'Foto Bukan Sampel Makanan!'}
                  </h3>
                  <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
                    {foodValidationError.reason}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-rose-900/60 rounded-xl p-4 text-xs space-y-2.5">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-rose-400" />
                  <span>Petunjuk Standar Mutu RASA AI:</span>
                </p>
                <ul className="text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li><strong className="text-rose-300">{foodValidationError.suggestion || 'Arahkan kamera khusus ke sampel makanan olahan yang sedang diuji.'}</strong></li>
                  <li>Sistem Computer Vision RASA AI dilengkapi <strong>filter biometrik wajah & spektrum kromatografi</strong> untuk menolak foto manusia, wajah/selfie, dan objek mati non-kuliner.</li>
                  <li>Letakkan makanan olahan di atas wadah piring bersih dengan pencahayaan yang cukup.</li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFoodValidationError(null);
                    setCustomImage(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Foto Ulang Sampel Makanan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFoodValidationError(null);
                    setCustomImage(selectedProfile.sampleImage);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  <span>Gunakan Sampel Acuan ({selectedProfile.name})</span>
                </button>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full min-h-[440px] bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-950/50 border border-teal-800/40 flex items-center justify-center text-teal-400">
                <Scan className="w-8 h-8 animate-pulse" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-base font-bold text-white">Chamber Siap Menganalisis Sampel</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gunakan foto preset, upload foto makanan sendiri, atau 
                  <strong className="text-teal-400"> nyalakan kamera langsung HP Anda</strong> untuk menguji kerenyahan gorengan secara nyata dalam &lt; 4 detik.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-sm pt-2 text-[11px]">
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <span className="block text-slate-500">Waktu Uji</span>
                  <span className="font-bold text-teal-400">&lt; 4 Detik</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <span className="block text-slate-500">Sifat Uji</span>
                  <span className="font-bold text-emerald-400">Non-Destruktif</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <span className="block text-slate-500">Akurasi TPA</span>
                  <span className="font-bold text-sky-400">R² = 0.934</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
      </div> {/* End of print:hidden simulator panels */}

      {/* Official CPPOB & SNI Certificate Print Modal */}
      {showPrintModal && analysisResult && (
        <div 
          id="print-modal-container"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrintModal(false);
          }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/95 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start print:static print:inset-auto print:bg-white print:p-0 print:overflow-visible print:block"
        >
          <div 
            id="printable-audit-certificate"
            className="relative bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 my-4 sm:my-8 shadow-2xl space-y-6 print:m-0 print:p-6 print:max-w-none print:shadow-none print:rounded-none print:border print:border-slate-300 print:space-y-4"
          >
            {/* Close Button at Top-Right */}
            <button
              type="button"
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors print:hidden cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between pr-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl tracking-tight text-slate-950">RASA AI</span>
                  <span className="text-xs uppercase bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-mono font-bold">
                    LEMBAR UJI MUTU
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1 uppercase">
                  Lembar Hasil Pemeriksaan Kualitas & Kerenyahan Makanan
                </h3>
                <p className="text-xs text-slate-600">
                  Standar Mutu Kuliner ({selectedProfile.sniStandard})
                </p>
              </div>

              <div className="text-right text-xs font-mono">
                <p className="font-bold">DOKUMEN RESMI</p>
                <p className="text-slate-500">{new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p><strong>Nama Menu:</strong> {selectedProfile.name}</p>
                <p><strong>Kategori Makanan:</strong> {selectedProfile.category}</p>
                <p><strong>Cabang Dapur:</strong> {branches.find(b => b.id === activeBranchId)?.name || 'Semua Cabang / Dapur Pusat'}</p>
              </div>
              <div className="space-y-1 font-mono">
                <p><strong>ID Pemeriksaan:</strong> QC-{Date.now().toString().slice(-8)}</p>
                <p><strong>Pemeriksa:</strong> Tim Dapur / Staff QC</p>
                <p><strong>Metode:</strong> Sensor Kamera & Computer Vision</p>
              </div>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 border-b border-slate-300 text-[11px] uppercase font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5">Pemeriksaan</th>
                    <th className="p-2.5">Hasil Terukur</th>
                    <th className="p-2.5">Standar Acuan</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 font-semibold">Keempukan / Kekerasan Kulit</td>
                    <td className="p-2.5 font-mono font-bold">{analysisResult.hardnessNewtons} N</td>
                    <td className="p-2.5 font-mono text-slate-600">{selectedProfile.hardnessMinN} – {selectedProfile.hardnessMaxN} N</td>
                    <td className={`p-2.5 text-center font-bold ${
                      analysisResult.hardnessNewtons >= selectedProfile.hardnessMinN &&
                      analysisResult.hardnessNewtons <= selectedProfile.hardnessMaxN
                        ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {analysisResult.hardnessNewtons >= selectedProfile.hardnessMinN &&
                       analysisResult.hardnessNewtons <= selectedProfile.hardnessMaxN ? 'PAS' : 'TIDAK PAS'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Tekstur Pori-Pori Kerenyahan</td>
                    <td className="p-2.5 font-mono font-bold">{analysisResult.fractalDimension}</td>
                    <td className="p-2.5 font-mono text-slate-600">&ge; {selectedProfile.targetDf} (Berpori)</td>
                    <td className={`p-2.5 text-center font-bold ${
                      analysisResult.fractalDimension >= selectedProfile.targetDf ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {analysisResult.fractalDimension >= selectedProfile.targetDf ? 'RENYAH' : 'AGAK PADAT'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Kematangan & Kecerahan Warna</td>
                    <td className="p-2.5 font-mono">Tingkat Cerah: {analysisResult.cielab.l}</td>
                    <td className="p-2.5 font-mono text-slate-600">Kuning Keemasan</td>
                    <td className={`p-2.5 text-center font-bold ${
                      analysisResult.cielab.l >= 48 && analysisResult.cielab.l <= 70
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}>
                      {analysisResult.cielab.l < 48 ? 'TERLALU COKELAT' : analysisResult.cielab.l > 70 ? 'PUCAT' : 'PAS'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Kesesuaian Warna dengan Resep</td>
                    <td className="p-2.5 font-mono font-bold">{analysisResult.deltaE}</td>
                    <td className="p-2.5 font-mono text-slate-600">&le; 6.5 (Mirip Resep)</td>
                    <td className={`p-2.5 text-center font-bold ${analysisResult.deltaE <= 6.5 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {analysisResult.deltaE <= 6.5 ? 'MIRIP' : 'BEDA'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Skor Kerenyahan Akhir</td>
                    <td className="p-2.5 font-mono font-bold text-teal-800">{analysisResult.crispnessIndex} / 100</td>
                    <td className="p-2.5 font-mono text-slate-600">&ge; 80 / 100</td>
                    <td className={`p-2.5 text-center font-bold ${analysisResult.crispnessIndex >= 80 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {analysisResult.crispnessIndex >= 80 ? 'LOLOS' : 'TIDAK LOLOS'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">KESIMPULAN PEMERIKSAAN:</p>
              <p className="text-slate-700 leading-relaxed">
                Produk dinyatakan <strong>{analysisResult.qualityStatus === 'NORMAL' ? 'MEMENUHI STANDAR MUTU MAKANAN' : 'PERLU PERBAIKAN SEBELUM DISAJIKAN'}</strong>. 
                Hasil pemeriksaan ini telah tersimpan otomatis di sistem pemantauan mutu.
              </p>
            </div>

            <div className="flex justify-between pt-6 text-xs text-center border-t border-slate-200">
              <div className="w-40 space-y-12">
                <p className="text-slate-500">Operator AIoT Cabang</p>
                <p className="font-bold border-t border-slate-400 pt-1 text-slate-800">( Staff Dapur )</p>
              </div>
              <div className="w-40 space-y-12">
                <p className="text-slate-500">Quality Assurance Manager</p>
                <p className="font-bold border-t border-slate-400 pt-1 text-slate-800">( Muhamad Salman )</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden print-action-buttons">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-300"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleOpenPrintWindow}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
                title="Buka dokumen di tab baru yang bersih dan siap cetak"
              >
                <ExternalLink className="w-4 h-4 text-slate-600" />
                <span>Buka di Tab Baru</span>
              </button>
              <button
                type="button"
                onClick={handlePrintCertificate}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Audit (PDF)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
