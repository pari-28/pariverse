
import React, { useState, useEffect, useRef } from 'react';
import { ThemeMode } from '../types';
import { THEME_CONFIGS } from '../constants';

const CustomCursor: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const config = THEME_CONFIGS[theme];
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  
  const mousePos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // We don't return null anymore, but we track if we should show the cursor
    // Many modern tablets and certain mobile views support mouse input
    const handleMouseMove = (e: MouseEvent) => {
      // If we detect mouse move, we definitely want the custom cursor
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
      
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    const handleTouchStart = () => {
      // Hide cursor dot on touch start to prevent it following the finger awkwardly
      setIsVisible(false);
      setIsTouch(true);
    };

    const handleMouseDown = () => {
      if (ringRef.current) ringRef.current.style.transform = `${ringRef.current.style.transform} scale(0.85)`;
    };

    const handleMouseUp = () => {
      // Scale is handled by the animation loop mostly, but we reset here
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Animation loop for smooth ring easing
    let rafId: number;
    const animate = () => {
      const easing = 0.15;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * easing;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * easing;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px)`;
      }
      
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(rafId);
      document.body.style.cursor = 'auto';
    };
  }, [isVisible]);

  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-300 custom-cursor-layer ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden="true"
    >
      {/* Small Solid Dot */}
      <div 
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 -ml-0.75 -mt-0.75 rounded-full z-10"
        style={{ backgroundColor: config.primaryColor }}
      />
      
      {/* Thin Circular Ring */}
      <div 
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full border border-current transition-transform duration-75 ease-out"
        style={{ 
          color: config.primaryColor,
          opacity: 0.4,
          borderWidth: '1px'
        }}
      />
      
      {isVisible && (
        <style>{`
          * { cursor: none !important; }
        `}</style>
      )}
    </div>
  );
};

export default CustomCursor;
