import React, { useState, useEffect } from 'react';
import { useSwriteStore } from './store/useSwriteStore';
import { applyThemeToDocument } from './styles/themes';
import { TopHeader } from './components/toolbar/TopHeader';
import { ProjectSidebar } from './components/sidebar/ProjectSidebar';
import { NovelEditor } from './components/editor/NovelEditor';
import { PaginatedBookView } from './components/editor/PaginatedBookView';
import { MarginInspector } from './components/inspector/MarginInspector';
import { PlanWorkspace } from './components/plan/PlanWorkspace';
import { ReviewWorkspace } from './components/review/ReviewWorkspace';
import { StoryWorkspace } from './components/story/StoryWorkspace';
import { StoryTimelineWorkspace } from './components/timeline/StoryTimelineWorkspace';
import { ObsidianGraphView } from './components/graph/ObsidianGraphView';
import { PartnerWorkspace } from './components/partner/PartnerWorkspace';
import { ProjectOverviewWorkspace } from './components/overview/ProjectOverviewWorkspace';
import { CommandPalette } from './components/command/CommandPalette';
import { ThemeModal } from './components/modals/ThemeModal';
import { CompilerModal } from './components/modals/CompilerModal';
import { PresetsModal } from './components/modals/PresetsModal';
import { OrganizerModal } from './components/modals/OrganizerModal';
import { VersionHistoryModal } from './components/version/VersionHistoryModal';
import { VersionHistoryView } from './components/version/VersionHistoryView';
import { ProjectOrganizationWorkspace } from './components/organization/ProjectOrganizationWorkspace';
import { WorldSimulationWorkspace } from './components/simulation/WorldSimulationWorkspace';
import { CorkboardGridView } from './components/editor/CorkboardGridView';
import { OutlinerMatrixView } from './components/outliner/OutlinerMatrixView';
import { ambientAudio } from './services/ambientAudioService';

