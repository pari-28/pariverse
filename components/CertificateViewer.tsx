
import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useScrollLock } from '../hooks/useScrollLock';

// Import react-pdf styles for links and text selection
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker path using CDN to match the exact version of the API
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface CertificateViewerProps {
  imageUrl: string | null;
  onClose: () => void;
  theme?: string;
}

const CertificateViewer: React.FC<CertificateViewerProps> = ({ imageUrl, onClose, theme }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  
  useScrollLock(!!imageUrl);
  
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    // Initial measure
    updateWidth();

    // Use ResizeObserver for more reliable dimension tracking (handles flex/grid shifts)
    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(containerRef.current);

    // Also keep window resize as a fallback
    window.addEventListener('resize', updateWidth);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [imageUrl]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Intercept all anchor clicks to force target="_blank"
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href) {
        // Only intercept if it's an external link
        if (anchor.href.startsWith('http') || anchor.href.startsWith('mailto:')) {
          e.preventDefault();
          e.stopPropagation();
          window.open(anchor.href, '_blank', 'noopener,noreferrer');
        }
      }
    };

    container.addEventListener('click', handleLinkClick, true);
    return () => container.removeEventListener('click', handleLinkClick, true);
  }, [numPages]);

  if (!imageUrl) return null;

  const isLightTheme = theme === 'light';
  const isPdf = imageUrl.startsWith('data:application/pdf') || imageUrl.toLowerCase().endsWith('.pdf');

  return (
    <div 
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300" 
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-transparent cursor-pointer detail-view-container" />
      <div 
        className={`relative max-w-5xl w-full h-[90vh] flex flex-col rounded-2xl shadow-2xl border ${isLightTheme ? 'border-black/10 bg-white/90 backdrop-blur-xl' : 'border-white/10 bg-slate-900'} overflow-hidden compact-modal`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500/30 flex flex-col relative bg-transparent will-change-scroll transform-gpu"
        >
          <div className="min-h-full w-full flex flex-col items-center">
            {isPdf ? (
              <div className="flex flex-col items-center p-1 sm:p-4 w-full min-h-full">
                {containerWidth > 0 && (
                  <Document
                    file={imageUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    // @ts-ignore
                    externalLinkTarget="_blank"
                    // @ts-ignore
                    externalLinkRel="noopener noreferrer"
                    loading={
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-40">Loading PDF...</p>
                      </div>
                    }
                  >
                    {Array.from(new Array(numPages || 0), (_, index) => (
                      <div 
                        key={`page_${index + 1}`} 
                        className={`mb-8 last:mb-0 shadow-2xl rounded-sm overflow-hidden transition-all duration-700 ease-out transform-gpu ${renderedPages.has(index + 1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                      >
                        <Page 
                          pageNumber={index + 1} 
                          width={Math.min(containerWidth - (window.innerWidth < 640 ? 8 : 24), 1200)}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          onRenderSuccess={() => setRenderedPages(prev => new Set(prev).add(index + 1))}
                          // @ts-ignore
                          externalLinkTarget="_blank"
                          // @ts-ignore
                          externalLinkRel="noopener noreferrer"
                        />
                      </div>
                    ))}
                  </Document>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-8 flex flex-col items-center min-h-full transition-opacity duration-500 animate-in fade-in w-full">
                <img 
                  src={imageUrl} 
                  alt="Certificate View" 
                  loading="eager"
                  className="w-full max-w-full h-auto object-contain rounded-lg shadow-2xl border border-white/5 transform-gpu will-change-transform" 
                />
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="fixed top-8 right-8 p-3 rounded-full bg-white text-black hover:bg-gray-100 transition-all z-[1200] shadow-2xl flex items-center justify-center border border-black/10 hover:scale-110 active:scale-95"
          aria-label="Close Preview"
        >
          <span className="text-xl leading-none font-bold">✕</span>
        </button>
      </div>
    </div>
  );
};

export default CertificateViewer;
