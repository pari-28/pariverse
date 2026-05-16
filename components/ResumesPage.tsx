
import React, { useState, useEffect } from 'react';
import { ThemeMode, Resume } from '../types';
import { THEME_CONFIGS } from '../constants';
import { trackEvent } from '../analyticsService';
import DeleteConfirmModal from './DeleteConfirmModal';
import PdfLivePreview from './PdfLivePreview';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useScrollLock } from '../hooks/useScrollLock';

// Set worker path for pdfjs (both for initial preview and react-pdf) using CDN to match API version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ResumesPageProps {
  theme: ThemeMode;
  isAdmin: boolean;
  resumes: Resume[];
  onUpdate: React.Dispatch<React.SetStateAction<Resume[]>>;
  onBack: () => void;
  title: string;
  subtext: string;
  onTitleUpdate: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ResumesPage: React.FC<ResumesPageProps> = ({ theme, isAdmin, resumes, onUpdate, onBack, title, subtext, onTitleUpdate, showToast }) => {
  const config = THEME_CONFIGS[theme];
  const [infoResume, setInfoResume] = useState<Resume | null>(null);
  const [fullResume, setFullResume] = useState<Resume | null>(null);
  const [isEditing, setIsEditing] = useState<Resume | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fullResumeContainerRef = React.useRef<HTMLDivElement>(null);

  useScrollLock(!!infoResume || !!fullResume || !!isEditing || !!deletingId);

  const isLightTheme = theme === 'light';

  const dividerBg = config.accent.includes('gradient') 
    ? config.accent.replace('text-transparent', '').replace('bg-clip-text', '')
    : config.accent.replace('text-', 'bg-');

  const handleOpenFull = () => {
    setFullResume(infoResume);
    setInfoResume(null);
  };

  const handleAdd = () => {
    setIsEditing({ id: Math.random().toString(36).substr(2, 9), title: '', description: '', fileUrl: '', previewImageUrl: '', order: resumes.length + 1 });
  };

  const handleEdit = (res: Resume, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(res);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    
    onUpdate(prev => prev.filter(r => r.id !== deletingId));
    if (infoResume?.id === deletingId) setInfoResume(null);
    if (fullResume?.id === deletingId) setFullResume(null);
    setDeletingId(null);
  };

  // Session cache to keep previews working for newly selected files during the current session
  const [pdfLoadErrors, setPdfLoadErrors] = useState<Record<string, boolean>>({});
  const [resumeBlobUrls, setResumeBlobUrls] = useState<Record<string, string>>({});
  const [numPages, setNumPages] = useState<number | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  useEffect(() => {
    setNumPages(null);
  }, [fullResume]);

  useEffect(() => {
    const container = fullResumeContainerRef.current;
    if (!container) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href) {
        if (anchor.href.startsWith('http') || anchor.href.startsWith('mailto:')) {
          e.preventDefault();
          e.stopPropagation();
          window.open(anchor.href, '_blank', 'noopener,noreferrer');
        }
      }
    };

    container.addEventListener('click', handleLinkClick, true);
    return () => container.removeEventListener('click', handleLinkClick, true);
  }, [fullResume, numPages]);

  // Helper to convert base64 to blob URL
  const base64ToBlobUrl = (base64: string): string | null => {
    try {
      if (!base64.startsWith('data:application/pdf')) return base64;
      
      const base64Data = base64.split(',')[1];
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error("Base64 to Blob conversion failed:", err);
      return null;
    }
  };

  const getAbsoluteFileUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const origin = window.location.origin;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${origin}${path}`;
  };

  // Sync blob URLs for all resumes
  useEffect(() => {
    const newBlobUrls: Record<string, string> = { ...resumeBlobUrls };
    let changed = false;

    resumes.forEach(res => {
      if (res.fileUrl.startsWith('data:application/pdf') && !newBlobUrls[res.id]) {
        const url = base64ToBlobUrl(res.fileUrl);
        if (url) {
          newBlobUrls[res.id] = url;
          changed = true;
        }
      } else if (!res.fileUrl.startsWith('data:application/pdf') && !newBlobUrls[res.id]) {
        const absoluteUrl = getAbsoluteFileUrl(res.fileUrl);
        if (newBlobUrls[res.id] !== absoluteUrl) {
          newBlobUrls[res.id] = absoluteUrl;
          changed = true;
        }
      }
    });

    if (changed) {
      setResumeBlobUrls(newBlobUrls);
    }

    return () => {
      // We don't revoke here because it might revoke URLs currently in use by new tabs
      // but in a real app or with more time we'd manage this carefully
    };
  }, [resumes]);

  const handlePdfError = (resumeId: string) => {
    setPdfLoadErrors(prev => ({ ...prev, [resumeId]: true }));
  };

  const handleSave = () => {
    if (!isEditing) return;
    if (!isEditing.title || !isEditing.fileUrl) {
      alert("Title and Resume File are required.");
      return;
    }

    const resumeToSave = { ...isEditing };

    onUpdate(prev => {
      const exists = prev.find(r => r.id === resumeToSave.id);
      if (exists) return prev.map(r => r.id === resumeToSave.id ? resumeToSave : r);
      return [...prev, resumeToSave];
    });
    setIsEditing(null);
  };

  const generatePdfPreview = async (file: File): Promise<string | null> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Use the same pdfjs instance from react-pdf
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!context) return null;

      const renderContext: any = {
        canvasContext: context,
        viewport: viewport
      };
      await page.render(renderContext).promise;
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Preview generation failed:", error);
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isEditing) {
      if (file.type !== 'application/pdf') {
        if (showToast) showToast("Please upload a PDF file only.", "error");
        else alert("Please upload a PDF file only.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async () => {
        const base64PDF = reader.result as string;
        
        // Validate size (1MB limit for Firestore)
        if (base64PDF.length > 1000000) {
          if (showToast) showToast("Resume must be under 1 MB. Please upload a compressed PDF.", "error");
          else alert("Resume must be under 1 MB. Please upload a compressed PDF.");
          return;
        }

        const fileName = file.name;
        
        // Generate preview image
        const previewUrl = await generatePdfPreview(file);
        
        // Create local blob URL for immediate use
        const localBlobUrl = URL.createObjectURL(file);
        setResumeBlobUrls(prev => ({ ...prev, [isEditing.id]: localBlobUrl }));
        
        setIsEditing({ 
          ...isEditing, 
          fileUrl: base64PDF,
          pdfUrl: localBlobUrl,
          title: isEditing.title || fileName.replace(/\.pdf$/i, '').replace(/_/g, ' '),
          previewImageUrl: previewUrl || isEditing.previewImageUrl
        });
        
        if (showToast) showToast(`Resume "${fileName}" loaded successfully!`, "success");
        else alert(`Resume selected: ${fileName}\n\nPDF data loaded as Base64.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const isPdfUrl = (url: string) => {
    if (!url) return false;
    const cleanUrl = url.toLowerCase().split('?')[0];
    return cleanUrl.endsWith('.pdf') || 
           url.startsWith('blob:') || 
           url.startsWith('data:application/pdf');
  };

  const handlePreviewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isEditing) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIsEditing({ ...isEditing, previewImageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleView = (resume: Resume) => {
    const urlToOpen = resumeBlobUrls[resume.id] || resume.fileUrl;
    if (!urlToOpen) return;

    window.open(
      urlToOpen,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="w-full min-h-screen pt-32 pb-12 animate-in fade-in duration-700">
      <div className="mb-8">
        <button type="button" onClick={onBack} className={`mb-8 mt-2 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity text-sm font-bold uppercase tracking-widest ${isLightTheme ? 'text-slate-500' : ''}`}><span>←</span> Back to Portfolio</button>
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 relative">
              <h2 onClick={isAdmin ? onTitleUpdate : undefined} className={`text-4xl font-extrabold tracking-tight ${config.accent} ${isAdmin ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}>{title}</h2>
              {isAdmin && <button type="button" onClick={onTitleUpdate} className="p-1 rounded bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/40 transition-colors text-[14px]">✎</button>}
            </div>
            <div className={`w-24 h-[1px] my-3 opacity-30 ${dividerBg}`} />
            <p className={`text-sm opacity-60 font-medium max-w-lg ${isLightTheme ? 'text-slate-500' : ''}`}>{subtext}</p>
          </div>
          {isAdmin && <button type="button" onClick={handleAdd} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg">+ ADD RESUME</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...resumes].sort((a, b) => (a.order || 0) - (b.order || 0)).map((resume) => (
          <div key={resume.id} onClick={() => setInfoResume(resume)} className={`group cursor-pointer rounded-[2rem] border border-white/5 bg-white/5 p-8 transition-all duration-500 hover:border-white/20 hover:scale-[1.02] ${config.card} relative`}>
            {isAdmin && <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"><button type="button" onClick={(e) => handleEdit(resume, e)} className="p-2 bg-blue-500 text-white rounded-lg text-xs">✏️</button><button type="button" onClick={(e) => handleDelete(resume.id, e)} className="p-2 bg-red-500 text-white rounded-lg text-xs">🗑️</button></div>}
            <div className="flex flex-col"><h3 className={`text-xl font-bold mb-3 transition-colors ${isLightTheme ? 'group-hover:text-black text-black' : 'group-hover:text-indigo-400'}`}>{resume.title}</h3><p className={`text-sm opacity-60 leading-relaxed line-clamp-3 ${isLightTheme ? 'text-slate-600' : ''}`}>{resume.description}</p></div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm detail-view-container" onClick={() => setIsEditing(null)} />
          <div className={`relative w-full max-w-lg p-8 rounded-[2rem] border shadow-2xl ${config.card} text-white`}>
            <h3 className="text-2xl font-bold mb-6 text-white">Edit Resume</h3>
            <div className="space-y-4">
              <div><label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Title</label><input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" value={isEditing.title} onChange={e => setIsEditing({...isEditing, title: e.target.value})} /></div>
              <div><label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Description</label><textarea className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" rows={3} value={isEditing.description} onChange={e => setIsEditing({...isEditing, description: e.target.value})} /></div>
              <div>
                <div className="flex justify-between items-center"><label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Resume File Path</label><label className="text-[10px] font-bold text-indigo-400 cursor-pointer hover:underline uppercase">Select Resume<input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} /></label></div>
                <div className="mt-1 p-2 bg-white/5 rounded-lg border border-white/10"><p className="text-[10px] text-yellow-400 font-bold uppercase mb-2">Must be in /public folder.</p><input className="w-full p-2 rounded bg-black/20 text-[10px] font-mono outline-none border-none text-white/60" value={isEditing.fileUrl} onChange={e => setIsEditing({...isEditing, fileUrl: e.target.value})} /></div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Preview Image</label>
                <div className="flex justify-between items-center mt-1">
                   <label className="text-[10px] font-bold text-indigo-400 cursor-pointer hover:underline uppercase">Upload Custom<input type="file" className="hidden" accept="image/*" onChange={handlePreviewUpload} /></label>
                </div>
                <input className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white text-xs" value={isEditing.previewImageUrl} onChange={e => setIsEditing({...isEditing, previewImageUrl: e.target.value})} placeholder="Auto-generated on PDF upload" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white">Display Order</label>
                <input type="number" className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none text-white" value={isEditing.order || 0} onChange={e => setIsEditing({...isEditing, order: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="flex gap-4 mt-8"><button type="button" onClick={handleSave} className={`flex-1 py-3 rounded-xl font-bold ${config.button} text-white`}>Save</button><button type="button" onClick={() => setIsEditing(null)} className="flex-1 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white">Cancel</button></div>
          </div>
        </div>
      )}

      {infoResume && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in-95 duration-500" onClick={() => setInfoResume(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer detail-view-container" />
          <div 
            className={`relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl border flex flex-col lg:flex-row ${isLightTheme ? 'bg-white/95 backdrop-blur-3xl text-slate-600 border-black/5' : config.card} border-white/20`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Info Side */}
            <div className={`lg:w-1/2 p-8 md:p-12 flex flex-col justify-center text-left border-b lg:border-b-0 lg:border-r relative ${isLightTheme ? 'border-black/5' : 'border-white/10'}`}>
              <div className="absolute top-0 right-0 p-4 z-[70] lg:hidden">
                <button 
                  onClick={() => setInfoResume(null)} 
                  className="p-2 sm:p-2.5 rounded-full transition-all shadow-xl bg-white text-black border border-black/10 hover:bg-gray-100 active:scale-95"
                  aria-label="Close modal"
                >
                  <span className="text-lg block leading-none font-bold">✕</span>
                </button>
              </div>
              <button type="button" onClick={() => setInfoResume(null)} className="hidden lg:flex self-start mb-6 p-2 sm:p-2.5 rounded-full transition-all shadow-xl bg-white text-black border border-black/10 hover:bg-gray-100 active:scale-95">
                <span className="text-lg block leading-none font-bold">✕</span>
              </button>
              <h3 className={`text-3xl font-bold mb-4 ${config.accent}`}>{infoResume.title}</h3>
              <p className={`text-lg opacity-80 leading-relaxed mb-8 ${isLightTheme ? 'text-slate-600' : ''}`}>{infoResume.description}</p>
              
              <div className="space-y-4">
                <button 
                  type="button"
                  onClick={() => {
                    handleOpenFull();
                    trackEvent(`resume_view_${infoResume.title.toLowerCase().replace(/\s+/g, '_')}`, { type: 'resume', id: infoResume.title });
                  }} 
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl ${config.button}`}
                >
                  View Full Resume
                </button>
                <a 
                  href={resumeBlobUrls[infoResume.id] || infoResume.fileUrl || '/resume.pdf'} 
                  download={`${infoResume.title.replace(/\s+/g, '_')}_Resume.pdf`} 
                  className={`block text-center py-3 text-xs font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-all ${isLightTheme ? 'text-slate-400' : ''}`}
                  onClick={() => trackEvent(`resume_download_${infoResume.title.toLowerCase().replace(/\s+/g, '_')}`, { type: 'resume', id: infoResume.title })}
                >
                  Download PDF ⬇
                </a>
              </div>
            </div>

            {/* Preview Side */}
            <div className={`lg:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center ${isLightTheme ? 'bg-slate-50/50' : 'bg-black/20'}`}>
              <div 
                className="w-full cursor-pointer group relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-white" 
                onClick={() => handleOpenFull()}
              >
                {isPdfUrl(resumeBlobUrls[infoResume.id] || infoResume.fileUrl) && !pdfLoadErrors[infoResume.id] ? (
                  <PdfLivePreview 
                    fileUrl={resumeBlobUrls[infoResume.id] || infoResume.fileUrl} 
                    className="transition-transform duration-500 group-hover:scale-105" 
                    onError={() => handlePdfError(infoResume.id)}
                  />
                ) : (
                  <img 
                    src={infoResume.previewImageUrl || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80'} 
                    alt="Resume Preview" 
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-105" 
                  />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors opacity-0 group-hover:opacity-100 flex flex-col justify-end p-4">
                  <p className="text-sm font-black text-white uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md py-3 rounded-xl text-center">View Fullscreen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {fullResume && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500" onClick={() => setFullResume(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer detail-view-container" />
          <div className={`relative w-full max-w-5xl h-[85vh] rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 flex flex-col ${config.card}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b ${config.border} flex items-center justify-between bg-white/5`}>
              <h3 className={`font-bold text-lg ${isLightTheme ? 'text-black' : ''}`}>{fullResume.title}</h3>
              <div className="flex items-center gap-4">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleView(fullResume);
                  }}
                  className={`text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 ${isLightTheme ? 'text-slate-500' : ''}`}
                >
                  Open in New Tab
                </button>
                <a href={resumeBlobUrls[fullResume.id] || fullResume.fileUrl || '/resume.pdf'} download={`${fullResume.title.replace(/\s+/g, '_')}_Resume.pdf`} className={`text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 ${isLightTheme ? 'text-slate-500' : ''}`}>
                  Download PDF
                </a>
                <button type="button" onClick={() => setFullResume(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">✕</button>
              </div>
            </div>
            <div ref={fullResumeContainerRef} className="flex-1 overflow-auto bg-white relative flex flex-col items-center p-4 md:p-8 custom-scrollbar">
              <div className="w-full flex flex-col items-center">
                {/* Full PDF View using react-pdf for better Chrome compatibility */}
                <div className="relative w-full bg-slate-100 group flex items-start justify-center shadow-2xl rounded-xl overflow-hidden min-h-[500px]">
                  {isPdfUrl(resumeBlobUrls[fullResume.id] || fullResume.fileUrl) && !pdfLoadErrors[fullResume.id] ? (
                    <div className="flex flex-col items-center bg-slate-100 p-4">
                      <Document 
                        file={resumeBlobUrls[fullResume.id] || fullResume.fileUrl} 
                        onLoadError={() => handlePdfError(fullResume.id)}
                        onLoadSuccess={onDocumentLoadSuccess}
                        // @ts-ignore
                        externalLinkTarget="_blank"
                        // @ts-ignore
                        externalLinkRel="noopener noreferrer"
                        loading={
                          <div className="h-96 flex items-center justify-center text-slate-400 font-bold animate-pulse">
                            Loading PDF...
                          </div>
                        }
                      >
                        {Array.from(new Array(numPages || 0), (_, index) => (
                          <div key={`page_${index + 1}`} className="mb-8 shadow-2xl">
                            <Page 
                              pageNumber={index + 1} 
                              width={Math.min(window.innerWidth - 80, 800)}
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                              // @ts-ignore
                              externalLinkTarget="_blank"
                              // @ts-ignore
                              externalLinkRel="noopener noreferrer"
                            />
                          </div>
                        ))}
                      </Document>
                    </div>
                  ) : (
                    <div className="p-8">
                      <img 
                        src={fullResume.previewImageUrl || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80'} 
                        alt="Resume Preview"
                        className="max-w-full h-auto shadow-lg bg-white"
                      />
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
        title="Delete Resume?"
        description="Are you sure you want to delete this uploaded resume? This action cannot be undone."
        config={config}
      />
    </div>
  );
};

export default ResumesPage;
