import React, { useState } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { Scene, Character, Location, PlotThread } from '../../types';
import { 
  User, MapPin, GitBranch, Target, ChevronDown, ChevronUp, 
  Plus, Users, Flame, ShieldAlert, Check, X,
  Layers, Compass, ArrowRight, Eye, EyeOff, Copy, Scissors, 
  Merge, Trash2, Edit2, MoreHorizontal
} from 'lucide-react';

interface SceneContextBarProps {
  chapterId: string;
  onSplitAtCursor?: () => void;
}

export const SceneContextBar: React.FC<SceneContextBarProps> = ({ chapterId, onSplitAtCursor }) => {
  const { 
    project, activeSceneId, setActiveSceneId, 
    addScene, updateScene, deleteScene, duplicateScene, mergeScenes
  } = useSwriteStore();

  const theme = project.metadata.theme;

  // Locate current chapter
  const currentChapter = project.acts
    .flatMap(a => a.chapters)
    .find(c => c.id === chapterId);

  if (!currentChapter) return null;

  const scenes = currentChapter.scenes && currentChapter.scenes.length > 0 
    ? currentChapter.scenes 
    : [];

  // Determine active scene
  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];

  // Local UI visibility states
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingSceneTitle, setEditingSceneTitle] = useState('');
  const [showSceneActions, setShowSceneActions] = useState(false);
  const [isCompletelyHidden, setIsCompletelyHidden] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('swrite_hide_scene_context') === 'true';
    }
    return false;
  });

  const [activePopover, setActivePopover] = useState<'pov' | 'location' | 'characters' | 'threads' | null>(null);

  const toggleCompleteHide = () => {
    const next = !isCompletelyHidden;
    setIsCompletelyHidden(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('swrite_hide_scene_context', String(next));
    }
  };

  if (isCompletelyHidden) {
    return (
      <div className="flex justify-end mb-2 not-prose select-none">
        <button
          onClick={toggleCompleteHide}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-zinc-800/40 cursor-pointer"
          title="Show Scene Context"
        >
          <Compass className="w-3 h-3 text-zinc-400" />
          <span>Show Scene Context</span>
        </button>
      </div>
    );
  }

  if (!activeScene) return null;

  const activeSceneIndex = scenes.findIndex(s => s.id === activeScene.id);

  // Resolve relational entities
  const povCharacter = (project.characters || []).find(c => c.id === activeScene.povCharacterId);
  const location = (project.locations || []).find(l => (activeScene.locationIds || []).includes(l.id));
  const charactersInScene = (project.characters || []).filter(c => (activeScene.characterIds || []).includes(c.id));
  const threadsInScene = (project.plotThreads || []).filter(t => (activeScene.plotThreadIds || []).includes(t.id));

  const handleAddScene = () => {
    const created = addScene(chapterId, {
      title: 'Untitled Scene',
      povCharacterId: activeScene.povCharacterId,
      locationIds: activeScene.locationIds || [],
      characterIds: activeScene.characterIds || [],
      plotThreadIds: activeScene.plotThreadIds || [],
      status: 'draft'
    });
    setActiveSceneId(created.id);
  };

  const handleDuplicateScene = () => {
    const dup = duplicateScene(activeScene.id);
    setActiveSceneId(dup.id);
    setShowSceneActions(false);
  };

  const handleMergeWithNext = () => {
    if (activeSceneIndex < scenes.length - 1) {
      const nextScene = scenes[activeSceneIndex + 1];
      if (confirm(`Merge "${activeScene.title}" with next scene "${nextScene.title}"?`)) {
        const merged = mergeScenes(activeScene.id, nextScene.id);
        setActiveSceneId(merged.id);
        setShowSceneActions(false);
      }
    }
  };

  const handleMergeWithPrev = () => {
    if (activeSceneIndex > 0) {
      const prevScene = scenes[activeSceneIndex - 1];
      if (confirm(`Merge previous scene "${prevScene.title}" with "${activeScene.title}"?`)) {
        const merged = mergeScenes(prevScene.id, activeScene.id);
        setActiveSceneId(merged.id);
        setShowSceneActions(false);
      }
    }
  };

  const handleDeleteActiveScene = () => {
    if (scenes.length <= 1) {
      alert('Cannot delete the only scene in a chapter. Rename it or delete the chapter instead.');
      return;
    }
    if (confirm(`Delete scene "${activeScene.title}"?`)) {
      const nextActive = scenes.find(s => s.id !== activeScene.id);
      deleteScene(activeScene.id);
      if (nextActive) setActiveSceneId(nextActive.id);
      setShowSceneActions(false);
    }
  };

  const handleStartRename = (sc: Scene) => {
    setEditingSceneId(sc.id);
    setEditingSceneTitle(sc.title);
  };

  const handleSaveRename = () => {
    if (editingSceneId && editingSceneTitle.trim()) {
      updateScene(editingSceneId, { title: editingSceneTitle.trim() });
    }
    setEditingSceneId(null);
  };

  const handleToggleCharacter = (charId: string) => {
    const currentIds = activeScene.characterIds || [];
    const nextIds = currentIds.includes(charId) 
      ? currentIds.filter(id => id !== charId)
      : [...currentIds, charId];
    updateScene(activeScene.id, { characterIds: nextIds });
  };

  const handleToggleThread = (threadId: string) => {
    const currentIds = activeScene.plotThreadIds || [];
    const nextIds = currentIds.includes(threadId)
      ? currentIds.filter(id => id !== threadId)
      : [...currentIds, threadId];
    updateScene(activeScene.id, { plotThreadIds: nextIds });
  };

  const handleSetLocation = (locId: string) => {
    updateScene(activeScene.id, { locationIds: locId ? [locId] : [] });
    setActivePopover(null);
  };

  const handleSetPov = (charId: string) => {
    updateScene(activeScene.id, { povCharacterId: charId || undefined });
    setActivePopover(null);
  };

  return (
    <div 
      className="mb-5 rounded-lg border transition-all duration-200 select-none not-prose overflow-visible text-xs relative"
      style={{ 
        backgroundColor: isExpanded ? 'rgba(0,0,0,0.25)' : 'transparent',
        borderColor: isExpanded ? theme.pageBorder : 'transparent'
      }}
    >
      {/* Top Scene Switcher Strip (if multi-scene chapter) */}
      {scenes.length > 1 && (
        <div className="flex items-center space-x-1 mb-2 overflow-x-auto pb-1 border-b" style={{ borderColor: theme.pageBorder }}>
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mr-1">Scenes:</span>
          {scenes.map((sc, idx) => {
            const isCurrent = sc.id === activeScene.id;
            const isEditingThis = editingSceneId === sc.id;

            if (isEditingThis) {
              return (
                <div key={sc.id} className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingSceneTitle}
                    onChange={(e) => setEditingSceneTitle(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                    autoFocus
                    className="bg-black border border-zinc-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                  />
                  <button 
                    onClick={handleSaveRename}
                    className="p-0.5 text-emerald-400 hover:text-emerald-300"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={sc.id}
                onClick={() => setActiveSceneId(sc.id)}
                onDoubleClick={() => handleStartRename(sc)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center space-x-1 ${
                  isCurrent 
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
                title="Click to select, double-click to rename"
              >
                <span>{sc.title || `Scene ${idx + 1}`}</span>
              </button>
            );
          })}
          <button
            onClick={handleAddScene}
            className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 rounded transition-colors"
            title="Add New Scene"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Primary 1-Line Minimal Context Ribbon */}
      <div 
        className="flex items-center justify-between px-3 py-1.5 rounded-md bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/60 transition-colors"
      >
        {/* Left: Essential Dramatic Anchor Items */}
        <div className="flex items-center space-x-2.5 truncate flex-1 mr-2 text-[11px]">
          {/* Active Scene Title & Quick Rename */}
          <div className="flex items-center space-x-1 truncate max-w-[150px]">
            {editingSceneId === activeScene.id ? (
              <input
                type="text"
                value={editingSceneTitle}
                onChange={(e) => setEditingSceneTitle(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                autoFocus
                className="bg-black border border-zinc-500 rounded px-1 text-xs text-white outline-none w-full"
              />
            ) : (
              <span 
                className="font-semibold text-zinc-200 truncate cursor-pointer hover:text-white"
                onDoubleClick={() => handleStartRename(activeScene)}
                title="Double-click to rename scene"
              >
                {activeScene.title || `Scene ${activeSceneIndex + 1}`}
              </span>
            )}
          </div>

          <span className="text-zinc-600">·</span>

          {/* POV Pill */}
          <div className="relative">
            <button
              onClick={() => setActivePopover(activePopover === 'pov' ? null : 'pov')}
              className="flex items-center space-x-1 text-zinc-300 hover:text-white font-medium transition-colors truncate cursor-pointer"
              title="Change POV character"
            >
              <User className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate max-w-[110px]">
                {povCharacter ? povCharacter.name : 'POV Unset'}
              </span>
            </button>

            {/* POV Popover */}
            {activePopover === 'pov' && (
              <div 
                className="absolute left-0 top-6 z-50 p-2 rounded-md bg-zinc-900 border border-zinc-700 shadow-lg space-y-1 min-w-[150px]"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-[10px] text-zinc-500 font-mono uppercase px-1">Select POV:</div>
                <button
                  onClick={() => handleSetPov('')}
                  className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  (None)
                </button>
                {(project.characters || []).map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSetPov(c.id)}
                    className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors ${
                      c.id === activeScene.povCharacterId 
                        ? 'bg-zinc-800 text-white font-medium' 
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {c.name} ({c.role})
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-zinc-600">·</span>

          {/* Location Pill */}
          <div className="relative">
            <button
              onClick={() => setActivePopover(activePopover === 'location' ? null : 'location')}
              className="flex items-center space-x-1 text-zinc-300 hover:text-white transition-colors truncate cursor-pointer"
              title="Set Location"
            >
              <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate max-w-[110px]">
                {location ? location.name : 'Location Unset'}
              </span>
            </button>

            {/* Location Popover */}
            {activePopover === 'location' && (
              <div 
                className="absolute left-0 top-6 z-50 p-2 rounded-md bg-zinc-900 border border-zinc-700 shadow-lg space-y-1 min-w-[160px]"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-[10px] text-zinc-500 font-mono uppercase px-1">Select Location:</div>
                <button
                  onClick={() => handleSetLocation('')}
                  className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  (None)
                </button>
                {(project.locations || []).map(l => (
                  <button
                    key={l.id}
                    onClick={() => handleSetLocation(l.id)}
                    className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors ${
                      (activeScene.locationIds || []).includes(l.id)
                        ? 'bg-zinc-800 text-white font-medium' 
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-zinc-600 hidden sm:inline">·</span>

          {/* Characters Count */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setActivePopover(activePopover === 'characters' ? null : 'characters')}
              className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Tag characters in scene"
            >
              <Users className="w-3 h-3 text-zinc-500 shrink-0" />
              <span>{charactersInScene.length} cast</span>
            </button>

            {/* Characters Popover */}
            {activePopover === 'characters' && (
              <div 
                className="absolute left-0 top-6 z-50 p-2.5 rounded-md bg-zinc-900 border border-zinc-700 shadow-lg space-y-1.5 min-w-[180px]"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-[10px] text-zinc-500 font-mono uppercase px-1">Present in Scene:</div>
                {(project.characters || []).map(c => {
                  const isPresent = (activeScene.characterIds || []).includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleToggleCharacter(c.id)}
                      className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between transition-colors ${
                        isPresent 
                          ? 'bg-zinc-800 text-zinc-100 font-medium' 
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      }`}
                    >
                      <span>{c.name}</span>
                      {isPresent && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <span className="text-zinc-600 hidden md:inline">·</span>

          {/* Plot Threads */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setActivePopover(activePopover === 'threads' ? null : 'threads')}
              className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Link story threads"
            >
              <GitBranch className="w-3 h-3 text-zinc-500 shrink-0" />
              <span>{threadsInScene.length} thread{threadsInScene.length === 1 ? '' : 's'}</span>
            </button>

            {/* Threads Popover */}
            {activePopover === 'threads' && (
              <div 
                className="absolute left-0 top-6 z-50 p-2.5 rounded-md bg-zinc-900 border border-zinc-700 shadow-lg space-y-1.5 min-w-[200px]"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-[10px] text-zinc-500 font-mono uppercase px-1">Active Plot Threads:</div>
                {(project.plotThreads || []).map(t => {
                  const isLinked = (activeScene.plotThreadIds || []).includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleToggleThread(t.id)}
                      className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between transition-colors ${
                        isLinked 
                          ? 'bg-zinc-800 text-zinc-100 font-medium' 
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      }`}
                    >
                      <span className="truncate mr-2">{t.title}</span>
                      {isLinked && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}

                {(project.plotThreads || []).length === 0 && (
                  <p className="text-[10px] text-zinc-500 italic p-1">No plot threads defined yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Goal Snippet */}
          {activeScene.goal && (
            <>
              <span className="text-zinc-600 hidden lg:inline">·</span>
              <div className="hidden lg:flex items-center space-x-1 text-zinc-400 truncate max-w-[220px]">
                <Target className="w-3 h-3 text-zinc-500 shrink-0" />
                <span className="truncate">"{activeScene.goal}"</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Scene Operations Dropdown & Expand Actions */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* Scene Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSceneActions(!showSceneActions)}
              className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
              title="Scene Actions"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showSceneActions && (
              <div 
                className="absolute right-0 top-6 z-50 p-1.5 rounded-md bg-zinc-900 border border-zinc-700 shadow-xl space-y-1 min-w-[160px]"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-[10px] text-zinc-500 font-mono uppercase px-1.5 py-0.5">Scene Actions:</div>
                
                <button
                  onClick={() => { handleStartRename(activeScene); setShowSceneActions(false); }}
                  className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center space-x-1.5"
                >
                  <Edit2 className="w-3 h-3 text-zinc-400" />
                  <span>Rename Scene</span>
                </button>

                <button
                  onClick={handleDuplicateScene}
                  className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center space-x-1.5"
                >
                  <Copy className="w-3 h-3 text-zinc-400" />
                  <span>Duplicate Scene</span>
                </button>

                {onSplitAtCursor && (
                  <button
                    onClick={() => { onSplitAtCursor(); setShowSceneActions(false); }}
                    className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center space-x-1.5"
                  >
                    <Scissors className="w-3 h-3 text-zinc-400" />
                    <span>Split Scene Here</span>
                  </button>
                )}

                {activeSceneIndex > 0 && (
                  <button
                    onClick={handleMergeWithPrev}
                    className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center space-x-1.5"
                  >
                    <Merge className="w-3 h-3 text-zinc-400" />
                    <span>Merge with Previous</span>
                  </button>
                )}

                {activeSceneIndex < scenes.length - 1 && (
                  <button
                    onClick={handleMergeWithNext}
                    className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center space-x-1.5"
                  >
                    <Merge className="w-3 h-3 text-zinc-400" />
                    <span>Merge with Next</span>
                  </button>
                )}

                {scenes.length > 1 && (
                  <button
                    onClick={handleDeleteActiveScene}
                    className="w-full text-left px-2 py-1 rounded text-[11px] text-red-400 hover:bg-red-950/40 hover:text-red-300 flex items-center space-x-1.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Scene</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors flex items-center space-x-1 text-[11px]"
            title={isExpanded ? 'Collapse Context Drawer' : 'Expand Detailed Scene Context'}
          >
            <span>{isExpanded ? 'Less' : 'Details'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={toggleCompleteHide}
            className="p-1 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Hide scene context completely"
          >
            <EyeOff className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expanded Progressive Disclosure Drawer */}
      {isExpanded && (
        <div 
          className="p-3.5 mt-2 rounded-lg bg-zinc-950/40 border space-y-3 animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ borderColor: theme.pageBorder }}
        >
          {/* Row 1: Scene Title & Tension */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Scene Beat Title</label>
              <input
                type="text"
                value={activeScene.title || ''}
                onChange={(e) => updateScene(activeScene.id, { title: e.target.value })}
                placeholder="Scene Title / Identifier..."
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-zinc-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Narrative Tension</span>
                <span className="text-amber-400 font-mono">{activeScene.tensionLevel || 5}/10</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={activeScene.tensionLevel || 5}
                onChange={(e) => updateScene(activeScene.id, { tensionLevel: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
              />
            </div>
          </div>

          {/* Row 2: Goal, Conflict, Outcome Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>POV Goal</span>
              </label>
              <input
                type="text"
                value={activeScene.goal || ''}
                onChange={(e) => updateScene(activeScene.id, { goal: e.target.value })}
                placeholder="What does the POV desire?"
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-indigo-500/60"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider flex items-center space-x-1">
                <Flame className="w-3 h-3" />
                <span>Conflict / Obstacle</span>
              </label>
              <input
                type="text"
                value={activeScene.conflict || ''}
                onChange={(e) => updateScene(activeScene.id, { conflict: e.target.value })}
                placeholder="What stands in their way?"
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-rose-500/60"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider flex items-center space-x-1">
                <ArrowRight className="w-3 h-3" />
                <span>Outcome / Turn</span>
              </label>
              <input
                type="text"
                value={activeScene.outcome || ''}
                onChange={(e) => updateScene(activeScene.id, { outcome: e.target.value })}
                placeholder="Immediate result or reversal..."
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          {/* Row 3: Purpose & Consequence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-zinc-800/50">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Dramatic Purpose</label>
              <input
                type="text"
                value={activeScene.purpose || ''}
                onChange={(e) => updateScene(activeScene.id, { purpose: e.target.value })}
                placeholder="Why is this scene necessary in the story?"
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Ripple Consequence</label>
              <input
                type="text"
                value={activeScene.consequence || ''}
                onChange={(e) => updateScene(activeScene.id, { consequence: e.target.value })}
                placeholder="How does this constrain future choices?"
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
