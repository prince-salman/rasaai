# DOKUMEN RISET DAN DATA EMPIRIS RESMI: SISTEM RASA AI
**Dual-Engine Deep Vision and Machine Learning Framework untuk Standardisasi Mutu dan Konsistensi Tekstur Produk UMKM Kuliner**

Dokumen ini mendokumentasikan seluruh parameter ilmiah, data empiris laboratorium, formula matematis, regulasi standar pangan nasional (SNI & BPOM), serta rincian biaya perangkat keras riil di pasar Indonesia sebagai acuan operasional sistem RASA AI.

---

## 1. Parameter Mekanik Tekstur Pangan Empiris (Texture Profile Analyzer - TPA)

Sesuai rumusan baku **Szczesniak (2002)** dan **Bourne (2002)** dalam *Food Texture and Viscosity: Concept and Measurement*, kerenyahan (*crispness/fracturability*) dan kekerasan (*hardness*) adalah sifat mekanik objektif yang dapat diukur secara instrumental melalui mesin TPA (misalnya *Stable Micro Systems TA.XT Plus* atau *Brookfield CT3*).

### 1.1 Karakteristik Mekanik Produk Gorengan & Pangan Berpori
Pada produk gorengan berlapis tepung (seperti ayam goreng krispi, keripik, dan pastry), kurva *force-displacement* TPA menunjukkan serangkaian puncak fraktur mikro (*multiple fracture peaks/jaggedness*):

| Kategori Produk Pangan | Rentang Kekerasan Optimal (Peak Force / Hardness dalam Newton) | Indeks Kerenyahan Optimal (0?100) | Dimensi Fraktal Rekahan ($D_f$) | Titik Kritis Kegagalan Mutu |
| :--- | :--- | :--- | :--- | :--- |
| **Ayam Goreng Krispi (Fried Chicken)** | **18.0 N ? 28.0 N** | **85 ? 98** | **1.80 ? 1.92** | ? &lt; 16 N: Lembek/Undercooked<br>? &gt; 34 N: Keras/Overcooked/Gosong |
| **Keripik Kentang / Singkong** | **12.0 N ? 19.0 N** | **90 ? 99** | **1.86 ? 1.95** | ? &lt; 10 N: Melempem (kelembapan tinggi)<br>? &gt; 24 N: Terlalu tebal/alot |
| **Pastry / Croissant / Risoles Krispi** | **17.0 N ? 26.0 N** | **84 ? 95** | **1.78 ? 1.88** | ? &lt; 15 N: Minyak terperangkap/basah<br>? &gt; 30 N: Adonan mengeras/gosong |
| **Tahu / Tempe Crispy** | **15.0 N ? 24.0 N** | **85 ? 95** | **1.81 ? 1.90** | ? &lt; 13 N: Kulit lembek<br>? &gt; 29 N: Kerak keras getas |

*Sumber acuan ilmiah: Bourne (2002); Antonova et al. (2003); Qiao et al. (2007); Chen et al. (2022).*

---

## 2. Landasan Matematis & Algoritma Computer Vision

### 2.1 Ruang Warna CIELAB & Browning Index (BI)
Ekstraksi warna pada permukaan makanan menggunakan ruang warna **CIE $L^*a^*b^*$ (D65, 2? Standard Observer)** sesuai metodologi **Pathare, Opara, & Al-Said (2013)** dalam *Food and Bioprocess Technology*:

1. **Jarak Warna Euclidean ($\Delta E^*$):**
   $$\Delta E^* = \sqrt{(\Delta L^*)^2 + (\Delta a^*)^2 + (\Delta b^*)^2}$$
   - $\Delta E^* < 3.0$: Deviasi tidak kasat mata bagi mata manusia awam (*Golden Standard*).
   - $3.0 \le \Delta E^* \le 6.0$: Toleransi variasi kematangan normal (*Acceptable Zone*).
   - $\Delta E^* > 6.0$: Deviasi nyata; mengindikasikan ketidaksesuaian suhu minyak atau waktu goreng.

2. **Browning Index (BI) ? Indeks Pencoklatan Maillard:**
   $$x = rac{a^* + 1.75 L^*}{5.645 L^* + a^* - 3.012 b^*}$$
   $$	ext{BI} = rac{100(x - 0.31)}{0.17}$$
   - Nilai BI ideal untuk ayam goreng krispi: **42.0 ? 58.0**.
   - Nilai BI > 68.0: Reaksi Maillard berlebih, karamelisasi gosong.
   - Nilai BI < 35.0: Warna pucat, reaksi pembentukan kerak belum optimal.

### 2.2 Dimensi Fraktal Geometri ($D_f$) via Box-Counting
Berdasarkan kajian **Valous, Mendoza, Sun, & Allen (2009)** dalam *Food Chemistry*, struktur permukaan berpori produk pangan mencerminkan kerapatan rekahan mikro yang berkorelasi dengan kerenyahan:

$$N(s) \propto s^{-D_f} \implies D_f = - \lim_{s 	o 0} rac{\log N(s)}{\log s}$$
- $s$: Ukuran kotak (*grid box sizes*, e.g., $s \in [4, 8, 16, 32, 64]$ piksel).
- $N(s)$: Jumlah kotak yang memuat piksel tepi pori/rekahan (*edge/pore boundary*).
- $D_f$ bernilai antara **1.0 (garis mulus/datar tanpa pori)** hingga **2.0 (permukaan berpori mikro sangat padat dan kasar)**. Nilai $D_f \ge 1.82$ merupakan indikator fisik pori renyah yang sempurna.

