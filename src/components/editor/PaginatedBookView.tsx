import React, { useState, useEffect } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { CompilerService } from '../../services/compilerService';
import { Layers, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';

export const PaginatedBookView: React.FC = () => {
  const { project, activeChapterId, isFocusMode, setFocusMode } = useSwriteStore();
  const theme = project.metadata.theme;
  const typography = project.metadata.typography;

  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, setFocusMode]);

  const activeChapter = project.acts
    .flatMap(a => a.chapters)
    .find(c => c.id === activeChapterId) || project.acts[0]?.chapters[0];

  const parsedItems = CompilerService.parseProseItems(
    activeChapter?.content || '',
    typography.sceneOrnament || '* * *'
  );

  // Split parsed prose items into simulated pages (~260 words per page)
  const pages: Array<Array<{ type: 'paragraph' | 'scene-break'; text: string }>> = [];
  let currentPage: Array<{ type: 'paragraph' | 'scene-break'; text: string }> = [];
  let currentWordCount = 0;

  parsedItems.forEach(item => {
    const words = item.text.split(/\s+/).filter(Boolean).length;
    if (currentWordCount + words > 260 && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [item];
      currentWordCount = words;
    } else {
      currentPage.push(item);
      currentWordCount += words;
    }
  });
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  if (pages.length === 0) {
    pages.push([{ type: 'paragraph', text: 'Begin writing in the editor to preview your live paginated book...' }]);
  }

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-6 items-center select-none text-xs"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-6 text-xs text-zinc-400 border-b pb-3" style={{ borderColor: theme.pageBorder }}>
        <div className="flex items-center space-x-3">
          <span className="font-medium text-zinc-300">
            Book Preview: {pages.length} {pages.length === 1 ? 'Page' : 'Pages'} (6" × 9" Simulated Trim)
          </span>
          {activeChapter && (
            <span className="text-zinc-500 font-serif italic">
              • {activeChapter.title}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Zoom */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setZoomLevel(Math.max(75, zoomLevel - 10))}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-zinc-400">{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-3 w-[1px] bg-zinc-800" />

          {/* Focus Mode Toggle */}
          <button
            onClick={() => setFocusMode(!isFocusMode)}
            className="flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={isFocusMode ? "Exit Focus Mode (Esc)" : "Enter Focus Mode"}
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFocusMode ? "Exit Focus" : "Focus"}</span>
          </button>
        </div>
      </div>

      {/* Pages */}
      <div 
        className="flex flex-wrap justify-center gap-10 max-w-5xl pb-16 transition-transform duration-150"
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
      >
        {pages.map((pageItems, index) => {
          const pageNum = index + 1;
          const isVerso = pageNum % 2 === 0;

          return (
            <div
              key={index}
              className="book-page-sheet flex flex-col justify-between rounded border p-10 relative"
              style={{
                width: '450px',
                minHeight: '650px',
                backgroundColor: theme.colors?.editorPage || theme.colors?.surface || theme.pageBg,
                borderColor: theme.colors?.border || theme.pageBorder,
                color: theme.colors?.editorPageText || theme.colors?.text || theme.text,
                fontFamily: typography.manuscriptFont || typography.fontFamily,
                fontSize: `${typography.fontSize - 2}px`,
                lineHeight: typography.lineHeight,
              }}
            >
              {/* Top Running Header */}
              <div className="flex items-center justify-between pb-4 border-b text-[10px] uppercase opacity-40" style={{ borderColor: theme.pageBorder }}>
                {isVerso ? (
                  <>
                    <span>{pageNum}</span>
                    <span>{project.metadata.title}</span>
                  </>
                ) : (
                  <>
                    <span>{activeChapter?.title}</span>
                    <span>{pageNum}</span>
                  </>
                )}
              </div>

              {/* Page Body */}
              <div className="flex-1 py-4 space-y-2.5 novel-indent-mode">
                {pageNum === 1 && (
                  <h2 className="text-center font-bold text-lg mb-6 tracking-wide uppercase opacity-80 font-serif">
                    {activeChapter?.title}
                  </h2>
                )}
                {pageItems.map((item, pIdx) => {
                  if (item.type === 'scene-break') {
                    return (
                      <div key={pIdx} className="text-center my-4 opacity-60 font-serif tracking-widest text-[11px]">
                        {item.text || typography.sceneOrnament || '* * *'}
                      </div>
                    );
                  }
                  return (
                    <p key={pIdx} className="text-justify leading-relaxed">
                      {item.text}
                    </p>
                  );
                })}
              </div>

              {/* Bottom Running Footer */}
              <div className="text-center pt-4 border-t text-[10px] opacity-40 font-serif" style={{ borderColor: theme.pageBorder }}>
                — {pageNum} —
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
