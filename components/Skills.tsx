import React, { useState } from 'react';
import { ThemeMode, SkillCategory, Tool } from '../types';
import { THEME_CONFIGS } from '../constants';
import DeleteConfirmModal from './DeleteConfirmModal';
import { useScrollLock } from '../hooks/useScrollLock';

interface SkillsProps {
  theme: ThemeMode;
  isAdmin: boolean;
  skillCategories: SkillCategory[];
  setSkillCategories: React.Dispatch<React.SetStateAction<SkillCategory[]>>;
  toolsUsed: Tool[];
  setToolsUsed: React.Dispatch<React.SetStateAction<Tool[]>>;
  title: string;
  subtext: string;
  onTitleUpdate: () => void;
  toolsTitle: string;
  toolsSubtext: string;
  onToolsTitleUpdate: () => void;
  onNavigate: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Skills: React.FC<SkillsProps> = ({ 
  theme, 
  isAdmin, 
  skillCategories, 
  setSkillCategories, 
  toolsUsed, 
  setToolsUsed, 
  title, 
  subtext, 
  onTitleUpdate, 
  toolsTitle, 
  toolsSubtext, 
  onToolsTitleUpdate, 
  onNavigate,
  showToast
}) => {
  const config = THEME_CONFIGS[theme];
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isEditingSkill, setIsEditingSkill] = useState<SkillCategory | null>(null);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isEditingTool, setIsEditingTool] = useState<Tool | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string, type: 'skill' | 'tool' } | null>(null);

  useScrollLock(!!isEditingSkill || !!isEditingTool || !!deletingItem);

  const dividerBg = config.accent.includes('gradient') 
    ? config.accent.replace('text-transparent', '').replace('bg-clip-text', '')
    : config.accent.replace('text-', 'bg-');
  
  const handleToggle = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  const handleAddSkill = () => {
    setIsEditingSkill({ id: Math.random().toString(36).substr(2, 9), title: '', skills: [] });
    setNewSkillInput('');
  };

  const handleEditSkill = (cat: SkillCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    // Backward compatibility: if skills is still a string, convert it to array
    const normalizedSkills = Array.isArray(cat.skills) 
      ? cat.skills 
      : (typeof cat.skills === 'string' ? (cat.skills as string).split(',').map(s => s.trim()).filter(Boolean) : []);
    
    setIsEditingSkill({ ...cat, skills: normalizedSkills });
    setNewSkillInput('');
  };

  const handleDeleteSkill = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingItem({ id, type: 'skill' });
  };

  const handleDeleteTool = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingItem({ id, type: 'tool' });
  };

  const confirmDelete = () => {
    if (deletingItem) {
      if (deletingItem.type === 'skill') {
        setSkillCategories(prev => prev.filter(c => c.id !== deletingItem.id));
      } else {
        setToolsUsed(prev => prev.filter(t => t.id !== deletingItem.id));
      }
      setDeletingItem(null);
    }
  };

  const handleSaveSkill = () => {
    if (!isEditingSkill) return;
    setSkillCategories(prev => {
      const exists = prev.find(c => c.id === isEditingSkill.id);
      if (exists) return prev.map(c => c.id === isEditingSkill.id ? isEditingSkill : c);
      return [...prev, isEditingSkill];
    });
    setIsEditingSkill(null);
  };

  const handleAddTool = () => {
    setIsEditingTool({ id: Math.random().toString(36).substr(2, 9), name: '', icon: '🔧' });
  };

  const handleEditTool = (tool: Tool, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTool(tool);
  };

  const handleSaveTool = () => {
    if (!isEditingTool) return;
    setToolsUsed(prev => {
      const exists = prev.find(t => t.id === isEditingTool.id);
      if (exists) return prev.map(t => t.id === isEditingTool.id ? isEditingTool : t);
      return [...prev, isEditingTool];
    });
    setIsEditingTool(null);
  };

  return (
    <section id="skills" className="min-h-screen w-full py-12 flex flex-col justify-center">
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
          <p className="text-sm opacity-60 font-medium">{subtext}</p>
        </div>
        {isAdmin && (
          <button onClick={handleAddSkill} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold shadow-lg">
            + ADD SKILL
          </button>
        )}
      </div>

      <div className={`reveal p-5 md:p-10 rounded-[3.5rem] ${config.card} border shadow-2xl mb-8 max-w-5xl mx-auto w-full`}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {skillCategories.map((cat) => (
            <div 
              key={cat.id} 
              className={`p-4 rounded-xl group border border-white/5 bg-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/20 cursor-pointer overflow-hidden flex flex-col relative`}
              onClick={() => handleToggle(cat.id)}
              onMouseLeave={() => setExpandedCategory(null)}
            >
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => handleEditSkill(cat, e)} className="p-1.5 rounded-full bg-blue-500 text-white text-[10px]">✏️</button>
                   <button onClick={(e) => handleDeleteSkill(cat.id, e)} className="p-1.5 rounded-full bg-red-500 text-white text-[10px]">🗑️</button>
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-base opacity-80 leading-tight group-hover:opacity-100 transition-opacity">
                  {cat.title}
                </h3>
              </div>

              <div className={`transition-all duration-500 ease-in-out ${expandedCategory === cat.id ? 'max-h-[250px] opacity-100 pt-4 overflow-y-auto scrollbar-hide' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="flex flex-wrap gap-2 pr-2">
                  {(Array.isArray(cat.skills) ? cat.skills : []).map(skill => (
                    <span 
                      key={skill} 
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${config.border} group-hover:border-indigo-500/50 whitespace-nowrap`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-end mb-10 reveal max-w-5xl mx-auto w-full px-4 md:px-0">
        <div>
          <div className="flex items-center gap-3 relative">
            <h2 
              className={`text-3xl font-extrabold tracking-tight ${config.accent}`}
            >
              {toolsTitle}
            </h2>
            {isAdmin && (
              <button 
                onClick={onToolsTitleUpdate}
                className="p-1 rounded bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/40 transition-colors text-[14px]"
              >
                ✎
              </button>
            )}
          </div>
          <div className={`w-24 h-[1px] my-4 opacity-30 ${dividerBg}`} />
          <p className="text-sm opacity-60 font-medium">{toolsSubtext}</p>
        </div>
        {isAdmin && (
          <button onClick={handleAddTool} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold shadow-lg">
            + ADD TOOL
          </button>
        )}
      </div>

      <div className={`reveal p-5 md:p-10 rounded-[3.5rem] ${config.card} border shadow-2xl max-w-5xl mx-auto w-full`}>
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center md:justify-start">
          {toolsUsed.map((tool) => (
            <div 
              key={tool.id}
              className={`flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl border transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl bg-white/5 ${config.border} group relative overflow-hidden shadow-sm cursor-default`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                   <button onClick={(e) => handleEditTool(tool, e)} className="text-[10px]">✏️</button>
                   <button onClick={(e) => handleDeleteTool(tool.id, e)} className="text-[10px]">🗑️</button>
                </div>
              )}

              <div className="relative z-10 mb-2">
                <span className="text-3xl md:text-4xl block transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  {tool.icon}
                </span>
              </div>
              
              <span className="relative z-10 text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity text-center px-2">
                {tool.name}
              </span>
              
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>

      {isEditingSkill && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm detail-view-container" onClick={() => setIsEditingSkill(null)} />
          <div className={`relative w-full max-w-lg p-8 rounded-[2rem] border shadow-2xl ${config.card} text-white`}>
            <h3 className="text-2xl font-bold mb-6 text-white">Edit Skill Category</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Category Title</label>
                <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" value={isEditingSkill.title} onChange={e => setIsEditingSkill({...isEditingSkill, title: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">Skills</label>
                <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto no-scrollbar p-1">
                  {(Array.isArray(isEditingSkill.skills) ? isEditingSkill.skills : []).map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs text-white group/skill">
                      <span>{skill}</span>
                      <button 
                        onClick={() => {
                          const newSkills = [...isEditingSkill.skills];
                          newSkills.splice(index, 1);
                          setIsEditingSkill({...isEditingSkill, skills: newSkills});
                        }}
                        className="hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {isEditingSkill.skills.length === 0 && (
                    <p className="text-[10px] opacity-40 italic">No skills added yet.</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input 
                    className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white text-sm" 
                    placeholder="Add a skill (e.g. C, C++ or Node.js)" 
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSkillInput.trim()) {
                          setIsEditingSkill({...isEditingSkill, skills: [...isEditingSkill.skills, newSkillInput.trim()]});
                          setNewSkillInput('');
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (newSkillInput.trim()) {
                        setIsEditingSkill({...isEditingSkill, skills: [...isEditingSkill.skills, newSkillInput.trim()]});
                        setNewSkillInput('');
                      }
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs ${config.button} text-white transition-all active:scale-95`}
                  >
                    ADD
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={handleSaveSkill} className={`flex-1 py-3 rounded-xl font-bold ${config.button} text-white`}>Save</button>
              <button onClick={() => setIsEditingSkill(null)} className="flex-1 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isEditingTool && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm detail-view-container" onClick={() => setIsEditingTool(null)} />
          <div className={`relative w-full max-w-lg p-8 rounded-[2rem] border shadow-2xl ${config.card} text-white`}>
            <h3 className="text-2xl font-bold mb-6 text-white">Edit Tool</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Icon</label>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-center text-2xl text-white" value={isEditingTool.icon} onChange={e => setIsEditingTool({...isEditingTool, icon: e.target.value})} />
                </div>
                <div className="col-span-3">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Name</label>
                  <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" value={isEditingTool.name} onChange={e => setIsEditingTool({...isEditingTool, name: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={handleSaveTool} className={`flex-1 py-3 rounded-xl font-bold ${config.button} text-white`}>Save</button>
              <button onClick={() => setIsEditingTool(null)} className="flex-1 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={!!deletingItem}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
        title={deletingItem?.type === 'skill' ? "Delete Skill Category?" : "Delete Tool?"}
        description={deletingItem?.type === 'skill' 
          ? "Are you sure you want to delete this skill category and all its skills? This action cannot be undone." 
          : "Are you sure you want to delete this tool? This action cannot be undone."}
        config={config}
      />
    </section>
  );
};

export default Skills;