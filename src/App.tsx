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

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

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

  // Real-Time Notification Trigger (for real user actions: export, clear, calibration)
  const handleNotify = (item: {
    type: 'NORMAL' | 'WARNING' | 'DEVIATION';
    title: string;
    message: string;
    score?: number;
    branchName?: string;
  }) => {
    const newItem: NotificationItem = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: item.type,
      title: item.title,
      message: item.message,
      timestamp: 'Baru saja',
      branchName: item.branchName,
      score: item.score,
      read: false
    };

    if (item.type === 'DEVIATION') {
      playDeviationAlert();
    } else if (item.type === 'WARNING') {
      playWarningChime();
    } else {
      playSuccessChime();
    }

    setNotifications(prev => [newItem, ...prev.slice(0, 29)]);
    setActiveToast(newItem);
  };

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
            onNotify={handleNotify}
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

