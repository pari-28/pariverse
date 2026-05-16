import { 
  getFirestore, 
  doc, 
  updateDoc, 
  setDoc, 
  increment, 
  serverTimestamp, 
  getDoc,
  writeBatch 
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const { firebase } = window as any;
  const auth = firebase?.auth;
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const VISITOR_ID_KEY = 'pari_portfolio_visitor_id';
const SESSION_START_KEY = 'pari_portfolio_session_start';

const getTechInfo = () => {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  
  // OS Detection
  let os = 'Unknown OS';
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  if (ua.indexOf('Mac') !== -1) os = 'MacOS';
  if (ua.indexOf('X11') !== -1) os = 'UNIX';
  if (ua.indexOf('Linux') !== -1) os = 'Linux';
  if (/Android/.test(ua)) os = 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';

  // Browser Detection
  let browser = 'Unknown Browser';
  if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (ua.indexOf('SamsungBrowser') !== -1) browser = 'Samsung Browser';
  else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) browser = 'Opera';
  else if (ua.indexOf('Trident') !== -1) browser = 'IE';
  else if (ua.indexOf('Edge') !== -1) browser = 'Edge';
  else if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') !== -1) browser = 'Safari';

  return {
    os,
    browser,
    platform,
    language: navigator.language,
    screen: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

const sanitizeField = (field: any): string => {
  if (field === null || field === undefined) return 'unknown';
  const str = String(field).trim();
  if (!str) return 'unknown';
  // Firestore field paths cannot contain . [] * /
  // We replace them and spaces with underscores
  return str.replace(/[\.\s\/\$\[\]\#\*]/g, '_') || 'unknown';
};

export const trackEvent = async (eventName: string, metadata: any = {}) => {
  const { firebase } = window as any;
  if (!firebase || !firebase.db) return;

  const db = firebase.db;
  const sanitizedEventName = sanitizeField(eventName);

  try {
    const interactionsRef = doc(db, 'site_analytics', 'interactions');
    await updateDoc(interactionsRef, {
      [`counts.${sanitizedEventName}`]: increment(1),
      lastInteraction: serverTimestamp()
    }).catch(async (error) => {
      if (error.code === 'not-found') {
        await setDoc(interactionsRef, {
          counts: { [sanitizedEventName]: 1 },
          lastInteraction: serverTimestamp()
        }, { merge: true });
      } else {
        handleFirestoreError(error, OperationType.UPDATE, 'site_analytics/interactions');
      }
    });

    // Also track in top content if applicable
    if (metadata.type === 'project' || metadata.type === 'profile') {
      const typeKey = sanitizeField(`${metadata.type}s`);
      const sanitizedId = sanitizeField(metadata.id);
      
      const topContentRef = doc(db, 'site_analytics', 'top_content');
      await updateDoc(topContentRef, {
        [`${typeKey}.${sanitizedId}`]: increment(1)
      }).catch(async (error) => {
        if (error.code === 'not-found') {
          await setDoc(topContentRef, {
            [typeKey]: { [sanitizedId]: 1 }
          }, { merge: true });
        } else {
          handleFirestoreError(error, OperationType.UPDATE, 'site_analytics/top_content');
        }
      });
    }
  } catch (error) {
    console.error('Analytics trackEvent failed:', error);
  }
};

export const initAnalytics = async () => {
  const { firebase } = window as any;
  if (!firebase || !firebase.db) {
    setTimeout(initAnalytics, 500);
    return;
  }

  const db = firebase.db;

  try {
    const isNewVisitor = !localStorage.getItem(VISITOR_ID_KEY);
    if (isNewVisitor) {
      localStorage.setItem(VISITOR_ID_KEY, `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const isNewSession = !sessionStorage.getItem(SESSION_START_KEY);

    if (isNewSession) {
      sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }

    // Task 2: Valid top-level collection structure for daily traffic
    const mainStatsRef = doc(db, 'site_analytics', 'main_stats');
    const dailyRef = doc(db, 'daily_traffic', today);

    // Get device type
    const ua = navigator.userAgent;
    let deviceType = 'device_desktop';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      deviceType = 'device_tablet';
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua)) {
      deviceType = 'device_mobile';
    }

    // Atomic updates
    const tech = getTechInfo();
    const updates: any = {
      total_views: increment(1),
      [deviceType]: increment(1),
      last_active: serverTimestamp()
    };

    // Update tech analytics
    const techRef = doc(db, 'site_analytics', 'tech');
    await updateDoc(techRef, {
      [`os.${sanitizeField(tech.os)}`]: increment(1),
      [`browsers.${sanitizeField(tech.browser)}`]: increment(1),
      [`screens.${sanitizeField(tech.screen)}`]: increment(1),
      lastUpdate: serverTimestamp()
    }).catch(async (error) => {
      if (error.code === 'not-found') {
        await setDoc(techRef, { 
          os: { [sanitizeField(tech.os)]: 1 }, 
          browsers: { [sanitizeField(tech.browser)]: 1 },
          screens: { [sanitizeField(tech.screen)]: 1 },
          lastUpdate: serverTimestamp()
        }, { merge: true });
      } else {
        handleFirestoreError(error, OperationType.UPDATE, 'site_analytics/tech');
      }
    });

    // Update geo analytics
    const geoRef = doc(db, 'site_analytics', 'geo');
    await updateDoc(geoRef, {
      [`timezones.${sanitizeField(tech.timezone)}`]: increment(1),
      [`languages.${sanitizeField(tech.language)}`]: increment(1),
      lastUpdate: serverTimestamp()
    }).catch(async (error) => {
      if (error.code === 'not-found') {
          await setDoc(geoRef, { 
          timezones: { [sanitizeField(tech.timezone)]: 1 },
          languages: { [sanitizeField(tech.language)]: 1 },
          lastUpdate: serverTimestamp()
        }, { merge: true });
      } else {
        handleFirestoreError(error, OperationType.UPDATE, 'site_analytics/geo');
      }
    });

    // Duration and Session Tracking
    const sessionStart = Date.now();
    localStorage.setItem(SESSION_START_KEY, sessionStart.toString());

    window.addEventListener('beforeunload', async () => {
      const start = parseInt(localStorage.getItem(SESSION_START_KEY) || '0');
      if (start > 0) {
        const durationSeconds = Math.floor((Date.now() - start) / 1000);
        await trackEvent('session_duration', { seconds: durationSeconds });
      }
    });

    // Auto-track key interaction buttons once
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('button, a');
      if (!btn) return;

      const text = btn.textContent?.toLowerCase() || '';
      const href = (btn as any).href || '';

      if (text.includes('resume') || href.includes('resume')) trackEvent('resume_download');
      if (text.includes('contact') || href.includes('contact')) trackEvent('contact_click');
      if (href.includes('github.com')) trackEvent('social_click', { platform: 'github' });
      if (href.includes('linkedin.com')) trackEvent('social_click', { platform: 'linkedin' });
      if (href.includes('leetcode.com')) trackEvent('social_click', { platform: 'leetcode' });
    });

    // Monthly Rollover check
    const currentMonth = new Date().getMonth(); // 0-11
    const lastMonthTracked = localStorage.getItem('pari_portfolio_last_month');
    
    if (lastMonthTracked !== null && parseInt(lastMonthTracked) !== currentMonth) {
      try {
        const docSnap = await getDoc(mainStatsRef);
        if (docSnap.exists()) {
          const currentData = docSnap.data();
          updates.views_last_month = currentData.views_current_month || 0;
          updates.views_current_month = 1;
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'site_analytics/main_stats');
      }
      localStorage.setItem('pari_portfolio_last_month', currentMonth.toString());
  } else {
    if (lastMonthTracked === null) {
      localStorage.setItem('pari_portfolio_last_month', currentMonth.toString());
    }
    updates.views_current_month = increment(1);
  }

  if (isNewVisitor) {
    updates.unique_visitors = increment(1);
  } else {
    updates.returning = increment(1);
  }

  if (isNewSession) {
    updates.total_sessions = increment(1);
  }

  // Update main stats
  await updateDoc(mainStatsRef, updates).catch(async (error) => {
    if (error.code === 'not-found') {
      await setDoc(mainStatsRef, {
        total_views: 1,
        unique_visitors: 1,
        returning: 0,
        total_sessions: 1,
        avg_session_duration: 0,
        device_desktop: deviceType === 'device_desktop' ? 1 : 0,
        device_mobile: deviceType === 'device_mobile' ? 1 : 0,
        device_tablet: deviceType === 'device_tablet' ? 1 : 0,
        views_current_month: 1,
        views_last_month: 0,
        last_active: serverTimestamp()
      }, { merge: true });
    } else {
      handleFirestoreError(error, OperationType.UPDATE, 'site_analytics/main_stats');
    }
  });

  // Update daily traffic
  await updateDoc(dailyRef, {
    views: increment(1),
    uniques: isNewVisitor ? increment(1) : increment(0)
  }).catch(async (error) => {
    if (error.code === 'not-found') {
      await setDoc(dailyRef, {
        views: 1,
        uniques: 1,
        date: today
      }, { merge: true });
    } else {
      handleFirestoreError(error, OperationType.UPDATE, `daily_traffic/${today}`);
    }
  });

  // Update traffic source
  const referrer = document.referrer || 'direct';
  const source = new URL(referrer === 'direct' ? window.location.href : referrer).hostname || 'direct';
  const sourcesRef = doc(db, 'site_analytics', 'top_sources');
  const sanitizedSource = sanitizeField(source);
  await updateDoc(sourcesRef, {
    [sanitizedSource]: increment(1)
  }).catch(async (error) => {
    if (error.code === 'not-found') {
      await setDoc(sourcesRef, {
        [sanitizedSource]: 1
      }, { merge: true });
    } else {
      handleFirestoreError(error, OperationType.UPDATE, 'site_analytics/top_sources');
    }
  });

  // Task: Sync to User Private Dashboard (for Admin view)
  const user = firebase.auth?.currentUser;
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "";
  if (user && user.email === adminEmail) {
    const userAnalyticsRef = doc(db, 'users', user.uid, 'analytics', 'main');
    await setDoc(userAnalyticsRef, updates, { merge: true }).catch(error => {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/analytics/main`);
    });
  }

} catch (error) {
  console.error('Analytics initialization failed:', error);
}
};

/**
 * Helper to perform an async operation with retries
 */
const retryOperation = async <T>(
  operation: () => Promise<T>, 
  label: string, 
  maxRetries = 3
): Promise<T | null> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await operation();
      return result;
    } catch (error: any) {
      attempt++;
      const delay = Math.pow(2, attempt) * 500 + Math.random() * 500;
      console.warn(`[Analytics] ${label} failed (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${Math.round(delay)}ms...`);
      if (attempt >= maxRetries) break;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  console.error(`[Analytics] ${label} permanently failed after ${maxRetries} attempts.`);
  return null;
};

/**
 * Resets all analytics data in Firestore to 0 or initial states.
 * Runs with resilient background execution and internal timeouts.
 */
export const resetAllAnalytics = async () => {
  console.log("[Service] resetAllAnalytics starting (Optimistic/Background Mode)...");
  const { firebase } = window as any;
  if (!firebase || !firebase.db) {
    console.error("[Service] Firebase or DB not found on window");
    return false;
  }

  const db = firebase.db;
  
  const docsToReset = [
    { path: ['site_analytics', 'main_stats'], data: {
      total_views: 0,
      unique_visitors: 0,
      returning: 0,
      total_sessions: 0,
      avg_session_duration: 0,
      device_desktop: 0,
      device_mobile: 0,
      device_tablet: 0,
      views_current_month: 0,
      views_last_month: 0,
      last_active: serverTimestamp()
    }},
    { path: ['site_analytics', 'interactions'], data: { counts: {}, lastInteraction: serverTimestamp() }},
    { path: ['site_analytics', 'top_content'], data: { projects: {}, profiles: {} }},
    { path: ['site_analytics', 'tech'], data: { os: {}, browsers: {}, screens: {}, lastUpdate: serverTimestamp() }},
    { path: ['site_analytics', 'geo'], data: { timezones: {}, languages: {}, lastUpdate: serverTimestamp() }},
    { path: ['site_analytics', 'top_sources'], data: {} },
    { path: ['coding_stats', 'live_data'], data: { history: {}, lastSynced: serverTimestamp() }}
  ];

  // Perform local cleanup immediately
  localStorage.removeItem(VISITOR_ID_KEY);
  localStorage.removeItem(SESSION_START_KEY);
  localStorage.removeItem('pari_portfolio_last_month');
  sessionStorage.removeItem(SESSION_START_KEY);

  let successCount = 0;

  // Process documents one by one in the background
  // We don't use Promise.all to avoid flooding the transport stream
  for (const item of docsToReset) {
    try {
      const docRef = doc(db, item.path[0], item.path[1]);
      // Use a timeout for each individual write to prevent hanging
      await Promise.race([
        retryOperation(() => setDoc(docRef, item.data, { merge: false }), `Resetting ${item.path.join('/')}`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Write Timeout')), 8000))
      ]);
      successCount++;
    } catch (e) {
      console.warn(`[Service] Quiet failure for ${item.path.join('/')}:`, e);
    }
    // Tiny delay between writes
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`[Service] Background reset finished (${successCount}/${docsToReset.length} docs).`);
  return successCount > 0;
};
