# RASA AI — Dual-Engine AIoT Culinary Quality Control Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20TailwindCSS-61DAFB)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.10+-009688)](https://fastapi.tiangolo.com/)
[![Computer Vision](https://img.shields.io/badge/Engine%201-OpenCV%20%7C%20CIELAB-orange)](https://opencv.org/)
[![Machine Learning](https://img.shields.io/badge/Engine%202-XGBoost%20%7C%20Scikit--Learn-yellow)](https://scikit-learn.org/)
[![Compliance](https://img.shields.io/badge/Standard-CPPOB%20%7C%20SNI%2001--2973-brightgreen)](https://pom.go.id/)

> **RASA AI** adalah platform Quality Control (QC) kuliner berbasis **AIoT (Artificial Intelligence & Internet of Things)** dengan arsitektur **Dual-Engine** (Computer Vision & Machine Learning Regression). Sistem ini dirancang untuk standardisasi mutu produk olahan pangan gorengan/keripik secara real-time, non-destruktif, dan sesuai dengan standar regulasi pangan **CPPOB BPOM RI** & **SNI 01-2973**.

---

## 🌟 Fitur Utama

1. **Dual-Engine Analytical Framework**:
   - **Engine 1: Deep Vision (Computer Vision)**
     - Transformasi ruang warna **CIE L\*a\*b\*** (Pathare et al., 2013) yang seragam secara perseptual manusia.
     - Perhitungan deviasi warna objektif **Delta E\* ($\Delta E^*$)** terhadap target baku referensi (SNI Golden Standard).
     - Ekstraksi tekstur dan porositas mikro permukaan melalui **Dimensi Fraktal ($D_f$) Box-Counting**.
     - Pemantauan reaksi Maillard secara matematis dengan **Browning Index (BI)**.
   - **Engine 2: ML Regression (XGBoost / LightGBM)**
     - Prediksi kekerasan instrumental non-destruktif (**Texture Profile Analysis - TPA Hardness**, skala Newton).
     - Prediksi kadar air residual (*Moisture Content %*).
     - Fusi sensor telemetri: Inframerah MLX90614, durasi penggorengan, dan parameter visual.
     - Akurasi model tinggi dengan $R^2 = 0.934$.

2. **Real-Time Notification & Audio Telemetry**:
   - Audio synthesizer cerdas (**Web Audio API**) dengan tone berbeda untuk status Normal, Warning, dan Critical Deviation.
   - Real-time Floating Toast Alert yang muncul otomatis saat terjadi deviasi mutu batch.
   - Notification Drawer dengan filtering kategori, badge counter, dan dispatch tombol SOP langsung.

3. **Unduh Rekam Mutu Rapi & Terstandarisasi (Excel/CSV Export)**:
   - Format file ekspor terstruktur dengan **UTF-8 BOM (`\uFEFF`)** dan header delimiter `sep=,` agar langsung rapi saat dibuka di Microsoft Excel.
   - Metadata rekam audit CPPOB/SNI lengkap: Total Batch, Compliance Pass Rate (%), Range Nilai, dan Rekomendasi Tindakan Korektif (CAPA).

4. **Multi-Outlet Telemetry & Fleet Monitoring**:
   - Pemantauan live batch pada cabang utama dan outlet satelit.
   - Instruksi preskriptif operasional untuk juru masak dapur (Klausul 8 & 14 CPPOB).

---

## 🏗️ Arsitektur Sistem

```
┌────────────────────────────────────────────────────────┐
│               Mini-Dome Chamber / Sensor               │
│  - Kamera HD (Makro Optical)                           │
│  - Sensor Suhu Inframerah Contactless (MLX90614)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            FastAPI Backend (Python 3.10+)              │
│ ┌───────────────────────┐   ┌────────────────────────┐ │
│ │  Engine 1: Vision     │   │  Engine 2: Regression  │ │
│ │  - CIE L*a*b* Colors  │   │  - TPA Hardness (N)    │ │
│ │  - Delta E* (Color)   │   │  - Moisture Prediction │ │
│ │  - Box-Counting Df    │   │  - XGBoost Model       │ │
│ │  - Browning Index     │   │  - R² = 0.934          │ │
│ └───────────────────────┘   └────────────────────────┘ │
└───────────────────────────┬────────────────────────────┘
                            │ WebSocket / REST API
                            ▼
┌────────────────────────────────────────────────────────┐
│             Vite + React 18 + TypeScript               │
│  - Live Telemetry Dashboard                            │
│  - Real-Time Toast & Audio Alert Synthesizer           │
│  - Notification Center & SOP Dispatch                  │
│  - Standar Acuan Regulasi (CPPOB & SNI)                │
│  - Export Rekam Mutu Excel/CSV                         │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Struktur Direktori

```bash
rasaai/
├── backend/                  # Backend FastAPI & Model ML
│   ├── main.py               # API Endpoints (FastAPI)
│   ├── vision_engine.py      # Engine 1: Computer Vision & Colorimetry
│   ├── ml_engine.py          # Engine 2: XGBoost Regression & Sensor Fusion
│   ├── rasa_ml_model.joblib  # Trained Model Weights
│   ├── requirements.txt      # Python Dependencies
│   ├── test_rasa.py          # Backend Unit & Integration Tests
│   └── demo_generator.py     # Batch & Sensor Simulation Generator
├── docs/                     # Dokumentasi Riset & Ilmiah
│   └── RASA_AI_RESEARCH_DATA.md
├── public/                   # Static Assets
├── src/                      # Frontend Source Code (React 18 + TS)
│   ├── components/
│   │   ├── common/           # Header, Navigation, Badges
│   │   ├── dashboard/        # Quality Dashboard, Batch Grid, Live Telemetry
│   │   ├── notifications/    # Realtime Toast & Notification Drawer
│   │   └── reference/        # Scientific & Regulatory Reference Modules
│   ├── types/                # TypeScript Interfaces & Models
│   ├── utils/                # Audio Synthesizer, Formatters, Exporters
│   ├── App.tsx               # Root Application Component
│   └── main.tsx              # Application Entry Point
├── package.json              # NPM Dependencies
├── tsconfig.json             # TypeScript Configuration
├── tailwind.config.js        # Tailwind CSS Configuration
└── vite.config.ts            # Vite Build Configuration
```

---

## 🚀 Panduan Memulai (Getting Started)

### 1. Prasyarat (Prerequisites)
- **Node.js** v18+ & **npm**
- **Python** 3.10+ & **pip**

### 2. Instalasi & Menjalankan Frontend
```bash
# Clone repositori
git clone https://github.com/prince-salman/rasaai.git
cd rasaai

# Install dependencies frontend
npm install

# Jalankan Vite development server
npm run dev
```
Aplikasi frontend akan aktif di `http://localhost:3000`.

### 3. Menjalankan Backend (FastAPI)
```bash
# Pindah ke direktori backend (opsional: aktifkan virtual environment)
cd backend

# Install dependencies Python
pip install -r requirements.txt

# Jalankan server FastAPI
python -m uvicorn main:app --port 8000 --reload
```
API server backend akan aktif di `http://localhost:8000` dengan Swagger Docs interaktif di `http://localhost:8000/docs`.

---

## 📊 Acuan Regulasi & Metodologi Ilmiah

- **CIE L\*a\*b\* Colorimetry**: Pathare, P. B., Opara, U. L., & Al-Said, F. A. J. (2013). *Colour measurement and analysis in fresh and processed foods: A review*. Food and Bioprocess Technology, 6(1), 36-60.
- **Dimensi Fraktal ($D_f$)**: Metode Box-Counting untuk mendeteksi homogenitas rongga udara dan kerenyahan produk pangan olahan.
- **CPPOB BPOM**: Cara Produksi Pangan Olahan yang Baik (Klausul 8: Pengendalian Proses, Klausul 14: Dokumentasi & Pencatatan).
- **SNI 01-2973**: Baku Mutu Biskuit dan Makanan Ringan Olahan.

---

## 👥 Tim Peneliti & Pengembang

Proyek riset dan sistem AIoT dikembangkan di **President University**:
- **Salman** & Tim Pengembang RASA AI
- **Fakultas Ilmu Komputer / Teknik**, Universitas Presiden

---

## 📄 Lisensi

Didistribusikan di bawah lisensi MIT. Lihat `LICENSE` untuk rincian lebih lanjut.