---

## 3. Regulasi Mutu dan Kepatuhan Standar Nasional (SNI, BPOM, HACCP)

### 3.1 Standar Nasional Indonesia (SNI) Terkait
1. **SNI 01-3840-1995 (Roti & Pastry Olahan)**: Menetapkan parameter kadar air maksimal 40% dan kerenyahan kerak luar.
2. **SNI 01-2973 (Keripik & Biskuit Pangan Olahan)**: Menetapkan kadar air $\le 5\%$, bau normal, rasa khas, dan tekstur renyah (*crispy*).
3. **SNI 7388:2009 (Batas Maksimum Cemaran Mikroba dalam Pangan)**: Menetapkan sanitasi pengujian non-destruktif untuk mencegah kontaminasi silang sampel uji.

### 3.2 Kepatuhan CPPOB BPOM RI (Cara Produksi Pangan Olahan yang Baik)
Sesuai Peraturan BPOM No. 22 Tahun 2021 tentang Pedoman Penerapan CPPOB:
- **Aspek Pengendalian Proses (Klausul 8)**: Pelaku usaha wajib menetapkan spesifikasi parameter fisik (suhu, waktu, tekstur) dan mencatat rekam kendali mutu harian.
- **Sistem Mencegah Kontaminasi (Klausul 11)**: Penggunaan ruang uji *Mini-Dome Inspection Chamber* tertutup bertekanan positif mencegah uap minyak dan debu mencemari makanan.
- **Traceability / Keterlacakan (Klausul 14)**: Penyimpanan riwayat batch pengujian digital RASA AI memenuhi bukti audit resmi untuk perolehan izin edar **BPOM MD**.

### 3.3 HACCP Critical Control Points (CCP)
- **CCP-1 (Pemanasan Minyak Goreng)**: Suhu minyak stabil pada **$160^\circ	ext{C} ? 175^\circ	ext{C}$**.
- **CCP-2 (Kematangan Termal Inti Daging)**: Suhu internal ayam minimal **$74^\circ	ext{C}$** selama 15 detik untuk eliminasi *Salmonella spp.*
- **Monitoring Nirkontak**: Sensor inframerah MLX90614 mengukur suhu permukaan sajian (target: **$72^\circ	ext{C} ? 82^\circ	ext{C}$** saat selesai ditiriskan).

---

## 4. Rincian Biaya Riil Komponen Perangkat Keras (Bill of Materials - BOM)
*Harga pasar riil komponen di Indonesia (Tokopedia / Shopee / Digiware 2026)*:

| No | Komponen Perangkat Keras | Spesifikasi Teknis | Estimasi Biaya (IDR) |
| :---: | :--- | :--- | :---: |
| 1 | **Mikrokontroler Utama** | Raspberry Pi Zero 2W (Quad-core 64-bit, Wi-Fi/BT) | Rp 360.000,- |
| 2 | **Sensor Kamera** | Modul Kamera Sony IMX219 8 MP (Fixed-focus 15 cm) | Rp 215.000,- |
| 3 | **Sensor Suhu Inframerah** | Melexis MLX90614-DCI (Nirkontak, Akurasi ?0.5?C) | Rp 165.000,- |
| 4 | **Pencahayaan Terkalibrasi** | High-CRI Ring Light LED 5000K + Diffuser Akrilik Matte | Rp 95.000,- |
| 5 | **Sasis & Kubah Pelindung** | Housing 3D Print PETG Food-Grade (20 ? 20 ? 25 cm) | Rp 380.000,- |
| 6 | **Sistem Sirkulasi Udara** | Mini Fan 5V Brushless Bertekanan Positif + Filter | Rp 45.000,- |
| 7 | **Daya & Kontrol Fisik** | Power Adapter 5V 3A + Push Button LED Indikator | Rp 75.000,- |
| 8 | **Penyimpanan Lokal** | MicroSD Industrial 16GB (Kapasitas 5.000 data luring) | Rp 50.000,- |
| **TOTAL** | **Total Biaya Perakitan Per Unit (CAPEX Alat)** | **Sesuai Naskah BAB 2.3.1** | **Rp 1.385.000,-** |

---

## 5. Pemodelan Finansial & Operasional Riil (BAB 3.2 Naskah)
Pemodelan diterapkan pada UMKM kuliner dengan **3 cabang dapur** (omzet rata-rata Rp300.000.000,- per cabang per bulan):
- **Investasi Awal (CAPEX)**:
  - 3 unit alat RASA AI: $3 	imes 	ext{Rp1.400.000} = 	ext{Rp4.200.000}$
  - Instalasi sistem, kalibrasi resep, & pelatihan juru masak: $	ext{Rp1.500.000}$
  - **Total CAPEX: Rp 5.700.000,-**
- **Biaya Operasional (OPEX)**:
  - Cloud server database & notifikasi WhatsApp API: $	ext{Rp400.000,- / bulan}$
- **Manfaat Bersih Bulanan**:
  - Penurunan produk cacat/melempem/gosong sebesar **35%**: menghemat bahan baku Rp 7.200.000 / bulan.
  - Optimalisasi waktu penggorengan dan minyak goreng: efisiensi Rp 4.600.000 / bulan.
  - Total manfaat kotor: Rp 11.800.000 - OPEX Rp 400.000 = **Rp 11.400.000,- / bulan**.
- **Payback Period**:
  $$	ext{Payback Period} = rac{	ext{Rp5.700.000}}{	ext{Rp11.400.000}} pprox 0.5 	ext{ bulan (15 hari)} \quad lacksquare$$
