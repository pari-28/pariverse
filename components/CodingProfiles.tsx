
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { ThemeMode, CodingProfile } from '../types';
import { THEME_CONFIGS } from '../constants';
import { trackEvent } from '../analyticsService';
import DeleteConfirmModal from './DeleteConfirmModal';
import { useScrollLock } from '../hooks/useScrollLock';

// --- FRONTEND DATA FETCHERS ---

/**
 * Validates if the handle string is safe for API requests.
 */
function isValidHandle(handle: string): boolean {
  if (!handle || handle.trim().length === 0) return false;
  // Basic alphanumeric + underscores/hyphens check (most platforms follow this)
  return /^[a-zA-Z0-9\-_]+$/.test(handle.trim());
}

/**
 * Extracts and cleans handle from platform URLs.
 */
function extractHandle(link: string, fallback: string): string {
  if (!link || typeof link !== 'string' || link.trim() === '') return fallback;
  try {
    const cleaned = link.trim();
    // Handle URLs or direct handles
    if (cleaned.startsWith('http')) {
      const url = new URL(cleaned);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      // Special cases for common platforms
      if (cleaned.includes('leetcode.com')) {
        const uIdx = pathParts.indexOf('u');
        if (uIdx !== -1 && pathParts[uIdx + 1]) return pathParts[uIdx + 1];
      }
      
      const last = pathParts.pop();
      return last || fallback;
    }
    return cleaned;
  } catch (e) {
    return link.split('/').filter(Boolean).pop() || fallback;
  }
}

// --- UNIVERSAL PLATFORM ARCHITECTURE ---

interface PlatformStats {
  lastSynced: string;
  history?: Record<string, number>;
  [key: string]: any;
}

interface PlatformHandler {
  id: string;
  name: string;
  isSupported: boolean;
  fetcher: (handle: string) => Promise<PlatformStats | null>;
  getDisplayStats: (stats: any) => string;
}

/**
 * Universal registry of platform handlers.
 * Adding a new platform for future sync only requires adding a handler here.
 */
const PLATFORM_HANDLERS: Record<string, PlatformHandler> = {
  github: {
    id: 'github',
    name: 'GitHub',
    isSupported: true,
    fetcher: fetchGitHubStats,
    getDisplayStats: (stats) => `${stats.total_repos || 0} Repos`
  },
  leetcode: {
    id: 'leetcode',
    name: 'LeetCode',
    isSupported: true,
    fetcher: fetchLeetCodeStats,
    getDisplayStats: (stats) => `${stats.total_solved || 0} Solved`
  },
  codeforces: {
    id: 'codeforces',
    name: 'Codeforces',
    isSupported: true,
    fetcher: fetchCodeforcesStats,
    getDisplayStats: (stats) => `${stats.rank || 'Unrated'} (${stats.rating || 0})`
  },
  // Future Platforms Scaffolding
  hackerrank: {
    id: 'hackerrank',
    name: 'HackerRank',
    isSupported: false,
    fetcher: async () => null,
    getDisplayStats: (stats) => stats.solved || '0'
  },
  codechef: {
    id: 'codechef',
    name: 'CodeChef',
    isSupported: false,
    fetcher: async () => null,
    getDisplayStats: (stats) => stats.rating || '0'
  },
  geeksforgeeks: {
    id: 'geeksforgeeks',
    name: 'GeeksforGeeks',
    isSupported: false,
    fetcher: async () => null,
    getDisplayStats: (stats) => stats.solved || '0'
  }
};

async function fetchGitHubStats(username: string) {
  const handle = username.trim();
  if (!isValidHandle(handle)) {
    console.warn(`[GitHub] Invalid handle: ${handle}`);
    return null;
  }

  const url = `https://api.github.com/users/${handle}`;
  const contribUrl = `https://github-contributions-api.deno.dev/${handle}.json`;
  console.log(`[GitHub] Fetching stats and contributions for ${handle}`);
  
  try {
    const [statsResp, contribResp] = await Promise.all([
      axios.get(url, { timeout: 10000 }),
      axios.get(contribUrl, { timeout: 10000 }).catch(() => ({ data: { contributions: [] } }))
    ]);

    // Process contributions into a flat map of date -> count
    const history: Record<string, number> = {};
    let totalCommits = 0;
    if (contribResp.data?.contributions) {
      contribResp.data.contributions.forEach((week: any[]) => {
        week.forEach((day: any) => {
          if (day.date && day.contributionCount > 0) {
            history[day.date] = day.contributionCount;
            totalCommits += day.contributionCount;
          }
        });
      });
    }

    return {
      total_repos: statsResp.data.public_repos || 0,
      followers: statsResp.data.followers || 0,
      following: statsResp.data.following || 0,
      total_stars: 0,
      total_commits: totalCommits,
      history,
      lastSynced: new Date().toISOString()
    };
  } catch (e: any) {
    console.error(`[GitHub] Fetch failed for ${handle}:`, e.message);
    return null;
  }
}

