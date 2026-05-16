
import React, { useState } from 'react';
import { ThemeMode } from '../types';
import { THEME_CONFIGS } from '../constants';

interface AdminToggleProps {
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  theme: ThemeMode;
  onLogout: () => void;
}

const AdminToggle: React.FC<AdminToggleProps> = ({ isAdmin, setIsAdmin, theme, onLogout }) => {
  const config = THEME_CONFIGS[theme] || THEME_CONFIGS['light'];
  const [shouldHide, setShouldHide] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (window.innerWidth < 1024) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
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

  return (
    <div className={`fixed bottom-24 lg:bottom-6 left-6 z-[60] flex-col items-start gap-2 transition-all duration-500 pointer-events-none admin-toggle-ui hidden lg:flex ${
      shouldHide ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
    }`}>
      {isAdmin && (<div className="animate-in fade-in slide-in-from-bottom-1 duration-300 ml-1.5"><span className="text-xs font-black uppercase tracking-[0.3em] opacity-50 whitespace-nowrap">Admin Mode</span></div>)}
      <div className="flex flex-col gap-3">
        <button onClick={() => setIsAdmin(!isAdmin)} className={`pointer-events-auto group p-3 rounded-xl border ${config.border} flex items-center justify-center transition-all overflow-hidden ${isAdmin ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-black/20 opacity-40 hover:opacity-100 shadow-sm'}`}><span className="text-2xl transform transition-transform group-hover:scale-105 select-none">{isAdmin ? '🔓' : '⚙️'}</span></button>
        <button onClick={onLogout} className={`pointer-events-auto group p-3 rounded-xl border ${config.border} flex items-center justify-center transition-all bg-red-500/10 hover:bg-red-500 border-red-500/20 text-red-500 hover:text-white shadow-sm opacity-60 hover:opacity-100`}><span className="text-sm font-black uppercase tracking-widest px-1">Exit</span></button>
      </div>
    </div>
  );
};

export default AdminToggle;
