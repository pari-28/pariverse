import React from 'react';
import { ThemeMode } from '../types';
import { THEME_CONFIGS } from '../constants';

interface NavbarProps {
  activeSection: string;
  theme: ThemeMode;
  currentView: 'main' | 'resumes' | 'analytics';
  onNavigate: (view: 'main' | 'resumes' | 'analytics', sectionId?: string) => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  activeSection, 
  theme, 
  currentView, 
  onNavigate, 
  isAuthenticated, 
  onLoginClick, 
  onLogoutClick 
}) => {
  const config = THEME_CONFIGS[theme] || THEME_CONFIGS['light'];
  
  const navItems = [
    { label: 'Home', id: 'home', view: 'main' },
    { label: 'About', id: 'about', view: 'main' },
    { label: 'Skills', id: 'skills', view: 'main' },
    { label: 'Experience', id: 'experience', view: 'main' },
    { label: 'Certificates', id: 'certificates', view: 'main' },
    { label: 'Projects', id: 'projects', view: 'main' },
    { label: 'Coding Profiles', id: 'coding-profiles', view: 'main' },
    { label: 'Education', id: 'education', view: 'main' },
    { label: 'Contact', id: 'contact', view: 'main' },
    { label: 'Resume', id: 'resume', view: 'resumes' },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    onNavigate(item.view as 'main' | 'resumes' | 'analytics', item.view === 'main' ? item.id : undefined);
  };

  return (
    <nav className={`fixed top-4 lg:top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 lg:px-1 lg:py-0.5 rounded-full border transition-all duration-300 ${config.nav} ${config.border} backdrop-blur-xl hidden lg:flex items-center gap-1`}>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNavClick(item)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            (currentView === item.view && (item.view === 'resumes' || activeSection === item.id))
              ? `${config.button} scale-105` 
              : `hover:bg-white/10 ${config.text}`
          }`}
        >
          {item.label}
        </button>
      ))}
      
      {/* Auth Action Button - Always last item in Navbar */}
      <button
        onClick={isAuthenticated ? onLogoutClick : onLoginClick}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border border-transparent ${
          isAuthenticated 
            ? 'hover:bg-red-500/10 text-red-500' 
            : `hover:bg-white/10 ${config.text}`
        }`}
      >
        {isAuthenticated ? 'Logout' : 'Login'}
      </button>
    </nav>
  );
};

export default Navbar;