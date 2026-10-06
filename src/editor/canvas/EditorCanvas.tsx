import React, { useEffect, useRef, useState } from 'react';
import { createSwriteEditor, SwriteEditorInstance } from '../core/createEditor';
import { SourceEditor } from '../source/SourceEditor';
import { StatusBar } from './StatusBar';
import { FormattingBar } from './FormattingBar';
import { SlashDropdown } from './SlashDropdown';
import { FindReplaceBar } from './FindReplaceBar';
import { DocumentOutline } from './DocumentOutline';
import { LinkModal, ImageModal, TableModal } from './LinkImageModals';
import { DocumentMetadataHeader } from './DocumentMetadataHeader';
import { extractFrontmatter, combineFrontmatter } from '../core/frontmatter';
import { SaveCoordinator } from '../sync/saveCoordinator';
import { reportError } from '../../lib/errors';
import { calculateEditorStats } from '../core/stats';
import { FormattingCommands } from '../commands/formatting';
import { TableCommands } from '../commands/tableCommands';
import { TypographyPresetId, TYPOGRAPHY_PRESETS, getPresetStyleVariables } from './typographyPresets';
import { useOptionalTheme } from '../../theme/useTheme';
import { themeTypographyToVars } from '../../theme/themes';
import { EditorMode, EditorStats, SaveStatus } from '../core/types';
import './editor.css';

