
import React, { useState, useEffect } from 'react';
import { ThemeMode } from '../types';
import { THEME_CONFIGS } from '../constants';

interface ThemeSwitcherProps {
  currentTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, setTheme }) => {
  const config = THEME_CONFIGS[currentTheme] || THEME_CONFIGS['light'];
  const [showGroupLabel, setShowGroupLabel] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<ThemeMode | null>(null);

  const themes: { mode: ThemeMode; icon: string; color: string }[] = [
    { mode: 'light', icon: '🌞', color: 'bg-white' },
    { mode: 'yellow', icon: '🌑', color: 'bg-yellow-400' },
    { mode: 'gradient', icon: '🌌', color: 'bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500' },
    { mode: 'navy', icon: '🌊', color: 'bg-slate-800' },
    { mode: 'violet', icon: '💜', color: 'bg-violet-600' },
  ];

  const [shouldHide, setShouldHide] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
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
    <div 
      className={`fixed right-6 top-1/2 -translate-y-1/2 z-[60] flex-col items-center gap-2.5 group transition-all duration-500 pointer-events-auto theme-switcher-ui hidden lg:flex ${
        shouldHide ? 'translate-x-[150%] opacity-0' : 'translate-x-0 opacity-100'
      }`}
      onMouseEnter={() => setShowGroupLabel(true)}
      onMouseLeave={() => {
        setShowGroupLabel(false);
        setHoveredMode(null);
      }}
    >
      <div className={`absolute -top-10 right-0 transition-all duration-300 transform ${showGroupLabel ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-2'} pointer-events-none`}>
        <span className="text-xs font-black uppercase tracking-[0.3em] whitespace-nowrap">Modes</span>
      </div>
      {themes.map((t) => (
        <div key={t.mode} className="relative flex items-center justify-end">
          <div className={`absolute right-full mr-4 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap border transition-all duration-200 pointer-events-none ${hoveredMode === t.mode ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'} ${config.card} ${config.border} shadow-xl`}>
            {THEME_CONFIGS[t.mode].label}
          </div>
          <button onClick={() => setTheme(t.mode)} onMouseEnter={() => setHoveredMode(t.mode)} onMouseLeave={() => setHoveredMode(null)} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 hover:scale-125 hover:rotate-12 ${currentTheme === t.mode ? 'ring-2 ring-offset-2 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'} ${t.color} shadow-inner border border-black/10`} style={{ borderColor: currentTheme === t.mode ? config.primaryColor : 'transparent', boxShadow: currentTheme === t.mode ? `0 0 15px ${config.primaryColor}50` : '' }}>{t.icon}</button>
        </div>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
