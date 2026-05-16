
import React, { useState } from 'react';
import { ThemeMode, AboutData } from '../types';
import { THEME_CONFIGS } from '../constants';
import { useScrollLock } from '../hooks/useScrollLock';

interface AboutProps {
  theme: ThemeMode;
  isAdmin: boolean;
  data: AboutData;
  onUpdate: (data: AboutData) => void;
  title: string;
  subtext: string;
  onTitleUpdate: () => void;
  onNavigate: () => void;
}

const About: React.FC<AboutProps> = ({ theme, isAdmin, data, onUpdate, title, subtext, onTitleUpdate, onNavigate }) => {
  const config = THEME_CONFIGS[theme];
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editForm, setEditForm] = useState<AboutData>(data);

  useScrollLock(isEditing || isExpanded);

  // Refined 3D cursor-based motion state
  const [parallax, setParallax] = useState({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  
  const dividerBg = config.accent.includes('gradient') 
    ? config.accent.replace('text-transparent', '').replace('bg-clip-text', '')
    : config.accent.replace('text-', 'bg-');

  const handleSave = () => {
    onUpdate(editForm);
    setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Logic for TRUE 3D reactive motion
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Normalize coordinates from -0.5 to 0.5
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setParallax({
      x: x * 12,        // Subtle magnetic pull (horizontal)
      y: y * 12,        // Subtle magnetic pull (vertical)
      rotateX: -y * 20, // Tilt vertically (invert Y for natural rotation)
      rotateY: x * 20   // Tilt horizontally
    });
  };

  const handleMouseLeave = () => {
    setParallax({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  };

  return (
    <section id="about" className="min-h-screen w-full py-12 flex flex-col justify-center">
      <div className="mb-10 reveal flex justify-between items-end max-w-5xl mx-auto w-full px-4 md:px-0">
        <div>
          <div className="flex items-center gap-3 relative">
            <h2 
              onClick={onNavigate}
              className={`text-3xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition-all ${config.accent}`}
            >
              {title}
            </h2>
            {isAdmin && (
              <button 
                onClick={onTitleUpdate}
                className="p-1 rounded bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/40 transition-colors text-[14px]"
                title="Edit Heading"
              >
                ✎
              </button>
            )}
          </div>
          <div className={`w-24 h-[1px] my-4 opacity-30 ${dividerBg}`} />
          <p className={`text-sm opacity-60 font-medium ${theme === 'light' ? 'text-slate-500' : ''}`}>{subtext}</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setEditForm(data); setIsEditing(true); }}
            className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold shadow-lg"
          >
            EDIT CONTENT
          </button>
        )}
      </div>
      
      <div className={`reveal p-5 md:p-10 rounded-[3.5rem] ${config.card} border shadow-2xl overflow-hidden max-w-5xl mx-auto w-full`}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={theme === 'light' ? 'text-slate-600' : 'text-inherit'}>
            <p className="text-base leading-relaxed mb-4 opacity-100 font-medium">{data.text1}</p>
            <p className="text-base leading-relaxed opacity-100 font-medium">{data.text2}</p>
          </div>

          <div className="relative flex justify-center">
            {/* Perspective Root */}
            <div 
              className="relative w-56 h-56 md:w-72 md:h-72"
              style={{ perspective: '1200px' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full" />
              
              {/* 3D CURSOR-BASED MOTION WRAPPER: Layers behind the CSS hover container */}
              <div 
                className="w-full h-full transition-transform duration-500 ease-out"
                style={{ 
                  transform: `rotateX(${parallax.rotateX}deg) rotateY(${parallax.rotateY}deg) translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* EXISTING HOVER CONTAINER: Preserves all current hover classes Exactly */}
                <div 
                  onClick={() => setIsExpanded(true)}
                  className="w-full h-full rounded-full border-4 border-white/10 overflow-hidden shadow-2xl relative z-10 bg-white/5 cursor-zoom-in transition-all duration-700 cubic-bezier(0.23, 1, 0.32, 1) hover:scale-[1.04] hover:-translate-y-2 hover:rotate-1 hover:shadow-indigo-500/20 group/aboutimg"
                >
                  <img src={data.imageUrl || undefined} alt="Pari Developer Illustration" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-white/0 group-hover/aboutimg:bg-white/5 transition-colors duration-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div 
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
          onClick={() => setIsExpanded(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-zoom-out detail-view-container" />
          
          <div className="absolute top-0 right-0 p-4 z-[70] pointer-events-none">
            <button 
              onClick={() => setIsExpanded(false)} 
              className="p-2.5 sm:p-3 rounded-full transition-all shadow-xl pointer-events-auto bg-white text-black border border-black/10 hover:bg-gray-100 active:scale-95"
              aria-label="Close modal"
            >
              <span className="text-lg sm:text-xl block leading-none font-bold">✕</span>
            </button>
          </div>

          <div 
            className="relative max-w-[320px] sm:max-w-sm max-h-[70vh] z-10 animate-in zoom-in-95 duration-500 ease-out flex items-center justify-center compact-modal overflow-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={data.imageUrl || undefined} alt="Expanded" className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl border border-white/10" />
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm detail-view-container" onClick={() => setIsEditing(false)} />
          <div className={`relative w-full max-w-2xl p-6 md:p-8 rounded-[2rem] border shadow-2xl flex flex-col max-h-[95vh] lg:max-h-[90vh] overflow-hidden ${config.card} text-white`}>
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-2xl font-bold text-white">Edit About Section</h3>
              <button onClick={() => setIsEditing(false)} className="p-2 rounded-full hover:bg-white/10 opacity-70 lg:hidden">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">First Paragraph</label>
                <textarea className="w-full mt-1 p-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" rows={4} value={editForm.text1} onChange={e => setEditForm({...editForm, text1: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Second Paragraph</label>
                <textarea className="w-full mt-1 p-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" rows={4} value={editForm.text2} onChange={e => setEditForm({...editForm, text2: e.target.value})} />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Illustration URL</label>
                  <label className="text-[10px] font-bold text-indigo-400 cursor-pointer hover:underline uppercase">
                    Upload File
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
                <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" value={editForm.imageUrl} onChange={e => setEditForm({...editForm, imageUrl: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4 mt-8 pt-4 border-t border-white/10 shrink-0">
              <button onClick={handleSave} className={`flex-1 py-3 rounded-xl font-bold ${config.button} text-white active:scale-95 transition-all`}>Save Changes</button>
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white active:scale-95 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default About;
