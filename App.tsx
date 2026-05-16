import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeMode, Project, Experience, Certificate, Education, Resume, ProfileData, AboutData, ContactData, SkillCategory, Tool, CodingProfile, SectionHeadings } from './types';
import { THEME_CONFIGS, INITIAL_PROJECTS, INITIAL_EXPERIENCE, INITIAL_CERTIFICATES, INITIAL_EDUCATION, INITIAL_RESUMES, INITIAL_CODING_PROFILES, INITIAL_SECTION_HEADINGS } from './constants';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Skills from './components/Skills';
import ExperienceSection from './components/ExperienceSection';
import Projects from './components/Projects';
import Certificates from './components/Certificates';
import EducationSection from './components/EducationSection';
import CodingProfiles from './components/CodingProfiles';
import Contact from './components/Contact';
import ThemeSwitcher from './components/ThemeSwitcher';
import AIChatbot from './components/AIChatbot';
import AdminToggle from './components/AdminToggle';
import BackgroundManager from './components/BackgroundManager';
import CustomCursor from './components/CustomCursor';
import ResumesPage from './components/ResumesPage';
import Analytics from './components/Analytics';
import CosmicTransition from './components/CosmicTransition';
import LoginModal from './components/LoginModal';
import MobileDashboard from './components/MobileDashboard';

const AUTH_KEY = 'pari_portfolio_auth_session';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";

const compressImage = async (base64Str: string): Promise<string> => {
  if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_WIDTH = 800; // Reduced from 1200
      const MAX_HEIGHT = 800; // Reduced from 1200
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width > height) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        } else {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Str);
      let quality = 0.7; // Started from 0.7 instead of 0.9
      let result = base64Str;
      const step = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        result = canvas.toDataURL('image/jpeg', quality);
        // More aggressive limit: 150KB per image (150,000 chars roughly)
        if (result.length > 200000 && quality > 0.1) { 
          quality -= 0.1;
          step();
        } else {
          resolve(result);
        }
      };
      step();
    };
    img.onerror = () => resolve(base64Str);
  });
};

const validatePdfSize = (base64Str: string): boolean => {
  return base64Str.length < 1000000;
};

const INITIAL_SKILLS: SkillCategory[] = [];

const INITIAL_TOOLS: Tool[] = [];

import { 
  initAnalytics, 
  trackEvent,
  handleFirestoreError,
  OperationType 
} from './analyticsService';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';

