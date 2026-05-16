import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ThemeMode } from '../types';
import { THEME_CONFIGS } from '../constants';

interface BackgroundManagerProps {
  theme: ThemeMode;
  activeSection: string;
}

// Utility to generate randomized object data that persists per session/mount
const generateObjects = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    vx: (Math.random() - 0.5) * 2, 
    vy: (Math.random() - 0.5) * 2, 
    size: 50 + Math.random() * 200,
    speed: 0.2 + Math.random() * 0.5,
    angle: Math.random() * Math.PI * 2,
    colorOffset: Math.random(),
    rotationSpeed: (Math.random() - 0.5) * 0.05,
  }));
};

const BackgroundManager: React.FC<BackgroundManagerProps> = ({ theme, activeSection }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Persistent object data for themes
  const themeObjects = useMemo(() => ({
    light: generateObjects(65),
    yellow: generateObjects(8), // Planets for theme 2
    yellowStars: generateObjects(120), // More stars for theme 2 for richer depth
    gradient: generateObjects(32), // Slightly more for better distribution of mixed elements
    navy: generateObjects(18),
    violet: generateObjects(7),
  }), []);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      time += 0.015; 
      const { width, height } = dimensions;
      ctx.clearRect(0, 0, width, height);

      // --- THEME 1: LIGHT (Bubbles + New Subtle Micro-Elements) ---
      if (theme === 'light') {
        // Existing Bubbles
        ctx.globalAlpha = 0.8;
        themeObjects.light.forEach(obj => {
          let xPercent = (obj.x + time * obj.vx * 12) % 100;
          let yPercent = (obj.y + time * obj.vy * 12) % 100;
          if (xPercent < 0) xPercent += 100;
          if (yPercent < 0) yPercent += 100;
          const px = xPercent * width / 100;
          const py = yPercent * height / 100;
          const bubbleSize = 4 + (obj.size % 8);
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, bubbleSize, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.fill();
          const glintX = px - bubbleSize * 0.35;
          const glintY = py - bubbleSize * 0.35;
          const glintSize = bubbleSize * 0.55;
          const glintGrad = ctx.createRadialGradient(glintX, glintY, 0, glintX, glintY, glintSize);
          glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glintGrad;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.restore();
        });

        // Add Petals, Flowers, Hearts (Sparse, Small, Slow)
        const microCount = 20;
        for (let i = 0; i < microCount; i++) {
          const obj = themeObjects.light[i];
          // Extremely slow drift logic
          let xPercent = (obj.x + time * obj.vx * 0.2) % 100;
          let yPercent = (obj.y + time * obj.vy * 0.2) % 100;
          if (xPercent < 0) xPercent += 100;
          if (yPercent < 0) yPercent += 100;
          const px = xPercent * width / 100;
          const py = yPercent * height / 100;
          
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(obj.angle + time * 0.05);
          ctx.globalAlpha = 0.12; // Low opacity

          const type = i % 3; // 0: Petal, 1: Flower, 2: Heart
          const size = 5 + (obj.size % 6); // Very small
          
          if (type === 0) {
            // Petal
            ctx.beginPath();
            ctx.ellipse(0, 0, size, size / 1.8, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD1DC'; // Light pink petal
            ctx.fill();
          } else if (type === 1) {
            // Simple Flower
            const petals = 5;
            for (let j = 0; j < petals; j++) {
              ctx.rotate((Math.PI * 2) / petals);
              ctx.beginPath();
              ctx.ellipse(size / 1.5, 0, size / 1.2, size / 2.5, 0, 0, Math.PI * 2);
              ctx.fillStyle = '#FFF0F5'; // Lavender blush flower
              ctx.fill();
            }
          } else {
            // Heart
            ctx.beginPath();
            const hs = size * 0.8;
            ctx.moveTo(0, hs / 4);
            ctx.bezierCurveTo(0, 0, -hs, 0, -hs, hs / 2);
            ctx.bezierCurveTo(-hs, hs, 0, hs * 1.2, 0, hs * 1.5);
            ctx.bezierCurveTo(0, hs * 1.2, hs, hs, hs, hs / 2);
            ctx.bezierCurveTo(hs, 0, 0, 0, 0, hs / 4);
            ctx.fillStyle = '#FFC0CB'; // Pink heart
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // --- THEME 2: YELLOW (ACTIVE ANIMATED PLANETS & STARS) ---
      if (theme === 'yellow') {
        ctx.globalAlpha = 0.6;
        themeObjects.yellowStars.forEach(star => {
          let xPercent = (star.x + time * star.vx * 1.5) % 100;
          let yPercent = (star.y + time * star.vy * 1.5) % 100;
          if (xPercent < 0) xPercent += 100;
          if (yPercent < 0) yPercent += 100;
          const px = xPercent * width / 100;
          const py = yPercent * height / 100;
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = '#FEF3C7';
          ctx.fill();
        });

        const cx = width / 2;
        const cy = height / 2;
        ctx.globalAlpha = 0.85;

        themeObjects.yellow.forEach((obj, i) => {
          const driftX = Math.sin(time * 0.1 + obj.id) * 20;
          const driftY = Math.cos(time * 0.1 + obj.id) * 20;
          const orbitRadius = 150 + i * 110;
          const orbitSpeed = 0.003 + (0.005 / (i + 1));
          const angle = time * orbitSpeed + obj.angle;
          const px = cx + Math.cos(angle) * orbitRadius + driftX;
          const py = cy + Math.sin(angle) * orbitRadius + driftY;
          const size = 12 + obj.colorOffset * 18;

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(time * 0.08); 

          const colors = ['#FDE68A', '#FEF3C7', '#F59E0B', '#FCD34D', '#FFFBEB', '#D97706'];
          const planetColor = colors[i % colors.length];

          if (i === 1) {
            ctx.save();
            ctx.rotate(0.5); 
            ctx.strokeStyle = '#FEF3C7';
            ctx.globalAlpha = 0.4;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(0, 0, size * 2.5, size * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(0, 0, size * 2.1, size * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
            ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fillStyle = planetColor; ctx.shadowBlur = 12; ctx.shadowColor = planetColor; ctx.fill(); ctx.shadowBlur = 0;
          } else {
            ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fillStyle = planetColor; ctx.shadowBlur = 10; ctx.shadowColor = planetColor; ctx.fill(); ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.2; ctx.fillStyle = '#000';
            if (i % 2 === 0) { ctx.beginPath(); ctx.arc(-size*0.3, -size*0.3, size*0.4, 0, Math.PI*2); ctx.fill(); }
            else { ctx.fillRect(-size, -2, size*2, 4); }
          }
          ctx.restore();
        });
      }

      // --- THEME 3: MATHEMATICS x PHYSICS INTELLIGENCE FIELD ---
      if (theme === 'gradient') {
        const mathColors = ['#A5F3FC', '#F8FAFC', '#BFDBFE', '#C4B5FD'];
        const symbols = ['∑', '∫', 'π', '∞', 'Δ', 'λ', 'φ', '∇', '√', '∂'];
        
        ctx.globalAlpha = 0.04;
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = 1;
        for(let x = 0; x < width; x += 120) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for(let y = 0; y < height; y += 120) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        themeObjects.gradient.forEach((obj, i) => {
          let xPercent = (obj.x + time * obj.vx * 0.8) % 100;
          let yPercent = (obj.y + time * obj.vy * 0.8) % 100;
          if (xPercent < 0) xPercent += 100;
          if (yPercent < 0) yPercent += 100;
          const px = xPercent * width / 100;
          const py = yPercent * height / 100;
          const dx = px - width / 2;
          const distFromCenter = Math.abs(dx);
          const readabilityFactor = Math.min(1, distFromCenter / (width / 4));
          const color = mathColors[i % mathColors.length];
          
          ctx.save();
          ctx.translate(px, py);
          ctx.globalAlpha = 0.3 * (0.35 + 0.65 * readabilityFactor);
          
          const category = i % 2;
          if (category === 0) {
            const symbol = symbols[i % symbols.length];
            const size = 30 + (obj.size % 40);
            ctx.font = `${size}px serif`;
            ctx.fillStyle = color;
            ctx.shadowBlur = 8 * readabilityFactor;
            ctx.shadowColor = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.rotate(obj.angle + time * 0.1);
            ctx.fillText(symbol, 0, 0);
          }
          ctx.restore();
        });
      }

      // --- THEME 4: NAVY (Constellations) ---
      if (theme === 'navy') {
        ctx.globalAlpha = 0.4;
        const points = themeObjects.navy.map(obj => ({
          x: (obj.x * width / 100 + Math.sin(time * obj.speed * 0.5) * 40),
          y: (obj.y * height / 100 + Math.cos(time * obj.speed * 0.5) * 40),
          size: 4 + obj.colorOffset * 6
        }));
        points.forEach(p => {
          const pulse = (Math.sin(time * 2 + p.x) + 1) / 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.8 + pulse * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = '#64FFDA';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#64FFDA';
          ctx.fill();
          ctx.shadowBlur = 0;
        });
        ctx.strokeStyle = 'rgba(100, 255, 218, 0.2)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < points.length; i++) {
          const p1 = points[i];
          const closest = points
            .map((p, idx) => ({ dist: Math.hypot(p1.x - p.x, p1.y - p.y), idx }))
            .filter(d => d.idx !== i)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2);
          closest.forEach(c => {
            if (c.dist < 300) {
              ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(points[c.idx].x, points[c.idx].y); ctx.stroke();
            }
          });
        }
      }

      // --- THEME 5: VIOLET (Energy Streams) ---
      if (theme === 'violet') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 3;
        themeObjects.violet.forEach((obj, i) => {
          ctx.strokeStyle = '#DDD6FE'; 
          ctx.beginPath();
          const waveHeight = 100 + obj.colorOffset * 150;
          const frequency = 0.0015 + obj.speed * 0.001;
          const yBase = obj.y * height / 100;
          ctx.moveTo(0, yBase);
          for (let x = 0; x <= width; x += 15) {
            const dy = Math.sin(x * frequency + time * 0.1 + i) * waveHeight;
            ctx.lineTo(x, yBase + dy);
          }
          ctx.stroke();
          const particleX = (time * 12 * obj.speed + i * 250) % width;
          const particleY = yBase + Math.sin(particleX * frequency + time * 0.1 + i) * waveHeight;
          ctx.beginPath(); ctx.arc(particleX, particleY, 6, 0, Math.PI * 2); ctx.fillStyle = '#E9D5FF';
          ctx.shadowBlur = 20; ctx.shadowColor = '#C084FC'; ctx.fill(); ctx.shadowBlur = 0;
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [theme, dimensions, themeObjects]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-all duration-1000">
      <canvas ref={canvasRef} className="absolute inset-0 block" />
      <div className="absolute inset-0 bg-transparent" />
    </div>
  );
};

export default BackgroundManager;