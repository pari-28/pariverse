import React, { useState, useEffect, useRef } from 'react';
import { ThemeMode } from '../types';

interface CosmicTransitionProps {
  theme: ThemeMode;
  navKey: number; // Used to trigger animation only on manual navigation
}

const CosmicTransition: React.FC<CosmicTransitionProps> = ({ theme, navKey }) => {
  const [isWarping, setIsWarping] = useState(false);
  const [showVortex, setShowVortex] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const firstRender = useRef(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (reducedMotion) return;

    // Reset staggering states
    setShowVortex(false);
    setShowParticles(false);
    
    setIsWarping(true);

    if (theme === 'violet') {
      // Sync initial paint with RAF and stagger components
      requestAnimationFrame(() => {
        // Start Vortex/Rings immediately but staggered slightly for paint stability
        setTimeout(() => setShowVortex(true), 16); 
        // Delay heavy particle simulation slightly
        setTimeout(() => setShowParticles(true), 120);
      });
    } else {
      setShowVortex(true);
      setShowParticles(true);
    }

    const duration = theme === 'violet' ? 2400 : 950;
    const timer = setTimeout(() => {
      setIsWarping(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [navKey, reducedMotion, theme]);

  if (!isWarping || reducedMotion) return null;

  const renderThemeEffect = () => {
    switch (theme) {
      case 'light':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ perspective: '1200px' }}>
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[12px] animate-in fade-in duration-300" />
            <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
              {[...Array(20)].map((_, i) => {
                const size = 40 + Math.random() * 80;
                return (
                  <div 
                    key={i}
                    className="absolute rounded-full border border-indigo-500/20 bg-indigo-500/5 animate-bubble-3d"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      animationDelay: `${i * 0.04}s`,
                      boxShadow: 'inset 0 0 15px rgba(99, 102, 241, 0.2), 0 0 10px rgba(99, 102, 241, 0.1)',
                      backdropFilter: 'blur(6px)',
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      case 'yellow':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[5px]" />
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="absolute border-2 border-yellow-400/30 rounded-full animate-solar-spin"
                style={{
                  width: `${300 + i * 200}px`,
                  height: `${300 + i * 200}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
            <div className="w-48 h-48 rounded-full bg-yellow-400/20 blur-[100px] animate-core-zoom" />
          </div>
        );
      case 'gradient':
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ perspective: '1000px' }}>
            <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-[15px]" />
            
            <div className="absolute inset-0 grid grid-cols-12 gap-2 opacity-30">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="w-full h-full bg-purple-500/20 animate-travel-streak" style={{ animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>

            <div className="relative z-10 animate-missile-travel flex flex-col items-center">
               <div 
                 className="w-12 h-24 bg-gradient-to-t from-blue-500 via-purple-500 to-pink-500 rounded-full blur-[1px]"
                 style={{ 
                   clipPath: 'polygon(50% 0%, 100% 100%, 50% 85%, 0% 100%)',
                   boxShadow: '0 0 35px rgba(168, 85, 247, 0.7)'
                 }}
               />
               <div className="w-6 h-40 bg-gradient-to-b from-pink-500/60 to-transparent blur-[8px] -mt-2" />
            </div>

            <div className="absolute flex flex-wrap gap-12 justify-center max-w-2xl opacity-40 pointer-events-none">
              {['∑', '∫', 'π', '∞', 'Δ', 'λ'].map((sym, i) => (
                <span key={i} className="text-8xl font-serif text-white animate-core-zoom" style={{ animationDelay: `${i * 0.1}s` }}>
                  {sym}
                </span>
              ))}
            </div>
          </div>
        );
      case 'navy':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0A192F]/70 backdrop-blur-[12px]" style={{ perspective: '1200px' }}>
            <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
              {[...Array(60)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-[2px] h-[2px] bg-white rounded-full animate-galaxy-warp shadow-[0_0_12px_2px_rgba(100,255,218,0.9)]"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${0.7 + Math.random() * 0.3}s`,
                    opacity: 0.8 + Math.random() * 0.2
                  }}
                />
              ))}
              <div className="w-2 h-2 bg-[#64FFDA] rounded-full blur-[50px] animate-core-zoom" />
            </div>
          </div>
        );
      case 'violet':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[8px]">
            {/* Optimized Vortex SVG Layer */}
            {showVortex && (
              <div className="relative w-[140%] h-[140%] flex items-center justify-center">
                <svg className="absolute w-full h-full animate-vortex-spin" viewBox="0 0 1000 1000">
                  {[...Array(6)].map((_, i) => {
                    const radius = 100 + i * 140;
                    const circumference = 2 * Math.PI * radius;
                    return (
                      <circle 
                        key={i}
                        cx="500" 
                        cy="500" 
                        r={radius}
                        fill="none"
                        stroke="rgba(139, 92, 246, 0.15)"
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference}
                        className="animate-ring-draw"
                        style={{
                          animationDelay: `${i * 0.05}s`,
                        }}
                      />
                    );
                  })}
                </svg>
              </div>
            )}

            {/* Staggered Energy Particles */}
            {showParticles && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(35)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-violet-300 shadow-[0_0_12px_#A78BFA] animate-particle-inward"
                    style={{
                      left: '50%',
                      top: '50%',
                      animationDelay: `${Math.random() * 0.6}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Optimized Core Element */}
            <div className="absolute w-72 h-72 rounded-full bg-black shadow-[0_0_120px_50px_rgba(139,92,246,0.5)] animate-core-zoom flex items-center justify-center">
               <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-700/30 to-transparent blur-2xl" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden cosmic-transition-layer">
      {renderThemeEffect()}
    </div>
  );
};

export default CosmicTransition;