const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginClickCount, setLoginClickCount] = useState(0);
  
  useEffect(() => {
    const { firebase } = window as any;
    const testConnection = async () => {
      if (!firebase || !firebase.db) {
        setTimeout(testConnection, 500);
        return;
      }
      try {
        // Use getDocFromServer to verify real connectivity
        await getDocFromServer(doc(firebase.db, 'system_health', 'connection_test'));
        console.log("Firestore connection verified.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('permission')) {
          console.error("Firestore Permission Denied. Check security rules.");
        }
      }
    };

    initAnalytics();
    testConnection();
  }, []);

  const [activeSection, setActiveSection] = useState('home');
  const [view, setView] = useState<'main' | 'resumes' | 'analytics'>('main');
  const [navKey, setNavKey] = useState(0); 
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [editingHeading, setEditingHeading] = useState<{ key: keyof SectionHeadings; subKey: keyof SectionHeadings } | null>(null);
  const [headingForm, setHeadingForm] = useState({ title: '', subtext: '' });

  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    greeting: '',
    tagline: '',
    imageUrl: '',
    isOpenToWork: false,
    position: '',
    organization: '',
    department: ''
  });

  const [about, setAbout] = useState<AboutData>({
    text1: '',
    text2: '',
    imageUrl: ''
  });

  const [contact, setContact] = useState<ContactData>({
    title: "",
    description: "",
    email: "",
    linkedin: "",
    github: "",
    leetcode: "",
    codeforces: "",
    instagram: "",
    quoteText: "",
    quoteAuthor: ""
  });

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [experiences, setExperiences] = useState<Experience[]>(INITIAL_EXPERIENCE);
  const [certificates, setCertificates] = useState<Certificate[]>(INITIAL_CERTIFICATES);
  const [educations, setEducations] = useState<Education[]>(INITIAL_EDUCATION);
  const [resumes, setResumes] = useState<Resume[]>(INITIAL_RESUMES);
  const [skills, setSkills] = useState<SkillCategory[]>(INITIAL_SKILLS);
  const [tools, setTools] = useState<Tool[]>(INITIAL_TOOLS);
  const [codingProfiles, setCodingProfiles] = useState<CodingProfile[]>(INITIAL_CODING_PROFILES);
  const [sectionHeadings, setSectionHeadings] = useState<SectionHeadings>(INITIAL_SECTION_HEADINGS);
  // FIX: state to hold live synced stats for practice cards
  const [liveStats, setLiveStats] = useState<any>(null);
  const [totalViews, setTotalViews] = useState(0);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // --- Z-INDEX MANAGEMENT: MONITOR FOR MODALS ---
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isModalActive = !!document.querySelector('.detail-view-container');
      if (isModalActive) {
        document.body.classList.add('detail-view-active');
      } else {
        document.body.classList.remove('detail-view-active');
        // Failsafe: If no modals are active, ensure scroll is restored
        const currentOverflow = document.body.style.overflow;
        if (currentOverflow === 'hidden' && !isModalActive) {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const saveToFirestore = useCallback(async (path: string, data: any) => {
    const { firebase } = window as any;
    if (!firebase || !firebase.db || !firebase.auth?.currentUser) return;
    try {
      const [collectionName, docId] = path.split('/');
      await firebase.setDoc(firebase.doc(firebase.db, collectionName, docId), {
        ...data,
        updatedAt: firebase.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, []);

  const saveCollectionToFirestore = useCallback(async (collectionName: string, items: any[]) => {
    const { firebase } = window as any;
    if (!firebase || !firebase.db || !firebase.auth?.currentUser) return;
    try {
      // PROACTIVE COMPRESSION for all items in collections that might contain images
      const processedItems = await Promise.all(items.map(async (item) => {
        const newItem = { ...item };
        // Check for common image fields and compress them
        if (newItem.imageUrl && typeof newItem.imageUrl === 'string' && newItem.imageUrl.startsWith('data:image')) {
          newItem.imageUrl = await compressImage(newItem.imageUrl);
        }
        if (newItem.image && typeof newItem.image === 'string' && newItem.image.startsWith('data:image')) {
          newItem.image = await compressImage(newItem.image);
        }
        if (newItem.certificateImageUrl && typeof newItem.certificateImageUrl === 'string' && newItem.certificateImageUrl.startsWith('data:image')) {
          newItem.certificateImageUrl = await compressImage(newItem.certificateImageUrl);
        }
        if (newItem.previewImageUrl && typeof newItem.previewImageUrl === 'string' && newItem.previewImageUrl.startsWith('data:image')) {
          newItem.previewImageUrl = await compressImage(newItem.previewImageUrl);
        }
        return newItem;
      }));

      const isLargeCollection = ['projects', 'certificates', 'experiences', 'resumes'].includes(collectionName);

      if (isLargeCollection) {
        // SAVE AS INDIVIDUAL DOCUMENTS to avoid 1MB limit
        // 1. Get existing doc IDs to handle cleanup
        const itemsColRef = firebase.collection(firebase.db, 'portfolio_collections', collectionName, 'items');
        const existingDocs = await firebase.getDocs(itemsColRef);
        const existingIds = existingDocs.docs.map((doc: any) => doc.id);
        const newItemIds = processedItems.map(item => item.id);

        // 2. Write new/updated items
        const batch = firebase.writeBatch(firebase.db);
        processedItems.forEach((item) => {
          const docRef = firebase.doc(firebase.db, 'portfolio_collections', collectionName, 'items', item.id);
          batch.set(docRef, { ...item, updatedAt: firebase.serverTimestamp() }, { merge: true });
        });

        // 3. Delete removed items
        existingIds.forEach((id: string) => {
          if (!newItemIds.includes(id)) {
            const docRef = firebase.doc(firebase.db, 'portfolio_collections', collectionName, 'items', id);
            batch.delete(docRef);
          }
        });

        await batch.commit();

        // 4. Update the parent document to mark it as split and CLEAR the bulky items array
        await firebase.setDoc(firebase.doc(firebase.db, 'portfolio_collections', collectionName), {
          isSplit: true,
          items: firebase.deleteField(),
          count: processedItems.length,
          updatedAt: firebase.serverTimestamp()
        }, { merge: true });

      } else {
        // Standard small collection save
        await firebase.setDoc(firebase.doc(firebase.db, 'portfolio_collections', collectionName), {
          items: processedItems,
          updatedAt: firebase.serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `portfolio_collections/${collectionName}`);
    }
  }, []);

  useEffect(() => { if (isDataLoaded && isAuthenticated) saveToFirestore('portfolio_settings/profile', profile); }, [profile, isDataLoaded, isAuthenticated, saveToFirestore]);
  useEffect(() => { if (isDataLoaded && isAuthenticated) saveToFirestore('portfolio_settings/about', about); }, [about, isDataLoaded, isAuthenticated, saveToFirestore]);
  useEffect(() => { if (isDataLoaded && isAuthenticated) saveToFirestore('portfolio_settings/contact', contact); }, [contact, isDataLoaded, isAuthenticated, saveToFirestore]);
  useEffect(() => { if (isDataLoaded && isAuthenticated) saveToFirestore('portfolio_settings/headings', sectionHeadings); }, [sectionHeadings, isDataLoaded, isAuthenticated, saveToFirestore]);
  useEffect(() => { if (isDataLoaded && isAuthenticated) saveCollectionToFirestore('projects', projects); }, [projects, isDataLoaded, isAuthenticated, saveCollectionToFirestore]);
  useEffect(() => { if (isDataLoaded && isAuthenticated) saveCollectionToFirestore('experiences', experiences); }, [experiences, isDataLoaded, isAuthenticated, saveCollectionToFirestore]);
  useEffect(() => { if (isDataLoaded && isAuthenticated) saveCollectionToFirestore('certificates', certificates); }, [certificates, isDataLoaded, isAuthenticated, saveCollectionToFirestore]);
  useEffect(() => { if (isDataLoaded && isAuthenticated) saveCollectionToFirestore('educations', educations); }, [educations, isDataLoaded, isAuthenticated, saveCollectionToFirestore]);
  useEffect(() => { if (isDataLoaded && isAuthenticated) saveCollectionToFirestore('resumes', resumes); }, [resumes, isDataLoaded, isAuthenticated, saveCollectionToFirestore]);
  useEffect(() => { if (isDataLoaded && isAuthenticated) saveCollectionToFirestore('skills', skills); }, [skills, isDataLoaded, isAuthenticated, saveCollectionToFirestore]);
  useEffect(() => { if (isDataLoaded && isAuthenticated) saveCollectionToFirestore('tools', tools); }, [tools, isDataLoaded, isAuthenticated, saveCollectionToFirestore]);
  useEffect(() => { if (isDataLoaded && isAuthenticated) saveCollectionToFirestore('codingProfiles', codingProfiles); }, [codingProfiles, isDataLoaded, isAuthenticated, saveCollectionToFirestore]);

  // FIX: bind activity graph to live Firestore data via real-time listener
  useEffect(() => {
    const { firebase } = window as any;
    if (!firebase || !firebase.db) return;

    // Listen to the main live_data for overall stats like lastSynced
    const mainDocRef = firebase.doc(firebase.db, 'coding_stats', 'live_data');
    const unsubscribeMain = firebase.onSnapshot(mainDocRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveStats(prev => ({ ...prev, ...data }));
        console.log("Main live stats updated.");
      }
    });

    // Listen to the new coding_profiles collection for individual platforms
    const profilesColRef = firebase.collection(firebase.db, 'coding_profiles');
    const unsubscribeProfiles = firebase.onSnapshot(profilesColRef, (querySnap: any) => {
      const stats: any = {};
      querySnap.forEach((docSnap: any) => {
        stats[docSnap.id] = docSnap.data();
      });
      setLiveStats(prev => ({ ...prev, platforms: stats }));
      console.log("Platform stats updated.");
    }, (error: any) => {
      console.error("Firestore coding_profiles listener failed:", error);
    });

    return () => {
      unsubscribeMain();
      unsubscribeProfiles();
    };
  }, []);

  useEffect(() => {
    const fetchFirestoreData = async () => {
      const { firebase } = window as any;
      if (!firebase) {
        setTimeout(fetchFirestoreData, 500);
        return;
      }
      try {
        const profileSnap = await firebase.getDoc(firebase.doc(firebase.db, 'portfolio_settings', 'profile'));
        if (profileSnap.exists()) setProfile(profileSnap.data());
        const aboutSnap = await firebase.getDoc(firebase.doc(firebase.db, 'portfolio_settings', 'about'));
        if (aboutSnap.exists()) setAbout(aboutSnap.data());
        const contactSnap = await firebase.getDoc(firebase.doc(firebase.db, 'portfolio_settings', 'contact'));
        if (contactSnap.exists()) setContact(contactSnap.data());
        const headingsSnap = await firebase.getDoc(firebase.doc(firebase.db, 'portfolio_settings', 'headings'));
        if (headingsSnap.exists()) setSectionHeadings(headingsSnap.data());
        const collectionsSnap = await firebase.getDocs(firebase.collection(firebase.db, 'portfolio_collections'));
        const loadPromises = collectionsSnap.docs.map(async (doc: any) => {
          const docData = doc.data();
          let data = docData.items || [];
          
          // Special handling for split collections
          if (docData.isSplit || ['projects', 'certificates', 'experiences', 'resumes'].includes(doc.id)) {
            const itemsSnap = await firebase.getDocs(firebase.collection(firebase.db, 'portfolio_collections', doc.id, 'items'));
            if (!itemsSnap.empty) {
              data = itemsSnap.docs.map((itemDoc: any) => ({ ...itemDoc.data(), id: itemDoc.id }));
            }
          }

          switch (doc.id) {
            case 'projects': setProjects(data); break;
            case 'experiences': setExperiences(data); break;
            case 'certificates': setCertificates(data); break;
            case 'educations': setEducations(data); break;
            case 'resumes': setResumes(data); break;
            case 'skills': setSkills(data); break;
            case 'tools': setTools(data); break;
            case 'codingProfiles': setCodingProfiles(data); break;
          }
        });
        await Promise.all(loadPromises);
        setIsDataLoaded(true);
      } catch (error: any) {
        setIsDataLoaded(true); 
      }
    };
    fetchFirestoreData();

    const handleAuthChange = (e: any) => {
      const user = e.detail.user;
      if (user && user.email === ADMIN_EMAIL) {
        setIsAuthenticated(true);
        setIsAdmin(true);
        showToast("Welcome back, Pari!", "success");
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    window.addEventListener('auth-state-changed', handleAuthChange);
    
    if (sessionStorage.getItem(AUTH_KEY) === 'valid_admin_session') {
      setIsAuthenticated(true);
      setIsAdmin(true);
    }

    return () => window.removeEventListener('auth-state-changed', handleAuthChange);
  }, [showToast]);

  const handleAdminDataUpdate = async (type: string, data: any) => {
    if (!isAuthenticated) return;
    let processedData = data;
    if (processedData.imageUrl && processedData.imageUrl.startsWith('data:image')) {
      processedData.imageUrl = await compressImage(processedData.imageUrl);
    }
    if (processedData.image && processedData.image.startsWith('data:image')) {
      processedData.image = await compressImage(processedData.image);
    }
    if (processedData.certificateImageUrl && processedData.certificateImageUrl.startsWith('data:image')) {
      processedData.certificateImageUrl = await compressImage(processedData.certificateImageUrl);
    }
    if (processedData.fileUrl && processedData.fileUrl.startsWith('data:application/pdf')) {
      if (!validatePdfSize(processedData.fileUrl)) {
        showToast("Resume must be under 1 MB. Please upload a compressed PDF.", "error");
        return;
      }
    }
    switch (type) {
      case 'profile':
        await saveToFirestore('portfolio_settings/profile', processedData);
        setProfile(processedData);
        break;
      case 'about':
        await saveToFirestore('portfolio_settings/about', processedData);
        setAbout(processedData);
        break;
      case 'contact':
        await saveToFirestore('portfolio_settings/contact', processedData);
        setContact(processedData);
        break;
    }
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} updated!`, "success");
  };

  useEffect(() => {
    if (view !== 'main') return;
    const handleScroll = () => {
      const sections = ['home', 'about', 'skills', 'experience', 'certificates', 'projects', 'coding-profiles', 'education', 'contact'];
      const viewportHeight = window.innerHeight;
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= viewportHeight * 0.4 && rect.bottom >= viewportHeight * 0.4) {
            setActiveSection(section);
            break;
          }
        }
      }
      const reveals = document.querySelectorAll('.reveal');
      reveals.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < viewportHeight * 0.85) el.classList.add('active');
        else el.classList.remove('active');
      });
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [view]);

  const openEditor = (key: keyof SectionHeadings, subKey: keyof SectionHeadings) => {
    setEditingHeading({ key, subKey });
    setHeadingForm({ title: sectionHeadings[key], subtext: sectionHeadings[subKey] });
  };

  const saveHeading = async () => {
    if (editingHeading) {
      const newHeadings = {
        ...sectionHeadings,
        [editingHeading.key]: headingForm.title,
        [editingHeading.subKey]: headingForm.subtext
      };
      await saveToFirestore('portfolio_settings/headings', newHeadings);
      setSectionHeadings(newHeadings);
      showToast("Section heading updated.", "success");
    }
    setEditingHeading(null);
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    (window as any).handleLogout();
    showToast("Logged out successfully.", "info");
  };

  const handleAdminLogin = (success: boolean) => {
    if (success) {
      setLoginClickCount(0);
    }
    setIsLoginModalOpen(false);
  };

  const handleFooterSecretTrigger = () => {
    setLoginClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setIsLoginModalOpen(true);
        return 0;
      }
      return next;
    });
  };

  const handleManualNavigate = (v: 'main' | 'resumes' | 'analytics', sectionId?: string) => {
    setNavKey(prev => prev + 1); 
    setView(v);
    setTimeout(() => {
      if (sectionId) document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white overflow-hidden">
        <div className="relative flex flex-col items-center">
          {/* Subtle Modern Loader */}
          <div className="relative w-20 h-20 mb-10">
            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500/10 animate-spin" />
            <div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-sky-400/30 animate-[spin_1.5s_linear_infinite]" />
            <div className="absolute inset-4 rounded-full border-b-2 border-l-2 border-emerald-400/50 animate-[spin_2s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)] animate-pulse" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 px-4">
            <h1 className="text-[10px] sm:text-sm font-black tracking-[0.2em] sm:tracking-[0.4em] uppercase text-white/90 animate-pulse text-center max-w-[300px] sm:max-w-none leading-relaxed" id="m7v2qx">
              Welcome to Pari's Portfolio
            </h1>
            <div className="relative w-24 h-[1px] overflow-hidden">
              <div className="absolute inset-0 bg-white/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-[progress_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>

        <style>{`
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  const config = THEME_CONFIGS[theme] || THEME_CONFIGS['light'];
  const effectiveIsAdmin = isAdmin && isAuthenticated;

  return (
    <div className={`min-h-screen transition-all duration-1000 ${config.bg} ${config.text} relative selection:bg-sky-500/40 overflow-x-hidden`}>
      <BackgroundManager theme={theme} activeSection={activeSection} />
      <Navbar 
        activeSection={activeSection} 
        theme={theme} 
        currentView={view} 
        onNavigate={handleManualNavigate} 
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoutClick={handleAdminLogout}
      />
      <ThemeSwitcher currentTheme={theme} setTheme={setTheme} />
      <MobileDashboard 
        theme={theme} 
        setTheme={setTheme}
        activeSection={activeSection} 
        currentView={view} 
        onNavigate={handleManualNavigate} 
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        onLoginClick={() => setIsLoginModalOpen(true)}
        totalViews={totalViews}
      />
      
      <main className="container mx-auto px-6 md:px-20 max-w-6xl relative flex flex-col items-center">
        {view === 'main' ? (
          <>
            <Home theme={theme} isAdmin={effectiveIsAdmin} data={profile} onUpdate={(d) => handleAdminDataUpdate('profile', d)} onNavigate={(s) => handleManualNavigate('main', s)} />
            <About theme={theme} isAdmin={effectiveIsAdmin} data={about} onUpdate={(d) => handleAdminDataUpdate('about', d)} title={sectionHeadings.about} subtext={sectionHeadings.aboutSub} onTitleUpdate={() => openEditor('about', 'aboutSub')} onNavigate={() => handleManualNavigate('main', 'about')} />
            <Skills theme={theme} isAdmin={effectiveIsAdmin} skillCategories={skills} setSkillCategories={setSkills} toolsUsed={tools} setToolsUsed={setTools} title={sectionHeadings.skills} subtext={sectionHeadings.skillsSub} onTitleUpdate={() => openEditor('skills', 'skillsSub')} toolsTitle={sectionHeadings.tools} toolsSubtext={sectionHeadings.toolsSub} onToolsTitleUpdate={() => openEditor('tools', 'toolsSub')} onNavigate={() => handleManualNavigate('main', 'skills')} showToast={showToast} />
            <ExperienceSection theme={theme} isAdmin={effectiveIsAdmin} experiences={experiences} setExperiences={setExperiences} title={sectionHeadings.experience} subtext={sectionHeadings.experienceSub} onTitleUpdate={() => openEditor('experience', 'experienceSub')} onNavigate={() => handleManualNavigate('main', 'experience')} showToast={showToast} />
            <Certificates theme={theme} isAdmin={effectiveIsAdmin} certificates={certificates} setCertificates={setCertificates} title={sectionHeadings.certificates} subtext={sectionHeadings.certificatesSub} onTitleUpdate={() => openEditor('certificates', 'certificatesSub')} onNavigate={() => handleManualNavigate('main', 'certificates')} showToast={showToast} />
            <Projects theme={theme} isAdmin={effectiveIsAdmin} projects={projects} setProjects={setProjects} title={sectionHeadings.projects} subtext={sectionHeadings.projectsSub} onTitleUpdate={() => openEditor('projects', 'projectsSub')} onNavigate={() => handleManualNavigate('main', 'projects')} showToast={showToast} />
            <CodingProfiles theme={theme} isAdmin={effectiveIsAdmin} profiles={codingProfiles} setProfiles={setCodingProfiles} title={sectionHeadings.codingProfiles} subtext={sectionHeadings.codingProfilesSub} onTitleUpdate={() => openEditor('codingProfiles', 'codingProfilesSub')} onNavigate={() => handleManualNavigate('main', 'coding-profiles')} showToast={showToast} liveStats={liveStats} contact={contact} />
            <EducationSection theme={theme} isAdmin={effectiveIsAdmin} educations={educations} setEducations={setEducations} title={sectionHeadings.education} subtext={sectionHeadings.educationSub} onTitleUpdate={() => openEditor('education', 'educationSub')} onNavigate={() => handleManualNavigate('main', 'education')} showToast={showToast} />
            <Contact theme={theme} isAdmin={effectiveIsAdmin} data={contact} onUpdate={(d) => handleAdminDataUpdate('contact', d)} title={sectionHeadings.contact} subtext={sectionHeadings.contactSub} onTitleUpdate={() => openEditor('contact', 'contactSub')} onNavigate={() => handleManualNavigate('main', 'contact')} showToast={showToast} />
          </>
        ) : view === 'resumes' ? (
          <ResumesPage theme={theme} isAdmin={effectiveIsAdmin} resumes={resumes} onUpdate={setResumes} onBack={() => handleManualNavigate('main')} title={sectionHeadings.resumes} subtext={sectionHeadings.resumesSub} onTitleUpdate={() => openEditor('resumes', 'resumesSub')} showToast={showToast} />
        ) : (
          <div className="min-h-screen w-full flex items-center justify-center p-20">
            <div className="text-center opacity-20 font-black uppercase tracking-[0.5em] text-xs">Loading Analytics Dashboard...</div>
          </div>
        )}
      </main>

      {editingHeading && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm detail-view-container" onClick={() => setEditingHeading(null)} />
          <div className={`relative w-full max-w-lg p-8 rounded-[2rem] border shadow-2xl ${config.card} text-white`}>
            <h3 className="text-2xl font-bold mb-6 text-white">Edit Section Heading</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Heading Name</label>
                <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" value={headingForm.title} onChange={e => setHeadingForm({...headingForm, title: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Subtext / Content</label>
                <textarea className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" rows={3} value={headingForm.subtext} onChange={e => setHeadingForm({...headingForm, subtext: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={saveHeading} className={`flex-1 py-3 rounded-xl font-bold ${config.button} text-white`}>Save</button>
              <button onClick={() => setEditingHeading(null)} className="flex-1 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isLoginModalOpen && <LoginModal theme={theme} onClose={() => setIsLoginModalOpen(false)} onLogin={handleAdminLogin} />}
      <AIChatbot theme={theme} />
      {isAuthenticated && <AdminToggle isAdmin={isAdmin} setIsAdmin={setIsAdmin} theme={theme} onLogout={handleAdminLogout} />}
      
      {/* GLOBAL INTERACTION LAYERS - HIGHEST DOM PRIORITY */}
      <Analytics theme={theme} isAdmin={effectiveIsAdmin} currentView={view} onNavigate={(v) => handleManualNavigate(v)} onViewsUpdate={setTotalViews} />
      <CosmicTransition theme={theme} navKey={navKey} />
      
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 border backdrop-blur-md flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
          toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
          'bg-indigo-500/90 border-indigo-400 text-white'
        }`}>
          <span className="text-lg">{toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <CustomCursor theme={theme} />
    </div>
  );
};

export default App;