
import React, { useState, useEffect, useRef } from 'react';
import { ThemeMode, Education } from '../types';
import { THEME_CONFIGS } from '../constants';
import DeleteConfirmModal from './DeleteConfirmModal';
import { useScrollLock } from '../hooks/useScrollLock';

interface Props {
  theme: ThemeMode;
  isAdmin: boolean;
  educations: Education[];
  setEducations: React.Dispatch<React.SetStateAction<Education[]>>;
  title: string;
  subtext: string;
  onTitleUpdate: () => void;
  // Added onNavigate to match usage in App.tsx
  onNavigate: () => void;
}

const EducationSection: React.FC<Props> = ({ theme, isAdmin, educations, setEducations, title, subtext, onTitleUpdate, onNavigate }) => {
  const config = THEME_CONFIGS[theme];
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<Education | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useScrollLock(!!isEditing || !!deletingId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(event.target as Node)) {
        setFocusedId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFocusedId(focusedId === id ? null : id);
  };

  const dividerBg = config.accent.includes('gradient') 
    ? config.accent.replace('text-transparent', '').replace('bg-clip-text', '')
    : config.accent.replace('text-', 'bg-');

  const handleAdd = () => {
    setIsEditing({ id: Math.random().toString(36).substr(2, 9), degree: '', institution: '', year: '', highlight: '' });
  };

  const handleEdit = (edu: Education, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(edu);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      setEducations(prev => prev.filter(e => e.id !== deletingId));
      setDeletingId(null);
    }
  };

  const handleSave = () => {
    if (!isEditing) return;
    setEducations(prev => {
      const exists = prev.find(e => e.id === isEditing.id);
      if (exists) return prev.map(e => e.id === isEditing.id ? isEditing : e);
      return [...prev, isEditing];
    });
    setIsEditing(null);
  };

  return (
    <section 
      id="education" 
      className="min-h-screen w-full py-12 flex flex-col justify-center"
      ref={sectionRef}
    >
      <div className="flex justify-between items-end mb-10 reveal max-w-5xl mx-auto w-full px-4 md:px-0">
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
              >
                ✎
              </button>
            )}
          </div>
          <div className={`w-24 h-[1px] my-4 opacity-30 ${dividerBg}`} />
          <p className={`text-sm opacity-60 font-medium ${theme === 'light' ? 'text-slate-500' : ''}`}>{subtext}</p>
        </div>
        {isAdmin && (
          <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold shadow-lg">
            + ADD
          </button>
        )}
      </div>

      <div className="relative w-full overflow-visible">
        <div className={`reveal p-5 md:p-10 rounded-[3.5rem] ${config.card} border shadow-2xl relative transition-all duration-500 max-w-5xl mx-auto w-full`}>
          
          <div 
            className="absolute left-6 md:left-20 top-10 bottom-10 w-[2px] opacity-20"
            style={{ background: `linear-gradient(to bottom, ${config.primaryColor}, transparent)` }}
          />

          <div className="relative space-y-6">
            {educations.map((edu) => {
              const isFocused = focusedId === edu.id;
              const isAnyFocused = focusedId !== null;

              return (
                <div 
                  key={edu.id} 
                  className={`relative pl-10 md:pl-24 transition-all duration-500 ease-out cursor-pointer ${
                    isFocused ? 'z-20 scale-[1.03]' : 'z-10'
                  } ${isAnyFocused && !isFocused ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
                  onClick={(e) => handleItemClick(edu.id, e)}
                >
                  <div 
                    className={`absolute left-[22px] md:left-[86px] top-7 w-2.5 h-2.5 rounded-full ring-4 ring-white/10 transition-all duration-500`} 
                    style={{ 
                      backgroundColor: config.primaryColor,
                      boxShadow: isFocused ? `0 0 15px ${config.primaryColor}` : 'none',
                      transform: isFocused ? 'scale(1.4)' : 'scale(1)'
                    }}
                  />
                  
                  <div className={`p-5 rounded-[2rem] border transition-all duration-500 ${
                    isFocused 
                      ? 'bg-black/20 border-white/40 shadow-2xl backdrop-blur-3xl' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  } relative`}>
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex gap-2 z-20">
                         <button onClick={(e) => handleEdit(edu, e)} className="p-1.5 bg-blue-500 text-white rounded text-[10px]">✏️</button>
                         <button onClick={(e) => handleDelete(edu.id, e)} className="p-1.5 bg-red-500 text-white rounded text-[10px]">🗑️</button>
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                      <div>
                        <h3 className={`text-base font-bold transition-colors ${isFocused ? config.accent : (theme === 'light' ? 'text-black' : '')}`}>{edu.degree}</h3>
                        <p className={`text-xs font-medium opacity-80 ${theme === 'light' ? 'text-slate-600' : ''}`}>{edu.institution}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className={`text-[10px] opacity-60 font-mono font-bold ${theme === 'light' ? 'text-slate-500' : ''}`}>{edu.year}</span>
                      </div>
                    </div>

                    <div className={`grid transition-all duration-500 ease-in-out ${isFocused ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="pt-4 border-t border-white/10">
                          <p className={`text-sm leading-relaxed opacity-90 italic ${theme === 'light' ? 'text-white' : ''}`}>
                            "{edu.highlight}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm detail-view-container" onClick={() => setIsEditing(null)} />
          <div className={`relative w-full max-w-lg rounded-[2rem] border shadow-2xl flex flex-col max-h-[95vh] landscape:max-h-[98vh] ${config.card} text-white overflow-hidden`}>
            <div className="p-6 md:p-8 shrink-0 flex justify-between items-center bg-white/5">
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Edit Education</h3>
              <button onClick={() => setIsEditing(null)} className="p-2 rounded-full hover:bg-white/10 opacity-70 lg:hidden transition-all active:scale-90">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar overscroll-contain">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Degree</label>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.degree} onChange={e => setIsEditing({...isEditing, degree: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Institution</label>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.institution} onChange={e => setIsEditing({...isEditing, institution: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Year</label>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.year} onChange={e => setIsEditing({...isEditing, year: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Highlight</label>
                  <textarea className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" rows={3} value={isEditing.highlight} onChange={e => setIsEditing({...isEditing, highlight: e.target.value})} />
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-8 pt-4 border-t border-white/10 shrink-0 flex gap-4 bg-white/5">
              <button onClick={handleSave} className={`flex-1 py-3 rounded-xl font-bold ${config.button} text-white transition-all active:scale-95`}>Save</button>
              <button onClick={() => setIsEditing(null)} className="flex-1 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white transition-all active:scale-95">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={!!deletingId}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
        title="Delete Education?"
        description="Are you sure you want to delete this education entry? This action cannot be undone."
        config={config}
      />
    </section>
  );
};

export default EducationSection;
