import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { DOMSerializer } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useSwriteStore } from '../../store/useSwriteStore';
import { SceneContextBar } from './SceneContextBar';
import { ProofreadingReviewPanel } from './ProofreadingReviewPanel';
import { ProofreadingEngine } from '../../editorial';
import { RevisionQueries } from '../../editorial/revision';
import { ManuscriptReviewMode } from '../revision/ManuscriptReviewMode';
import { Finding, RevisionItemCategory, RevisionItemPriority, REVISION_CATEGORY_LABELS, REVISION_PRIORITY_LABELS } from '../../types';
import { SplitPaneContainer } from './SplitPaneContainer';
import { MarginCommentsPanel } from './MarginCommentsPanel';
import { FootnoteEditorBar } from './FootnoteEditorBar';
import { ambientAudio } from '../../services/ambientAudioService';
import { 
  Bold, Italic, Underline as UnderlineIcon, MessageSquare, 
  BookOpen, MessageSquarePlus, ChevronRight, X, ChevronDown,
  Maximize2, Minimize2, Scissors, SpellCheck, Check, EyeOff, Shield,
  FileEdit, Columns, Rows, LayoutGrid, Bookmark, Music, Volume2, Headphones
} from 'lucide-react';

interface FloatingPosition {
  top: number;
  left: number;
  visible: boolean;
  selectedText: string;
}

interface NovelEditorProps {
  customChapterId?: string;
  isSecondaryPane?: boolean;
  onCloseSecondary?: () => void;
}

