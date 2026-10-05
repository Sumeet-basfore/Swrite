import React, { useEffect, useRef, useState } from 'react';
import { createSwriteEditor, SwriteEditorInstance } from '../core/createEditor';
import { SourceEditor } from '../source/SourceEditor';
import { StatusBar } from './StatusBar';
import { FormattingBar } from './FormattingBar';
import { SlashDropdown } from './SlashDropdown';
import { SaveCoordinator } from '../sync/saveCoordinator';
import { calculateEditorStats } from '../core/stats';
import { EditorMode, EditorStats, SaveStatus } from '../core/types';
import './editor.css';

export interface EditorCanvasProps {
  documentId: string;
  relativePath: string;
  initialContent: string;
  onContentChange?: (markdown: string) => void;
  onSave?: (markdown: string) => Promise<void>;
  readOnly?: boolean;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  documentId,
  relativePath,
  initialContent,
  onContentChange,
  readOnly = false,
}) => {
  const [mode, setMode] = useState<EditorMode>('rich');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [stats, setStats] = useState<EditorStats>(() => calculateEditorStats(initialContent));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('clean');
  const [slashState, setSlashState] = useState<{
    open: boolean;
    query: string;
    position: { top: number; left: number };
  }>({ open: false, query: '', position: { top: 0, left: 0 } });

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<SwriteEditorInstance | null>(null);
  const saveCoordinatorRef = useRef<SaveCoordinator | null>(null);
  const currentContentRef = useRef<string>(initialContent);

  // Initialize Save Coordinator
  useEffect(() => {
    const coordinator = new SaveCoordinator({
      documentId,
      relativePath,
      debounceMs: 1500,
      recoveryIntervalMs: 3000,
      onStatusChange: (status) => setSaveStatus(status),
      onExternalChangeDetected: (conflict) => {
        if (conflict) {
          console.warn('External modification detected with dirty buffer on:', relativePath);
        }
      },
    });

    coordinator.setInitialContent(initialContent);
    saveCoordinatorRef.current = coordinator;

    return () => {
      coordinator.dispose();
      saveCoordinatorRef.current = null;
    };
  }, [documentId, relativePath, initialContent]);

  // Initialize Milkdown Rich Editor
  useEffect(() => {
    if (mode !== 'rich' || !editorContainerRef.current) return;

    let isMounted = true;

    async function initEditor() {
      if (!editorContainerRef.current) return;

      try {
        const instance = await createSwriteEditor({
          root: editorContainerRef.current,
          initialMarkdown: currentContentRef.current,
          editable: !readOnly,
          callbacks: {
            onChange: (markdown, newStats) => {
              currentContentRef.current = markdown;
              setStats(newStats);
              saveCoordinatorRef.current?.updateContent(markdown);
              onContentChange?.(markdown);

              // Check for slash command trigger
              checkForSlashCommand(instance);
            },
          },
          shortcutCallbacks: {
            onToggleFocusMode: () => setFocusMode((prev) => !prev),
            onToggleSourceMode: () => handleToggleMode(),
            onSave: () => handleSaveNow(),
          },
        });

        if (isMounted) {
          editorInstanceRef.current = instance;
        } else {
          await instance.destroy();
        }
      } catch (err) {
        console.error('Failed to initialize Milkdown editor:', err);
      }
    }

    initEditor();

    return () => {
      isMounted = false;
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy().catch(console.error);
        editorInstanceRef.current = null;
      }
    };
  }, [mode, readOnly]);

  const checkForSlashCommand = (instance: SwriteEditorInstance) => {
    const view = instance.getView();
    if (!view) return;

    const { state } = view;
    const { selection } = state;
    if (!selection.empty) {
      if (slashState.open) setSlashState((s) => ({ ...s, open: false }));
      return;
    }

    const { $from } = selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, ' ');
    const slashIndex = textBefore.lastIndexOf('/');

    if (slashIndex !== -1 && (slashIndex === 0 || textBefore[slashIndex - 1] === ' ')) {
      const query = textBefore.substring(slashIndex + 1);
      const coords = view.coordsAtPos($from.pos);
      setSlashState({
        open: true,
        query,
        position: { top: coords.bottom, left: coords.left },
      });
    } else if (slashState.open) {
      setSlashState((s) => ({ ...s, open: false }));
    }
  };

  const handleToggleMode = () => {
    if (mode === 'rich') {
      if (editorInstanceRef.current) {
        currentContentRef.current = editorInstanceRef.current.getMarkdown();
      }
      setMode('source');
    } else {
      setMode('rich');
    }
  };

  const handleSourceChange = (markdown: string, newStats: EditorStats) => {
    currentContentRef.current = markdown;
    setStats(newStats);
    saveCoordinatorRef.current?.updateContent(markdown);
    onContentChange?.(markdown);
  };

  const handleSaveNow = async () => {
    if (saveCoordinatorRef.current) {
      await saveCoordinatorRef.current.saveNow();
    }
  };

  return (
    <div className={`swrite-editor-container ${focusMode ? 'focus-mode' : ''}`}>
      {/* Floating Formatting Toolbar (only in Rich mode and not in deep focus) */}
      {mode === 'rich' && !focusMode && (
        <FormattingBar getView={() => editorInstanceRef.current?.getView() || null} />
      )}

      {/* Main Canvas Viewport */}
      <div className="swrite-scroll-viewport">
        {mode === 'rich' ? (
          <div className="swrite-manuscript-page">
            <div ref={editorContainerRef} className="milkdown-wrapper" />
          </div>
        ) : (
          <SourceEditor
            initialValue={currentContentRef.current}
            onChange={handleSourceChange}
            onSave={handleSaveNow}
            onToggleMode={handleToggleMode}
            readOnly={readOnly}
          />
        )}
      </div>

      {/* Slash Commands Dropdown */}
      {slashState.open && editorInstanceRef.current?.getView() && (
        <SlashDropdown
          view={editorInstanceRef.current.getView()!}
          query={slashState.query}
          position={slashState.position}
          onClose={() => setSlashState((s) => ({ ...s, open: false }))}
        />
      )}

      {/* Distraction-Free Status Bar */}
      <StatusBar
        stats={stats}
        saveStatus={saveStatus}
        mode={mode}
        focusMode={focusMode}
        onToggleMode={handleToggleMode}
        onToggleFocusMode={() => setFocusMode((prev) => !prev)}
        onSaveNow={handleSaveNow}
      />
    </div>
  );
};
