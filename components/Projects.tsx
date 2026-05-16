
import React, { useState, useRef, useEffect } from 'react';
import { ThemeMode, Project } from '../types';
import { THEME_CONFIGS } from '../constants';
import { trackEvent } from '../analyticsService';
import DeleteConfirmModal from './DeleteConfirmModal';
import { useScrollLock } from '../hooks/useScrollLock';

interface Props {
  theme: ThemeMode;
  isAdmin: boolean;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  title: string;
  subtext: string;
  onTitleUpdate: () => void;
  onNavigate: () => void;
}

const Projects: React.FC<Props> = ({ theme, isAdmin, projects, setProjects, title, subtext, onTitleUpdate, onNavigate }) => {
  const config = THEME_CONFIGS[theme];
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState<Project | null>(null);
  const [newTech, setNewTech] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useScrollLock(!!selectedProject || !!isEditing || !!deletingId);

  useEffect(() => {
    if (!isEditing) setNewTech('');
  }, [isEditing]);

  const addTech = () => {
    if (newTech.trim() && isEditing) {
      if (!isEditing.techStack.includes(newTech.trim())) {
        setIsEditing({
          ...isEditing,
          techStack: [...isEditing.techStack, newTech.trim()]
        });
      }
      setNewTech('');
    }
  };

  const removeTech = (index: number) => {
    if (isEditing) {
      setIsEditing({
        ...isEditing,
        techStack: isEditing.techStack.filter((_, i) => i !== index)
      });
    }
  };
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isLightTheme = theme === 'light';

  const scrollRight = () => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
  };

  const dividerBg = config.accent.includes('gradient') 
    ? config.accent.replace('text-transparent', '').replace('bg-clip-text', '')
    : config.accent.replace('text-', 'bg-');

  const handleAdd = () => {
    setIsEditing({ id: Math.random().toString(36).substr(2, 9), title: '', description: '', techStack: [], image: '', longDescription: '', outcome: '', githubUrl: '', liveUrl: '', order: projects.length });
  };

  const handleEdit = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(proj);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      setProjects(prev => prev.filter(p => p.id !== deletingId));
      setDeletingId(null);
    }
  };

  const handleSave = () => {
    if (!isEditing) return;
    setProjects(prev => {
      const exists = prev.find(p => p.id === isEditing.id);
      if (exists) return prev.map(p => p.id === isEditing.id ? isEditing : p);
      return [...prev, isEditing];
    });
    setIsEditing(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isEditing) {
      const reader = new FileReader();
      reader.onloadend = () => setIsEditing({ ...isEditing, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const sortedProjects = [...projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <section id="projects" className="min-h-screen w-full py-12 flex flex-col justify-center">
      <div className="flex justify-between items-end mb-10 reveal max-w-5xl mx-auto w-full px-4 md:px-0">
        <div>
          <div className="flex items-center gap-3 relative">
            <h2 onClick={onNavigate} className={`text-3xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition-all ${config.accent}`}>{title}</h2>
            {isAdmin && <button onClick={onTitleUpdate} className="p-1 rounded bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/40 transition-colors text-[14px]">✎</button>}
          </div>
          <div className={`w-24 h-[1px] my-4 opacity-30 ${dividerBg}`} />
          <p className={`text-sm opacity-60 font-medium ${isLightTheme ? 'text-slate-500' : ''}`}>{subtext}</p>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold shadow-lg">+ ADD</button>}
          <button onClick={scrollRight} className={`w-10 h-10 rounded-full flex items-center justify-center border ${config.border} hover:bg-white/10 transition-all shadow-lg active:scale-90`}><span className="text-xl">→</span></button>
        </div>
      </div>

      <div className={`reveal p-5 md:p-10 rounded-[3.5rem] ${config.card} border shadow-2xl overflow-hidden max-w-5xl mx-auto w-full`}>
        <div ref={scrollContainerRef} className="flex flex-row gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {sortedProjects.map((project) => (
            <div 
              key={project.id} 
              className={`min-w-[280px] md:min-w-[400px] snap-start group rounded-3xl overflow-hidden border border-white/5 bg-white/5 transition-all duration-300 hover:border-white/20 hover:scale-[1.02] cursor-pointer relative`}
              onClick={() => {
                setSelectedProject(project);
                trackEvent(`project_view_${project.title.toLowerCase().replace(/\s/g, '_')}`, { type: 'project', id: project.title });
              }}
            >
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => handleEdit(project, e)} className="p-1.5 bg-blue-500 text-white rounded text-xs">✏️</button>
                   <button onClick={(e) => handleDelete(project.id, e)} className="p-1.5 bg-red-500 text-white rounded text-xs">🗑️</button>
                </div>
              )}
              <div className="aspect-video relative overflow-hidden">
                <img src={project.image || undefined} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3"><h3 className={`text-xl font-bold transition-colors ${isLightTheme ? 'group-hover:text-black text-black' : ''}`}>{project.title}</h3></div>
                <p className={`text-sm opacity-80 mb-4 line-clamp-2 ${isLightTheme ? 'text-slate-600' : ''}`}>{project.description}</p>
                <div className="flex flex-wrap gap-2">{project.techStack.map(tech => (<span key={tech} className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${isLightTheme ? 'bg-black/5 border-black/10 text-slate-500' : 'bg-white/5 border-white/10'}`}>{tech}</span>))}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm detail-view-container" onClick={() => setIsEditing(null)} />
          <div className={`relative w-full max-w-2xl p-8 rounded-[2rem] border shadow-2xl overflow-y-auto max-h-[90vh] compact-modal ${config.card} text-white`}>
            <h3 className="text-2xl font-bold mb-6 text-white">Edit Project</h3>
            <div className="space-y-4">
              <div><label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Title</label><input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" value={isEditing.title} onChange={e => setIsEditing({...isEditing, title: e.target.value})} /></div>
              <div><label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Short Description</label><input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" value={isEditing.description} onChange={e => setIsEditing({...isEditing, description: e.target.value})} /></div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Tech Stack</label>
                <div className="flex gap-2 mt-1">
                  <input 
                    className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white text-sm" 
                    placeholder="Add technology..."
                    value={newTech}
                    onChange={e => setNewTech(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTech();
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={addTech} 
                    className={`px-4 py-2 ${config.button} rounded-xl text-white font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all`}
                  >
                    Add
                  </button>
                </div>
                {isEditing.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 max-h-[120px] overflow-y-auto p-1 custom-scrollbar">
                    {isEditing.techStack.map((tech, index) => (
                      <div key={`${tech}-${index}`} className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/90 animate-in fade-in zoom-in duration-200">
                        <span>{tech}</span>
                        <button 
                          type="button"
                          onClick={() => removeTech(index)} 
                          className="w-4 h-4 flex items-center justify-center rounded-md bg-white/10 hover:bg-red-500 hover:text-white transition-all text-[8px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center"><label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Image URL</label><label className="text-[10px] font-bold text-indigo-400 cursor-pointer hover:underline uppercase">Upload File<input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} /></label></div>
                <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" value={isEditing.image} onChange={e => setIsEditing({...isEditing, image: e.target.value})} />
              </div>
              <div><label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">GitHub URL</label><input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" value={isEditing.githubUrl || ''} onChange={e => setIsEditing({...isEditing, githubUrl: e.target.value})} /></div>
              <div><label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Live URL</label><input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" value={isEditing.liveUrl || ''} onChange={e => setIsEditing({...isEditing, liveUrl: e.target.value})} /></div>
              <div><label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Outcome</label><input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" value={isEditing.outcome || ''} onChange={e => setIsEditing({...isEditing, outcome: e.target.value})} /></div>
              <div><label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Display Order (Lower = First)</label><input type="number" className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" value={isEditing.order || 0} onChange={e => setIsEditing({...isEditing, order: parseInt(e.target.value) || 0})} /></div>
              <div><label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Long Description</label><textarea className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" rows={4} value={isEditing.longDescription || ''} onChange={e => setIsEditing({...isEditing, longDescription: e.target.value})} /></div>
            </div>
            <div className="flex gap-4 mt-8"><button onClick={handleSave} className={`flex-1 py-3 rounded-xl font-bold ${config.button} text-white`}>Save</button><button onClick={() => setIsEditing(null)} className="flex-1 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white">Cancel</button></div>
          </div>
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 md:p-12 animate-in fade-in zoom-in duration-300" onClick={() => setSelectedProject(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer detail-view-container" />
          <div 
            className={`relative max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-2xl border flex flex-col compact-modal ${isLightTheme ? 'bg-white/90 backdrop-blur-3xl text-slate-600 border-black/5' : `border-white/10 ${config.card}`}`} 
            onClick={(e) => e.stopPropagation()}
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Mobile Close Button - Sticky/Fixed to top right */}
            <div className="absolute top-0 right-0 p-4 z-[70] pointer-events-none">
              <button 
                onClick={() => setSelectedProject(null)} 
                className="p-2.5 sm:p-3 rounded-full transition-all shadow-xl pointer-events-auto bg-white text-black border border-black/10 hover:bg-gray-100 active:scale-95"
                aria-label="Close modal"
              >
                <span className="text-lg sm:text-xl block leading-none font-bold">✕</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="relative aspect-video w-full shrink-0">
                <img src={selectedProject.image || undefined} alt={selectedProject.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>

              <div className="p-5 sm:p-8 md:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="w-full">
                    <h2 className={`text-2xl sm:text-3xl font-extrabold mb-2 leading-tight pr-12 ${isLightTheme ? 'text-black' : config.accent}`}>{selectedProject.title}</h2>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                      {selectedProject.techStack.map(tech => (
                        <span key={tech} className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border uppercase tracking-widest ${isLightTheme ? 'bg-black/5 border-black/10 text-slate-500' : 'bg-white/10 border-white/10'}`}>{tech}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto mt-2 sm:mt-0">
                    {selectedProject.githubUrl && (
                      <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer" className={`flex-1 md:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-center font-bold border transition-all text-xs sm:text-sm ${isLightTheme ? 'bg-black/5 hover:bg-black/10 text-black border-black/10' : 'bg-white/10 hover:bg-white/20 border-white/20'}`}>
                        GitHub
                      </a>
                    )}
                    {selectedProject.liveUrl && (
                      <a href={selectedProject.liveUrl} target="_blank" rel="noopener noreferrer" className={`flex-1 md:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-center font-bold shadow-lg transition-all text-xs sm:text-sm ${isLightTheme ? 'bg-black text-white hover:bg-slate-900' : config.button}`}>
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-5 sm:space-y-6">
                  {selectedProject.outcome && (
                    <div>
                      <h4 className="text-[10px] sm:text-sm font-black uppercase tracking-widest opacity-40 mb-1 sm:mb-2 text-current">Project Outcome</h4>
                      <p className="text-lg sm:text-xl font-medium leading-relaxed italic">{selectedProject.outcome}</p>
                    </div>
                  )}
                  {selectedProject.longDescription && (
                    <div>
                      <h4 className="text-[10px] sm:text-sm font-black uppercase tracking-widest opacity-40 mb-1 sm:mb-2 text-current">Description</h4>
                      <p className="text-sm sm:text-base leading-relaxed opacity-90">{selectedProject.longDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={!!deletingId}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
        title="Delete Project?"
        description="Are you sure you want to delete this project? This action cannot be undone."
        config={config}
      />
    </section>
  );
};

export default Projects;
