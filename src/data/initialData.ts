import { Branch, FoodProfile, BatchRecord } from '../types';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'kemang',
    name: 'Cabang Kemang',
    location: 'Jakarta Selatan',
    lastScore: 90,
    status: 'NORMAL',
    lastUpdate: '2 jam lalu',
    activeBatchesToday: 28,
    recentDeviationsCount: 0
  },
  {
    id: 'bintaro',
    name: 'Cabang Bintaro',
    location: 'Tangerang Selatan',
    lastScore: 87,
    status: 'NORMAL',
    lastUpdate: '1 jam lalu',
    activeBatchesToday: 32,
    recentDeviationsCount: 0
  },
  {
    id: 'kelapa-gading',
    name: 'Cabang Kelapa Gading',
    location: 'Jakarta Utara',
    lastScore: 84,
    status: 'WARNING',
    lastUpdate: '3 jam lalu',
    activeBatchesToday: 24,
    recentDeviationsCount: 1
  },
  {
    id: 'bsd',
    name: 'Cabang BSD',
    location: 'Tangerang',
    lastScore: 92,
    status: 'NORMAL',
    lastUpdate: '30 menit lalu',
    activeBatchesToday: 41,
    recentDeviationsCount: 0
  },
  {
    id: 'cikarang',
    name: 'Cabang Cikarang',
    location: 'Kawasan Industri Jababeka',
    lastScore: 74,
    status: 'DEVIATION',
    lastUpdate: '5 jam lalu',
    activeBatchesToday: 18,
    recentDeviationsCount: 3 // Triggers 3-consecutive deviation alert
  },
  {
    id: 'bandung',
    name: 'Cabang Bandung',
    location: 'Dago Atas',
    lastScore: 88,
    status: 'NORMAL',
    lastUpdate: '4 jam lalu',
    activeBatchesToday: 35,
    recentDeviationsCount: 0
  },
  {
    id: 'surabaya',
    name: 'Cabang Surabaya Gubeng',
    location: 'Surabaya Pusat',
    lastScore: 89,
    status: 'NORMAL',
    lastUpdate: '1 jam lalu',
    activeBatchesToday: 30,
    recentDeviationsCount: 0
  },
  {
    id: 'yogyakarta',
    name: 'Cabang Yogyakarta Malioboro',
    location: 'DI Yogyakarta',
    lastScore: 86,
    status: 'NORMAL',
    lastUpdate: '2 jam lalu',
    activeBatchesToday: 26,
    recentDeviationsCount: 0
  },
  {
    id: 'semarang',
    name: 'Cabang Semarang Pandanaran',
    location: 'Semarang',
    lastScore: 85,
    status: 'NORMAL',
    lastUpdate: '3 jam lalu',
    activeBatchesToday: 22,
    recentDeviationsCount: 0
  },
  {
    id: 'medan',
    name: 'Cabang Medan Ringroad',
    location: 'Medan Sunggal',
    lastScore: 83,
    status: 'WARNING',
    lastUpdate: '45 menit lalu',
    activeBatchesToday: 20,
    recentDeviationsCount: 1
  },
  {
    id: 'denpasar',
    name: 'Cabang Denpasar Teuku Umar',
    location: 'Bali',
    lastScore: 91,
    status: 'NORMAL',
    lastUpdate: '1 jam lalu',
    activeBatchesToday: 38,
    recentDeviationsCount: 0
  },
  {
    id: 'makassar',
    name: 'Cabang Makassar Pettarani',
    location: 'Makassar',
    lastScore: 78,
    status: 'DEVIATION',
    lastUpdate: '2 jam lalu',
    activeBatchesToday: 19,
    recentDeviationsCount: 2
  }
];

export const SEVEN_DAY_TREND = [
  { day: 'Sen', fullDay: 'Senin', score: 82, benchmark: 80, batches: 184 },
  { day: 'Sel', fullDay: 'Selasa', score: 85, benchmark: 80, batches: 210 },
  { day: 'Rab', fullDay: 'Rabu', score: 79, benchmark: 80, batches: 192 },
  { day: 'Kam', fullDay: 'Kamis', score: 88, benchmark: 80, batches: 228 },
  { day: 'Jum', fullDay: 'Jumat', score: 91, benchmark: 80, batches: 265 },
  { day: 'Sab', fullDay: 'Sabtu', score: 87, benchmark: 80, batches: 310 },
  { day: 'Min', fullDay: 'Minggu', score: 90, benchmark: 80, batches: 295 }
];

