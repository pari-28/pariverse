
import React, { useState, useEffect } from 'react';
import { ThemeMode, ProfileData } from '../types';
import { THEME_CONFIGS } from '../constants';
import { useScrollLock } from '../hooks/useScrollLock';

interface HomeProps {
  theme: ThemeMode;
  isAdmin: boolean;
  data: ProfileData;
  onUpdate: (data: ProfileData) => void;
  onNavigate: (sectionId: string) => void;
}

const Home: React.FC<HomeProps> = ({ theme, isAdmin, data, onUpdate, onNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ProfileData>(data);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const config = THEME_CONFIGS[theme];

  useScrollLock(isModalOpen || isEditing);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) * 0.015;
      const y = (e.clientY - window.innerHeight / 2) * 0.015;
      setOffset({ x, y });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleCloseModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const handleSave = () => {
    onUpdate(editForm);
    setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof ProfileData) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section id="home" className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center gap-8 relative overflow-visible py-12">
      <div className="relative group z-20 pointer-events-auto">
        <button 
          type="button"
          className="relative z-10 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 rounded-full"
          onClick={handleOpenModal}
          aria-label="Open Profile Card"
        >
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-4 border-white/20 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative">
            <img 
              src={data.imageUrl || undefined} 
              alt={data.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </button>
        
        <div className="absolute top-[calc(100%+1rem)] left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
          <span className={`${data.isOpenToWork ? 'bg-emerald-500' : 'bg-slate-500'} text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg`}>
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            {data.isOpenToWork ? 'Open to Work' : 'Busy Building'}
          </span>
        </div>

        {isAdmin && (
          <button 
            onClick={() => { setEditForm(data); setIsEditing(true); }}
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg z-30 text-xs"
          >
            ✏️
          </button>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto detail-view-container"
            onClick={handleCloseModal}
          />
          
          <div className={`relative w-full max-w-[340px] rounded-[3rem] md:rounded-[4rem] flex flex-col overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-500 border border-white/20 ${config.card} pointer-events-auto max-h-[95vh] landscape:max-h-[98vh]`}>
            
            <div className="pt-8 pb-2 px-8 flex justify-end items-start shrink-0">
               <button 
                 onClick={handleCloseModal}
                 className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-30 hover:opacity-100 z-10 active:scale-90"
                 aria-label="Close profile"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar overscroll-contain">
              <div className="flex flex-col items-center text-center">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-white/10 overflow-hidden shadow-2xl mb-8 ring-8 ring-black/5 transition-transform hover:scale-105 duration-500 shrink-0">
                  <img 
                    src={data.imageUrl || undefined} 
                    alt={data.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400";
                    }}
                  />
                </div>

                <div className="flex flex-col mb-1">
                  <span className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-white' : config.text} opacity-90 uppercase`}>
                    {data.name}
                  </span>
                </div>

                <div className="w-full h-[1px] bg-white/10 my-6" />

                <div className="w-full space-y-5">
                  <div className="flex flex-col items-center">
                    <span className={`text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-1 ${theme === 'light' ? 'text-white' : ''}`}>POSITION</span>
                    <span className={`text-[10px] font-bold opacity-80 uppercase leading-tight tracking-wider ${theme === 'light' ? 'text-white' : ''}`}>
                      {data.position}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className={`text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-1 ${theme === 'light' ? 'text-white' : ''}`}>ORGANIZATION</span>
                    <span className={`text-[10px] font-bold opacity-80 uppercase leading-tight tracking-wider ${theme === 'light' ? 'text-white' : ''}`}>
                      {data.organization}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 w-full gap-4 pt-4 border-t border-white/5 mt-2">
                    <div className="flex flex-col items-center border-r border-white/10 pr-4">
                      <span className={`text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-1 ${theme === 'light' ? 'text-white' : ''}`}>DEPARTMENT</span>
                      <span className={`text-[10px] font-bold opacity-80 uppercase tracking-tight ${theme === 'light' ? 'text-white' : ''}`}>{data.department}</span>
                    </div>
                    <div className="flex flex-col items-center pl-4">
                      <span className={`text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-1 ${theme === 'light' ? 'text-white' : ''}`}>STATUS</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${data.isOpenToWork ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-400'}`} />
                        <span className={`font-black uppercase tracking-widest text-[9px] ${data.isOpenToWork ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {data.isOpenToWork ? 'Active' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto py-5 px-8 bg-white/5 border-t border-white/5 flex flex-col items-center shrink-0">
              <div className="flex gap-1 h-2 opacity-10 mb-1">
                {[3, 5, 2, 4, 3, 6, 2, 3, 5, 4, 3, 2, 4].map((w, i) => (
                  <div key={i} className="h-full bg-white rounded-full" style={{ width: `${w}px` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm detail-view-container" onClick={() => setIsEditing(false)} />
          <div className={`relative w-full max-w-lg rounded-[2rem] border shadow-2xl ${config.card} flex flex-col max-h-[95vh] landscape:max-h-[98vh] text-white overflow-hidden`}>
            <div className="p-6 md:p-8 shrink-0 flex justify-between items-center bg-white/5">
              <h3 className="text-2xl font-bold text-white">Edit Home Section</h3>
              <button onClick={() => setIsEditing(false)} className="p-2 rounded-full hover:bg-white/10 opacity-70 lg:hidden transition-all active:scale-90">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar overscroll-contain">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Greeting Text</label>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" value={editForm.greeting} onChange={e => setEditForm({...editForm, greeting: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Full Name</label>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Tagline (Intro Text)</label>
                  <textarea className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" rows={3} value={editForm.tagline} onChange={e => setEditForm({...editForm, tagline: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Position</label>
                    <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Organization</label>
                    <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" value={editForm.organization} onChange={e => setEditForm({...editForm, organization: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Department</label>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} />
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Profile Image URL</label>
                    <label className="text-[10px] font-bold text-indigo-400 cursor-pointer hover:underline uppercase transition-colors">
                      Upload File
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} />
                    </label>
                  </div>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" value={editForm.imageUrl} onChange={e => setEditForm({...editForm, imageUrl: e.target.value})} />
                </div>
                <div className="flex items-center gap-3 py-2 text-white">
                  <input type="checkbox" id="isOpenToWork" className="w-5 h-5 rounded border-white/10 bg-white/5 accent-emerald-500 transition-all cursor-pointer" checked={editForm.isOpenToWork} onChange={e => setEditForm({...editForm, isOpenToWork: e.target.checked})} />
                  <label htmlFor="isOpenToWork" className="text-sm font-bold opacity-90 cursor-pointer text-white select-none">Open to Work Status</label>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-8 pt-4 border-t border-white/10 shrink-0 flex gap-4 bg-white/5">
              <button onClick={handleSave} className={`flex-1 py-3 rounded-xl font-bold ${config.button} text-white transition-all active:scale-95`}>Save Changes</button>
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white transition-all active:scale-95">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-initial text-center lg:text-left reveal active z-10 w-full" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
        <div className={`${config.card} p-5 md:p-10 rounded-[3.5rem] border shadow-2xl w-full max-w-5xl mx-auto relative overflow-hidden group/hero`}>

          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 group-hover/hero:opacity-70 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
            <h2 className={`text-base md:text-xl font-medium opacity-80 mb-3 flex items-center justify-center lg:justify-start gap-3 text-balance ${theme === 'light' ? 'text-slate-500' : ''}`}>{data.greeting}</h2>
            <h1 className={`text-3xl sm:text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight text-balance ${config.accent}`}>{data.name}</h1>
            <h2 className={`text-base md:text-lg leading-relaxed opacity-90 font-medium text-balance ${theme === 'light' ? 'text-slate-600' : ''}`}>{data.tagline}</h2>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-8">
              <button onClick={() => onNavigate('contact')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 ${config.button}`}>Start a Conversation</button>
              <button onClick={() => onNavigate('projects')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${config.border} hover:bg-white/10 backdrop-blur-sm ${theme === 'light' ? 'text-slate-600' : ''}`}>View My Work</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
