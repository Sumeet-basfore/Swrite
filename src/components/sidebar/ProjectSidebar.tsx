import React, { useState, useRef, useEffect } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { StorageService } from '../../services/storageService';
import { 
  Folder, FolderOpen, FolderPlus, Plus, FileText, ChevronDown, ChevronRight, 
  Search, Trash2, Edit2, ArrowRightLeft, Check, GripVertical, FileUp, 
  BookOpen, Scissors, Users, MapPin, GitBranch, Bookmark, Clock,
  FolderTree, FileCode, Layers, Copy, Network, Sliders, Palette
} from 'lucide-react';
import { CodexEntry } from '../../types';
import { RevisionQueries } from '../../editorial/revision';

interface DragState {
  type: 'chapter' | 'act' | 'scene';
  id?: string;
  sourceActId?: string;
  sourceChapterId?: string;
  actIndex?: number;
  sceneIndex?: number;
}

interface DropIndicator {
  actId?: string;
  chapterId?: string;
  sceneId?: string;
  position?: 'before' | 'after' | 'inside';
}

export const ProjectSidebar: React.FC = () => {
  const { 
    project, activeChapterId, activeSceneId, setActiveChapterId, setActiveSceneId, 
    setActiveTab, addNewChapter, deleteChapter,
    deleteChapterToCutDrawer, restoreCutScene, deleteCutScenePermanently,
    updateChapterMetadata, addNewAct, updateActTitle, deleteAct, moveChapterToAct,
    reorderChapter, reorderActs, localFolderName, isSidebarOpen, loadImportedProject,
    setOrganizerModalOpen, addScene, updateScene, deleteScene, duplicateScene,
    mergeScenes, reorderScenes, setThemeModalOpen
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const [searchTerm, setSearchTerm] = useState('');
  
  // Section collapse states
  const [isManuscriptOpen, setIsManuscriptOpen] = useState(true);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // Expanded Acts & Chapters
  const [expandedActs, setExpandedActs] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Inline rename states
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState('');
  const [editingActId, setEditingActId] = useState<string | null>(null);
  const [editingActTitleText, setEditingActTitleText] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingSceneTitle, setEditingSceneTitle] = useState('');
  const [movingChapterId, setMovingChapterId] = useState<string | null>(null);

  // Drag and Drop States
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [isExternalFileDragging, setIsExternalFileDragging] = useState(false);

  // Resizable Sidebar Width (Stored in localStorage)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('swrite_sidebar_width');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 180 && parsed <= 500) return parsed;
        }
      } catch (e) {}
    }
    return 260;
  });

  const isResizingRef = useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.min(500, Math.max(180, moveEvent.clientX));
      setSidebarWidth(newWidth);
      try {
        localStorage.setItem('swrite_sidebar_width', newWidth.toString());
      } catch (e) {}
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isSidebarOpen) return null;

  const allChapters = project.acts.flatMap(a => a.chapters.map(c => ({ ...c, actTitle: a.title, actId: a.id })));

  const handleOpenFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const result = await StorageService.pickAndLoadLocalFolder();
        if (result) {
          loadImportedProject(result.project, result.folderName);
          return;
        }
      } catch (e) {
        console.warn('Directory picker failed, falling back to input:', e);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const result = await StorageService.loadFromFileInputList(files);
      loadImportedProject(result.project, result.folderName);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleAct = (actId: string) => {
    setExpandedActs(prev => ({
      ...prev,
      [actId]: prev[actId] === undefined ? false : !prev[actId]
    }));
  };

  const toggleChapterScenes = (chId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChapters(prev => ({
      ...prev,
      [chId]: !prev[chId]
    }));
  };

  const startRenameChapter = (chId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChapterId(chId);
    setEditingChapterTitle(currentTitle);
  };

  const saveRenameChapter = (chId: string) => {
    if (editingChapterTitle.trim()) {
      updateChapterMetadata(chId, { title: editingChapterTitle.trim() });
    }
    setEditingChapterId(null);
  };

  const startRenameAct = (actId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingActId(actId);
    setEditingActTitleText(currentTitle);
  };

  const saveRenameAct = (actId: string) => {
    if (editingActTitleText.trim()) {
      updateActTitle(actId, editingActTitleText.trim());
    }
    setEditingActId(null);
  };

  const startRenameScene = (sceneId: string, currentTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSceneId(sceneId);
    setEditingSceneTitle(currentTitle);
  };

  const saveRenameScene = (sceneId: string) => {
    if (editingSceneTitle.trim()) {
      updateScene(sceneId, { title: editingSceneTitle.trim() });
    }
    setEditingSceneId(null);
    setEditingSceneTitle('');
  };

  const handleCreateFolder = () => {
    const folderCount = project.acts.length;
    const newTitle = `Act ${folderCount + 1}`;
    const newId = addNewAct(newTitle);
    setExpandedActs(prev => ({ ...prev, [newId]: true }));
    setEditingActId(newId);
    setEditingActTitleText(newTitle);
  };

  const handleAddChapterToAct = (actId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const act = project.acts.find(a => a.id === actId);
    const chapterNum = (act?.chapters.length || 0) + 1;
    const newChId = addNewChapter(actId, `Chapter ${chapterNum}`);
    setExpandedActs(prev => ({ ...prev, [actId]: true }));
    setActiveChapterId(newChId);
    setActiveTab('editor');
  };

  const handleDeleteAct = (actId: string, actTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.acts.length <= 1) {
      alert('You must have at least one Act in your manuscript.');
      return;
    }
    if (confirm(`Delete "${actTitle}"? Any chapters inside will be moved to the first Act.`)) {
      deleteAct(actId);
    }
  };

  // External File Drop Handler
  const handleExternalFilesDrop = async (e: React.DragEvent, targetActId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExternalFileDragging(false);
    setDropIndicator(null);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const targetAct = targetActId 
      ? project.acts.find(a => a.id === targetActId) || project.acts[0]
      : project.acts[0];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.startsWith('.')) continue;
      try {
        const parsed = await StorageService.parseSingleFile(file);
        const newChId = addNewChapter(targetAct.id, parsed.title);
        updateChapterMetadata(newChId, {
          content: parsed.html,
          wordCount: parsed.wordCount,
        });
        setActiveChapterId(newChId);
        setActiveTab('editor');
      } catch (err) {
        console.warn(`Could not import file ${file.name}:`, err);
      }
    }
  };

  // Chapter Drag & Drop
  const handleChapterDragStart = (e: React.DragEvent, chId: string, sourceActId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'chapter', chapterId: chId, sourceActId }));
    e.dataTransfer.effectAllowed = 'move';
    setDragState({ type: 'chapter', id: chId, sourceActId });
  };

  const handleChapterDragOver = (e: React.DragEvent, targetActId: string, targetChId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const position = offsetY < rect.height / 2 ? 'before' : 'after';

    setDropIndicator({
      actId: targetActId,
      chapterId: targetChId,
      position,
    });
  };

  const handleChapterDrop = (e: React.DragEvent, targetActId: string, targetChIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleExternalFilesDrop(e, targetActId);
      return;
    }

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);

      if (data.type === 'chapter' && data.chapterId) {
        const position = dropIndicator?.position || 'after';
        const finalIndex = position === 'before' ? targetChIndex : targetChIndex + 1;
        reorderChapter(data.chapterId, targetActId, finalIndex);
      }
    } catch (err) {
      console.warn('Drag drop parse error:', err);
    } finally {
      setDragState(null);
      setDropIndicator(null);
    }
  };

  // Scene Drag & Drop
  const handleSceneDragStart = (e: React.DragEvent, scId: string, chapterId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'scene', sceneId: scId, sourceChapterId: chapterId }));
    e.dataTransfer.effectAllowed = 'move';
    setDragState({ type: 'scene', id: scId, sourceChapterId: chapterId });
  };

  const handleSceneDragOver = (e: React.DragEvent, chapterId: string, scId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragState?.type !== 'scene') return;
    e.dataTransfer.dropEffect = 'move';

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const position = offsetY < rect.height / 2 ? 'before' : 'after';

    setDropIndicator({
      chapterId,
      sceneId: scId,
      position,
    });
  };

  const handleSceneDrop = (e: React.DragEvent, chapterId: string, targetScIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);

      if (data.type === 'scene' && data.sceneId) {
        const chapter = project.acts.flatMap(a => a.chapters).find(c => c.id === chapterId);
        if (chapter && chapter.scenes) {
          const currentIds = chapter.scenes.map(s => s.id);
          const fromIndex = currentIds.indexOf(data.sceneId);
          if (fromIndex !== -1) {
            const reordered = [...currentIds];
            const [moved] = reordered.splice(fromIndex, 1);
            const position = dropIndicator?.position || 'after';
            let insertIdx = position === 'before' ? targetScIndex : targetScIndex + 1;
            if (fromIndex < insertIdx) insertIdx -= 1;
            reordered.splice(insertIdx, 0, moved);
            reorderScenes(chapterId, reordered);
          }
        }
      }
    } catch (err) {
      console.warn('Scene drag drop parse error:', err);
    } finally {
      setDragState(null);
      setDropIndicator(null);
    }
  };

  return (
    <aside 
      className="flex flex-col h-full border-r select-none text-xs relative shrink-0 font-sans"
      style={{ 
        width: `${sidebarWidth}px`,
        backgroundColor: theme.colors?.surface || theme.bg,
        borderColor: theme.colors?.border || theme.pageBorder,
        color: theme.colors?.text || theme.text,
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setIsExternalFileDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsExternalFileDragging(false);
        }
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleExternalFilesDrop(e);
        }
      }}
    >
      {/* Resizable Grip Bar on Right Edge */}
      <div 
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-zinc-500/50 active:bg-zinc-400 z-40 transition-colors group"
        title="Drag to resize sidebar width"
      >
        <div className="w-full h-full opacity-0 group-hover:opacity-100 bg-zinc-500/30" />
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* External File Drop Overlay */}
      {isExternalFileDragging && (
        <div className="absolute inset-0 z-50 bg-zinc-950/90 border-2 border-dashed border-zinc-400 flex flex-col items-center justify-center p-4 text-center backdrop-blur-xs pointer-events-none">
          <FileUp className="w-7 h-7 text-zinc-300 animate-bounce mb-2" />
          <p className="text-xs font-semibold text-zinc-100">Drop files to import</p>
          <p className="text-[10px] text-zinc-400 mt-1">Markdown, text or Word files</p>
        </div>
      )}

      {/* Top Project Anchor */}
      <div className="p-3 border-b space-y-2 shrink-0" style={{ borderColor: theme.pageBorder }}>
        <div className="flex items-center justify-between">
          <div className="truncate flex-1 mr-1.5">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Project</div>
            <div className="font-semibold text-zinc-200 text-xs truncate" title={project.metadata.title}>
              {localFolderName ? localFolderName : project.metadata.title}
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={handleOpenFolder}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
              title="Open folder on computer"
            >
              {localFolderName ? <FolderOpen className="w-3.5 h-3.5 text-zinc-300" /> : <Folder className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setOrganizerModalOpen(true)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
              title="Curate & Structure Manuscript"
            >
              <FolderTree className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search manuscript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/60 border rounded pl-6 pr-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
            style={{ borderColor: theme.pageBorder }}
          />
        </div>
      </div>

      {/* Main Tree Canvas */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        
        {/* ========================================================================= */}
        {/* SECTION 1: MANUSCRIPT STRUCTURE (Act → Chapter → Scene)                   */}
        {/* ========================================================================= */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            <button
              onClick={() => setIsManuscriptOpen(!isManuscriptOpen)}
              className="flex items-center space-x-1 hover:text-zinc-300 transition-colors"
            >
              <BookOpen className="w-3 h-3 text-zinc-500" />
              <span>Manuscript</span>
              {isManuscriptOpen ? <ChevronDown className="w-2.5 h-2.5 ml-0.5" /> : <ChevronRight className="w-2.5 h-2.5 ml-0.5" />}
            </button>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleCreateFolder}
                className="p-0.5 text-zinc-500 hover:text-zinc-300 rounded"
                title="Add New Act"
              >
                <FolderPlus className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  const newChId = addNewChapter(undefined, `Chapter ${allChapters.length + 1}`);
                  setActiveChapterId(newChId);
                  setActiveTab('editor');
                }}
                className="p-0.5 text-zinc-500 hover:text-zinc-300 rounded"
                title="Add Chapter"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isManuscriptOpen && (
            <div className="space-y-1.5">
              {project.acts
                .filter(act => !act.title.startsWith('.'))
                .map((act, actIndex) => {
                const isExpanded = expandedActs[act.id] !== false;
                const isEditingAct = editingActId === act.id;
                const isActDropTarget = dropIndicator?.actId === act.id && dropIndicator?.position === 'inside';

                const filteredChapters = act.chapters.filter(c => {
                  if (c.title.startsWith('.')) return false;
                  if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                  }
                  return true;
                });

                return (
                  <div 
                    key={act.id} 
                    className={`space-y-0.5 rounded transition-colors ${
                      isActDropTarget ? 'bg-zinc-900 ring-1 ring-zinc-600' : ''
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropIndicator({ actId: act.id, position: 'inside' });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragState?.type === 'chapter' && dragState.id) {
                        moveChapterToAct(dragState.id, act.id);
                      }
                      setDragState(null);
                      setDropIndicator(null);
                    }}
                  >
                    {/* Act Header */}
                    <div 
                      onClick={() => toggleAct(act.id)}
                      className="group flex items-center justify-between px-1.5 py-1 rounded cursor-pointer hover:bg-zinc-800/40 text-zinc-300 text-xs transition-colors"
                    >
                      <div className="flex items-center space-x-1.5 truncate flex-1 mr-1">
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                        )}
                        <Folder className="w-3 h-3 text-zinc-400 shrink-0" />
                        
                        {isEditingAct ? (
                          <div className="flex items-center space-x-1 flex-1" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingActTitleText}
                              onChange={(e) => setEditingActTitleText(e.target.value)}
                              onBlur={() => saveRenameAct(act.id)}
                              onKeyDown={(e) => e.key === 'Enter' && saveRenameAct(act.id)}
                              autoFocus
                              className="bg-black border border-zinc-500 rounded px-1.5 py-0.5 text-xs text-white w-full outline-none"
                            />
                            <button 
                              onClick={() => saveRenameAct(act.id)}
                              className="p-0.5 text-emerald-400 hover:text-emerald-300"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span 
                            className="truncate text-zinc-300 font-medium"
                            onDoubleClick={(e) => startRenameAct(act.id, act.title, e)}
                            title="Double-click to rename"
                          >
                            {act.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {act.chapters.length}
                        </span>

                        <button
                          onClick={(e) => handleAddChapterToAct(act.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded"
                          title={`Add chapter to ${act.title}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => startRenameAct(act.id, act.title, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded"
                          title="Rename Act"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>

                        {project.acts.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteAct(act.id, act.title, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-700/50 rounded"
                            title="Delete Act"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chapters List */}
                    {isExpanded && (
                      <div className="pl-2 space-y-0.5 border-l border-zinc-800 ml-2.5">
                        {filteredChapters.map((ch, chIndex) => {
                          const isActive = ch.id === activeChapterId;
                          const isEditing = editingChapterId === ch.id;
                          const hasScenes = ch.scenes && ch.scenes.length > 0;
                          const isScenesExpanded = expandedChapters[ch.id] ?? false;

                          return (
                            <div key={ch.id} className="relative rounded">
                              <div
                                draggable={!isEditing}
                                onDragStart={(e) => handleChapterDragStart(e, ch.id, act.id)}
                                onDragOver={(e) => handleChapterDragOver(e, act.id, ch.id)}
                                onDrop={(e) => handleChapterDrop(e, act.id, chIndex)}
                                onClick={() => {
                                  setActiveChapterId(ch.id);
                                  if (ch.scenes?.[0]) setActiveSceneId(ch.scenes[0].id);
                                  setActiveTab('editor');
                                }}
                                className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer text-xs transition-colors ${
                                  isActive
                                    ? 'bg-zinc-800 text-zinc-100 font-semibold'
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5 truncate flex-1 mr-1">
                                  {hasScenes ? (
                                    <button
                                      onClick={(e) => toggleChapterScenes(ch.id, e)}
                                      className="p-0.5 text-zinc-500 hover:text-zinc-300 rounded shrink-0"
                                    >
                                      {isScenesExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                                    </button>
                                  ) : (
                                    <FileText className="w-3 h-3 text-zinc-500 shrink-0" />
                                  )}

                                  {isEditing ? (
                                    <div className="flex items-center space-x-1 flex-1" onClick={e => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={editingChapterTitle}
                                        onChange={(e) => setEditingChapterTitle(e.target.value)}
                                        onBlur={() => saveRenameChapter(ch.id)}
                                        onKeyDown={(e) => e.key === 'Enter' && saveRenameChapter(ch.id)}
                                        autoFocus
                                        className="bg-black border border-zinc-500 rounded px-1.5 py-0.5 text-xs text-white w-full outline-none"
                                      />
                                      <button onClick={() => saveRenameChapter(ch.id)} className="p-0.5 text-emerald-400">
                                        <Check className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span 
                                      className="truncate flex-1"
                                      onDoubleClick={(e) => startRenameChapter(ch.id, ch.title, e)}
                                      title={ch.title}
                                    >
                                      {ch.title}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center space-x-1 shrink-0">
                                  {/* Open Revision count badge */}
                                  {(() => {
                                    const items = (project.revisionItems || []).filter(i => 
                                      (i.chapterId === ch.id || (!i.chapterId && i.actId === act.id)) && 
                                      (i.status === 'open' || i.status === 'in-progress')
                                    );
                                    if (items.length === 0) return null;
                                    return (
                                      <span className="text-[9px] font-mono text-amber-400 group-hover:hidden" title={`${items.length} revision notes`}>
                                        ● {items.length}
                                      </span>
                                    );
                                  })()}

                                  <span className="text-[10px] font-mono text-zinc-500 group-hover:hidden">
                                    {ch.wordCount}w
                                  </span>

                                  <button
                                    onClick={(e) => startRenameChapter(ch.id, ch.title, e)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-200 rounded"
                                    title="Rename Chapter"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteChapterToCutDrawer(ch.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-red-400 rounded"
                                    title="Send to Cut Drawer"
                                  >
                                    <Scissors className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Nested Scenes */}
                              {hasScenes && isScenesExpanded && (
                                <div className="pl-4 space-y-0.5 border-l border-zinc-800 ml-3 my-0.5">
                                  {ch.scenes?.map((sc, scIdx) => {
                                    const isScActive = sc.id === activeSceneId;
                                    const isEditingSc = editingSceneId === sc.id;

                                    return (
                                      <div
                                        key={sc.id}
                                        draggable={!isEditingSc}
                                        onDragStart={(e) => handleSceneDragStart(e, sc.id, ch.id)}
                                        onDragOver={(e) => handleSceneDragOver(e, ch.id, sc.id)}
                                        onDrop={(e) => handleSceneDrop(e, ch.id, scIdx)}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveChapterId(ch.id);
                                          setActiveSceneId(sc.id);
                                          setActiveTab('editor');
                                        }}
                                        className={`group flex items-center justify-between px-2 py-0.5 rounded cursor-pointer text-[11px] transition-colors ${
                                          isScActive && isActive
                                            ? 'bg-zinc-800/80 text-zinc-100 font-semibold'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-1.5 truncate flex-1 mr-1">
                                          <span className="text-[9px] font-mono text-zinc-600">↳</span>
                                          {isEditingSc ? (
                                            <div className="flex items-center space-x-1 flex-1" onClick={e => e.stopPropagation()}>
                                              <input
                                                type="text"
                                                value={editingSceneTitle}
                                                onChange={(e) => setEditingSceneTitle(e.target.value)}
                                                onBlur={() => saveRenameScene(sc.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && saveRenameScene(sc.id)}
                                                autoFocus
                                                className="bg-black border border-zinc-500 rounded px-1.5 py-0.2 text-[11px] text-white w-full outline-none"
                                              />
                                              <button onClick={() => saveRenameScene(sc.id)} className="p-0.5 text-emerald-400">
                                                <Check className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <span 
                                              className="truncate flex-1"
                                              onDoubleClick={(e) => startRenameScene(sc.id, sc.title || `Scene ${scIdx + 1}`, e)}
                                            >
                                              {sc.title || `Scene ${scIdx + 1}`}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center space-x-1 shrink-0">
                                          <span className="text-[9px] font-mono text-zinc-500 group-hover:hidden">
                                            {sc.wordCount || 0}w
                                          </span>

                                          <button
                                            onClick={(e) => startRenameScene(sc.id, sc.title, e)}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-200 rounded"
                                            title="Rename Scene"
                                          >
                                            <Edit2 className="w-2 h-2" />
                                          </button>

                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              duplicateScene(sc.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-200 rounded"
                                            title="Duplicate Scene"
                                          >
                                            <Copy className="w-2 h-2" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newSc = addScene(ch.id, { title: 'Untitled Scene' });
                                      setActiveChapterId(ch.id);
                                      setActiveSceneId(newSc.id);
                                      setActiveTab('editor');
                                    }}
                                    className="w-full flex items-center space-x-1 px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/20 rounded transition-colors text-left"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                    <span>Add Scene</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: STORY (Characters, Plot Threads, World)                        */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t space-y-1" style={{ borderColor: theme.pageBorder }}>
          <button
            onClick={() => setIsStoryOpen(!isStoryOpen)}
            className="w-full flex items-center justify-between px-1.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
          >
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3 text-zinc-500" />
              <span>Story Bible</span>
            </div>
            {isStoryOpen ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
          </button>

          {isStoryOpen && (
            <div className="space-y-0.5 pl-1">
              <button
                onClick={() => setActiveTab('codex')}
                className="w-full text-left flex items-center justify-between px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3 h-3 text-indigo-400" />
                  <span>Characters</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{project.characters?.length || 0}</span>
              </button>

              <button
                onClick={() => setActiveTab('threads')}
                className="w-full text-left flex items-center justify-between px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <GitBranch className="w-3 h-3 text-purple-400" />
                  <span>Plot Threads</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{project.plotThreads?.length || 0}</span>
              </button>

              <button
                onClick={() => setActiveTab('codex')}
                className="w-full text-left flex items-center justify-between px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>World Codex</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{(project.locations?.length || 0) + (project.codex?.length || 0)}</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: TOOLS (Timeline, Universe Graph)                               */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t space-y-1" style={{ borderColor: theme.pageBorder }}>
          <button
            onClick={() => setIsToolsOpen(!isToolsOpen)}
            className="w-full flex items-center justify-between px-1.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
          >
            <div className="flex items-center space-x-1">
              <Layers className="w-3 h-3 text-zinc-500" />
              <span>Tools</span>
            </div>
            {isToolsOpen ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
          </button>

          {isToolsOpen && (
            <div className="space-y-0.5 pl-1">
              <button
                onClick={() => setActiveTab('timeline')}
                className="w-full text-left flex items-center space-x-1.5 px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
              >
                <Clock className="w-3 h-3 text-sky-400" />
                <span>Story Timeline</span>
              </button>

              <button
                onClick={() => setActiveTab('graph')}
                className="w-full text-left flex items-center space-x-1.5 px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
              >
                <Network className="w-3 h-3 text-purple-400" />
                <span>Universe Graph</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Sidebar Utilities */}
      <div className="p-2.5 border-t flex items-center justify-between text-xs text-zinc-500 shrink-0" style={{ borderColor: theme.pageBorder }}>
        <button
          onClick={() => setThemeModalOpen(true)}
          className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Theme & Typography Settings"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setOrganizerModalOpen(true)}
          className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Curate & Structure"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Curate</span>
        </button>
      </div>
    </aside>
  );
};
