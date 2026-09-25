import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { QualityDashboard } from './components/dashboard/QualityDashboard';
import { MiniDomeSimulator } from './components/scanner/MiniDomeSimulator';
import { RoiCalculator } from './components/showcase/RoiCalculator';
import { Branch, BatchRecord, NotificationItem } from './types';
import { INITIAL_BRANCHES, INITIAL_BATCH_RECORDS } from './data/initialData';
import { RealtimeToastContainer } from './components/notifications/RealtimeToastContainer';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { playSuccessChime, playWarningChime, playDeviationAlert } from './utils/audioAlert';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-01',
    type: 'DEVIATION',
    title: 'Peringatan Deviasi Mutu',
    message: 'Cabang Cikarang: Kerak ayam terlalu keras dan gelap (Skor 62/100). Perlu kalibrasi api kompor segera.',
    timestamp: '2 menit lalu',
    branchName: 'Cabang Cikarang',
    score: 62,
    read: false
  },
  {
    id: 'NOTIF-02',
    type: 'WARNING',
    title: 'Perhatian Suhu Minyak',
    message: 'Cabang Kemang: Tekstur agak sedikit lembek (Skor 78/100). Suhu minyak drop saat bahan masuk.',
    timestamp: '5 menit lalu',
    branchName: 'Cabang Kemang',
    score: 78,
    read: false
  },
  {
    id: 'NOTIF-03',
    type: 'NORMAL',
    title: 'Batch Lolos Standar Emas',
    message: 'Cabang Kelapa Gading: Kerenyahan dan warna keemasan sempurna (Skor 92/100). Siap disajikan.',
    timestamp: '8 menit lalu',
    branchName: 'Cabang Kelapa Gading',
    score: 92,
    read: true
  }
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'roi'>('dashboard');
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [batches, setBatches] = useState<BatchRecord[]>(INITIAL_BATCH_RECORDS);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  // Check if any branch has active 3-consecutive deviation alert
  const hasDeviationAlert = branches.some(b => b.recentDeviationsCount >= 3) || notifications.some(n => !n.read && n.type === 'DEVIATION');
  const unreadAlertsCount = notifications.filter(n => !n.read).length;

  // Add new batch record from the Mini-Dome Simulator or live stream
  const handleAddBatchRecord = (record: BatchRecord) => {
    setBatches(prev => [record, ...prev]);

    // Update the corresponding branch
    setBranches(prev => prev.map(b => {
      if (b.id === record.branchId) {
        const isDev = record.status === 'DEVIATION';
        const newDevCount = isDev ? b.recentDeviationsCount + 1 : 0;
        return {
          ...b,
          lastScore: Math.round(record.crispnessScore),
          status: record.status,
          lastUpdate: 'Baru saja',
          activeBatchesToday: b.activeBatchesToday + 1,
          recentDeviationsCount: newDevCount
        };
      }
      return b;
    }));

    // Trigger Real-Time Notification & Audio Chime
    const isDev = record.status === 'DEVIATION';
    const isWarn = record.status === 'WARNING';
    
    if (isDev) {
      playDeviationAlert();
    } else if (isWarn) {
      playWarningChime();
    } else {
      playSuccessChime();
    }

    const notifTitle = isDev ? '🚨 Peringatan Deviasi Mutu' :
                       isWarn ? '⚠️ Perhatian Kerenyahan' :
                       '✨ Batch Baru Lolos Standar';

    const notifMsg = isDev 
      ? `${record.branchName}: ${record.sampleName} mengalami deviasi mutu (${record.crispnessScore}/100). Pisahkan batch ini.`
      : isWarn
      ? `${record.branchName}: ${record.sampleName} mendekati batas toleransi (${record.crispnessScore}/100). Periksa kompor.`
      : `${record.branchName}: ${record.sampleName} lolos standar resep emas (${record.crispnessScore}/100). Kerenyahan optimal.`;

    const newNotifItem: NotificationItem = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: record.status,
      title: notifTitle,
      message: notifMsg,
      timestamp: 'Baru saja',
      branchName: record.branchName,
      score: record.crispnessScore,
      read: false
    };

    setNotifications(prev => [newNotifItem, ...prev.slice(0, 29)]);
    setActiveToast(newNotifItem);
  };

  // Clear demo batches to start pure real user testing
  const handleClearBatches = () => {
    setBatches([]);
  };

  // Restore 12-branch baseline data
  const handleResetDemoBatches = () => {
    setBatches(INITIAL_BATCH_RECORDS);
    setBranches(INITIAL_BRANCHES);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Background Simulated Real-Time Live IoT Kitchen stream
  useEffect(() => {
    if (!isLiveStreaming) return;

    const sampleDishes = [
      { name: 'Ayam Goreng Krispi', cat: 'Ayam Krispi', baseHardness: 23.4 },
      { name: 'Keripik Tempe Crispy', cat: 'Keripik / Olahan', baseHardness: 18.5 },
      { name: 'Tahu Crispy Keemasan', cat: 'Tahu / Tempe', baseHardness: 17.2 },
      { name: 'Pastry Risoles Krispi', cat: 'Pastry', baseHardness: 20.8 }
    ];

    const interval = setInterval(() => {
      // Pick random branch
      const randomBranch = branches[Math.floor(Math.random() * branches.length)];
      const randomDish = sampleDishes[Math.floor(Math.random() * sampleDishes.length)];
      
      // Realistic simulation: 75% Normal, 15% Warning, 10% Deviation
      const rand = Math.random();
      const isGood = rand > 0.25;
      const isDev = rand < 0.10;

      let crispness: number;
      let hardness: number;
      let status: 'NORMAL' | 'WARNING' | 'DEVIATION';

      if (isDev) {
        crispness = Math.round(58 + Math.random() * 12);
        hardness = Math.round((randomDish.baseHardness + 11.5 + Math.random() * 4) * 10) / 10;
        status = 'DEVIATION';
      } else if (!isGood) {
        crispness = Math.round(72 + Math.random() * 8);
        hardness = Math.round((randomDish.baseHardness - 6.5 + Math.random() * 3) * 10) / 10;
        status = 'WARNING';
      } else {
        crispness = Math.round(86 + Math.random() * 11);
        hardness = Math.round((randomDish.baseHardness + (Math.random() * 2 - 1)) * 10) / 10;
        status = 'NORMAL';
      }

      const simulatedRecord: BatchRecord = {
        id: `BATCH-IOT-${Math.floor(1000 + Math.random() * 9000)}`,
        branchId: randomBranch.id,
        branchName: randomBranch.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        sampleName: `${randomDish.name} (Live IoT)`,
        category: randomDish.cat,
        crispnessScore: crispness,
        hardnessN: hardness,
        deltaE: Math.round((2.0 + Math.random() * 4.0) * 10) / 10,
        df: Math.round((1.78 + Math.random() * 0.12) * 100) / 100,
        browningIndex: Math.round((55 + Math.random() * 15) * 10) / 10,
        tempC: Math.round((75 + Math.random() * 6) * 10) / 10,
        status,
        operator: 'AIoT Telemetry Sensor'
      };

      handleAddBatchRecord(simulatedRecord);
    }, 7500); // Live real-time stream every 7.5s

    return () => clearInterval(interval);
  }, [isLiveStreaming, branches]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 selection:bg-teal-500 selection:text-slate-950 font-sans print:bg-white print:text-slate-900 print:min-h-0">
      
      {/* Floating Real-Time Toast Notifications */}
      <RealtimeToastContainer 
        toast={activeToast}
        onClose={() => setActiveToast(null)}
        onView={() => setActiveTab('dashboard')}
      />

      {/* Real-Time Notification Center Drawer */}
      <NotificationDrawer 
        isOpen={showNotificationDrawer}
        onClose={() => setShowNotificationDrawer(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearNotifications}
        onViewDashboard={() => setActiveTab('dashboard')}
        branches={branches}
      />

      {/* Top Header */}
      <div className="print:hidden">
        <Header 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          branches={branches}
          selectedBranch={selectedBranchId}
          setSelectedBranch={setSelectedBranchId}
          isLiveStreaming={isLiveStreaming}
          setIsLiveStreaming={setIsLiveStreaming}
          hasDeviationAlert={hasDeviationAlert}
          unreadAlertsCount={unreadAlertsCount}
          onAlertClick={() => setShowNotificationDrawer(true)}
        />
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 print:p-0 print:m-0 print:max-w-none">
        {activeTab === 'dashboard' && (
          <QualityDashboard 
            branches={branches}
            selectedBranchId={selectedBranchId}
            setSelectedBranchId={setSelectedBranchId}
            batches={batches}
            onOpenScanner={() => setActiveTab('scanner')}
            showDeviationModal={showNotificationDrawer}
            setShowDeviationModal={setShowNotificationDrawer}
            onClearBatches={handleClearBatches}
            onResetDemoBatches={handleResetDemoBatches}
          />
        )}

        {activeTab === 'scanner' && (
          <MiniDomeSimulator 
            branches={branches}
            selectedBranchId={selectedBranchId}
            onAddBatchRecord={handleAddBatchRecord}
            onViewDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'roi' && (
          <RoiCalculator />
        )}
      </main>

      {/* Footer */}
      <div className="print:hidden">
        <Footer />
      </div>

    </div>
  );
};

export default App;

