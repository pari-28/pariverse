
import React, { useState, useEffect, useMemo } from 'react';
import { ThemeMode } from '../types';
import { THEME_CONFIGS } from '../constants';
import { 
  query, 
  collection, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc,
  getFirestore
} from 'firebase/firestore';
import { resetAllAnalytics } from '../analyticsService';
import { useScrollLock } from '../hooks/useScrollLock';

interface AnalyticsProps {
  theme: ThemeMode;
  isAdmin: boolean;
  currentView?: 'main' | 'resumes' | 'analytics';
  onNavigate?: (view: 'main' | 'resumes' | 'analytics') => void;
  onViewsUpdate?: (views: number) => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ theme, isAdmin, currentView, onNavigate, onViewsUpdate }) => {
  const [dbData, setDbData] = useState<any>({
    total_views: 0,
    unique_visitors: 0,
    returning: 0,
    total_sessions: 0,
    device_desktop: 0,
    device_mobile: 0,
    device_tablet: 0,
    views_current_month: 0,
    views_last_month: 0,
    last_active: null
  });

  const [interactions, setInteractions] = useState<any>({});
  const [dailyTraffic, setDailyTraffic] = useState<any[]>([]);
  const [topContent, setTopContent] = useState<any>({});
  const [techStats, setTechStats] = useState<any>({});
  const [geoStats, setGeoStats] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const config = THEME_CONFIGS[theme] || THEME_CONFIGS['light'];
  const showAdminPanel = currentView === 'analytics';
  const isDark = theme !== 'light';

  // Admin access verification (Task 5)
  const hasAdminAccess = useMemo(() => {
    const { auth } = window as any;
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "";
    return isAdmin && auth?.currentUser?.email === adminEmail;
  }, [isAdmin]);

  const [shouldHide, setShouldHide] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (window.innerWidth < 1024) {
        setShouldHide(currentScrollY > lastScrollY && currentScrollY > 100);
      } else {
        setShouldHide(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    // Modular Firebase initialization
    const { firebase } = window as any;
    if (!firebase || !firebase.db) return;

    const db = firebase.db;
    
    // Graceful snapshot listeners with error handling (Task 4, 6)
    const unsubscribers: (() => void)[] = [];

    try {
      // 1. Main Stats
      unsubscribers.push(onSnapshot(doc(db, 'site_analytics', 'main_stats'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDbData(data);
          if (onViewsUpdate) onViewsUpdate(data.total_views || 0);
        }
      }, (err) => {
        console.error('Analytics Main Stats Error:', err);
        setError('Analytics temporarily unavailable');
      }));

      // 2. Interactions
      unsubscribers.push(onSnapshot(doc(db, 'site_analytics', 'interactions'), (docSnap) => {
        if (docSnap.exists()) setInteractions(docSnap.data().counts || {});
      }, (err) => console.error('Analytics Interactions Error:', err)));

      // 3. Daily Traffic - Modular Query Syntax (Task 1)
      const qDaily = query(
        collection(db, 'daily_traffic'), 
        orderBy('date', 'desc'), 
        limit(7)
      );
      unsubscribers.push(onSnapshot(qDaily, (querySnap) => {
        const daily: any[] = [];
        querySnap.forEach((doc) => daily.push(doc.data()));
        setDailyTraffic(daily.reverse());
      }, (err) => console.error('Analytics Daily Traffic Error:', err)));

      // 4. Top Content
      unsubscribers.push(onSnapshot(doc(db, 'site_analytics', 'top_content'), (docSnap) => {
        if (docSnap.exists()) setTopContent(docSnap.data());
      }, (err) => console.error('Analytics Top Content Error:', err)));

      // 5. Tech Stats
      unsubscribers.push(onSnapshot(doc(db, 'site_analytics', 'tech'), (docSnap) => {
        if (docSnap.exists()) setTechStats(docSnap.data());
      }, (err) => console.error('Analytics Tech Stats Error:', err)));

      // 6. Geo Stats
      unsubscribers.push(onSnapshot(doc(db, 'site_analytics', 'geo'), (docSnap) => {
        if (docSnap.exists()) setGeoStats(docSnap.data());
      }, (err) => console.error('Analytics Geo Stats Error:', err)));

    } catch (err) {
      console.error('Analytics Setup Error:', err);
      setError('Dashboard loading error');
    }

    return () => unsubscribers.forEach(unsub => unsub());
  }, [onViewsUpdate]);

  useScrollLock(showAdminPanel);

  useEffect(() => {
    if (showAdminPanel) {
      document.body.classList.add('analytics-active');
    } else {
      document.body.classList.remove('analytics-active');
    }
    return () => {
      document.body.classList.remove('analytics-active');
    };
  }, [showAdminPanel]);

  const stats = useMemo(() => {
    const current = dbData.views_current_month || 0;
    const last = dbData.views_last_month || 0;
    const growth = last === 0 ? 0 : Math.round(((current - last) / last) * 100);
    return {
      growthRate: growth,
      growthColor: growth >= 0 ? 'text-emerald-400' : 'text-red-400'
    };
  }, [dbData]);

  const handleOpenDashboard = () => onNavigate?.('analytics');
  const handleCloseDashboard = () => onNavigate?.('main');

  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  const handleResetClick = () => {
    console.log("[Analytics] Reset button clicked");
    setShowResetConfirm(true);
  };

  const handleResetCancel = () => {
    console.log("[Analytics] Reset cancelled by user");
    setShowResetConfirm(false);
  };

  const executeReset = async () => {
    console.log("[Analytics] Optimistic reset starting...");
    
    // 1. Close modal and show initial toast immediately
    setShowResetConfirm(false);
    setResetStatus("Analytics reset started...");
    
    // 2. Optimistic Update: Immediately zero out the UI state
    const emptyStats = {
      total_views: 0,
      unique_visitors: 0,
      returning: 0,
      total_sessions: 0,
      avg_session_duration: 0,
      device_desktop: 0,
      device_mobile: 0,
      device_tablet: 0,
      views_current_month: 0,
      views_last_month: 0
    };
    setDbData(prev => ({ ...prev, ...emptyStats }));
    
    // 3. Initiate background sync without blocking UI
    setIsResetting(true);
    
    // Fire and forget (almost) - we handle status separately
    resetAllAnalytics().then(success => {
      setIsResetting(false);
      if (success) {
        console.log("[Analytics] Reset synced to cloud successfully");
        setResetStatus("Analytics synced successfully ✅");
        // Clear status after 3 seconds
        setTimeout(() => setResetStatus(null), 3000);
      } else {
        console.error("[Analytics] Background sync failed or partially failed");
        setResetStatus("Sync partially failed ⚠️");
        setTimeout(() => setResetStatus(null), 5000);
      }
    }).catch(err => {
      setIsResetting(false);
      console.error("[Analytics] Background error:", err);
      setResetStatus("Sync Error ❌");
      setTimeout(() => setResetStatus(null), 5000);
    });
  };

  return (
    <>
      <div className={`fixed top-6 lg:top-4 left-6 lg:left-4 z-[60] hidden lg:flex flex-col items-start gap-3 transition-all duration-500 pointer-events-none analytics-ui ${
        shouldHide ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}>
        <div className={`text-[10px] font-bold uppercase tracking-widest opacity-40 py-2 lg:py-1 px-4 lg:px-2 rounded-full border transition-all duration-500 hover:opacity-100 pointer-events-auto ${isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-black/5'}`}>
          👀 {(dbData.total_views || 0).toLocaleString()} views | 👤 {(dbData.unique_visitors || 0).toLocaleString()} visitors
        </div>
        {hasAdminAccess && (
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={handleOpenDashboard} 
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-xl transition-all hover:scale-110 active:scale-95 border ${config.border} bg-indigo-500 text-white animate-in slide-in-from-left-4 fade-in duration-300`} 
              title="Open Analytics"
            >
              📈
            </button>
          </div>
        )}
      </div>

      {hasAdminAccess && showAdminPanel && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md detail-view-container" onClick={handleCloseDashboard} />
          <div className={`relative w-full lg:max-w-6xl max-h-[95vh] lg:max-h-[90vh] overflow-hidden rounded-[2rem] lg:rounded-[3.5rem] border shadow-2xl animate-in zoom-in-95 fade-in duration-300 ${config.card} text-white flex flex-col`}>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12 custom-scrollbar">
              {error ? (
                <div className="flex flex-col items-center justify-center py-10 lg:py-20 text-center">
                  <span className="text-4xl mb-4">⚠️</span>
                  <p className="text-lg font-bold opacity-60">{error}</p>
                  <button onClick={handleCloseDashboard} className="mt-8 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold">Return to Dashboard</button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row justify-between items-start mb-8 lg:mb-10 gap-4">
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-2">Live Pulse Analytics</h3>
                      <p className="text-sm opacity-50 font-medium whitespace-nowrap">Real-time database intelligence</p>
                    </div>
                    <div className="flex gap-3 relative">
                      {resetStatus && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-300 whitespace-nowrap z-[2200]">
                          {resetStatus}
                        </div>
                      )}
                      <button 
                        onClick={handleResetClick}
                        disabled={isResetting}
                        className={`px-5 py-2 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap flex items-center gap-2 ${isResetting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isResetting ? 'Syncing...' : (
                          <>
                            <span className="text-xs">🧹</span>
                            Reset Stats
                          </>
                        )}
                      </button>
                      <button 
                        onClick={handleCloseDashboard} 
                        className="px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                      >
                        Close Dashboard
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 lg:mb-10">
                  {[
                    { label: 'Total Views', value: (dbData.total_views || 0).toLocaleString(), icon: '🔥' }, 
                    { label: 'Uniques', value: (dbData.unique_visitors || 0).toLocaleString(), icon: '👤' }, 
                    { label: 'Returning', value: (dbData.returning || 0).toLocaleString(), icon: '🔄' },
                    { label: 'Sessions', value: (dbData.total_sessions || 0).toLocaleString(), icon: '⚡' },
                    { label: 'Desktop', value: (dbData.device_desktop || 0), icon: '💻' },
                    { label: 'Mobile', value: (dbData.device_mobile || 0), icon: '📱' },
                    { label: 'Monthly Growth', value: `${stats.growthRate >= 0 ? '+' : ''}${stats.growthRate}%`, icon: '📈', customClass: stats.growthColor },
                    { label: 'Daily Peak', value: dailyTraffic.length > 0 ? Math.max(...dailyTraffic.map(d => d.views)).toLocaleString() : '-', icon: '🎯' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 p-6 md:p-8 rounded-[2rem] flex flex-col items-center text-center transition-all hover:bg-white/10">
                      <span className="text-2xl mb-2">{stat.icon}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">{stat.label}</span>
                      <span className={`text-xl font-bold truncate w-full px-1 ${stat.customClass || ''}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-8 mb-10">
                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 flex items-center justify-between">
                      <span>Interaction Pulse</span>
                      <span className="text-indigo-400">Total Interactions: {Object.values(interactions).reduce((a: any, b: any) => a + (Number(b) || 0), 0) as any}</span>
                    </h4>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {Object.entries(interactions).sort((a: any, b: any) => b[1] - a[1]).map(([name, count]: any) => (
                        <div key={name} className="flex items-center justify-between group">
                          <span className="text-xs font-bold opacity-60 group-hover:opacity-100 transition-opacity capitalize">{name.replace(/_/g, ' ')}</span>
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full" 
                                style={{ width: `${Math.min(100, (count / (dbData.total_views || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-black min-w-[30px] text-right">{(count || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      {Object.keys(interactions).length === 0 && <p className="text-xs opacity-40 text-center py-10">No interaction data yet</p>}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 font-bold">Top Content Performance</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {['project', 'profile'].map(type => (
                        <div key={type} className="space-y-3">
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-30">{type}s</p>
                          {Object.entries(topContent[`${type}s`] || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([id, count]: any) => (
                            <div key={id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                               <span className="text-xs font-bold truncate max-w-[150px]">{id}</span>
                               <span className="text-xs font-black text-indigo-400">{count} clicks</span>
                            </div>
                          ))}
                          {(!topContent[`${type}s`] || Object.keys(topContent[`${type}s`]).length === 0) && <p className="text-[10px] opacity-20">Waiting for data...</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* New Deep Intelligence Row */}
                <div className="grid lg:grid-cols-3 gap-8 mb-10">
                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">Operating Systems</h4>
                    <div className="space-y-4">
                      {Object.entries(techStats.os || {}).sort((a: any, b: any) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([os, count]: any) => (
                        <div key={os} className="flex items-center justify-between">
                          <span className="text-[11px] font-bold opacity-60">{os}</span>
                          <span className="text-[11px] font-black text-indigo-400">{count}</span>
                        </div>
                      ))}
                      {!techStats.os && <p className="text-[10px] opacity-20">Gathering OS data...</p>}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">Browser Usage</h4>
                    <div className="space-y-4">
                      {Object.entries(techStats.browsers || {}).sort((a: any, b: any) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([browser, count]: any) => (
                        <div key={browser} className="flex items-center justify-between">
                          <span className="text-[11px] font-bold opacity-60">{browser}</span>
                          <span className="text-[11px] font-black text-emerald-400">{count}</span>
                        </div>
                      ))}
                      {!techStats.browsers && <p className="text-[10px] opacity-20">Gathering browser data...</p>}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">Geographical Reach</h4>
                    <div className="space-y-4">
                      {Object.entries(geoStats.timezones || {}).sort((a: any, b: any) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([tz, count]: any) => (
                        <div key={tz} className="flex items-center justify-between">
                          <span className="text-[11px] font-bold opacity-60 truncate max-w-[140px]">{tz.replace(/_/g, '/')}</span>
                          <span className="text-[11px] font-black text-amber-400">{count}</span>
                        </div>
                      ))}
                      {!geoStats.timezones && <p className="text-[10px] opacity-20">Gathering geo data...</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 overflow-hidden">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    Live Network Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 opacity-70 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-40">Persistence Mode</span>
                      <span className="text-emerald-400 font-bold tracking-widest">REALTIME_SNAPSHOT</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-40">Last Activity</span>
                      <span className="font-bold">
                        {dbData.last_active?.seconds ? new Date(dbData.last_active.seconds * 1000).toLocaleString() : 'Syncing...'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-40">Data Integrity</span>
                      <span className="font-mono text-[10px] opacity-60">Verified Firestore v2</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-40">Traffic Sources</span>
                      <span className="font-bold text-indigo-400">ACTIVE</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            </div>

            {/* Custom Reset Confirmation Modal */}
            {showResetConfirm && (
              <div className="absolute inset-0 z-[2100] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleResetCancel} />
                <div className="relative w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 bg-[#161618] shadow-2xl animate-in zoom-in-95 duration-300 text-center">
                  <h4 className="text-xl font-bold mb-3">Clear Analytics?</h4>
                  <p className="text-sm opacity-60 leading-relaxed mb-8">
                    Are you sure you want to reset all analytics data? This action is permanent and will clear all visitor counts, interaction history, and live stats.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={executeReset}
                      className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 transition-all font-bold text-sm"
                    >
                      Confirm Reset
                    </button>
                    <button 
                      onClick={handleResetCancel}
                      className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-bold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Analytics;