export interface EditorCanvasProps {
  documentId: string;
  relativePath: string;
  initialContent: string;
  onContentChange?: (markdown: string) => void;
  onSave?: (markdown: string) => Promise<void>;
  onSaveStatusChange?: (status: SaveStatus) => void;
  onNavigateWikilink?: (target: string) => void;
  readOnly?: boolean;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  documentId,
  relativePath,
  initialContent,
  onContentChange,
  onSaveStatusChange,
  onNavigateWikilink,
  readOnly = false,
}) => {
  const [mode, setMode] = useState<EditorMode>('rich');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [readingMode, setReadingMode] = useState<boolean>(false);
  const [currentPreset, setCurrentPreset] = useState<TypographyPresetId>('literary');
  const [baseWords] = useState(() => calculateEditorStats(initialContent).wordCount);
  const [sessionGoal, setSessionGoal] = useState<number>(() => {
      const raw = localStorage.getItem('swrite_session_goal');
  // Picking a preset opts out for this session; "Theme pairing" in the menu opts back in.
  const [presetTouched, setPresetTouched] = useState<boolean>(false);
  const theme = useOptionalTheme()?.theme ?? null;
  const [stats, setStats] = useState<EditorStats>(() => calculateEditorStats(initialContent));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('clean');
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [showOutline, setShowOutline] = useState<boolean>(false);

  // Frontmatter state
  const initialParsed = extractFrontmatter(initialContent);
  const [frontmatter, setFrontmatter] = useState<string | null>(initialParsed.frontmatter);
  const [metadata, setMetadata] = useState<Record<string, string>>(initialParsed.metadata);
  const frontmatterRef = useRef<string | null>(initialParsed.frontmatter);
  const bodyMarkdownRef = useRef<string>(initialParsed.body);
  const fullMarkdownRef = useRef<string>(initialContent);

  // Modals state
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
  const [tableModalOpen, setTableModalOpen] = useState<boolean>(false);

  const [slashState, setSlashState] = useState<{
    open: boolean;
    query: string;

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<SwriteEditorInstance | null>(null);
  const saveCoordinatorRef = useRef<SaveCoordinator | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Reset scroll position to top when switching documents
  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = 0;
    }
  }, [documentId]);

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

  // Initialize Milkdown Rich Editor with body markdown only
  useEffect(() => {
    if (mode !== 'rich' || readingMode || !editorContainerRef.current) return;

    let isMounted = true;

    async function initEditor() {
      if (!editorContainerRef.current) return;

      try {
        const instance = await createSwriteEditor({
          root: editorContainerRef.current,
          initialMarkdown: bodyMarkdownRef.current,
          editable: !readOnly,
          onNavigateWikilink,
          callbacks: {
            onChange: (bodyMarkdown, newStats) => {
              bodyMarkdownRef.current = bodyMarkdown;
              const fullMarkdown = combineFrontmatter(frontmatterRef.current, bodyMarkdown);
              fullMarkdownRef.current = fullMarkdown;
              setStats(newStats);
              saveCoordinatorRef.current?.updateContent(fullMarkdown);
              onContentChange?.(fullMarkdown);

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
        reportError('editor-init', err, { notify: true });
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
  }, [mode, readingMode, readOnly, documentId]);

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
      });
    } else if (slashState.open) {
      setSlashState((s) => ({ ...s, open: false }));
    }
  };

  const handleToggleMode = () => {
    if (mode === 'rich') {
      if (editorInstanceRef.current) {
        bodyMarkdownRef.current = editorInstanceRef.current.getMarkdown();
      }
      fullMarkdownRef.current = combineFrontmatter(frontmatterRef.current, bodyMarkdownRef.current);
      setMode('source');
    } else {
      const parsed = extractFrontmatter(fullMarkdownRef.current);
      setFrontmatter(parsed.frontmatter);
      setMetadata(parsed.metadata);
      frontmatterRef.current = parsed.frontmatter;
      bodyMarkdownRef.current = parsed.body;
      setMode('rich');
    }
  };

  const handleSourceChange = (newFullMarkdown: string, newStats: EditorStats) => {
    fullMarkdownRef.current = newFullMarkdown;
    const parsed = extractFrontmatter(newFullMarkdown);
    setFrontmatter(parsed.frontmatter);
    setMetadata(parsed.metadata);
    frontmatterRef.current = parsed.frontmatter;
    bodyMarkdownRef.current = parsed.body;
    setStats(newStats);
    saveCoordinatorRef.current?.updateContent(newFullMarkdown);
    onContentChange?.(newFullMarkdown);
  };

  const handleSaveNow = async () => {
    if (saveCoordinatorRef.current) {
      await saveCoordinatorRef.current.saveNow();
    }
  };

  const handleReplaceContent = (newFullMarkdown: string) => {
    fullMarkdownRef.current = newFullMarkdown;
    const parsed = extractFrontmatter(newFullMarkdown);
    setFrontmatter(parsed.frontmatter);
    setMetadata(parsed.metadata);
    frontmatterRef.current = parsed.frontmatter;
    bodyMarkdownRef.current = parsed.body;
    const newStats = calculateEditorStats(newFullMarkdown);
    setStats(newStats);
    saveCoordinatorRef.current?.updateContent(newFullMarkdown);
    onContentChange?.(newFullMarkdown);

    if (mode === 'rich' && editorInstanceRef.current) {
      editorInstanceRef.current.setMarkdown(parsed.body);
    }
  };

  const themeVars = theme?.typography ? themeTypographyToVars(theme.typography) : null;
  const presetVars = getPresetStyleVariables(TYPOGRAPHY_PRESETS[currentPreset] || TYPOGRAPHY_PRESETS.literary);
  // Theme pairing wins until the user explicitly picks a preset (per session + per document).
  const presetVariables = !presetTouched && themeVars ? themeVars : presetVars;
    setPresetTouched(false);
  const handleEditSessionGoal = () => {
    const raw = window.prompt('Session word goal:', String(sessionGoal));
    setSessionGoal(n);
      localStorage.setItem('swrite_session_goal', String(n));

  return (
    <div
      style={presetVariables as React.CSSProperties}
    >
      {/* Dedicated Workspace Formatting Toolbar (only in Rich mode and not in focus/reading mode) */}
      {mode === 'rich' && !focusMode && !readingMode && (
        <div className="swrite-editor-toolbar-zone">
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
        </div>
      )}

      {/* Embedded Find & Replace Header Zone */}
      {showFindReplace && (
        <div className="swrite-editor-find-zone">
          <FindReplaceBar
            getView={() => editorInstanceRef.current?.getView() || null}
            getRawContent={() => fullMarkdownRef.current}
            onReplaceContent={handleReplaceContent}
            onClose={() => setShowFindReplace(false)}
          />
        </div>
      )}

      {/* Main Canvas Viewport */}
      <div ref={scrollViewportRef} className="swrite-scroll-viewport">
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
              {bodyMarkdownRef.current.split('\n\n').map((paragraph, i) => (
                <p key={i}>{renderParagraphWithWikilinks(paragraph, onNavigateWikilink)}</p>
              ))}
            </div>
          </div>
        ) : mode === 'rich' ? (
          <div className="swrite-manuscript-page">
            <DocumentMetadataHeader metadata={metadata} rawFrontmatter={frontmatter} />
            <div ref={editorContainerRef} className="milkdown-wrapper" />
          </div>
        ) : (
          <SourceEditor
            initialValue={fullMarkdownRef.current}
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
          markdown={fullMarkdownRef.current}
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
        sessionGoalWords={sessionGoal}
        sessionDeltaWords={Math.max(0, stats.wordCount - baseWords)}
        onEditSessionGoal={handleEditSessionGoal}
        themeName={theme?.name}
        usingThemePairing={!presetTouched && !!themeVars}
        onToggleMode={handleToggleMode}
        onToggleFocusMode={() => setFocusMode((prev) => !prev)}
        onToggleReadingMode={() => setReadingMode((prev) => !prev)}
        onToggleOutline={() => setShowOutline((prev) => !prev)}
          setPresetTouched(true);
        onSelectThemePairing={() => setPresetTouched(false)}
        onSaveNow={handleSaveNow}
      />
    </div>
  );
};

function renderParagraphWithWikilinks(text: string, onNavigate?: (target: string) => void) {
  const parts: React.ReactNode[] = [];
  const regex = /\[\[([^\]\n]+?)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const inner = match[1].trim();
    let target = inner;
    let label = inner;
    if (inner.includes('|')) {
      const split = inner.split('|');
      target = split[0].trim();
      label = split.slice(1).join('|').trim();
    }
    parts.push(
      <span
        key={match.index}
        className="swrite-wikilink"
        data-target={target}
        onClick={(e) => {
          e.preventDefault();
          onNavigate?.(target);
        }}
        title={`Open [[${target}]]`}
      >
        {label || target}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

