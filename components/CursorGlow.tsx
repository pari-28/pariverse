
import React, { useState, useEffect, useRef } from 'react';
import { ThemeMode } from '../types';

const CURSOR_COLORS: Record<string, string> = {
  light: 'rgba(56, 189, 248, 0.15)', // Light blue (Sky 400)
  yellow: 'rgba(250, 204, 21, 0.12)', // Yellow 400
  gradient: 'rgba(168, 85, 247, 0.12)', // Purple 500
  navy: 'rgba(100, 255, 218, 0.1)',   // Teal/Cyan (Navy Accent)
  violet: 'rgba(139, 92, 246, 0.12)', // Violet 500
};

const CursorGlow: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const [opacity, setOpacity] = useState(0);
  const timerRef = useRef<number | null>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable on touch devices to ensure performance and avoid ghost effects
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      // Direct DOM manipulation for maximum performance and "instant" feel
      const x = 'clientX' in e ? e.clientX : e.touches[0].clientX;
      const y = 'clientY' in e ? e.clientY : e.touches[0].clientY;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${x - 200}px, ${y - 200}px)`;
      }
      
      setOpacity(1);

      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setOpacity(0);
      }, 1000); // Fades out slowly when stationary
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const color = CURSOR_COLORS[theme] || CURSOR_COLORS.light;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100] overflow-hidden cursor-glow-layer"
      aria-hidden="true"
    >
      <div
        ref={glowRef}
        className="transition-opacity duration-1000 ease-in-out"
        style={{
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: opacity,
          willChange: 'transform',
        }}
      />
    </div>
  );
};

export default CursorGlow;
