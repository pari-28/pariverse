
import React, { useState, useEffect } from 'react';
import { ThemeMode, Experience } from '../types';
import { THEME_CONFIGS } from '../constants';
import DeleteConfirmModal from './DeleteConfirmModal';
import { useScrollLock } from '../hooks/useScrollLock';

import CertificateViewer from './CertificateViewer';
import PdfLivePreview from './PdfLivePreview';

interface Props {
  theme: ThemeMode;
  isAdmin: boolean;
  experiences: Experience[];
  setExperiences: React.Dispatch<React.SetStateAction<Experience[]>>;
  title: string;
  subtext: string;
  onTitleUpdate: () => void;
  onNavigate: () => void;
}

const ExperienceSection: React.FC<Props> = ({ theme, isAdmin, experiences, setExperiences, title, subtext, onTitleUpdate, onNavigate }) => {
  const config = THEME_CONFIGS[theme];
  const [activeExp, setActiveExp] = useState<Experience | null>(null);
  const [mediumCertUrl, setMediumCertUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<Experience | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useScrollLock(!!activeExp || !!isEditing || !!deletingId || !!mediumCertUrl);

  const isLightTheme = theme === 'light';

  const dividerBg = config.accent.includes('gradient') 
    ? config.accent.replace('text-transparent', '').replace('bg-clip-text', '')
    : config.accent.replace('text-', 'bg-');

  const handleAdd = () => {
    setIsEditing({ id: Math.random().toString(36).substr(2, 9), role: '', organization: '', duration: '', description: [''], certificateImageUrl: '', verificationId: '', verificationUrl: '', order: experiences.length });
  };

  const handleEdit = (exp: Experience, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(exp);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      setExperiences(prev => prev.filter(exp => exp.id !== deletingId));
      setDeletingId(null);
    }
  };

  const handleSave = () => {
    if (!isEditing) return;
    setExperiences(prev => {
      const exists = prev.find(e => e.id === isEditing.id);
      if (exists) return prev.map(e => e.id === isEditing.id ? isEditing : e);
      return [...prev, isEditing];
    });
    setIsEditing(null);
  };

  const isPdf = (url: string) => url?.startsWith('data:application/pdf') || url?.toLowerCase().endsWith('.pdf');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isEditing) {
      if (file.size > 800 * 1024) {
        // If it's an image, we can try to compress it
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;

              // Keep aspect ratio but cap dimensions if very large
              const maxDim = 1200;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);

              // Compress to jpeg with quality adjustment
              let quality = 0.7;
              let dataUrl = canvas.toDataURL('image/jpeg', quality);
              
              // If still too large, try lower quality
              if (dataUrl.length > 1000000) {
                quality = 0.5;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
              }
              
              if (dataUrl.length > 1000000) {
                alert("The image is too high resolution even after compression. Please use a smaller file.");
                return;
              }

              setIsEditing({ ...isEditing, certificateImageUrl: dataUrl });
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
          return;
        } else {
          alert("File size too large. For PDFs, please upload a file smaller than 800KB to fit within database limits.");
          return;
        }
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setIsEditing({ ...isEditing, certificateImageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const sortedExperiences = [...experiences].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <section id="experience" className="min-h-screen w-full py-12 flex flex-col justify-center">
      <div className="flex justify-between items-end mb-10 reveal max-w-5xl mx-auto w-full px-4 md:px-0">
        <div>
          <div className="flex items-center gap-3 relative">
            <h2 onClick={onNavigate} className={`text-3xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition-all ${config.accent}`}>{title}</h2>
            {isAdmin && <button onClick={onTitleUpdate} className="p-1 rounded bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/40 transition-colors text-[14px]">✎</button>}
          </div>
          <div className={`w-24 h-[1px] my-4 opacity-30 ${dividerBg}`} />
          <p className={`text-sm opacity-60 font-medium ${isLightTheme ? 'text-slate-500' : ''}`}>{subtext}</p>
        </div>
        {isAdmin && <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold shadow-lg">+ ADD</button>}
      </div>

      <div className={`reveal p-5 md:p-10 rounded-[3.5rem] ${config.card} border shadow-2xl max-w-5xl mx-auto w-full`}>
        <div className="space-y-6">
          {sortedExperiences.map((exp) => (
            <div 
              key={exp.id} 
              className={`p-6 rounded-3xl border border-white/5 bg-white/5 transition-all duration-300 hover:border-white/20 hover:scale-[1.01] cursor-pointer group relative`}
              onClick={() => setActiveExp(exp)}
            >
              {isAdmin && (
                <div className="absolute top-3 right-3 flex gap-2">
                   <button onClick={(e) => handleEdit(exp, e)} className="p-1.5 bg-blue-500 text-white rounded-lg text-[10px]">✏️</button>
                   <button onClick={(e) => handleDelete(exp.id, e)} className="p-1.5 bg-red-500 text-white rounded-lg text-[10px]">🗑️</button>
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className={`text-xl font-bold transition-colors ${isLightTheme ? 'group-hover:text-black text-black' : 'group-hover:text-indigo-400'}`}>{exp.role}</h3>
                  <p className={`text-base font-medium ${isLightTheme ? 'text-slate-600' : config.accent}`}>{exp.organization}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 ${isLightTheme ? 'text-slate-500' : ''}`}>{exp.duration}</span>
                </div>
              </div>
              <ul className="space-y-2">
                {exp.description.slice(0, 2).map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 opacity-90 leading-relaxed text-sm line-clamp-1">
                    <span className={`mt-1.5 min-w-[5px] h-[5px] rounded-full ${isLightTheme ? 'bg-slate-400' : config.button.split(' ')[0]}`} />
                    <span className={isLightTheme ? 'text-slate-600' : ''}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm detail-view-container" onClick={() => setIsEditing(null)} />
          <div className={`relative w-full max-w-2xl rounded-[2rem] border shadow-2xl flex flex-col max-h-[95vh] landscape:max-h-[98vh] compact-modal ${config.card} text-white overflow-hidden`}>
            <div className="p-6 md:p-8 shrink-0 flex justify-between items-center bg-white/5">
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Edit Experience</h3>
              <button onClick={() => setIsEditing(null)} className="p-2 rounded-full hover:bg-white/10 opacity-70 lg:hidden transition-all active:scale-90">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar overscroll-contain">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Role</label>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.role} onChange={e => setIsEditing({...isEditing, role: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Organization</label>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.organization} onChange={e => setIsEditing({...isEditing, organization: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Duration</label>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.duration} onChange={e => setIsEditing({...isEditing, duration: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Display Order</label>
                  <input 
                    type="number" 
                    className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" 
                    value={isEditing.order || 0} 
                    onChange={e => setIsEditing({...isEditing, order: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Verification ID</label>
                    <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.verificationId || ''} onChange={e => setIsEditing({...isEditing, verificationId: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Verification Link</label>
                    <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.verificationUrl || ''} onChange={e => setIsEditing({...isEditing, verificationUrl: e.target.value})} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Certificate Image URL</label>
                    <label className="text-[10px] font-bold text-indigo-400 cursor-pointer hover:underline uppercase transition-colors">
                      Upload File
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                    </label>
                  </div>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" value={isEditing.certificateImageUrl} onChange={e => setIsEditing({...isEditing, certificateImageUrl: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Description Bullets</label>
                  <textarea className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white focus:ring-2 focus:ring-indigo-500" rows={4} value={isEditing.description.join('\n')} onChange={e => setIsEditing({...isEditing, description: e.target.value.split('\n')})} />
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

      {activeExp && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 md:p-12 animate-in fade-in duration-300" onClick={() => setActiveExp(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer detail-view-container" />
          <div 
            className={`relative max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-[2rem] shadow-2xl border flex flex-col compact-modal ${isLightTheme ? 'bg-white/90 backdrop-blur-3xl text-slate-600 border-black/5' : config.card}`}
            onClick={(e) => e.stopPropagation()}
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Sticky/Fixed Close Button Container */}
            <div className="absolute top-0 right-0 p-4 z-[70] pointer-events-none">
              <button 
                onClick={() => setActiveExp(null)} 
                className="p-2.5 sm:p-3 rounded-full transition-all shadow-xl pointer-events-auto bg-white text-black border border-black/10 hover:bg-gray-100 active:scale-95"
                aria-label="Close modal"
              >
                <span className="text-lg sm:text-xl block leading-none font-bold">✕</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="flex flex-col lg:grid lg:grid-cols-2">
                <div className={`p-6 sm:p-8 border-b lg:border-b-0 lg:border-r ${isLightTheme ? 'border-black/5' : 'border-white/10'}`}>
                  <h3 className={`text-xl sm:text-2xl font-bold mb-1 sm:mb-2 pr-12 ${isLightTheme ? 'text-black' : ''}`}>{activeExp.role}</h3>
                  <p className={`text-base sm:text-lg font-medium ${isLightTheme ? 'text-slate-600' : config.accent} mb-3`}>{activeExp.organization}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border mb-6 ${isLightTheme ? 'bg-black/5 text-slate-400 border-black/10' : 'bg-white/5 border-white/10'}`}>{activeExp.duration}</span>
                  <ul className="space-y-2.5 sm:space-y-3 mb-6">
                    {activeExp.description.map((item, idx) => (
                      <li key={idx} className={`flex gap-3 text-xs sm:text-sm leading-relaxed ${isLightTheme ? 'text-slate-600 opacity-100' : 'opacity-90'}`}>
                        <span className={`mt-1.5 min-w-[5px] h-[5px] rounded-full shrink-0 ${isLightTheme ? 'bg-slate-400' : config.button.split(' ')[0]}`} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {(activeExp.verificationId || activeExp.verificationUrl) && (
                    <div className={`pt-6 border-t ${isLightTheme ? 'border-black/5' : 'border-white/10'} space-y-4`}>
                      {activeExp.verificationId && (
                        <div>
                          <p className={`text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1 ${isLightTheme ? 'text-slate-400' : 'opacity-40'}`}>Verification ID</p>
                          <p className={`text-xs sm:text-sm font-mono ${isLightTheme ? 'text-slate-600' : 'opacity-90'}`}>{activeExp.verificationId}</p>
                        </div>
                      )}
                      {activeExp.verificationUrl && (
                        <div className="flex flex-col items-start pt-2">
                          <a 
                            href={activeExp.verificationUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${config.button} text-white`}
                          >
                            Verify Experience
                            <span className="text-lg">→</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className={`p-4 sm:p-6 flex flex-col items-center justify-center py-8 md:py-16 min-h-[300px] sm:min-h-[400px] md:min-h-[500px] ${isLightTheme ? 'bg-slate-50/50' : 'bg-black/20'}`}>
                  {activeExp.certificateImageUrl ? (
                    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-full">
                      <p className={`text-[10px] sm:text-xs font-black uppercase tracking-widest mb-4 opacity-40 ${isLightTheme ? 'text-slate-400' : ''}`}>Experience {isPdf(activeExp.certificateImageUrl) ? 'PDF' : 'Certificate'}</p>
                      <div className="cursor-pointer group relative rounded-xl overflow-hidden shadow-2xl border border-white/10 max-w-2xl w-full flex items-center justify-center" onClick={() => setMediumCertUrl(activeExp.certificateImageUrl!)}>
                        {isPdf(activeExp.certificateImageUrl) ? (
                          <div className="w-full min-h-[250px] sm:min-h-[350px] flex items-center justify-center">
                            <PdfLivePreview fileUrl={activeExp.certificateImageUrl} className="!bg-transparent" />
                          </div>
                        ) : (
                          <img src={activeExp.certificateImageUrl || undefined} alt="Certificate Preview" className="w-full h-auto max-h-[60vh] object-contain transition-transform duration-500 group-hover:scale-105" />
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors opacity-0 group-hover:opacity-100 flex flex-col justify-end p-4">
                          <p className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md py-2 rounded-lg">View Full {isPdf(activeExp.certificateImageUrl) ? 'PDF' : 'Certificate'}</p>
                        </div>
                      </div>
                    </div>
                  ) : <div className={`opacity-30 italic text-xs sm:text-sm ${isLightTheme ? 'text-slate-400' : ''}`}>Certificate not available</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CertificateViewer imageUrl={mediumCertUrl} onClose={() => setMediumCertUrl(null)} theme={theme} />

      <DeleteConfirmModal 
        isOpen={!!deletingId}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
        title="Delete Experience?"
        description="Are you sure you want to delete this experience entry? This action cannot be undone."
        config={config}
      />
    </section>
  );
};

export default ExperienceSection;
