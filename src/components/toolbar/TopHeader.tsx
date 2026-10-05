import React, { useState } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { 
  PenLine, LayoutGrid, CheckCircle2, Users, Clock, Network, 
  Download, Palette, Sliders, Maximize2, Minimize2, Search,
  Square, Timer, ChevronDown, Columns, Check, FolderTree, History
} from 'lucide-react';
import { SplitMode, WorkspaceTab } from '../../types';
import { ContinuityEngine } from '../../engine';

interface TopHeaderProps {
  onOpenCommandPalette?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenCommandPalette }) => {
  const { 
    project, activeChapterId, activeSceneId, activeTab, setActiveTab, 
    viewMode, setViewMode, splitMode, setSplitMode, syncStatus,
    setThemeModalOpen, setCompilerModalOpen, setPresetsModalOpen, setOrganizerModalOpen,
    setIsVersionHistoryModalOpen,
    sprint, startSprint, stopSprint, isFocusMode, toggleFocusMode
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const [sprintMinutes, setSprintMinutes] = useState(15);
  const [showSprintPopover, setShowSprintPopover] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSplitPopover, setShowSplitPopover] = useState(false);

  const totalWords = project.metadata.currentWordCount;

  // Active Chapter & Scene Resolution
  const allChapters = project.acts.flatMap(a => a.chapters.map(c => ({ ...c, actTitle: a.title })));
  const activeChapter = allChapters.find(c => c.id === activeChapterId) || allChapters[0];
  const activeScene = activeChapter?.scenes?.find(s => s.id === activeSceneId) || activeChapter?.scenes?.[0];

  // Review open items count
  const openRevisionCount = (project.revisionItems || []).filter(i => i.status === 'open' || i.status === 'in-progress').length;
  const openContinuityCount = ContinuityEngine.runAudit(project).filter(w => !w.isIgnored && !w.isIntentional).length;
  const totalReviewItems = openRevisionCount + openContinuityCount;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSprint = () => {
    startSprint(sprintMinutes);
    setShowSprintPopover(false);
  };

  // Map workspace tab to primary mode
  const isWriteActive = activeTab === 'editor' || activeTab === 'write';
  const isPlanActive = activeTab === 'outliner' || activeTab === 'plan' || activeTab === 'corkboard';
  const isReviewActive = activeTab === 'revision' || activeTab === 'review' || activeTab === 'continuity';
  const isStoryActive = activeTab === 'codex' || activeTab === 'story' || activeTab === 'threads' || activeTab === 'characters';
  const isTimelineActive = activeTab === 'timeline';
  const isGraphActive = activeTab === 'graph';

  return (
    <header 
      className="h-12 border-b flex items-center justify-between px-4 select-none text-xs transition-colors z-30 shrink-0 font-sans"
      style={{ 
        backgroundColor: theme.colors?.surface || theme.pageBg || '#141416',
        borderColor: theme.colors?.border || theme.pageBorder || '#27272a',
        color: theme.colors?.text || theme.text,
      }}
    >
      {/* 1. Left: Project Title & Primary Workspace Switcher */}
      <div className="flex items-center space-x-3">
        {/* Project Brand & Title */}
        <button
          onClick={() => {
            setActiveTab('overview');
            if (splitMode !== 'none') setSplitMode('none');
          }}
          className="flex items-center space-x-2 hover:opacity-85 transition-opacity text-left cursor-pointer"
          title="Open Project Overview"
        >
          <span className="font-serif font-bold text-sm tracking-tight text-slate-100">
            Swrite
          </span>
          <span className="text-[11px] text-zinc-500 font-normal hidden md:inline">/</span>
          <span className="text-[11px] text-zinc-300 font-medium truncate max-w-[130px] hidden md:inline">
            {project.metadata.title}
          </span>
        </button>

        <div className="h-4 w-[1px] bg-zinc-800 hidden sm:inline" />

        {/* Primary Workspace Navigation Switcher */}
        <nav className="flex items-center space-x-1">
          {/* WRITE */}
          <button
            onClick={() => {
              setActiveTab('editor');
              if (splitMode !== 'none') setSplitMode('none');
            }}
            title="Write Workspace (⌘1)"
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1.5 ${
              isWriteActive && splitMode === 'none'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <PenLine className="w-3.5 h-3.5 opacity-80" />
            <span>Write</span>
          </button>

          {/* PLAN */}
          <button
            onClick={() => {
              setActiveTab('outliner');
              if (splitMode !== 'none') setSplitMode('none');
            }}
            title="Plan Workspace (⌘2)"
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1.5 ${
              isPlanActive && splitMode === 'none'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 opacity-80" />
            <span>Plan</span>
          </button>

          {/* REVIEW */}
          <button
            onClick={() => {
              setActiveTab('revision');
              if (splitMode !== 'none') setSplitMode('none');
            }}
            title="Review Queue (⌘3)"
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1.5 ${
              isReviewActive && splitMode === 'none'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 opacity-80" />
            <span>Review</span>
            {totalReviewItems > 0 && (
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {totalReviewItems}
              </span>
            )}
          </button>

          {/* SECONDARY WORKSPACES POPOVER / MORE */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="More Workspaces"
              data-testid="workspace-more-btn"
              className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 ${
                isStoryActive || isTimelineActive || isGraphActive
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <span>
                {isStoryActive ? 'Story' : isTimelineActive ? 'Timeline' : isGraphActive ? 'Graph' : 'More'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {showMoreMenu && (
              <div 
                className="absolute left-0 mt-1 z-50 bg-[#1a1a1e] border border-zinc-700 rounded-lg p-1.5 shadow-2xl w-48 text-xs text-zinc-200 animate-in fade-in duration-100"
                onClick={() => setShowMoreMenu(false)}
              >
                <div className="font-semibold text-zinc-500 px-2 py-1 text-[10px] uppercase tracking-wider">
                  Story & Reference
                </div>

                <button
                  data-testid="nav-story-bible"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('codex');
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded flex items-center space-x-2 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Story Bible & Cast</span>
                </button>

                <button
                  data-testid="nav-timeline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('timeline');
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded flex items-center space-x-2 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Story Timeline</span>
                </button>

                <button
                  data-testid="nav-graph"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('graph');
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded flex items-center space-x-2 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Network className="w-3.5 h-3.5 text-purple-400" />
                  <span>Universe Graph</span>
                </button>

                <div className="h-[1px] bg-zinc-800 my-1" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCompilerModalOpen(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded flex items-center space-x-2 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Publication Studio</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* 2. Center: Active Chapter/Scene Identity & Mode Options */}
      <div className="hidden md:flex items-center space-x-3 text-xs">
        {isWriteActive && activeChapter && (
          <div className="flex items-center space-x-2 text-zinc-300 font-medium">
            <span className="text-zinc-500 font-mono text-[11px]">{activeChapter.actTitle} ·</span>
            <span className="truncate max-w-[160px] text-zinc-200">{activeChapter.title}</span>
            {activeScene && (
              <span className="text-zinc-500 font-mono text-[10px]">({activeScene.title || 'Scene'})</span>
            )}
          </div>
        )}

        {/* View mode toggle in write mode */}
        {isWriteActive && splitMode === 'none' && (
          <div className="flex items-center space-x-0.5 border rounded p-0.5" style={{ borderColor: theme.pageBorder }}>
            <button
              onClick={() => setViewMode('continuous')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'continuous' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Continuous
            </button>
            <button
              onClick={() => setViewMode('paginated')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'paginated' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Pages
            </button>
          </div>
        )}
      </div>

      {/* 3. Right: Search/Command Palette, Word Count, Timer, Settings & Export */}
      <div className="flex items-center space-x-2.5 text-zinc-400 text-xs">
        {/* Command Palette Trigger Button (Cmd+K) */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Open Command Palette (⌘K / Ctrl+K)"
        >
          <Search className="w-3 h-3 text-zinc-500" />
          <span className="text-[11px] hidden sm:inline">Search & Actions</span>
          <span className="px-1 py-0.2 rounded font-mono text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700">
            ⌘K
          </span>
        </button>

        {/* Word Count */}
        <span className="text-[11px] font-mono text-zinc-300 hidden lg:inline">
          {totalWords.toLocaleString()} words
        </span>

        {/* Sprint Widget */}
        <div className="relative">
          {sprint.isActive ? (
            <div className="flex items-center space-x-1.5 bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-zinc-200 font-mono">
              <span>{formatTime(sprint.secondsLeft)}</span>
              <button onClick={stopSprint} className="text-zinc-400 hover:text-red-400">
                <Square className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSprintPopover(!showSprintPopover)}
              className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              title="Timed Word Sprint"
            >
              <Timer className="w-3.5 h-3.5" />
            </button>
          )}

          {showSprintPopover && (
            <div className="absolute right-0 mt-1 z-50 bg-[#1a1a1e] border border-zinc-700 rounded-lg p-3 shadow-xl w-44 text-xs text-zinc-200">
              <div className="font-semibold text-zinc-100 mb-2">Word Sprint</div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-400">Duration:</span>
                <select
                  value={sprintMinutes}
                  onChange={(e) => setSprintMinutes(Number(e.target.value))}
                  className="bg-[#121215] border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-200 text-xs"
                >
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                </select>
              </div>
              <button
                onClick={handleStartSprint}
                className="w-full py-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded text-xs transition-colors"
              >
                Start Sprint
              </button>
            </div>
          )}
        </div>

        {/* Focus Mode Toggle */}
        <button
          onClick={toggleFocusMode}
          className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title="Toggle Distraction-Free Focus Mode"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Version History & Recovery */}
        <button
          onClick={() => setIsVersionHistoryModalOpen(true)}
          className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title="Version History & Snapshots"
        >
          <History className="w-3.5 h-3.5" />
        </button>

        {/* Theme Settings */}
        <button
          onClick={() => setThemeModalOpen(true)}
          className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title="Theme & Typography Settings"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>

        {/* Export / Compile Studio */}
        <button
          onClick={() => setCompilerModalOpen(true)}
          className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-xs font-medium transition-colors border border-zinc-700"
          title="Compile & Export Manuscript"
        >
          <Download className="w-3 h-3" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};