async function fetchLeetCodeStats(username: string) {
  const handle = username.trim();
  if (!isValidHandle(handle)) {
    console.warn(`[LeetCode] Invalid or empty handle: ${handle}`);
    return null;
  }

  const baseUrl = `https://alfa-leetcode-api.onrender.com/${handle}`;
  
  try {
    console.log(`[LeetCode] Syncing via Alfa API: ${handle}`);
    // Fetch profile, solved, and calendar in parallel
    const [profileResp, solvedResp, calendarResp] = await Promise.all([
      axios.get(baseUrl, { timeout: 10000 }).catch(() => ({ data: {} })),
      axios.get(`${baseUrl}/solved`, { timeout: 10000 }).catch(() => ({ data: {} })),
      axios.get(`${baseUrl}/calendar`, { timeout: 10000 }).catch(() => ({ data: {} }))
    ]);

    const profile = profileResp.data || {};
    const solved = solvedResp.data || {};
    const calendarData = calendarResp.data || {};

    // Process calendar data
    const history: Record<string, number> = {};
    if (calendarData.submissionCalendar) {
      try {
        const subCal = JSON.parse(calendarData.submissionCalendar);
        Object.entries(subCal).forEach(([timestamp, count]) => {
          const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];
          history[date] = (history[date] || 0) + (count as number);
        });
      } catch (err) {
        console.error("[LeetCode] Failed to parse submission calendar", err);
      }
    }

    // Check if we got ANY useful data
    if (solved.solvedProblem === undefined && profile.ranking === undefined) {
      console.warn(`[LeetCode] Alfa API returned no metrics for ${handle}`);
      return null;
    }

    return {
      total_solved: solved.solvedProblem || 0,
      easy_solved: solved.easySolved || 0,
      medium_solved: solved.mediumSolved || 0,
      hard_solved: solved.hardSolved || 0,
      ranking: profile.ranking || 0,
      contest_rating: 0, 
      history,
      lastSynced: new Date().toISOString()
    };
  } catch (e: any) {
    console.error(`[LeetCode] Fetch failed for ${handle}:`, e.message);
    return null;
  }
}

async function fetchCodeforcesStats(username: string) {
  const handleOrig = username?.trim();
  // Skip if empty or invalid to prevent spamming CF API with bad requests (400 errors)
  if (!handleOrig || !isValidHandle(handleOrig)) {
    return null;
  }

  const handle = encodeURIComponent(handleOrig);
  const url = `https://codeforces.com/api/user.info?handles=${handle}`;
  
  try {
    const resp = await axios.get(url, { timeout: 10000 });
    if (resp.data.status === 'OK') {
      const info = resp.data.result[0];
      return {
        rating: info.rating || 0,
        max_rating: info.maxRating || 0,
        rank: info.rank || 'Unrated',
        max_rank: info.maxRank || 'Unrated',
        lastOnline: info.lastOnlineTimeSeconds ? new Date(info.lastOnlineTimeSeconds * 1000).toISOString() : new Date().toISOString(),
        lastSynced: new Date().toISOString()
      };
    }
    return null;
  } catch (e: any) {
    if (e.response?.status === 400) {
      console.warn(`[Codeforces] Handle not found (400): ${handleOrig}`);
    } else {
      console.error(`[Codeforces] Fetch failed for ${handleOrig}:`, e.message);
    }
    return null;
  }
}

interface Props {
  theme: ThemeMode;
  isAdmin: boolean;
  profiles: CodingProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<CodingProfile[]>>;
  title: string;
  subtext: string;
  onTitleUpdate: () => void;
  onNavigate: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  liveStats?: any;
  contact: any;
}