import { X, Minimize2, ArrowLeft, Volume2, Headphones, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const { 
    project, activeChapterId, activeSceneId, activeTab, setActiveTab,
    viewMode, splitMode, setSplitMode, isFocusMode, toggleFocusMode,
    editorViewMode, focusModeConfig, updateFocusModeConfig
  } = useSwriteStore();

  // expose setActiveTab in the shortcut closure
  const setActiveTabRef = React.useRef(setActiveTab);
  setActiveTabRef.current = setActiveTab;

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const theme = project.metadata.theme;
  const typography = project.metadata.typography;

  useEffect(() => {
    if (theme) {
      applyThemeToDocument(theme, typography);
    }
  }, [theme, typography]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for command palette, Esc for focus mode exit)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditingField = target?.isContentEditable || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (!isEditingField && (e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        setActiveTabRef.current('editor');
      } else if (!isEditingField && (e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        setActiveTabRef.current('outliner');
      } else if (!isEditingField && (e.metaKey || e.ctrlKey) && e.key === '3') {
        e.preventDefault();
        setActiveTabRef.current('revision');
      } else if (!isEditingField && e.key === 'Escape' && isFocusMode) {
        e.preventDefault();
        toggleFocusMode();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFocusMode, toggleFocusMode]);

  const allChapters = project.acts.flatMap(a => a.chapters);
  const activeChapter = allChapters.find(c => c.id === activeChapterId) || allChapters[0];
  const activeScene = activeChapter?.scenes?.find(s => s.id === activeSceneId) || activeChapter?.scenes?.[0];

  const inFocusMode = isFocusMode && (activeTab === 'editor' || activeTab === 'write');

  return (
    <div 
      className="flex flex-col h-screen w-screen overflow-hidden select-none"
      style={{ 
        backgroundColor: theme.colors?.background || theme.bg, 
        color: theme.colors?.text || theme.text,
        fontFamily: typography?.uiFont || '"Inter", sans-serif'
      }}
    >
      {/* Top Header - hidden in Focus Mode */}
      {!inFocusMode && (
        <TopHeader onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Fullscreen Distraction-Free Focus Mode */}
        {inFocusMode ? (
          <div className={`flex-1 flex flex-col w-full h-full overflow-hidden relative ${
            focusModeConfig.dimmingMode !== 'off' ? `focus-dim-${focusModeConfig.dimmingMode}` : ''
          }`}>
            {/* Minimal Distraction-Free Floating Header */}
            <div className="h-10 px-6 border-b flex items-center justify-between text-xs text-zinc-400 shrink-0 select-none bg-black/40 backdrop-blur-md border-zinc-800/40 z-20">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-zinc-300">{activeChapter?.title}</span>
                {activeScene && (
                  <span className="text-zinc-500 font-mono">({activeScene.title || 'Scene'})</span>
                )}
              </div>

              {/* Focus Controls */}
              <div className="flex items-center space-x-4">
                {/* Typewriter Toggle */}
                <button
                  onClick={() => updateFocusModeConfig({ isTypewriterScrolling: !focusModeConfig.isTypewriterScrolling })}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    focusModeConfig.isTypewriterScrolling ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Toggle Typewriter Scrolling (Caret Centering)"
                >
                  Typewriter
                </button>

                {/* Dimming Selector */}
                <div className="flex items-center space-x-1 text-[11px]">
                  <span className="text-zinc-500 text-[10px] uppercase">Spotlight:</span>
                  {(['off', 'sentence', 'paragraph'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => updateFocusModeConfig({ dimmingMode: mode })}
                      className={`px-1.5 py-0.5 rounded capitalize transition-colors ${
                        focusModeConfig.dimmingMode === mode ? 'bg-zinc-700 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Ambient Soundscapes */}
                <div className="flex items-center space-x-1.5 text-[11px]">
                  <Headphones className="w-3 h-3 text-zinc-400" />
                  <select
                    value={focusModeConfig.ambientSound}
                    onChange={(e) => {
                      const sound = e.target.value as any;
                      updateFocusModeConfig({ ambientSound: sound });
                      ambientAudio.setSound(sound, focusModeConfig.soundVolume);
                    }}
                    className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 focus:outline-none"
                  >
                    <option value="none">Audio: Off</option>
                    <option value="rain">Rainfall</option>
                    <option value="whitenoise">White Noise</option>
                    <option value="cafesound">Coffee Shop</option>
                  </select>
                </div>

                <span className="text-[11px] font-mono text-zinc-400 border-l border-zinc-800 pl-3">
                  {activeChapter?.wordCount.toLocaleString()} words
                </span>
                <button
                  onClick={toggleFocusMode}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors cursor-pointer"
                  title="Exit Focus Mode (ESC)"
                >
                  <Minimize2 className="w-3 h-3" />
                  <span>Exit (ESC)</span>
                </button>
              </div>
            </div>

            {/* Manuscript Editor */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'continuous' ? <NovelEditor /> : <PaginatedBookView />}
            </div>
          </div>
        ) : (
          <>
            {/* Split Layout Views */}
            {splitMode === 'editor-graph' && (
              <div className="flex-1 flex w-full h-full overflow-hidden">
                <div className="w-1/2 h-full flex border-r border-zinc-800 overflow-hidden">
                  <ProjectSidebar />
                  {viewMode === 'continuous' ? <NovelEditor /> : <PaginatedBookView />}
                </div>
                <div className="w-1/2 h-full flex overflow-hidden">
                  <ObsidianGraphView 
                    isEmbeddedSplit 
                    onCloseSplit={() => setSplitMode('none')} 
                  />
                </div>
              </div>
            )}

            {splitMode === 'editor-editor' && (
              <div className="flex-1 flex w-full h-full overflow-hidden">
                <div className="w-1/2 h-full flex border-r border-zinc-800 overflow-hidden">
                  <ProjectSidebar />
                  <NovelEditor />
                </div>
                <div className="w-1/2 h-full flex overflow-hidden">
                  <NovelEditor 
                    isSecondaryPane 
                    onCloseSecondary={() => setSplitMode('none')} 
                  />
                </div>
              </div>
            )}

            {splitMode === 'editor-partner' && (
              <div className="flex-1 flex w-full h-full overflow-hidden">
                <div className="w-1/2 h-full flex border-r border-zinc-800 overflow-hidden">
                  <ProjectSidebar />
                  <NovelEditor />
                </div>
                <div className="w-1/2 h-full flex flex-col overflow-hidden">
                  <div 
                    className="h-10 px-4 border-b flex items-center justify-between text-xs text-zinc-300 shrink-0 select-none"
                    style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
                  >
                    <span className="font-semibold text-zinc-200">Writing Partner</span>
                    <button 
                      onClick={() => setSplitMode('none')}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                      title="Close Split View"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <PartnerWorkspace />
                  </div>
                </div>
              </div>
            )}

            {/* Standard Primary & Secondary Workspaces */}
            {splitMode === 'none' && (
              <>
                {/* 1. WRITE WORKSPACE (Default) */}
                {(activeTab === 'editor' || activeTab === 'write') && (
                  <>
                    <ProjectSidebar />
                    {editorViewMode === 'corkboard' ? (
                      <CorkboardGridView />
                    ) : editorViewMode === 'outliner' ? (
                      <OutlinerMatrixView />
                    ) : (
                      viewMode === 'continuous' ? <NovelEditor /> : <PaginatedBookView />
                    )}
                    {editorViewMode === 'editor' && <MarginInspector />}
                  </>
                )}

                {/* 2. PLAN WORKSPACE */}
                {(activeTab === 'outliner' || activeTab === 'plan' || activeTab === 'corkboard') && (
                  <PlanWorkspace />
                )}

                {/* 3. REVIEW WORKSPACE */}
                {(activeTab === 'revision' || activeTab === 'review' || activeTab === 'continuity') && (
                  <ReviewWorkspace />
                )}

                {/* 4. STORY WORKSPACE */}
                {(activeTab === 'codex' || activeTab === 'story' || activeTab === 'threads' || activeTab === 'characters') && (
                  <StoryWorkspace />
                )}

                {/* 5. TIMELINE WORKSPACE */}
                {activeTab === 'timeline' && (
                  <StoryTimelineWorkspace />
                )}

                {/* 6. GRAPH WORKSPACE */}
                {activeTab === 'graph' && (
                  <ObsidianGraphView />
                )}

                {/* 7. RESEARCH & WRITING PARTNER */}
                {activeTab === 'partner' && (
                  <PartnerWorkspace />
                )}

                {/* 8. PROJECT OVERVIEW */}
                {activeTab === 'overview' && (
                  <ProjectOverviewWorkspace />
                )}

                {/* 9. VERSION HISTORY & RECOVERY */}
                {activeTab === 'versions' && (
                  <VersionHistoryView />
                )}

                {/* 10. AI PROJECT INTELLIGENCE & ORGANIZATION */}
                {activeTab === 'organization' && (
                  <ProjectOrganizationWorkspace />
                )}

                {/* 11. WORLD SIMULATION (EXPERIMENTAL) */}
                {activeTab === 'simulation' && (
                  <WorldSimulationWorkspace />
                )}

              </>
            )}
          </>
        )}
      </main>

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Global Modals & Utilities */}
      <ThemeModal />
      <CompilerModal />
      <PresetsModal />
      <OrganizerModal />
      <VersionHistoryModal />
    </div>
  );
};

export default App;
