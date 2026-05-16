import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Import react-pdf styles for links and text selection
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker path using CDN to match the exact version of the API
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfLivePreviewProps {
  fileUrl: string;
  className?: string;
  onError?: () => void;
  thumbnail?: boolean;
}

const PdfLivePreview: React.FC<PdfLivePreviewProps> = ({ fileUrl, className, onError, thumbnail = false }) => {
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
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
  }, [numPages]);

  if (!fileUrl) return null;

  return (
    <div 
      ref={containerRef}
      className={`relative flex flex-col w-full min-h-[150px] rounded-xl overflow-y-auto overflow-x-hidden p-0.5 custom-scrollbar transform-gpu will-change-transform ${className}`}
    >
      <div className="w-full min-h-full flex flex-col items-center">
        {containerWidth > 0 && (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              setLoading(false);
            }}
            // @ts-ignore
            externalLinkTarget="_blank"
            // @ts-ignore
            externalLinkRel="noopener noreferrer"
            onLoadError={(err) => {
              console.error("PdfLivePreview load error:", err);
              if (onError) onError();
              setLoading(false);
            }}
            loading={
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm z-10 min-h-[150px]">
                <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-2" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
              </div>
            }
          >
            {thumbnail ? (
              <div className={`shadow-sm rounded-sm overflow-hidden transition-opacity duration-500 flex items-center justify-center ${renderedPages.has(1) ? 'opacity-100' : 'opacity-0'}`}>
                <Page 
                  pageNumber={1} 
                  width={containerWidth - 4}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onRenderSuccess={() => setRenderedPages(prev => new Set(prev).add(1))}
                  className="bg-white"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                {Array.from(new Array(numPages || 0), (_, index) => (
                  <div 
                    key={`page_${index + 1}`} 
                    className={`mb-4 last:mb-0 shadow-md rounded-sm overflow-hidden transition-all duration-500 ${renderedPages.has(index + 1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                  >
                    <Page 
                      pageNumber={index + 1} 
                      width={containerWidth - 8}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onRenderSuccess={() => setRenderedPages(prev => new Set(prev).add(index + 1))}
                      // @ts-ignore
                      externalLinkTarget="_blank"
                      // @ts-ignore
                      externalLinkRel="noopener noreferrer"
                      className="bg-white"
                    />
                  </div>
                ))}
              </div>
            )}
          </Document>
        )}
      </div>
      {loading && !fileUrl.startsWith('data:') && !fileUrl.startsWith('blob:') && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-[9px] text-slate-400 font-bold uppercase tracking-widest min-h-[150px]">
          Connecting...
        </div>
      )}
    </div>
  );
};

export default PdfLivePreview;