export const FOOD_PROFILES: FoodProfile[] = [
  {
    id: 'ayam-krispi',
    name: 'Ayam Goreng Krispi (Fried Chicken)',
    category: 'Unggas Olahan Berlapis Tepung',
    subtitle: 'Kerenyahan pori mikro berongga udara dengan browning Maillard seimbang',
    targetHardnessN: 23.4,
    hardnessMinN: 18.0,
    hardnessMaxN: 28.0,
    targetCrispness: 92,
    targetDf: 1.85,
    goldenLab: { l: 61.2, a: 14.8, b: 37.5 },
    optimalOilTempC: 165,
    cookingTimeMins: 12,
    sniStandard: 'SNI 7388:2009 & Pedoman IKM Kemenperin 2024',
    description: 'Standar resep emas gorengan tepung berlapis bumbu kuning. Lapisan kerak memiliki rongga udara seragam dan pelepasan energi mekanik optimal saat digigit.',
    sampleImage: '/assets/sample_ayam_golden.jpg'
  },
  {
    id: 'keripik-kentang',
    name: 'Keripik Kentang / Singkong / Tempe',
    category: 'Camilan Kering & Keripik',
    subtitle: 'Ketebalan tipis getas dengan fraktal pori sangat rapat',
    targetHardnessN: 15.2,
    hardnessMinN: 11.5,
    hardnessMaxN: 19.5,
    targetCrispness: 95,
    targetDf: 1.91,
    goldenLab: { l: 66.5, a: 8.2, b: 38.0 },
    optimalOilTempC: 160,
    cookingTimeMins: 6,
    sniStandard: 'SNI 01-2973 (Keripik/Biskuit Olahan)',
    description: 'Kadar air bebas di bawah 3%. Kerenyahan tinggi dengan fraktur instan pada gigitan pertama.',
    sampleImage: '/assets/sample_ayam_golden.jpg'
  },
  {
    id: 'pastry-croissant',
    name: 'Pastry / Croissant / Risoles Krispi',
    category: 'Pastry & Roti Goreng',
    subtitle: 'Struktur laminasi berlapis dengan retakan renyah luar lembut dalam',
    targetHardnessN: 20.8,
    hardnessMinN: 16.0,
    hardnessMaxN: 26.0,
    targetCrispness: 88,
    targetDf: 1.82,
    goldenLab: { l: 59.4, a: 16.2, b: 34.8 },
    optimalOilTempC: 175,
    cookingTimeMins: 9,
    sniStandard: 'SNI 01-3840-1995 (Roti & Pastry)',
    description: 'Adonan mengembang dengan pori heksagonal berongga. Warna kecoklatan karamel dan tidak berminyak di permukaan.',
    sampleImage: '/assets/sample_ayam_golden.jpg'
  },
  {
    id: 'tahu-tempe-crispy',
    name: 'Tahu / Tempe Crispy',
    category: 'Gorengan Nabati',
    subtitle: 'Kulit terluar renyah keriting dengan kelembutan inti kedelai',
    targetHardnessN: 18.5,
    hardnessMinN: 14.0,
    hardnessMaxN: 24.0,
    targetCrispness: 89,
    targetDf: 1.84,
    goldenLab: { l: 63.0, a: 11.5, b: 36.2 },
    optimalOilTempC: 170,
    cookingTimeMins: 8,
    sniStandard: 'SNI 01-3144 (Tahu/Tempe Olahan)',
    description: 'Kremesan tepung beras dan tapioka mengembang membentuk jaring-jaring renyah nirkontak.',
    sampleImage: '/assets/sample_ayam_golden.jpg'
  }
];

export const INITIAL_BATCH_RECORDS: BatchRecord[] = [
  {
    id: 'BATCH-2026-0920-001',
    branchId: 'cikarang',
    branchName: 'Cabang Cikarang',
    timestamp: '12:15 WIB',
    sampleName: 'Ayam Goreng Krispi (Fried Chicken)',
    category: 'Unggas Olahan Berlapis Tepung',
    crispnessScore: 71.4,
    hardnessN: 16.2,
    deltaE: 8.4,
    df: 1.68,
    tempC: 69.4,
    browningIndex: 33.5,
    status: 'DEVIATION',
    operator: 'Ahmad Syafiq (Staff QC Dapur)',
    feedback: 'Produk melempem akibat suhu minyak drop di bawah 150?C'
  },
  {
    id: 'BATCH-2026-0920-002',
    branchId: 'bsd',
    branchName: 'Cabang BSD',
    timestamp: '12:08 WIB',
    sampleName: 'Ayam Goreng Krispi (Fried Chicken)',
    category: 'Unggas Olahan Berlapis Tepung',
    crispnessScore: 92.8,
    hardnessN: 23.5,
    deltaE: 2.1,
    df: 1.88,
    tempC: 78.9,
    browningIndex: 48.2,
    status: 'NORMAL',
    operator: 'Rian Kusuma (Kepala Dapur)',
    feedback: 'Kerenyahan sempurna, pori mikro dan warna emas ideal'
  },
  {
    id: 'BATCH-2026-0920-003',
    branchId: 'kemang',
    branchName: 'Cabang Kemang',
    timestamp: '11:55 WIB',
    sampleName: 'Ayam Goreng Krispi (Fried Chicken)',
    category: 'Unggas Olahan Berlapis Tepung',
    crispnessScore: 90.2,
    hardnessN: 22.8,
    deltaE: 2.6,
    df: 1.84,
    tempC: 77.5,
    browningIndex: 46.8,
    status: 'NORMAL',
    operator: 'Budi Wahyudi (Operator AIoT)',
    feedback: 'Memenuhi spesifikasi standar resep emas'
  },
  {
    id: 'BATCH-2026-0920-004',
    branchId: 'kelapa-gading',
    branchName: 'Cabang Kelapa Gading',
    timestamp: '11:42 WIB',
    sampleName: 'Ayam Goreng Krispi (Fried Chicken)',
    category: 'Unggas Olahan Berlapis Tepung',
    crispnessScore: 82.5,
    hardnessN: 26.4,
    deltaE: 5.9,
    df: 1.76,
    tempC: 76.1,
    browningIndex: 54.1,
    status: 'WARNING',
    operator: 'Doni Hermawan (Juru Masak)',
    feedback: 'Kerak mendekati batas atas kekerasan, kurangi waktu goreng 30 detik'
  },
  {
    id: 'BATCH-2026-0920-005',
    branchId: 'bintaro',
    branchName: 'Cabang Bintaro',
    timestamp: '11:30 WIB',
    sampleName: 'Ayam Goreng Krispi (Fried Chicken)',
    category: 'Unggas Olahan Berlapis Tepung',
    crispnessScore: 88.6,
    hardnessN: 24.1,
    deltaE: 3.2,
    df: 1.82,
    tempC: 78.0,
    browningIndex: 47.5,
    status: 'NORMAL',
    operator: 'Siti Maryam (Staff Dapur)',
    feedback: 'Tekstur renyah stabil sesuai resep acuan'
  }
];