const CodingProfiles: React.FC<Props> = ({ theme, isAdmin, profiles, setProfiles, title, subtext, onTitleUpdate, onNavigate, showToast, liveStats, contact }) => {
  const config = THEME_CONFIGS[theme];
  const [isEditing, setIsEditing] = useState<CodingProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ platform: string; status: 'pending' | 'success' | 'error' }[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // FIX: state for managing single reusable tooltip element
  const [tooltip, setTooltip] = useState<{ x: number, y: number, content: string, visible: boolean }>({ 
    x: 0, y: 0, content: '', visible: false 
  });

  const isLightTheme = theme === 'light';
  const syncEnabled = !!liveStats?.sync_enabled;

  const dividerBg = config.accent.includes('gradient') 
    ? config.accent.replace('text-transparent', '').replace('bg-clip-text', '')
    : config.accent.replace('text-', 'bg-');

  const [selectedDetail, setSelectedDetail] = useState<CodingProfile | null>(null);

  useScrollLock(!!selectedDetail || !!isEditing || !!deletingId);

  const stats = useMemo(() => {
    // Priority: Sync ON + Live Data > Manual
    if (syncEnabled && liveStats?.platforms) {
      return liveStats.platforms;
    }
    return null;
  }, [syncEnabled, liveStats]);

  const getSolvedText = (p: CodingProfile) => {
    const platformKey = p.name.toLowerCase();
    const platformStats = stats?.[platformKey];
    
    if (platformStats) {
      const handler = PLATFORM_HANDLERS[platformKey];
      if (handler) {
        return handler.getDisplayStats(platformStats);
      }
    }
    return p.solved || '0';
  };

  const getStreakText = (p: CodingProfile) => {
    const platformKey = p.name.toLowerCase();
    const platformStats = stats?.[platformKey];
    
    if (platformStats) {
      if (platformKey === 'leetcode') return `${platformStats.medium_solved || 0} Medium`;
      if (platformKey === 'github') return `${platformStats.total_commits || 0} Commits`;
      if (platformKey === 'codeforces') return `Max: ${platformStats.max_rank || 'N/A'}`;
    }
    return p.streak || 'Active';
  };

  const handleCardClick = (p: CodingProfile) => {
    setSelectedDetail(p);
    trackEvent(`profile_click_${p.name.toLowerCase()}`, { type: 'profile', id: p.name });
  };

  const handleAdd = () => {
    setIsEditing({ id: Math.random().toString(36).substr(2, 9), name: '', icon: '🧠', solved: '', streak: '', link: '' });
  };

  const handleEdit = (p: CodingProfile, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(p);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      setProfiles(prev => prev.filter(p => p.id !== deletingId));
      setDeletingId(null);
    }
  };

  const handleSave = () => {
    if (!isEditing) return;
    setProfiles(prev => {
      const exists = prev.find(p => p.id === isEditing.id);
      if (exists) return prev.map(p => p.id === isEditing.id ? isEditing : p);
      return [...prev, isEditing];
    });
    setIsEditing(null);
  };

  const totalSolvedCount = useMemo(() => {
    return profiles.reduce((acc, p) => {
      const text = getSolvedText(p);
      const count = parseInt(text.replace(/\D/g, '')) || 0;
      return acc + count;
    }, 0);
  }, [profiles, liveStats]);

  // FIX: Include intensity and position in activityData for tooltip logic
  const activityData = useMemo(() => {
    // If we have live history from Firebase AND sync is ON, use it
    const history = (syncEnabled && liveStats?.history) ? liveStats.history : {};
    const today = new Date();
    
    return Array.from({ length: 52 }).map((_, weekIdx) => {
      // Logic for tapered/irregular building shape visibility
      let visibleDaysCount = 7;
      if (weekIdx > 48) visibleDaysCount = 1;
      else if (weekIdx > 40) visibleDaysCount = 3;
      else if (weekIdx > 25) visibleDaysCount = 5;

      const weekDays = Array.from({ length: 7 }).map((_, dayIdx) => {
        const isVisible = Math.abs(dayIdx - 3) <= (visibleDaysCount - 1) / 2;
        
        // Calculate the specific date for this block relative to today
        const totalDayOffset = (51 - weekIdx) * 7 + (6 - dayIdx);
        const cellDate = new Date(today);
        cellDate.setDate(today.getDate() - totalDayOffset);
        const dateKey = cellDate.toISOString().split('T')[0];
        
        // Use history count or fallback to pattern if sync is disabled
        const count = history[dateKey] || 0;
        const seedValue = (weekIdx * 7 + dayIdx + (parseInt(totalSolvedCount as any) || 0)) % 100 / 100;
        const intensity = syncEnabled ? (count / 10) : seedValue;
        
        let color = isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
        let stroke = isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
        let glow = false;

        if (intensity > 0.85) {
          color = isLightTheme ? '#0ea5e9' : 'rgba(255, 255, 255, 0.9)';
          stroke = isLightTheme ? '#0284c7' : '#fff';
          glow = !isLightTheme && syncEnabled;
        } else if (intensity > 0.4) {
          color = isLightTheme ? '#60a5fa' : '#22d3ee';
          stroke = isLightTheme ? '#3b82f6' : '#67e8f9';
        } else if (intensity > 0.1) {
          color = isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(148, 163, 184, 0.3)';
          stroke = isLightTheme ? 'rgba(0,0,0,0.15)' : 'rgba(148, 163, 184, 0.5)';
        }

        return { 
          isVisible, color, stroke, glow, intensity,
          week: 52 - weekIdx, day: dayIdx + 1, date: dateKey, count
        };
      });
      return weekDays;
    });
  }, [totalSolvedCount, liveStats, syncEnabled, isLightTheme]);

  // FIX: explain analyzed data per block with interpretation text
  const getTooltipContent = (day: any) => {
    const level = day.intensity > 0.85 ? "Maximum" : day.intensity > 0.4 ? "High" : day.intensity > 0.1 ? "Active" : "Quiet";
    const interpretation = day.count > 0 ? `${day.count} contributions on this day` : "No recorded activity";
    const platforms = syncEnabled ? "Synced Data" : "Mock Analytics";
    
    return `
      <div class="flex flex-col gap-1 min-w-[120px]">
        <div class="flex items-center justify-between gap-4">
          <span class="text-[10px] font-black uppercase tracking-widest opacity-50">${day.date}</span>
          <span class="text-[9px] font-bold opacity-40">L${level}</span>
        </div>
        <div class="text-xs font-bold">${interpretation}</div>
        <div class="text-[9px] opacity-40 uppercase tracking-tighter mt-1">Source: ${platforms}</div>
      </div>
    `;
  };

  const streakStats = useMemo(() => {
    // If sync disabled, use manual profile aggregation
    if (!syncEnabled || !liveStats?.history) {
      const manualLongest = Math.max(...profiles.map(p => parseInt(p.streak as any) || 0), 0);
      return { 
        current: manualLongest > 0 ? 1 : 0, // Simplified fallback
        longest: manualLongest,
        avg: (parseInt(totalSolvedCount as any) / 100).toFixed(1)
      };
    }

    const history = liveStats.history;
    const dates = Object.keys(history).sort();
    if (dates.length === 0) return { current: 0, longest: 0, avg: 0 };

    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    let totalEvents = 0;
    
    // Calculate stats over the last 365 days
    const checkDate = new Date();
    for (let i = 0; i < 365; i++) {
        const dKey = checkDate.toISOString().split('T')[0];
        const count = history[dKey] || 0;
        totalEvents += count;
        
        if (count > 0) {
            tempStreak++;
            if (tempStreak > longest) longest = tempStreak;
            if (i === current) current++;
        } else {
            tempStreak = 0;
        }
        checkDate.setDate(checkDate.getDate() - 1);
    }

    return { 
        current, 
        longest, 
        avg: (totalEvents / 365).toFixed(1) 
    };
  }, [liveStats]);

  const horizontalHeatmapData = useMemo(() => {
    const history = (syncEnabled && liveStats?.history) ? liveStats.history : {};
    const today = new Date();
    const data = [];
    
    for (let w = 0; w < 13; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const offset = (12 - w) * 7 + (6 - d);
        const cellDate = new Date(today);
        cellDate.setDate(today.getDate() - offset);
        const dKey = cellDate.toISOString().split('T')[0];
        
        let count = history[dKey] || 0;
        // Mock fallback pattern if sync is off
        if (!syncEnabled) {
          const seed = (w * 7 + d + (parseInt(totalSolvedCount as any) || 0)) % 7;
          count = seed > 4 ? seed : 0;
        }
        
        week.push({ count, date: dKey });
      }
      data.push(week);
    }
    return data;
  }, [liveStats, syncEnabled, totalSolvedCount]);

  const handleMouseEnter = (day: any, e: React.MouseEvent) => {
    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      content: getTooltipContent(day)
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const toggleSync = async () => {
    const { firebase } = window as any;
    if (!firebase || !firebase.db) return;

    const newSyncState = !syncEnabled;
    setIsSyncing(true);

    try {
      // 1. Update Global Settings
      const docRef = firebase.doc(firebase.db, 'coding_stats', 'live_data');
      await firebase.setDoc(docRef, { sync_enabled: newSyncState }, { merge: true });

      // 2. Update User Profile Settings
      const userId = firebase.auth?.currentUser?.uid;
      if (userId) {
        await firebase.setDoc(firebase.doc(firebase.db, 'users', userId, 'settings', 'autoSync'), {
          enabled: newSyncState,
          updatedAt: firebase.serverTimestamp()
        }, { merge: true });
      }

      // 3. Trigger immediate sync if turned ON
      if (newSyncState) {
        await handleAutoSync();
      } else {
        showToast("Auto-Sync Disabled", "info");
      }
    } catch (error) {
      console.error("Sync toggle failed:", error);
      showToast("Failed to update sync mode.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAutoSync = async () => {
    const { firebase } = window as any;
    if (!firebase || !firebase.db) {
      showToast("Firebase not initialized", "error");
      return;
    }

    // 1. Identify active and supported platforms from contact data
    const syncTasks = Object.values(PLATFORM_HANDLERS)
      .map(handler => {
        // Find handle in contact (handle special cases like cfHandle)
        let link = contact[handler.id];
        if (handler.id === 'codeforces') link = contact.codeforces || contact.cfHandle;
        
        const handle = extractHandle(link, '');
        return { handler, handle };
      })
      .filter(task => task.handle && task.handler.isSupported);

    if (syncTasks.length === 0) {
      showToast("No active supported profiles found to sync.", "info");
      return;
    }

    console.log(`[Sync] Initiating auto-sync for ${syncTasks.length} platforms: ${syncTasks.map(t => t.handler.name).join(', ')}`);

    setSyncProgress(syncTasks.map(t => ({ platform: t.handler.name, status: 'pending' })));

    try {
      // 2. Fetch data in parallel for all supported platforms
      const results = await Promise.all(
        syncTasks.map(async (task) => {
          try {
            const data = await task.handler.fetcher(task.handle);
            return { handler: task.handler, data, status: data ? 'success' : 'error' };
          } catch (e) {
            console.error(`[Sync] ${task.handler.name} failed:`, e);
            return { handler: task.handler, data: null, status: 'error' };
          }
        })
      );

      const batch = firebase.writeBatch(firebase.db);
      let successCount = 0;
      const newProgress: { platform: string; status: 'pending' | 'success' | 'error' }[] = [];
      const combinedHistory: Record<string, number> = {};

      // 3. Process results and prepare Firestore updates
      results.forEach(res => {
        if (res.status === 'success' && res.data) {
          const { history, ...stats } = res.data;
          
          // Store basic stats in coding_profiles collection
          batch.set(firebase.doc(firebase.db, 'coding_profiles', res.handler.id), stats, { merge: true });
          
          // Merge history for the global contribution graph
          if (history) {
            Object.entries(history).forEach(([date, count]) => {
              combinedHistory[date] = (combinedHistory[date] || 0) + (count as number);
            });
          }
          
          successCount++;
          newProgress.push({ platform: res.handler.name, status: 'success' });
        } else {
          newProgress.push({ platform: res.handler.name, status: 'error' });
        }
      });

      if (successCount > 0) {
        // 4. Save combined history and last sync timestamp
        batch.set(firebase.doc(firebase.db, 'coding_stats', 'live_data'), {
          history: combinedHistory,
          lastSynced: firebase.serverTimestamp()
        }, { merge: true });
        
        await batch.commit();
        
        showToast(
          successCount === syncTasks.length 
            ? "Sync Successful!" 
            : `Sync Partial (${successCount}/${syncTasks.length} succeeded)`, 
          successCount === syncTasks.length ? "success" : "info"
        );
      } else {
        showToast("All sync requests failed. Check handles or API availability.", "error");
      }

      setSyncProgress(newProgress);
    } catch (error: any) {
      console.error("Auto-sync failed:", error);
      showToast(error.message || "Sync encountered a critical error.", "error");
    } finally {
      setTimeout(() => setSyncProgress([]), 5000); // Keep progress visible a bit longer
    }
  };

  return (
    <section id="coding-profiles" className="min-h-screen w-full py-12 flex flex-col justify-center relative">
      {/* FIX: Lightweight hover tooltip element positioned dynamically */}
      {tooltip.visible && (
        <div 
          className="fixed z-[9999] pointer-events-none transition-transform duration-75 ease-out"
          style={{ 
            left: 0, top: 0, 
            transform: `translate3d(${tooltip.x + 15}px, ${tooltip.y - 20}px, 0)` 
          }}
        >
          <div className={`p-3 rounded-xl border backdrop-blur-md shadow-2xl ${config.card} border-white/20`}
               dangerouslySetInnerHTML={{ __html: tooltip.content }} />
        </div>
      )}

      <div className="flex justify-between items-end mb-10 reveal max-w-5xl mx-auto w-full px-4 md:px-0">
        <div>
          <div className="flex items-center gap-3 relative">
            <h2 
              className={`text-3xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition-all ${config.accent}`}
              onClick={onNavigate}
            >
              {title}
            </h2>
            {isAdmin && (
              <button 
                onClick={onTitleUpdate}
                className="p-1 rounded bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/40 transition-colors text-[14px]"
              >
                ✎
              </button>
            )}
          </div>
          <div className={`w-24 h-[1px] my-4 opacity-30 ${dividerBg}`} />
          <p className={`text-sm opacity-60 font-medium ${isLightTheme ? 'text-slate-500' : ''}`}>
            {subtext} 
            {isAdmin && liveStats?.lastSynced && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] opacity-100">
                Last Synced: {new Date(liveStats.lastSynced?.seconds * 1000).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-4 items-center">
            <div className={`flex items-center gap-3 bg-white/5 p-1.5 pl-3 rounded-2xl border border-white/10 transition-all ${isSyncing ? 'pr-4 w-auto' : ''}`}>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Auto-Sync</span>
                {isSyncing && (
                   <div className="flex gap-1 mt-1">
                      {syncProgress.map((p, i) => (
                        <div key={i} title={p.platform} className={`w-2 h-2 rounded-full ${
                          p.status === 'success' ? 'bg-emerald-500' : 
                          p.status === 'error' ? 'bg-red-500' : 
                          'bg-indigo-500 animate-pulse'
                        }`} />
                      ))}
                   </div>
                )}
              </div>

              <button 
                onClick={toggleSync}
                disabled={isSyncing}
                className={`w-10 h-5 rounded-full relative transition-all ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''} ${
                  syncEnabled 
                  ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' 
                  : 'bg-emerald-500/10'
                }`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-lg transition-all ${syncEnabled ? 'left-6 bg-white' : 'left-1 bg-white/60'}`} />
              </button>
            </div>
            
            <button onClick={handleAdd} className="px-5 py-2.5 rounded-2xl bg-white text-black text-xs font-black tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl">
              + Add
            </button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10 max-w-5xl mx-auto w-full px-4 md:px-0">
        {profiles.map((p) => (
          <motion.div 
            key={p.id} 
            layoutId={`profile-${p.id}`}
            onClick={() => handleCardClick(p)}
            className={`p-4 rounded-2xl reveal flex items-center gap-3 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-white/20 group relative cursor-pointer ${config.card}`}
          >
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(p, e);
                  }} 
                  className="p-1.5 rounded bg-blue-500 text-white text-[10px] hover:bg-blue-600 transition-colors"
                >
                  ✏️
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id, e);
                  }} 
                  className="p-1.5 rounded bg-red-500 text-white text-[10px] hover:bg-red-600 transition-colors"
                >
                  🗑️
                </button>
              </div>
            )}
            <span className="text-3xl group-hover:scale-110 transition-transform">{p.icon}</span>
            <div>
              <h3 className={`text-base font-bold transition-colors ${isLightTheme ? 'group-hover:text-black text-black' : 'group-hover:text-indigo-400'}`}>{p.name}</h3>
              <p className={`text-[11px] opacity-60 ${isLightTheme ? 'text-slate-500' : ''}`}>Solved: {getSolvedText(p)}</p>
              <p className={`text-[11px] font-bold ${isLightTheme ? 'text-slate-600' : config.accent}`}>{getStreakText(p)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Burj Khalifa Activity Skyscraper */}
      <div className={`p-5 md:p-10 rounded-[3.5rem] reveal overflow-hidden ${config.card} border border-white/5 relative group/building max-w-5xl mx-auto w-full`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-50" />
        
        <h3 className={`text-base font-bold mb-8 flex items-center justify-center gap-3 relative z-10 ${isLightTheme ? 'text-black' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          Coding Architecture Log
        </h3>

        <div className="flex flex-col items-center justify-center relative z-10 w-full">
          <svg 
            width="100%" 
            height={850} 
            viewBox="0 0 140 850" 
            className="max-h-[600px] overflow-visible will-change-transform scale-[0.9] origin-top"
          >
            {/* VISUAL: Rounded 3D Depth Defs */}
            <defs>
              <linearGradient id="burjDepthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.01)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
              </linearGradient>
            </defs>

            {/* VISUAL: Rounded 3D depth layer behind blocks (Fake 3D Pillar) */}
            <g transform="translate(0, 50)" opacity="0.4">
               {/* Tapered Top Tier */}
               <rect x="60" y="0" width="16" height="45" rx="8" fill="url(#burjDepthGradient)" />
               {/* Tier 2 */}
               <rect x="40" y="45" width="56" height="120" rx="20" fill="url(#burjDepthGradient)" />
               {/* Tier 3 */}
               <rect x="20" y="165" width="96" height="225" rx="30" fill="url(#burjDepthGradient)" />
               {/* Tier 4 (Base) */}
               <rect x="0" y="390" width="136" height="390" rx="40" fill="url(#burjDepthGradient)" />
            </g>

            {/* The Pinnacle Spire */}
            <g opacity="0.6">
              <line x1="70" y1="0" x2="70" y2="40" stroke="#22d3ee" strokeWidth="2" strokeDasharray="2,2" />
              <circle cx="70" cy="0" r="4" fill="#22d3ee" className="animate-pulse">
                <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Building Body (Weeks/Floors) - VISUAL: blocks remain flat, depth applied in background only */}
            <g transform="translate(0, 50)">
              {activityData.slice().reverse().map((week, weekIdx) => (
                <g key={weekIdx} transform={`translate(0, ${weekIdx * 15})`}>
                  {week.map((day, dayIdx) => {
                    if (!day.isVisible) return null;
                    return (
                      <rect
                        key={dayIdx}
                        x={dayIdx * 20}
                        y="0"
                        width="16"
                        height="12"
                        rx="2"
                        fill={day.color}
                        stroke={day.stroke}
                        strokeWidth="1"
                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="transition-opacity duration-300 hover:opacity-80 cursor-help"
                        style={{
                          filter: day.glow ? 'drop-shadow(0 0 4px rgba(255,255,255,0.4))' : 'none'
                        }}
                      />
                    );
                  })}
                </g>
              ))}
            </g>
          </svg>

          <div className="w-48 h-2 bg-white/5 rounded-full mt-4 backdrop-blur-md border border-white/10" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20 mt-2">Structure of consistency</p>
        </div>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>

      {/* New Horizontal Consistency Graph Section */}
      <div className={`mt-6 p-8 md:p-10 rounded-[2.5rem] reveal overflow-hidden ${config.card} border border-white/5 relative max-w-5xl mx-auto w-full`}>
        <div className="flex justify-between items-start mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Consistency Graph</h3>
          <div className="flex items-center gap-8">
            <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest opacity-20 hidden md:flex">
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-20">Less</span>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-white/5 border border-white/10" />
                <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500/30" />
                <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500/60" />
                <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-20">More</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-center">
          {/* Stats Column */}
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-white/5 pb-4 group/stat">
              <span className="text-[11px] font-bold opacity-40 group-hover/stat:opacity-100 transition-opacity">Current Streak</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black ${isLightTheme ? 'text-black' : 'text-white'}`}>{streakStats.current}</span>
                <span className="text-[10px] font-bold opacity-40 uppercase">Days</span>
              </div>
            </div>
            <div className="flex justify-between items-end border-b border-white/5 pb-4 group/stat">
              <span className="text-[11px] font-bold opacity-40 group-hover/stat:opacity-100 transition-opacity">Longest Streak</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black ${isLightTheme ? 'text-black' : 'text-white'}`}>{streakStats.longest}</span>
                <span className="text-[10px] font-bold opacity-40 uppercase">Days</span>
              </div>
            </div>
            <div className="flex justify-between items-end border-b border-white/5 pb-4 group/stat">
              <span className="text-[11px] font-bold opacity-40 group-hover/stat:opacity-100 transition-opacity">Avg daily</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black ${isLightTheme ? 'text-black' : 'text-white'}`}>{streakStats.avg}</span>
                <span className="text-[10px] font-bold opacity-40 uppercase">Events</span>
              </div>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="flex flex-col items-center md:items-end">
            <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1 md:gap-2">
              {horizontalHeatmapData.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-2">
                  {week.map((day, dIdx) => {
                    const intensity = day.count > 10 ? 1 : day.count > 5 ? 0.6 : day.count > 0 ? 0.3 : 0;
                    return (
                      <div 
                        key={dIdx}
                        onMouseEnter={(e) => handleMouseEnter({
                          date: day.date,
                          count: day.count,
                          intensity: intensity
                        }, e)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className={`w-4 h-4 md:w-6 md:h-6 rounded-lg transition-all duration-300 cursor-help border ${
                          intensity >= 1 ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]' :
                          intensity >= 0.6 ? 'bg-indigo-500/60 border-indigo-500/40' :
                          intensity >= 0.3 ? 'bg-indigo-500/20 border-indigo-500/20' :
                          `bg-white/5 border-white/5 hover:border-white/20`
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            
            <div className="w-full flex justify-between mt-12 pt-8 border-t border-white/5">
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Real-time consistency insights</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Modal */}
      <AnimatePresence mode="wait">
        {selectedDetail && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDetail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md detail-view-container"
            />
            <motion.div 
              layoutId={`profile-${selectedDetail.id}`}
              className={`relative w-full max-w-2xl overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl ${config.card} flex flex-col max-h-[85vh] md:max-h-[80vh] animate-in zoom-in-95 duration-300 compact-modal`}
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setSelectedDetail(null)}
                  className="p-3 md:p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-90"
                  aria-label="Close analytics"
                >
                  <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/5 flex items-center justify-center text-4xl md:text-5xl border border-white/10 shrink-0">
                    {selectedDetail.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">{selectedDetail.name}</h2>
                    <p className={`text-sm font-bold ${isLightTheme ? 'text-white/95' : 'opacity-60'}`}>@{contact[selectedDetail.name.toLowerCase()]?.split('/').filter(Boolean).pop() || 'pari-28'}</p>
                    <div className="flex gap-2 mt-2 justify-center md:justify-start">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 border border-white/10 ${config.accent}`}>
                         {getStreakText(selectedDetail)}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {(() => {
                    const platform = selectedDetail.name.toLowerCase();
                    const live = stats?.[platform];
                    
                    if (platform === 'leetcode') {
                      return (
                        <>
                          {/* LeetCode stats */}
                          {[
                            { label: 'Total', value: live?.total_solved || selectedDetail.solved },
                            { label: 'Easy', value: live?.easy_solved || '-' },
                            { label: 'Medium', value: live?.medium_solved || '-' },
                            { label: 'Hard', value: live?.hard_solved || '-' },
                            { label: 'Rank', value: live?.ranking || 'N/A' },
                            { label: 'Rating', value: live?.contest_rating || 'N/A' },
                          ].map((s, i) => (
                            <div key={i} className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 group/stat">
                              <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'opacity-80 text-white/90' : 'opacity-40'} group-hover/stat:opacity-100 transition-opacity`}>{s.label}</p>
                              <p className="text-lg md:text-xl font-bold text-white mt-1">{s.value}</p>
                            </div>
                          ))}
                        </>
                      )
                    }
                    if (platform === 'github') {
                      return (
                        <>
                          {/* GitHub stats */}
                          {[
                            { label: 'Repos', value: live?.total_repos || selectedDetail.solved },
                            { label: 'Stars', value: live?.total_stars || '0' },
                            { label: 'Followers', value: live?.followers || '0' },
                            { label: 'Following', value: live?.following || '0' },
                            { label: 'Commits', value: live?.total_commits || '-' },
                            { label: 'Active', value: 'Live' },
                          ].map((s, i) => (
                            <div key={i} className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 group/stat">
                              <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'opacity-80 text-white/90' : 'opacity-40'} group-hover/stat:opacity-100 transition-opacity`}>{s.label}</p>
                              <p className="text-lg md:text-xl font-bold text-white mt-1">{s.value}</p>
                            </div>
                          ))}
                        </>
                      )
                    }
                    if (platform === 'codeforces') {
                      return (
                        <>
                          {/* Codeforces stats */}
                          {[
                            { label: 'Rating', value: live?.rating || selectedDetail.solved },
                            { label: 'Max Rating', value: live?.max_rating || '-' },
                            { label: 'Rank', value: live?.rank || '-' },
                            { label: 'Max Rank', value: live?.max_rank || '-' },
                          ].map((s, i) => (
                            <div key={i} className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 group/stat">
                              <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'opacity-80 text-white/90' : 'opacity-40'} group-hover/stat:opacity-100 transition-opacity`}>{s.label}</p>
                              <p className="text-lg md:text-xl font-bold text-white mt-1">{s.value}</p>
                            </div>
                          ))}
                        </>
                      )
                    }
                    return (
                      <>
                        <div className="col-span-1 md:col-span-2 p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5">
                          <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'opacity-80 text-white/90' : 'opacity-40'}`}>Problems Solved</p>
                          <p className="text-lg md:text-xl font-bold text-white mt-1">{selectedDetail.solved}</p>
                        </div>
                        <div className="col-span-1 md:col-span-2 p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5">
                          <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'opacity-80 text-white/90' : 'opacity-40'}`}>Performance</p>
                          <p className="text-lg md:text-xl font-bold text-white mt-1">{selectedDetail.streak}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {isAdmin && (
                  <div className="pt-8 border-t border-white/10 space-y-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <h4 className={`text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'opacity-80 text-white/90' : 'opacity-40'}`}>Admin Intelligence</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDetail(null);
                            handleEdit(selectedDetail, e as any);
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-[10px] font-black hover:bg-blue-500/30 transition-all active:scale-95"
                        >
                          Manual Override
                        </button>
                        <button 
                          onClick={handleAutoSync}
                          disabled={isSyncing}
                          className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-[10px] font-black hover:bg-emerald-500/30 transition-all disabled:opacity-50 active:scale-95"
                        >
                          Trigger Sync
                        </button>
                      </div>
                    </div>
                    {liveStats?.lastSynced && (
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className={`text-[10px] font-medium ${isLightTheme ? 'opacity-90 text-white/80' : 'opacity-60'}`}>Last API Response</span>
                        <span className="text-[10px] font-bold text-indigo-400">{new Date(liveStats.lastSynced.seconds * 1000).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8 pt-0 flex gap-4 shrink-0 bg-gradient-to-t from-black/10 to-transparent">
                <a 
                  href={selectedDetail.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] text-center transition-all ${config.button} text-white shadow-xl hover:scale-[1.02] active:scale-95`}
                >
                  Open Full Profile
                </a>
                <button 
                  onClick={() => setSelectedDetail(null)}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white active:scale-95"
                >
                  Close Analytics
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isEditing && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm detail-view-container" onClick={() => setIsEditing(null)} />
          <div className={`relative w-full max-w-lg rounded-[2rem] border shadow-2xl ${config.card} text-white flex flex-col max-h-[85vh] md:max-h-[80vh] overflow-hidden compact-modal`}>
            <div className="p-6 md:p-8 pb-0 shrink-0 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Edit Profile</h3>
              <button 
                onClick={() => setIsEditing(null)} 
                className="p-2 rounded-full hover:bg-white/10 opacity-70 lg:hidden transition-all active:scale-90"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">Icon</label>
                  <input className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-center text-2xl text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.icon} onChange={e => setIsEditing({...isEditing, icon: e.target.value})} />
                </div>
                <div className="col-span-3">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">Platform Name</label>
                  <input className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.name} onChange={e => setIsEditing({...isEditing, name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">Problems Solved</label>
                <input className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.solved} onChange={e => setIsEditing({...isEditing, solved: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">Streak / Achievement</label>
                <input className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.streak} onChange={e => setIsEditing({...isEditing, streak: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">Profile URL</label>
                <input className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.link} onChange={e => setIsEditing({...isEditing, link: e.target.value})} />
              </div>
            </div>
            
            <div className="p-6 md:p-8 pt-4 border-t border-white/10 shrink-0 flex gap-4">
              <button onClick={handleSave} className={`flex-1 py-3 rounded-xl font-bold ${config.button} text-white active:scale-95 transition-all`}>Save</button>
              <button onClick={() => setIsEditing(null)} className="flex-1 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white active:scale-95 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={!!deletingId}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
        title="Delete Profile?"
        description="Are you sure you want to delete this coding profile? This action cannot be undone."
        config={config}
      />
    </section>
  );
};

export default CodingProfiles;
