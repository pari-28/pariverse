
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Firebase Modular SDK
import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  getRedirectResult,
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  initializeFirestore,
  doc, 
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
  writeBatch,
  deleteField,
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import {
  getAnalytics,
  isSupported
} from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";
const AUTH_KEY = 'pari_portfolio_auth_session';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: (window as any).auth?.currentUser?.uid,
      email: (window as any).auth?.currentUser?.email,
      emailVerified: (window as any).auth?.currentUser?.emailVerified,
      isAnonymous: (window as any).auth?.currentUser?.isAnonymous,
      tenantId: (window as any).auth?.currentUser?.tenantId,
      providerInfo: (window as any).auth?.currentUser?.providerData?.map((provider: any) => ({
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

// 1. Initialize Firebase App
let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  // Verification Logging (Tasks 2, 3, 9)
  console.log("✅ Firebase initialized successfully");
  console.log("🔍 Verification Status:");
  console.log(` - Project ID: ${firebaseConfig.projectId || 'NOT_SET'}`);
  console.log(` - App ID: ${firebaseConfig.appId || 'NOT_SET'}`);
  console.log(` - Measurement ID: ${firebaseConfig.measurementId || 'NOT_SET'}`);
} catch (error) {
  console.error("❌ Firebase Initialization Error:", error);
}

// 2. Initialize Firebase Authentication
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
(window as any).auth = auth;

// 3. Initialize Cloud Firestore with Persistence and Long Polling
const db = initializeFirestore(app!, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalForceLongPolling: true, // Avoid WebSocket warnings and connection issues
});
(window as any).db = db;

// 4. Initialize Analytics (if supported)
isSupported().then((supported) => {
  if (supported) {
    const analytics = getAnalytics(app!);
    console.log("📊 Firebase Analytics initialized correctly");
    (window as any).analytics = analytics;
  } else {
    console.log("📊 Firebase Analytics is not supported in this environment");
  }
}).catch(err => {
  console.error("❌ Analytics support check failed:", err);
});

// 5. Connection Test Function (per Task 5)
async function testFirestoreConnection() {
  console.log("🔍 Running Firestore connectivity test...");
  const path = 'system_health/connection_test';
  try {
    const testDocRef = doc(db, 'system_health', 'connection_test');
    await setDoc(testDocRef, {
      lastChecked: serverTimestamp(),
      status: 'online',
      message: 'Connection test from App',
      projectId: firebaseConfig.projectId
    });
    
    const snap = await getDocFromServer(testDocRef);
    if (snap.exists()) {
      console.log("✅ Firestore test: Document read/write successful.");
    } else {
      throw new Error("Document write confirmed but read failed to find document.");
    }
  } catch (error: any) {
    if (error.message.includes('permission-denied') || error.code === 'permission-denied') {
      console.group("❌ Firestore Connectivity Test Failed: Missing or insufficient permissions.");
      console.error("Reason: Your Firestore Security Rules are blocking the write.");
      console.info("💡 SOLUTION: ");
      console.log(`1. Open: https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/rules`);
      console.log("2. Copy the rules from the 'firestore.rules' file in this editor.");
      console.log("3. Paste them into the console and click 'Publish'.");
      console.groupEnd();
    } else {
      console.error("❌ Firestore Connectivity Test Error:", error);
    }
  }
}

// Execute test
testFirestoreConnection();

/**
 * AUTH STATE OBSERVER
 */
onAuthStateChanged(auth, (user) => {
  if (user && user.email === ADMIN_EMAIL) {
    sessionStorage.setItem(AUTH_KEY, 'valid_admin_session');
    console.log("Admin session verified for:", user.email);
  } else {
    sessionStorage.removeItem(AUTH_KEY);
    if (user) console.warn("Access denied for non-admin user:", user.email);
  }
  
  window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user } }));
});

// Expose Firebase tools to window (to maintain compatibility with existing components)
(window as any).firebase = {
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDocFromServer,
  increment,
  writeBatch,
  deleteField,
  testFirestoreConnection // Exporting test function for manual trigger if needed
};

/**
 * REDIRECT RESULT HANDLER
 */
getRedirectResult(auth).then((result) => {
  if (result && result.user.email === ADMIN_EMAIL) {
    sessionStorage.setItem(AUTH_KEY, 'valid_admin_session');
    window.location.reload();
  }
}).catch((error: any) => {
  console.error("Redirect Login failed:", error);
});

(window as any).handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    if (result.user.email === ADMIN_EMAIL) {
      sessionStorage.setItem(AUTH_KEY, 'valid_admin_session');
      return result.user;
    } else {
      await signOut(auth);
      console.error("Access denied for user:", result.user.email);
      throw new Error("Access denied: Only " + ADMIN_EMAIL + " can access admin mode.");
    }
  } catch (error: any) {
    if (error.code === 'auth/unauthorized-domain') {
      console.group("🔐 Firebase Auth: Unauthorized Domain");
      console.error("Domain is not authorized in Firebase Console.");
      console.info("💡 SOLUTION: ");
      console.log(`1. Open: https://console.firebase.google.com/project/${firebaseConfig.projectId}/auth/settings`);
      console.log("2. Go to 'Authorized Domains'.");
      console.log(`3. Add '${window.location.hostname}' to the list.`);
      console.groupEnd();
    }
    console.error("Google Login failed:", error.code || error.message);
    throw error;
  }
};

(window as any).handleEmailLogin = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user.email === ADMIN_EMAIL) {
      sessionStorage.setItem(AUTH_KEY, 'valid_admin_session');
      return result.user;
    } else {
      await signOut(auth);
      console.error("Access denied for user:", result.user.email);
      throw new Error("Access denied: You are not authorized to access this portal.");
    }
  } catch (error: any) {
    let msg = error.code || error.message;
    if (error.code === 'auth/invalid-credential') {
      msg = "Invalid email or password. Please check your credentials in the Firebase Console.";
    } else if (error.code === 'auth/user-not-found') {
      msg = "Admin account not found. Please create it in the Firebase Console.";
    }
    console.error("Email Login failed:", msg);
    throw new Error(msg);
  }
};

(window as any).handleLogout = async () => {
  try {
    await signOut(auth);
    sessionStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error("Logout failed:", error);
  }
};


// --- 3. CODING PROFILE SYNC (Callable) ---

// Suppress benign Vite/WebSocket warnings in dev environments or when HMR is intentionally disabled
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    const msg = args[0]?.toString() || '';
    if (msg.includes('[vite] failed to connect to websocket') || 
        msg.includes('WebSocket closed without opened')) {
      return;
    }
    originalError(...args);
  };

  console.warn = (...args) => {
    const msg = args[0]?.toString() || '';
    if (msg.includes('WebSocket connection to') && msg.includes('failed')) {
      return;
    }
    originalWarn(...args);
  };
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
