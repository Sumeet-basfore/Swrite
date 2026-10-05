import React, { useState, useRef, useCallback } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { SecondaryPaneView } from './SecondaryPaneView';

interface SplitPaneContainerProps {
  children: React.ReactNode;
}

export const SplitPaneContainer: React.FC<SplitPaneContainerProps> = ({ children }) => {
  const { project, splitPaneState, setSplitPaneState } = useSwriteStore();
  const theme = project.metadata.theme;
  const { isOpen, orientation, ratio } = splitPaneState;

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      let newRatio = ratio;
      if (orientation === 'vertical') {
        const currentX = moveEvent.clientX - rect.left;
        newRatio = Math.max(0.25, Math.min(0.75, currentX / rect.width));
      } else {
        const currentY = moveEvent.clientY - rect.top;
        newRatio = Math.max(0.25, Math.min(0.75, currentY / rect.height));
      }

      setSplitPaneState({ ratio: newRatio });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [orientation, ratio, setSplitPaneState]);

  if (!isOpen) {
    return <div className="h-full w-full">{children}</div>;
  }

  const primaryStyle: React.CSSProperties = orientation === 'vertical'
    ? { width: `${ratio * 100}%`, height: '100%' }
    : { height: `${ratio * 100}%`, width: '100%' };

  const secondaryStyle: React.CSSProperties = orientation === 'vertical'
    ? { width: `${(1 - ratio) * 100}%`, height: '100%' }
    : { height: `${(1 - ratio) * 100}%`, width: '100%' };

  return (
    <div 
      ref={containerRef}
      className={`h-full w-full flex ${orientation === 'vertical' ? 'flex-row' : 'flex-col'} overflow-hidden relative select-${isDragging ? 'none' : 'auto'}`}
    >
      {/* Primary Pane */}
      <div style={primaryStyle} className="overflow-hidden flex flex-col">
        {children}
      </div>

      {/* Resize Divider */}
      <div
        onMouseDown={handleMouseDown}
        className={`group transition-colors z-20 flex items-center justify-center ${
          orientation === 'vertical' 
            ? 'w-2 cursor-col-resize hover:bg-amber-500/20 active:bg-amber-500/40' 
            : 'h-2 cursor-row-resize hover:bg-amber-500/20 active:bg-amber-500/40'
        }`}
        style={{
          backgroundColor: theme.colors.border
        }}
      >
        <div 
          className={`rounded-full ${
            orientation === 'vertical' ? 'w-0.5 h-6' : 'h-0.5 w-6'
          } group-hover:bg-amber-500 transition-colors`}
          style={{ backgroundColor: theme.colors.borderStrong }}
        />
      </div>

      {/* Secondary Pane */}
      <div style={secondaryStyle} className="overflow-hidden flex flex-col">
        <SecondaryPaneView />
      </div>
    </div>
  );
};
