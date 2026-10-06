import React, { useEffect, useRef, useState } from 'react';
import { createSwriteEditor, SwriteEditorInstance } from '../core/createEditor';
import { SourceEditor } from '../source/SourceEditor';
import { StatusBar } from './StatusBar';
import { FormattingBar } from './FormattingBar';
import { SlashDropdown } from './SlashDropdown';
import { FindReplaceBar } from './FindReplaceBar';
import { DocumentOutline } from './DocumentOutline';
import { LinkModal, ImageModal, TableModal } from './LinkImageModals';
import { SaveCoordinator } from '../sync/saveCoordinator';
import { calculateEditorStats } from '../core/stats';
import { FormattingCommands } from '../commands/formatting';
import { TableCommands } from '../commands/tableCommands';
import { TypographyPresetId, TYPOGRAPHY_PRESETS, getPresetStyleVariables } from './typographyPresets';
import { EditorMode, EditorStats, SaveStatus } from '../core/types';
import './editor.css';

export interface EditorCanvasProps {
  documentId: string;
  relativePath: string;
  initialContent: string;
  onContentChange?: (markdown: string) => void;
  onSave?: (markdown: string) => Promise<void>;
  onSaveStatusChange?: (status: SaveStatus) => void;
  readOnly?: boolean;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  documentId,
  relativePath,
  initialContent,
  onContentChange,
  onSaveStatusChange,
  readOnly = false,
}) => {
  const [mode, setMode] = useState<EditorMode>('rich');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [readingMode, setReadingMode] = useState<boolean>(false);
  const [currentPreset, setCurrentPreset] = useState<TypographyPresetId>('literary');
  const [stats, setStats] = useState<EditorStats>(() => calculateEditorStats(initialContent));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('clean');
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [showOutline, setShowOutline] = useState<boolean>(false);

  // Modals state
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
  const [tableModalOpen, setTableModalOpen] = useState<boolean>(false);

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
      onStatusChange: (status) => {
        setSaveStatus(status);
        if (onSaveStatusChange) {
          onSaveStatusChange(status);
        }
      },
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
    if (mode !== 'rich' || readingMode || !editorContainerRef.current) return;

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
            onToggleReadingMode: () => setReadingMode((prev) => !prev),
            onToggleSourceMode: () => handleToggleMode(),
            onSave: () => handleSaveNow(),
            onFind: () => setShowFindReplace(true),
            onToggleOutline: () => setShowOutline((prev) => !prev),
            onAddComment: () => {
              const view = instance.getView();
              if (view) {
                FormattingCommands.insertBookmark(view, 'Comment marker');
              }
            },
            onAddBookmark: () => {
              const view = instance.getView();
              if (view) {
                FormattingCommands.insertBookmark(view, 'Bookmark');
              }
            },
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
  }, [mode, readingMode, readOnly]);

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

  const handleReplaceContent = (newMarkdown: string) => {
    currentContentRef.current = newMarkdown;
    const newStats = calculateEditorStats(newMarkdown);
    setStats(newStats);
    saveCoordinatorRef.current?.updateContent(newMarkdown);
    onContentChange?.(newMarkdown);

    if (mode === 'rich' && editorInstanceRef.current) {
      editorInstanceRef.current.setMarkdown(newMarkdown);
    }
  };

  const presetVariables = getPresetStyleVariables(TYPOGRAPHY_PRESETS[currentPreset] || TYPOGRAPHY_PRESETS.literary);

  return (
    <div
      className={`swrite-editor-container ${focusMode ? 'focus-mode' : ''} ${readingMode ? 'reading-mode' : ''}`}
      style={presetVariables as React.CSSProperties}
    >
      {/* Floating Formatting Toolbar (only in Rich mode and not in focus/reading mode) */}
      {mode === 'rich' && !focusMode && !readingMode && (
        <FormattingBar
          getView={() => editorInstanceRef.current?.getView() || null}
          onOpenLinkModal={() => setLinkModalOpen(true)}
          onOpenImageModal={() => setImageModalOpen(true)}
          onOpenTableModal={() => setTableModalOpen(true)}
          onOpenCommentModal={() => {
            const view = editorInstanceRef.current?.getView();
            if (view) FormattingCommands.insertBookmark(view, 'Comment annotation');
          }}
          onAddBookmark={() => {
            const view = editorInstanceRef.current?.getView();
            if (view) FormattingCommands.insertBookmark(view, 'Bookmark');
          }}
        />
      )}

      {/* Embedded Find & Replace Bar */}
      {showFindReplace && (
        <FindReplaceBar
          getView={() => editorInstanceRef.current?.getView() || null}
          getRawContent={() => currentContentRef.current}
          onReplaceContent={handleReplaceContent}
          onClose={() => setShowFindReplace(false)}
        />
      )}

      {/* Main Canvas Viewport */}
      <div className="swrite-scroll-viewport">
        {readingMode ? (
          <div className="swrite-reading-page">
            <div className="reading-page-header">
              <span className="reading-badge">Reading Mode</span>
              <button
                className="exit-reading-btn"
                onClick={() => setReadingMode(false)}
              >
                Exit Reading Mode (Esc)
              </button>
            </div>
            <div className="reading-prose-content">
              {currentContentRef.current.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        ) : mode === 'rich' ? (
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

      {/* Document Outline Drawer */}
      {showOutline && (
        <DocumentOutline
          markdown={currentContentRef.current}
          onSelectLine={(_line) => {
            setShowOutline(false);
          }}
          onClose={() => setShowOutline(false)}
        />
      )}

      {/* Slash Commands Dropdown */}
      {slashState.open && editorInstanceRef.current?.getView() && (
        <SlashDropdown
          view={editorInstanceRef.current.getView()!}
          query={slashState.query}
          position={slashState.position}
          context={{
            onOpenFind: () => setShowFindReplace(true),
            onOpenLinkModal: () => setLinkModalOpen(true),
            onOpenImageModal: () => setImageModalOpen(true),
            onToggleFocusMode: () => setFocusMode((v) => !v),
            onToggleReadingMode: () => setReadingMode((v) => !v),
          }}
          onClose={() => setSlashState((s) => ({ ...s, open: false }))}
        />
      )}

      {/* Link Modal */}
      {linkModalOpen && (
        <LinkModal
          onConfirm={(url, title) => {
            const view = editorInstanceRef.current?.getView();
            if (view) {
              FormattingCommands.insertLink(view, url, title);
            }
            setLinkModalOpen(false);
          }}
          onClose={() => setLinkModalOpen(false)}
        />
      )}

      {/* Image Modal */}
      {imageModalOpen && (
        <ImageModal
          onConfirm={(src, alt, title) => {
            const view = editorInstanceRef.current?.getView();
            if (view) {
              FormattingCommands.insertImage(view, src, alt, title);
            }
            setImageModalOpen(false);
          }}
          onClose={() => setImageModalOpen(false)}
        />
      )}

      {/* Table Modal */}
      {tableModalOpen && (
        <TableModal
          onConfirm={(rows, cols) => {
            const view = editorInstanceRef.current?.getView();
            if (view) {
              TableCommands.insertTable(view, rows, cols);
            }
            setTableModalOpen(false);
          }}
          onClose={() => setTableModalOpen(false)}
        />
      )}

      {/* Distraction-Free Status Bar */}
      <StatusBar
        stats={stats}
        saveStatus={saveStatus}
        mode={mode}
        focusMode={focusMode}
        readingMode={readingMode}
        currentPreset={currentPreset}
        onToggleMode={handleToggleMode}
        onToggleFocusMode={() => setFocusMode((prev) => !prev)}
        onToggleReadingMode={() => setReadingMode((prev) => !prev)}
        onToggleOutline={() => setShowOutline((prev) => !prev)}
        onSelectPreset={setCurrentPreset}
        onSaveNow={handleSaveNow}
      />
    </div>
  );
};
