
import React, { useState, useEffect } from 'react';
import { ThemeMode } from '../types';
import { THEME_CONFIGS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { useScrollLock } from '../hooks/useScrollLock';

interface MobileDashboardProps {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  activeSection: string;
  currentView: 'main' | 'resumes' | 'analytics';
  onNavigate: (view: 'main' | 'resumes' | 'analytics', sectionId?: string) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  onLoginClick: () => void;
  totalViews?: number;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
  theme,
  setTheme,
  activeSection,
  currentView,
  onNavigate,
  isAuthenticated,
  isAdmin,
  setIsAdmin,
  onLoginClick,
  totalViews = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [shouldHide, setShouldHide] = useState(false);
  
  useScrollLock(isOpen);

  const config = THEME_CONFIGS[theme] || THEME_CONFIGS['light'];

  const themeOptions: { mode: ThemeMode; icon: string }[] = [
    { mode: 'light', icon: '☀️' },
    { mode: 'yellow', icon: '🟡' },
    { mode: 'gradient', icon: '🌈' },
    { mode: 'navy', icon: '🌊' },
    { mode: 'violet', icon: '💜' },
  ];

  const navItems = [
    { label: 'Home', id: 'home', icon: '🏠', view: 'main' },
    { label: 'About', id: 'about', icon: '👤', view: 'main' },
    { label: 'Skills', id: 'skills', icon: '⚡', view: 'main' },
    { label: 'Projects', id: 'projects', icon: '🚀', view: 'main' },
    { label: 'Resume', id: 'resume', icon: '📄', view: 'resumes' },
    { label: 'Contact', id: 'contact', icon: '✉️', view: 'main' },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('dashboard-active');
    } else {
      document.body.classList.remove('dashboard-active');
    }
    return () => { 
      document.body.classList.remove('dashboard-active');
    };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 100);
      
      const isTabletLandscape = window.innerWidth >= 1024 && window.innerWidth <= 1366;
      const isMobileOrTablet = window.innerWidth < 1024;

      if (isMobileOrTablet || isTabletLandscape) {
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
          setShouldHide(true);
        } else {
          setShouldHide(false);
        }
      } else {
        setShouldHide(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleItemClick = (item: any) => {
    onNavigate(item.view, item.view === 'main' ? item.id : undefined);
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden">
      {/* Floating Dashboard Trigger - Top Right */}
      <motion.button
        id="mobile-dashboard-trigger"
        onClick={() => setIsOpen(true)}
        className={`fixed top-6 right-6 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-2xl z-[120] transition-all duration-500 border ${config.border} ${config.button} ${
          shouldHide ? 'translate-y-[-140%] opacity-0' : 'translate-y-0 opacity-100'
        }`}
        whileTap={{ scale: 0.9 }}
      >
        🎛️
      </motion.button>

      {/* Dashboard Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[130] detail-view-container"
            />
              <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed top-0 right-0 bottom-0 w-[75vw] max-w-[320px] z-[140] shadow-2xl border-l ${config.border} ${config.bg} flex flex-col ai-dashboard-panel`}
            >
              {/* Header - Non-scrolling */}
              <div className="p-6 pb-2 flex justify-between items-center shrink-0">
                <div>
                  <h2 className={`text-xl font-black tracking-tight ${config.accent}`}>DASHBOARD</h2>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${config.border} opacity-60 active:bg-white/10 text-base`}
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-4 space-y-6">
                {/* Navigation List - Vertical Stack */}
                <div className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                        (currentView === item.view && (item.view === 'resumes' || activeSection === item.id))
                          ? `${config.button} shadow-xl border-transparent`
                          : `bg-white/5 border-white/10 ${config.text} hover:bg-white/10`
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-bold uppercase tracking-[0.1em]">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {/* View Count */}
                  <div className={`p-3 rounded-xl border ${config.border} bg-white/5 flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">👀</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-shadow-sm">Total Reach</span>
                    </div>
                    <span className={`text-base font-black ${config.accent}`}>{totalViews.toLocaleString()}</span>
                  </div>

                  {/* Theme Controller */}
                  <div className={`p-3 rounded-xl border ${config.border} bg-white/5`}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="text-lg">🎨</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Atmosphere</span>
                    </div>
                    <div className="flex justify-between gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {themeOptions.map((opt) => (
                        <button
                          key={opt.mode}
                          onClick={() => setTheme(opt.mode)}
                          className={`w-8 h-8 min-w-[2rem] rounded-full flex items-center justify-center transition-all ${
                            theme === opt.mode ? 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/20' : 'bg-white/5 opacity-40'
                          }`}
                        >
                          <span className="text-base">{opt.icon}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admin Mode Toggle (Visible only if authenticated) */}
                  {isAuthenticated && (
                    <button
                      onClick={() => setIsAdmin(!isAdmin)}
                      className={`w-full p-3 rounded-xl border ${config.border} ${isAdmin ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5'} flex items-center justify-between active:scale-[0.98] transition-all`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{isAdmin ? '🔓' : '⚙️'}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isAdmin ? 'text-emerald-400' : ''}`}>Admin Controls</span>
                      </div>
                      <div className={`w-7 h-3.5 rounded-full relative transition-colors ${isAdmin ? 'bg-emerald-500' : 'bg-white/10'}`}>
                        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${isAdmin ? 'left-4' : 'left-0.5'}`} />
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Fixed Footer - Non-scrolling */}
              <div className="p-6 border-t border-white/5 space-y-3 shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                {!isAuthenticated ? (
                  <button
                    onClick={() => { onLoginClick(); setIsOpen(false); }}
                    className={`w-full py-3.5 rounded-xl font-bold border border-white/10 bg-white/5 ${config.text} active:bg-white/10 transition-all text-xs flex items-center justify-center gap-2`}
                  >
                    🛡️ Login to Admin Portal
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => { onNavigate('analytics'); setIsOpen(false); }}
                      className={`w-full py-3.5 rounded-xl font-bold bg-indigo-500 text-white transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/30 text-xs`}
                    >
                      📈 System Analytics
                    </button>
                    <button
                      onClick={() => {
                        import('firebase/auth').then(({ getAuth, signOut }) => {
                          const auth = getAuth();
                          signOut(auth);
                          setIsOpen(false);
                        });
                      }}
                      className={`w-full py-3.5 rounded-xl font-bold border border-red-500/30 bg-red-500/5 text-red-500 active:bg-red-500/10 transition-all text-xs`}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileDashboard;