export const NovelEditor: React.FC<NovelEditorProps> = ({
  customChapterId,
  isSecondaryPane = false,
  onCloseSecondary
}) => {
  const { 
    project, activeChapterId, secondaryChapterId, setSecondaryChapterId,
    setActiveChapterId, setActiveTab, activeSceneId, setActiveSceneId, splitScene,
    updateChapterContent, addNewChapter, updateTypography,
    addAnnotation, isSidebarOpen, isInspectorOpen, toggleSidebar, toggleInspector,
    isFocusMode, setFocusMode, setInspectorSelection,
    acceptProofreadingFinding, ignoreProofreadingFinding,
    markProofreadingFindingIntentional,
    activeRevisionRoundId, isRevisionReviewModeOpen, setIsRevisionReviewModeOpen,
    createInlineRevisionNote,
    splitPaneState, setSplitPaneState, closeSplitPane,
    editorViewMode, setEditorViewMode,
    focusModeConfig, updateFocusModeConfig,
    activeAnnotationId, setActiveAnnotationId, isMarginCommentsOpen, setIsMarginCommentsOpen,
    activeFootnoteId, setActiveFootnoteId, isFootnoteDrawerOpen, setIsFootnoteDrawerOpen,
    addAnnotationThread, addFootnote
  } = useSwriteStore();

  const currentChId = customChapterId || (isSecondaryPane ? secondaryChapterId : activeChapterId);

  const activeChapter = project.acts
    .flatMap(a => a.chapters)
    .find(c => c.id === currentChId) || project.acts[0]?.chapters[0];
  const activeScene = activeChapter?.scenes?.find(s => s.id === activeSceneId) || activeChapter?.scenes?.[0];
  const editorContent = activeScene?.content ?? activeChapter?.content ?? '';

  const typography = project.metadata.typography;
  const theme = project.metadata.theme;
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handleEditorClick = (e: React.MouseEvent) => {
    const chip = (e.target as HTMLElement).closest('.wikilink-chip');
    if (chip) {
      e.preventDefault();
      e.stopPropagation();
      const target = chip.getAttribute('data-target') || '';
      const alias = chip.getAttribute('data-alias') || target;
      const lowerTarget = target.toLowerCase();
      const lowerAlias = alias.toLowerCase();

      // 1. Look for matching chapter
      const matchedChapter = project.acts
        .flatMap(a => a.chapters)
        .find(c => c.title.toLowerCase().includes(lowerTarget) || c.title.toLowerCase().includes(lowerAlias));

      if (matchedChapter) {
        if (isSecondaryPane) {
          setSecondaryChapterId(matchedChapter.id);
        } else {
          setActiveChapterId(matchedChapter.id);
        }
        return;
      }

      // 2. Look for matching Codex entry or Character
      const matchedCodex = project.codex?.find(cd => 
        cd.name.toLowerCase().includes(lowerTarget) || 
        cd.name.toLowerCase().includes(lowerAlias)
      );

      const matchedChar = project.characters?.find(ch =>
        ch.name.toLowerCase().includes(lowerTarget) ||
        ch.name.toLowerCase().includes(lowerAlias)
      );

      if (matchedCodex || matchedChar) {
        setActiveTab('codex');
        return;
      }

      // Fallback: switch to codex
      setActiveTab('codex');
    }
  };

  const [floatingMenu, setFloatingMenu] = useState<FloatingPosition>({
    top: 0,
    left: 0,
    visible: false,
    selectedText: '',
  });

  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [notePromptOpen, setNotePromptOpen] = useState(false);
  const [noteInputText, setNoteInputText] = useState('');
  const [selectedHighlightColor, setSelectedHighlightColor] = useState('critique');

  // Revision Note Prompt State
  const [revisionPromptOpen, setRevisionPromptOpen] = useState(false);
  const [revisionTitle, setRevisionTitle] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionCategory, setRevisionCategory] = useState<RevisionItemCategory>('prose');
  const [revisionPriority, setRevisionPriority] = useState<RevisionItemPriority>('medium');
  const [splitMenu, setSplitMenu] = useState({ top: 0, left: 0, visible: false });
  const [splitNotice, setSplitNotice] = useState<string | null>(null);
  const [focusStartSceneId, setFocusStartSceneId] = useState<string | null>(null);

  const chapterRevisionCount = useMemo(() => {
    if (!project || !activeChapter) return 0;
    return RevisionQueries.getRevisionItemsForChapter(project, activeChapter.id)
      .filter(i => i.status === 'open' || i.status === 'in-progress').length;
  }, [project, activeChapter?.id]);

  const handleCreateRevisionNote = () => {
    if (!revisionTitle.trim() || !activeChapter) return;
    createInlineRevisionNote({
      chapterId: activeChapter.id,
      sceneId: activeSceneId || activeChapter.scenes?.[0]?.id,
      anchoredText: floatingMenu.selectedText,
      title: revisionTitle.trim(),
      category: revisionCategory,
      priority: revisionPriority,
      notes: revisionNotes.trim() || undefined,
    });
    setRevisionTitle('');
    setRevisionNotes('');
    setRevisionPromptOpen(false);
    setFloatingMenu(prev => ({ ...prev, visible: false }));
  };

  // Proofreading Review Panel & Finding Popover State
  const [isProofreadingOpen, setIsProofreadingOpen] = useState(false);
  const [activeFindingPopover, setActiveFindingPopover] = useState<{
    finding: Finding;
    top: number;
    left: number;
  } | null>(null);

  const proofreadingFindings = useMemo(() => {
    return ProofreadingEngine.runAudit(project, {
      scope: project.metadata?.proofreadingConfig?.scope || 'scene',
      activeChapterId: activeChapter?.id,
      activeSceneId: activeSceneId || undefined,
      customConfig: project.metadata?.proofreadingConfig,
    }).filter(f => f.status === 'open');
  }, [project, activeChapter?.id, activeSceneId]);

  const handleJumpToFinding = (finding: Finding) => {
    if (!editor) return;
    const docText = editor.getText();
    const index = docText.indexOf(finding.originalText);
    if (index >= 0) {
      editor.commands.setTextSelection({ from: index + 1, to: index + 1 + finding.originalText.length });
      const { view } = editor;
      const coords = view.coordsAtPos(index + 1);
      setActiveFindingPopover({
        finding,
        top: Math.max(20, coords.top - 80),
        left: Math.max(20, coords.left),
      });
    }
  };

  const handleAcceptFinding = (finding: Finding) => {
    if (!editor || !finding.suggestedText) return;
    acceptProofreadingFinding(finding);
    const html = editor.getHTML();
    const replaced = html.replace(finding.originalText, finding.suggestedText);
    editor.commands.setContent(replaced);
    setActiveFindingPopover(null);
  };

  // Consecutive enter tracking
  const enterCountRef = useRef(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: false,
      }),
      Underline,
      CharacterCount,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'justify', 'right'],
      }),
      Placeholder.configure({
        placeholder: 'Begin writing your chapter...',
      }),
    ],
    content: editorContent,
    editorProps: {
      attributes: {
        class: `novel-editor-content focus:outline-none leading-relaxed ${
          typography.textAlign === 'justify' ? 'text-justify' : typography.textAlign === 'center' ? 'text-center' : 'text-left'
        }`,
      },
      handleKeyDown: (_view, _event) => {
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (!activeChapter) return;
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      updateChapterContent(activeChapter.id, html, wordCount, activeScene?.id);

      // Typewriter centering effect
      if (typography.typewriterMode && editorContainerRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const container = editorContainerRef.current;
          const containerRect = container.getBoundingClientRect();
          const desiredY = containerRect.top + containerRect.height / 2;
          const diff = rect.top - desiredY;
          if (Math.abs(diff) > 25) {
            container.scrollTop += diff * 0.25;
          }
        }
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
        selectionTimeoutRef.current = null;
      }

      const { from, to } = editor.state.selection;
      if (from !== to && !isFocusMode) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        if (text.trim().length > 0) {
          setInspectorSelection({ type: 'text', text: text.trim() });
        }

        // 220ms presentation delay / debounce to eliminate jarring floating popup
        selectionTimeoutRef.current = setTimeout(() => {
          if (!editor || isFocusMode) return;
          const sel = editor.state.selection;
          if (sel.from === sel.to) return;

          const { view } = editor;
          const start = view.coordsAtPos(sel.from);
          const end = view.coordsAtPos(sel.to);

          const left = (start.left + end.right) / 2;
          const top = start.top - 48;

          setFloatingMenu({
            top: Math.max(10, top),
            left: Math.max(10, left),
            visible: true,
            selectedText: text,
          });
        }, 220);
      } else {
        if (!notePromptOpen && !revisionPromptOpen) {
          setFloatingMenu(prev => ({ ...prev, visible: false }));
        }
      }
    },
  });

  // Keep scene selection in sync when switching chapters, and focus new prose immediately.
  useEffect(() => {
    if (!editor || !activeScene) return;
    if (activeSceneId !== activeScene.id) {
      setActiveSceneId(activeScene.id);
      return;
    }
    requestAnimationFrame(() => {
      editor.commands.focus(focusStartSceneId === activeScene.id ? 'start' : 'end');
      if (focusStartSceneId === activeScene.id) setFocusStartSceneId(null);
    });
  }, [editor, currentChId, activeScene?.id, focusStartSceneId]);

  // Clear floating menu on focus mode toggle
  useEffect(() => {
    if (isFocusMode) {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
      setFloatingMenu(prev => ({ ...prev, visible: false }));
      setNotePromptOpen(false);
      setRevisionPromptOpen(false);
    }
  }, [isFocusMode]);

  // Re-sync editor content when switching chapter or scene.
  useEffect(() => {
    if (editor && activeChapter && editor.getHTML() !== editorContent) {
      editor.commands.setContent(editorContent);
    }
  }, [currentChId, editor, activeScene?.id, editorContent]);

  // Review explicitly requests may focus the matching prose range; ordinary typing never does.
  useEffect(() => {
    const handleReviewRange = (event: Event) => {
      if (!editor) return;
      const text = (event as CustomEvent<{ text?: string; focus?: boolean }>).detail?.text;
      if (!text) return;
      const index = editor.getText().indexOf(text);
      if (index < 0) return;
      editor.commands.setTextSelection({ from: index + 1, to: index + 1 + text.length });
      if ((event as CustomEvent<{ focus?: boolean }>).detail?.focus) {
        editor.commands.focus();
        editor.commands.scrollIntoView();
      }
    };
    window.addEventListener('swrite:review-range', handleReviewRange);
    return () => window.removeEventListener('swrite:review-range', handleReviewRange);
  }, [editor]);

  // Escape key listener for Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (notePromptOpen) {
          setNotePromptOpen(false);
          setFloatingMenu(prev => ({ ...prev, visible: false }));
        } else if (revisionPromptOpen) {
          setRevisionPromptOpen(false);
          setFloatingMenu(prev => ({ ...prev, visible: false }));
        } else if (isFocusMode) {
          setFocusMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, setFocusMode, notePromptOpen, revisionPromptOpen]);

  const handleApplyHighlight = (colorKey: string) => {
    if (!editor) return;
    const color = (theme.highlightColors as any)[colorKey] || '#EF4444';
    editor.chain().focus().toggleHighlight({ color }).run();
    setFloatingMenu(prev => ({ ...prev, visible: false }));
  };

  const handleCreateComment = () => {
    if (!noteInputText.trim() || !activeChapter) return;
    const color = (theme.highlightColors as any)[selectedHighlightColor] || '#EF4444';
    
    editor?.chain().focus().setHighlight({ color }).run();

    if (activeScene) {
      addAnnotationThread({
        sceneId: activeScene.id,
        highlightedText: floatingMenu.selectedText,
        comment: noteInputText,
        color: selectedHighlightColor
      });
    }

    addAnnotation({
      id: `ann-${Date.now()}`,
      chapterId: activeChapter.id,
      type: 'comment',
      color,
      quote: floatingMenu.selectedText,
      noteText: noteInputText,
      resolved: false,
      createdAt: new Date().toISOString(),
    });

    setNoteInputText('');
    setNotePromptOpen(false);
    setFloatingMenu(prev => ({ ...prev, visible: false }));
  };

  const handleSplitAtCursor = () => {
    if (!editor || !activeChapter) return;
    const currentScene = (activeChapter.scenes || []).find(s => s.id === activeSceneId) || activeChapter.scenes?.[0];
    if (!currentScene) return;
    const { from } = editor.state.selection;
    const docSize = editor.state.doc.content.size;
    const cursorTextBefore = editor.state.doc.textBetween(0, from, '\n', '\n').trim();
    const cursorTextAfter = editor.state.doc.textBetween(from, docSize, '\n', '\n').trim();
    if (!cursorTextBefore || !cursorTextAfter || from <= 1 || from >= docSize) {
      setSplitNotice('Place the cursor between words or paragraphs to split this scene.');
      window.setTimeout(() => setSplitNotice(null), 2800);
      setSplitMenu({ top: 0, left: 0, visible: false });
      return;
    }
    if (!editor.state.selection.$from.parent.isTextblock) {
      setSplitNotice('This document element cannot be split here.');
      window.setTimeout(() => setSplitNotice(null), 2800);
      return;
    }

    const serialize = (node: typeof editor.state.doc) => {
      const wrapper = document.createElement('div');
      wrapper.appendChild(DOMSerializer.fromSchema(editor.schema).serializeFragment(node.content));
      return wrapper.innerHTML;
    };
    const beforeHtml = serialize(editor.state.doc.cut(0, from));
    const afterHtml = serialize(editor.state.doc.cut(from));
    if (!beforeHtml || !afterHtml) return;

    const splitRes = splitScene(currentScene.id, beforeHtml, afterHtml, 'Untitled Scene');
    setActiveChapterId(activeChapter.id);
    setActiveSceneId(splitRes.newScene.id);
    setFocusStartSceneId(splitRes.newScene.id);
    setSplitMenu({ top: 0, left: 0, visible: false });
    setFloatingMenu(prev => ({ ...prev, visible: false }));
    setSplitNotice(`Scene split · ${currentScene.title || 'Scene'} → ${splitRes.newScene.title}`);
    window.setTimeout(() => setSplitNotice(null), 2800);
  };

  useEffect(() => {
    const handleSplitRequest = () => handleSplitAtCursor();
    window.addEventListener('swrite:split-scene-here', handleSplitRequest);
    return () => window.removeEventListener('swrite:split-scene-here', handleSplitRequest);
  }, [editor, activeChapter?.id, activeSceneId]);

  const wordCount = activeScene?.wordCount || activeChapter?.wordCount || 0;
  const allChapters = project.acts.flatMap(a => a.chapters.map(c => ({ ...c, actTitle: a.title })));

  const editorBody = (
    <div 
      className="relative flex-1 flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: theme.colors?.background || theme.bg,
        color: theme.colors?.text || theme.text,
        ['--novel-indent' as any]: `${typography.paragraphIndent}em`,
        ['--scene-ornament' as any]: `"${typography.sceneOrnament}"`,
        ['--accent-color' as any]: theme.colors?.accent || theme.accent,
        ['--muted-color' as any]: theme.colors?.textMuted || theme.muted,
      }}
    >
      {/* Top Header Bar (Focus Mode vs Standard Mode) */}
      {isFocusMode ? (
        <div 
          className="flex items-center justify-between px-6 sm:px-10 py-2.5 border-b text-xs select-none transition-opacity duration-200 z-20 shrink-0 opacity-70 hover:opacity-100"
          style={{ borderColor: theme.colors?.border || theme.pageBorder, backgroundColor: theme.colors?.background || theme.bg }}
        >
          <div className="flex items-center space-x-3 text-zinc-400">
            <span className="font-serif italic text-zinc-300 text-sm">
              {activeChapter?.title || 'Untitled Chapter'}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-zinc-400 text-xs">
            <span className="font-mono text-zinc-500 text-[11px]">{wordCount.toLocaleString()} words</span>
            <button
              onClick={() => setFocusMode(false)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-zinc-700/60 text-xs transition-colors"
              title="Exit Focus Mode (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Focus</span>
              <kbd className="text-[10px] text-zinc-500 bg-zinc-800 px-1 py-0.5 rounded font-mono border border-zinc-700 ml-1">Esc</kbd>
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="flex items-center justify-between px-4 sm:px-6 py-2 border-b text-xs select-none transition-colors z-20 shrink-0"
          style={{ borderColor: theme.pageBorder, backgroundColor: theme.bg }}
        >
          <div className="flex items-center space-x-2 text-zinc-400">
            {!isSecondaryPane && (
              <button 
                onClick={toggleSidebar}
                className="p-1 hover:text-zinc-200 transition-colors"
                title="Toggle Outliner"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            )}

            {isSecondaryPane ? (
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Split View
                </span>
                <select
                  value={currentChId}
                  onChange={(e) => setSecondaryChapterId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-100 outline-none"
                >
                  {allChapters.map(ch => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title} ({ch.wordCount}w)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="font-medium text-zinc-200 text-xs truncate max-w-[200px]">
                {activeChapter?.title || 'Untitled Chapter'}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-zinc-400 text-xs">
            <span className="font-mono text-[11px]">{wordCount.toLocaleString()} words</span>

            {/* View Switcher [Manuscript | Corkboard] */}
            {!isSecondaryPane && activeChapter?.scenes && activeChapter.scenes.length > 0 && (
              <div className="flex items-center rounded-md border border-zinc-700 bg-zinc-900/90 p-0.5 text-xs">
                <button
                  onClick={() => setEditorViewMode('editor')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    editorViewMode === 'editor' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setEditorViewMode('corkboard')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    editorViewMode === 'corkboard' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" />
                  Corkboard
                </button>
              </div>
            )}

            {!isSecondaryPane && (
              <button 
                onClick={() => setSplitPaneState({ isOpen: !splitPaneState.isOpen })}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-colors text-xs ${
                  splitPaneState.isOpen 
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                title="Toggle Split-Screen Reference View"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
            )}

            {!isSecondaryPane && (
              <button 
                onClick={() => setIsMarginCommentsOpen(!isMarginCommentsOpen)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-colors text-xs ${
                  isMarginCommentsOpen 
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                title="Toggle Margin Comments & Annotations"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Comments</span>
                {(project.annotationThreads || []).filter(t => t.sceneId === activeScene?.id && !t.isResolved).length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-mono">
                    {(project.annotationThreads || []).filter(t => t.sceneId === activeScene?.id && !t.isResolved).length}
                  </span>
                )}
              </button>
            )}

            {!isSecondaryPane && (
              <button 
                onClick={() => setIsFootnoteDrawerOpen(!isFootnoteDrawerOpen)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-colors text-xs ${
                  isFootnoteDrawerOpen 
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                title="Toggle Footnotes & Endnotes Tray"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Notes</span>
                {(project.footnotes || []).filter(f => f.sceneId === activeScene?.id).length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-mono">
                    {(project.footnotes || []).filter(f => f.sceneId === activeScene?.id).length}
                  </span>
                )}
              </button>
            )}

            {!isSecondaryPane && (
              <button 
                onClick={() => setIsProofreadingOpen(!isProofreadingOpen)}
                className={`flex items-center space-x-1.5 px-2 py-0.5 rounded transition-colors text-xs ${
                  isProofreadingOpen 
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                title="Toggle Proofreading & Editorial Review"
              >
                <SpellCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Review</span>
                {proofreadingFindings.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-mono">
                    {proofreadingFindings.length}
                  </span>
                )}
              </button>
            )}

            {!isSecondaryPane && (
              <button 
                onClick={() => setIsRevisionReviewModeOpen(!isRevisionReviewModeOpen)}
                className={`flex items-center space-x-1.5 px-2 py-0.5 rounded transition-colors text-xs ${
                  isRevisionReviewModeOpen 
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                title="Toggle Manuscript Sequential Revision Mode"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Revise</span>
                {chapterRevisionCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-mono">
                    {chapterRevisionCount}
                  </span>
                )}
              </button>
            )}

            {!isSecondaryPane && (
              <button 
                onClick={() => setFocusMode(true)}
                className="flex items-center space-x-1 px-2 py-0.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded transition-colors text-xs"
                title="Enter Focus Mode"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Focus</span>
              </button>
            )}
            
            {!isSecondaryPane && (
              <button 
                onClick={toggleInspector}
                className="p-1 hover:text-zinc-200 transition-colors"
                title="Toggle Margin Notes"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
              </button>
            )}

            {isSecondaryPane && onCloseSecondary && (
              <button
                onClick={onCloseSecondary}
                className="p-1 hover:text-zinc-200 text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
                title="Close Split Pane"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor Main Canvas & Side Drawers */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Main Canvas (Full Height Scrolling) */}
        <div 
          ref={editorContainerRef}
          className={`flex-1 overflow-y-auto px-4 md:px-8 py-6 flex justify-center items-start ${
            typography.typewriterMode ? 'typewriter-active' : ''
          }`}
        >
          {/* Seamless Manuscript Page Sheet */}
          <div 
            onClick={(e) => { handleEditorClick(e); setSplitMenu(prev => ({ ...prev, visible: false })); }}
            onContextMenu={(e) => {
              if ((e.target as HTMLElement).closest('.ProseMirror') && editor) {
                e.preventDefault();
                const coords = editor.view.coordsAtPos(editor.state.selection.from);
                setSplitMenu({ top: coords.bottom + 6, left: coords.left, visible: true });
              }
            }}
            className={`w-full transition-all duration-150 rounded-sm p-6 sm:p-10 md:p-14 novel-indent-mode ${
              typography.dropCap ? 'drop-cap-enabled' : ''
            } border book-page-sheet mb-20 min-h-[calc(100vh-140px)] cursor-text`}
            style={{
              maxWidth: `${typography.pageWidth}px`,
              backgroundColor: theme.colors?.editorPage || theme.colors?.surface || theme.pageBg,
              borderColor: theme.colors?.border || theme.pageBorder,
              color: theme.colors?.editorPageText || theme.colors?.text || theme.text,
              fontFamily: typography.manuscriptFont || typography.fontFamily,
              fontSize: `${typography.fontSize}px`,
              lineHeight: typography.lineHeight,
              letterSpacing: `${typography.letterSpacing || 0}em`,
            }}
          >
            {/* Level 2: Subtle Collapsible Scene Context Bar */}
            <SceneContextBar chapterId={activeChapter.id} onSplitAtCursor={handleSplitAtCursor} />

            {/* Level 1: Manuscript Prose */}
            <EditorContent editor={editor} />

            {/* Obsidian Running Stats Footer */}
            <div 
              className="flex items-center justify-between pt-6 mt-12 border-t text-[11px] text-zinc-500 font-mono select-none not-prose"
              style={{ borderColor: theme.colors?.border || theme.pageBorder }}
            >
              <div className="flex items-center space-x-3">
                <span>{activeChapter?.wikilinks?.length || 0} backlink{(activeChapter?.wikilinks?.length || 0) === 1 ? '' : 's'}</span>
                <span>•</span>
                <span className="capitalize">{activeChapter?.status || 'draft'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-zinc-400 font-medium">{wordCount.toLocaleString()} words</span>
                <span>•</span>
                <span>{Math.round(wordCount * 5.4).toLocaleString()} characters</span>
              </div>
            </div>
          </div>

          {/* Footnote Editor Bar (Bottom Docked) */}
          {isFootnoteDrawerOpen && !isSecondaryPane && activeScene && (
            <FootnoteEditorBar sceneId={activeScene.id} />
          )}
        </div>

        {/* Margin Comments Panel Side Drawer */}
        {isMarginCommentsOpen && !isSecondaryPane && activeScene && (
          <MarginCommentsPanel sceneId={activeScene.id} />
        )}

        {/* Proofreading Review Panel Side Drawer */}
        {isProofreadingOpen && !isSecondaryPane && (
          <div className="w-80 md:w-96 border-l shrink-0 flex flex-col h-full bg-[#141416] z-10" style={{ borderColor: theme.pageBorder }}>
            <ProofreadingReviewPanel 
              onClose={() => setIsProofreadingOpen(false)}
              onJumpToFinding={handleJumpToFinding}
            />
          </div>
        )}
      </div>

      {/* Popover for active Finding */}
      {activeFindingPopover && (
        <div 
          className="fixed z-50 bg-[#1c1c21] border border-zinc-700 rounded-lg p-3 shadow-2xl w-80 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
          style={{ 
            top: `${activeFindingPopover.top}px`, 
            left: `${activeFindingPopover.left}px` 
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-zinc-100 flex items-center space-x-1">
              <SpellCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="capitalize">{activeFindingPopover.finding.category} suggestion</span>
            </span>
            <button 
              onClick={() => setActiveFindingPopover(null)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="text-zinc-300 text-[11px] mb-2">
            {activeFindingPopover.finding.message}
          </div>

          <div className="flex items-center space-x-2 text-xs bg-zinc-900/90 p-2 rounded border border-zinc-800 mb-3">
            <span className="line-through text-red-400 font-mono">{activeFindingPopover.finding.originalText}</span>
            {activeFindingPopover.finding.suggestedText && (
              <>
                <span className="text-zinc-500">→</span>
                <span className="text-emerald-400 font-mono font-medium">{activeFindingPopover.finding.suggestedText}</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  ignoreProofreadingFinding(activeFindingPopover.finding.id);
                  setActiveFindingPopover(null);
                }}
                className="px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded text-[11px] flex items-center space-x-1"
                title="Ignore this instance"
              >
                <EyeOff className="w-3 h-3" />
                <span>Ignore</span>
              </button>
              <button
                onClick={() => {
                  markProofreadingFindingIntentional(activeFindingPopover.finding.id);
                  setActiveFindingPopover(null);
                }}
                className="px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded text-[11px] flex items-center space-x-1"
                title="Mark intentional"
              >
                <Shield className="w-3 h-3" />
                <span>Intentional</span>
              </button>
            </div>

            {activeFindingPopover.finding.suggestedText && (
              <button
                onClick={() => handleAcceptFinding(activeFindingPopover.finding)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-[11px] transition-colors flex items-center space-x-1"
              >
                <Check className="w-3 h-3" />
                <span>Accept</span>
              </button>
            )}
          </div>
        </div>
      )}

      {splitMenu.visible && (
        <>
          <button aria-label="Close scene split menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setSplitMenu(prev => ({ ...prev, visible: false }))} />
          <div className="fixed z-50 rounded-md border border-zinc-700 bg-[#18181b] shadow-xl p-1" style={{ top: splitMenu.top, left: splitMenu.left }}>
            <button onClick={handleSplitAtCursor} className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800 whitespace-nowrap"><Scissors className="w-3.5 h-3.5 text-zinc-400" />Split Scene Here</button>
          </div>
        </>
      )}
      {splitNotice && <div role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded border border-zinc-700 bg-[#18181b]/95 text-xs text-zinc-300 shadow-lg">{splitNotice}</div>}

      {/* Floating Selection Highlighter Toolbar */}
      {floatingMenu.visible && editor && (
        <div 
          className="fixed z-50 transform -translate-x-1/2 flex items-center bg-[#18181b] border border-zinc-700/80 rounded-lg shadow-xl px-2 py-1 space-x-1.5 text-xs text-zinc-200 select-none animate-in fade-in zoom-in-95 duration-100"
          style={{ 
            top: `${floatingMenu.top}px`, 
            left: `${floatingMenu.left}px` 
          }}
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-zinc-800 ${editor.isActive('bold') ? 'text-indigo-400 font-bold' : ''}`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-zinc-800 ${editor.isActive('italic') ? 'text-indigo-400 italic' : ''}`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-zinc-800 ${editor.isActive('underline') ? 'text-indigo-400 underline' : ''}`}
            title="Underline"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

          {/* Highlight Color Pickers */}
          <div className="flex items-center space-x-1">
            {Object.entries(theme.highlightColors).map(([key, color]) => (
              <button
                key={key}
                onClick={() => handleApplyHighlight(key)}
                className="w-3.5 h-3.5 rounded-full border border-black/20 hover:scale-125 transition-transform"
                style={{ backgroundColor: color }}
                title={`Highlight ${key}`}
              />
            ))}
          </div>

          <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

          {/* Split Scene at Selection */}
          <button
            onClick={handleSplitAtCursor}
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Split scene at selection"
          >
            <Scissors className="w-3 h-3 text-zinc-400" />
            <span className="text-[11px]">Split</span>
          </button>

          <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

          {/* Add Margin Note / Editorial Comment */}
          <button
            onClick={() => {
              setNotePromptOpen(!notePromptOpen);
              setRevisionPromptOpen(false);
            }}
            className="flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <MessageSquare className="w-3 h-3 text-amber-400" />
            <span className="text-[11px]">Note</span>
          </button>

          {/* Add Inline Revision Note */}
          <button
            onClick={() => {
              setRevisionPromptOpen(!revisionPromptOpen);
              setNotePromptOpen(false);
            }}
            className="flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-zinc-800 text-amber-300 hover:text-amber-200 transition-colors"
            title="Create Anchored Revision Note"
          >
            <FileEdit className="w-3 h-3 text-amber-400" />
            <span className="text-[11px]">Revise</span>
          </button>

          {/* Add Footnote */}
          {activeScene && (
            <button
              onClick={() => {
                addFootnote(activeScene.id, `Citation/note on: "${floatingMenu.selectedText.slice(0, 30)}..."`);
                setFloatingMenu(prev => ({ ...prev, visible: false }));
              }}
              className="flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-zinc-800 text-amber-300 hover:text-amber-200 transition-colors"
              title="Insert Footnote at Selection"
            >
              <Bookmark className="w-3 h-3 text-amber-400" />
              <span className="text-[11px]">Footnote</span>
            </button>
          )}
        </div>
      )}

      {/* Popover for Margin Note Input */}
      {notePromptOpen && (
        <div 
          className="fixed z-50 transform -translate-x-1/2 mt-12 bg-[#1c1c21] border border-zinc-700 rounded-lg p-3 shadow-2xl w-72 text-xs text-zinc-200"
          style={{ 
            top: `${floatingMenu.top}px`, 
            left: `${floatingMenu.left}px` 
          }}
        >
          <div className="font-semibold text-zinc-100 mb-1.5 flex items-center justify-between">
            <span>Add Editorial Margin Note</span>
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Critique</span>
          </div>
          <div className="text-[11px] text-zinc-400 italic mb-2 line-clamp-2 bg-zinc-900/80 p-1.5 rounded border border-zinc-800">
            "{floatingMenu.selectedText}"
          </div>
          <textarea
            autoFocus
            rows={3}
            placeholder="Type feedback, character continuity note, or sensory detail..."
            value={noteInputText}
            onChange={(e) => setNoteInputText(e.target.value)}
            className="w-full bg-[#121215] border border-zinc-700 rounded p-2 text-zinc-200 text-xs focus:border-zinc-500 outline-none resize-none mb-2"
          />
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {['critique', 'sensory', 'factcheck', 'favorite'].map(cKey => (
                <button
                  key={cKey}
                  onClick={() => setSelectedHighlightColor(cKey)}
                  className={`w-3.5 h-3.5 rounded-full border ${selectedHighlightColor === cKey ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: (theme.highlightColors as any)[cKey] }}
                />
              ))}
            </div>
            <div className="flex space-x-1.5">
              <button
                onClick={() => setNotePromptOpen(false)}
                className="px-2 py-1 text-zinc-400 hover:text-zinc-200 text-[11px]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateComment}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded text-[11px] transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popover for Anchored Revision Note Input */}
      {revisionPromptOpen && (
        <div 
          className="fixed z-50 transform -translate-x-1/2 mt-12 bg-[#1c1c21] border border-amber-600/60 rounded-lg p-3.5 shadow-2xl w-80 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
          style={{ 
            top: `${floatingMenu.top}px`, 
            left: `${floatingMenu.left}px` 
          }}
        >
          <div className="font-semibold text-zinc-100 mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileEdit className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Revision Item</span>
            </div>
            <span className="text-[10px] text-amber-400 font-mono uppercase">Anchored</span>
          </div>

          <div className="text-[11px] text-amber-200/80 italic mb-2.5 line-clamp-2 bg-amber-950/30 p-1.5 rounded border border-amber-800/40">
            "{floatingMenu.selectedText}"
          </div>

          <div className="space-y-2 mb-3">
            <div>
              <label className="block text-[10px] text-zinc-400 uppercase font-medium mb-1">
                Issue / Action Title
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g., Strengthen opening sensory hook..."
                value={revisionTitle}
                onChange={(e) => setRevisionTitle(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase font-medium mb-1">
                  Category
                </label>
                <select
                  value={revisionCategory}
                  onChange={(e) => setRevisionCategory(e.target.value as RevisionItemCategory)}
                  className="w-full bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:border-amber-500 outline-none"
                >
                  {Object.entries(REVISION_CATEGORY_LABELS).map(([catKey, label]) => (
                    <option key={catKey} value={catKey}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase font-medium mb-1">
                  Priority
                </label>
                <select
                  value={revisionPriority}
                  onChange={(e) => setRevisionPriority(e.target.value as RevisionItemPriority)}
                  className="w-full bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:border-amber-500 outline-none"
                >
                  {Object.entries(REVISION_PRIORITY_LABELS).map(([pKey, label]) => (
                    <option key={pKey} value={pKey}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 uppercase font-medium mb-1">
                Editorial Notes & Guidance (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Specific guidance on what to adjust..."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-700 rounded p-1.5 text-zinc-200 text-xs focus:border-amber-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800">
            <button
              onClick={() => setRevisionPromptOpen(false)}
              className="px-2.5 py-1 text-zinc-400 hover:text-zinc-200 text-[11px]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRevisionNote}
              disabled={!revisionTitle.trim()}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-medium rounded text-[11px] transition-colors"
            >
              Add Revision Note
            </button>
          </div>
        </div>
      )}

      {/* Docked Sequential Manuscript Review Mode Runner */}
      {isRevisionReviewModeOpen && !isSecondaryPane && (
        <ManuscriptReviewMode
          onClose={() => setIsRevisionReviewModeOpen(false)}
          onNavigateToScene={(chId, scId, anchorText) => {
            setActiveChapterId(chId);
            if (scId) setActiveSceneId(scId);
            if (anchorText && editor) {
              setTimeout(() => {
                const docText = editor.getText();
                const idx = docText.indexOf(anchorText);
                if (idx >= 0) {
                  editor.commands.setTextSelection({ from: idx + 1, to: idx + 1 + anchorText.length });
                }
              }, 60);
            }
          }}
        />
      )}
    </div>
  );

  if (!isSecondaryPane && splitPaneState.isOpen) {
    return <SplitPaneContainer>{editorBody}</SplitPaneContainer>;
  }

  return editorBody;
};
