import React, { useState, useMemo } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { ContinuityEngine, StoryEngineQueries } from '../../engine';
import { 
  User, MapPin, GitBranch, ArrowLeft, MessageSquare, CheckCircle2, 
  Trash2, Plus, AlertTriangle, ShieldCheck, ChevronRight, ChevronDown, BookOpen, 
  Layers, Compass, Flame, HeartHandshake, Eye, Clock, FileText,
  ExternalLink, Tag, Check, Target, Zap, Flag, X
} from 'lucide-react';
import { Character, PlotThread, Scene, Annotation, PlotThreadType, PlotThreadStatus, Chapter, BeliefCertainty, BeliefStatus, SecretStatus } from '../../types';

export const MarginInspector: React.FC = () => {
  const { 
    project, activeChapterId, activeSceneId, inspectorSelection, setInspectorSelection,
    setActiveChapterId, setActiveSceneId, setActiveTab, addAnnotation, resolveAnnotation,
    deleteAnnotation, isInspectorOpen, dismissContinuityWarning, markWarningIntentional,
    updateScene, attachSceneToThread, detachSceneFromThread, attachCharacterToThread,
    detachCharacterFromThread, addPlotThread, resolveThread, deletePlotThread, updatePlotThread,
    updateCharacterState, addGoal, addBelief, updateBelief, updateSecret, addSecret,
    addCharacterRelationship
  } = useSwriteStore();

  const [isDramaticOpen, setIsDramaticOpen] = useState(false);
  const [isLinkingThread, setIsLinkingThread] = useState(false);
  const [newThreadQuickTitle, setNewThreadQuickTitle] = useState('');
  const [isAddingCharToThread, setIsAddingCharToThread] = useState(false);
  // Inline character quick-edit state
  const [editingCharField, setEditingCharField] = useState<'state' | 'goal' | 'belief' | 'currentGoal' | 'currentConflict' | 'emotional' | 'physical' | 'mental' | 'motivation' | null>(null);
  const [quickEditValue, setQuickEditValue] = useState('');
  const [editingBeliefId, setEditingBeliefId] = useState<string | null>(null);
  const [beliefDraft, setBeliefDraft] = useState({ statement: '', certainty: 'strong' as BeliefCertainty, status: 'active' as BeliefStatus });
  const [editingSecretId, setEditingSecretId] = useState<string | null>(null);
  const [secretDraft, setSecretDraft] = useState({ secret: '', status: 'hidden' as SecretStatus, revealedIn: '' });
  const [editingRelationshipKey, setEditingRelationshipKey] = useState<string | null>(null);
  const [relationshipDraft, setRelationshipDraft] = useState({ relation: '', currentState: '', trustLevel: '', notes: '' });

  const theme = project.metadata.theme;

  // Active Chapter & Scene Resolution
  const activeChapter = project.acts
    .flatMap(a => a.chapters)
    .find(c => c.id === activeChapterId) || project.acts[0]?.chapters[0];

  const activeAct = project.acts.find(a => a.chapters.some(c => c.id === activeChapter?.id));

  const scenes = activeChapter?.scenes || [];
  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];

  // Resizable Inspector Width
  const [inspectorWidth, setInspectorWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('swrite_inspector_width');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 220 && parsed <= 550) return parsed;
        }
      } catch (e) {}
    }
    return 280;
  });

  const isResizingRef = React.useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.min(550, Math.max(220, window.innerWidth - moveEvent.clientX));
      setInspectorWidth(newWidth);
      try {
        localStorage.setItem('swrite_inspector_width', newWidth.toString());
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

  // Quick Note creation state
  const [quickNoteText, setQuickNoteText] = useState('');

  // Chapter-specific continuity warnings
  const chapterWarnings = useMemo(() => {
    if (!activeChapter) return [];
    const all = ContinuityEngine.runAudit(project);
    return all.filter(w => 
      !w.isIgnored && !w.isIntentional && (
        w.primaryChapterId === activeChapter.id ||
        w.secondaryChapterId === activeChapter.id ||
        w.evidence.some(e => e.chapterId === activeChapter.id)
      )
    );
  }, [project, activeChapter]);

  // Margin Annotations for this chapter
  const chapterAnnotations = useMemo(() => {
    if (!activeChapter) return [];
    return project.annotations.filter(a => a.chapterId === activeChapter.id);
  }, [project.annotations, activeChapter]);

  if (!isInspectorOpen || !activeChapter) return null;

  // Derive selection entity
  const selectedCharacter = inspectorSelection.type === 'character'
    ? project.characters?.find(c => c.id === inspectorSelection.characterId)
    : null;

  const selectedThread = inspectorSelection.type === 'thread'
    ? project.plotThreads?.find(t => t.id === inspectorSelection.threadId)
    : null;

  const selectedState: Partial<import('../../types').CharacterState> = selectedCharacter && typeof selectedCharacter.currentState === 'object'
    ? selectedCharacter.currentState
    : {};
  const beginQuickStateEdit = (field: 'currentGoal' | 'currentConflict' | 'emotional' | 'physical' | 'mental' | 'motivation') => {
    if (!selectedCharacter) return;
    const value = field === 'currentGoal' ? (selectedState.currentGoal || selectedCharacter.currentGoal) : selectedState[field];
    setQuickEditValue(value || '');
    setEditingCharField(field);
  };
  const saveQuickStateEdit = (field: 'currentGoal' | 'currentConflict' | 'emotional' | 'physical' | 'mental' | 'motivation') => {
    if (!selectedCharacter || !quickEditValue.trim()) return;
    if (field === 'currentGoal') updateCharacterState(selectedCharacter.id, { currentGoal: quickEditValue.trim() });
    else if (field === 'motivation') updateCharacterState(selectedCharacter.id, { motivation: quickEditValue.trim() });
    else updateCharacterState(selectedCharacter.id, { [field]: quickEditValue.trim() });
    setEditingCharField(null);
    setQuickEditValue('');
  };
  const quickStateField = (field: 'currentGoal' | 'currentConflict' | 'emotional' | 'physical' | 'mental' | 'motivation', label: string, placeholder: string) => {
    const value = field === 'currentGoal' ? (selectedState.currentGoal || selectedCharacter?.currentGoal) : selectedState[field];
    return <div className="space-y-1" key={field}>
      <div className="flex items-center justify-between"><span className="text-zinc-500">{label}</span><button onClick={() => editingCharField === field ? setEditingCharField(null) : beginQuickStateEdit(field)} className="text-[10px] text-zinc-500 hover:text-zinc-200">{editingCharField === field ? 'Cancel' : 'Edit'}</button></div>
      {editingCharField === field ? <div className="space-y-1"><input aria-label={label} autoFocus value={quickEditValue} onChange={e => setQuickEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveQuickStateEdit(field); if (e.key === 'Escape') { setEditingCharField(null); setQuickEditValue(''); } }} placeholder={placeholder} className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-indigo-500/60" /><button onClick={() => saveQuickStateEdit(field)} disabled={!quickEditValue.trim()} className="text-[10px] text-indigo-300 disabled:opacity-40">Save</button></div> : <div className="text-zinc-200">{value || <span className="text-zinc-600 italic">Not recorded</span>}</div>}
    </div>;
  };

  const handleCreateNote = (quoteText?: string) => {
    if (!quickNoteText.trim() || !activeChapter) return;
    addAnnotation({
      id: `ann-${Date.now()}`,
      chapterId: activeChapter.id,
      type: 'comment',
      color: theme.accent,
      quote: quoteText || activeChapter.title,
      noteText: quickNoteText.trim(),
      resolved: false,
      createdAt: new Date().toISOString(),
    });
    setQuickNoteText('');
  };

  // Characters in current scene/chapter
  const sceneCharacterIds = [...(activeScene?.characterIds || [])];
  if (activeScene?.povCharacterId && !sceneCharacterIds.includes(activeScene.povCharacterId)) {
    sceneCharacterIds.push(activeScene.povCharacterId);
  }
  const relevantCharacters = (project.characters || []).filter(c => 
    sceneCharacterIds.includes(c.id) || (activeChapter.characterIds || []).includes(c.id)
  );

  // Threads in current scene/chapter
  const sceneThreadIds = activeScene?.plotThreadIds || [];
  const activeThreads = (project.plotThreads || []).filter(t =>
    sceneThreadIds.includes(t.id) || (activeChapter.plotThreadIds || []).includes(t.id) || t.status === 'active'
  );

  return (
    <aside 
      className="flex flex-col h-full border-l select-none text-xs relative shrink-0 font-sans"
      style={{ 
        width: `${inspectorWidth}px`,
        backgroundColor: theme.colors?.surface || theme.bg,
        borderColor: theme.colors?.border || theme.pageBorder,
        color: theme.colors?.text || theme.text,
      }}
    >
      {/* Resizable Grip Bar on Left Edge */}
      <div 
        onMouseDown={startResizing}
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-zinc-500/50 active:bg-zinc-400 z-40 transition-colors group"
        title="Drag to resize inspector width"
      >
        <div className="w-full h-full opacity-0 group-hover:opacity-100 bg-zinc-500/30" />
      </div>

      {/* Dynamic Context Header */}
      <div 
        className="p-3 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: theme.pageBorder }}
      >
        {inspectorSelection.type !== 'none' ? (
          <button
            onClick={() => setInspectorSelection({ type: 'none' })}
            className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-medium">Scene Context</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1.5 text-xs text-zinc-300 font-medium">
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            <span>Inspector</span>
          </div>
        )}

        <div className="flex items-center space-x-1">
          {inspectorSelection.type !== 'none' && (
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              {inspectorSelection.type}
            </span>
          )}
        </div>
      </div>

      {/* Main Contextual Canvas */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* ========================================================================= */}
        {/* STATE 1: SCENE CONTEXT (Current Scene, POV, Location, Active Threads)      */}
        {/* ========================================================================= */}
        {inspectorSelection.type === 'none' && (
          <>
            {/* Current Chapter & Scene Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <span>Working Scene</span>
                <span className="font-mono text-zinc-500">{activeChapter.wordCount.toLocaleString()}w</span>
              </div>

              <div className="p-3 rounded-lg border bg-zinc-900/50 space-y-2.5" style={{ borderColor: theme.pageBorder }}>
                <div>
                  <div className="text-[10px] text-zinc-500 font-mono tracking-wide">{activeAct?.title || 'Act I'} · {activeChapter.title}</div>
                  <div className="font-semibold text-zinc-100 text-xs flex items-center justify-between mt-0.5">
                    <span>{activeScene ? (activeScene.title || 'Scene') : activeChapter.title}</span>
                    {activeScene && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase tracking-wider">
                        {activeScene.status}
                      </span>
                    )}
                  </div>
                </div>

                {activeScene && (
                  <>
                    {/* POV & Location Anchors */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-800/80">
                      {activeScene.povCharacterId ? (
                        <button
                          onClick={() => setInspectorSelection({ type: 'character', characterId: activeScene.povCharacterId! })}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] transition-colors"
                          title="Inspect POV Character"
                        >
                          <User className="w-2.5 h-2.5 text-zinc-400" />
                          <span>POV: {project.characters?.find(c => c.id === activeScene.povCharacterId)?.name || 'Unknown'}</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-800/40 text-zinc-500 text-[10px]">
                          <User className="w-2.5 h-2.5 text-zinc-600" />
                          <span>POV: Unassigned</span>
                        </div>
                      )}

                      {activeScene.locationIds && activeScene.locationIds.length > 0 ? (
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 text-[10px]">
                          <MapPin className="w-2.5 h-2.5 text-zinc-400" />
                          <span>{project.locations?.find(l => activeScene.locationIds?.includes(l.id))?.name || 'Location'}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Dramatic Structure Progressive Disclosure */}
                    <div className="pt-2 border-t border-zinc-800/60">
                      <button
                        onClick={() => setIsDramaticOpen(!isDramaticOpen)}
                        className="w-full flex items-center justify-between text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        <span className="font-semibold uppercase tracking-wider">Dramatic Arc</span>
                        <div className="flex items-center space-x-1">
                          {(activeScene.goal || activeScene.conflict || activeScene.outcome) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                          {isDramaticOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </div>
                      </button>

                      {isDramaticOpen && (
                        <div className="mt-2 space-y-2 text-[11px]">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium block mb-0.5">
                              POV Goal
                            </label>
                            <input
                              type="text"
                              value={activeScene.goal || ''}
                              placeholder="What does the character want in this scene?"
                              onChange={(e) => updateScene(activeScene.id, { goal: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 text-[11px]"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium block mb-0.5">
                              Conflict / Friction
                            </label>
                            <input
                              type="text"
                              value={activeScene.conflict || ''}
                              placeholder="What obstacle creates tension?"
                              onChange={(e) => updateScene(activeScene.id, { conflict: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 text-[11px]"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium block mb-0.5">
                              Outcome / Turn
                            </label>
                            <input
                              type="text"
                              value={activeScene.outcome || ''}
                              placeholder="How does the situation shift?"
                              onChange={(e) => updateScene(activeScene.id, { outcome: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 text-[11px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Relevant Characters in Context */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <span>Cast in Scene ({relevantCharacters.length})</span>
                <span className="text-[9px] text-zinc-600 lowercase">click to inspect</span>
              </div>

              <div className="space-y-1.5">
                {relevantCharacters.map(char => {
                  const isPov = activeScene?.povCharacterId === char.id;
                  const activeGoal = typeof char.currentGoal === 'string' 
                    ? char.currentGoal 
                    : (char.goals?.find(g => typeof g === 'object' && g.status === 'active') as any)?.description;
                  const charState = typeof char.currentState === 'object' 
                    ? char.currentState.emotional || char.currentState.currentGoal 
                    : char.currentState;

                  return (
                    <div
                      key={char.id}
                      onClick={() => setInspectorSelection({ type: 'character', characterId: char.id })}
                      className="p-2.5 rounded-md bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/70 hover:border-zinc-700 transition-all cursor-pointer space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 truncate flex-1 mr-2">
                          <User className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-300 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-xs text-zinc-200 group-hover:text-indigo-200 truncate">
                              {char.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono ml-1.5">
                              {char.role || 'Supporting'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {isPov && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold">
                              POV
                            </span>
                          )}
                          <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-300" />
                        </div>
                      </div>

                      {(activeGoal || charState) && (
                        <div className="text-[10px] text-zinc-400 space-y-0.5 bg-black/40 p-1.5 rounded border border-zinc-800/50">
                          {charState && (
                            <div className="truncate"><span className="text-zinc-500 font-medium">State:</span> {charState}</div>
                          )}
                          {activeGoal && (
                            <div className="truncate"><span className="text-zinc-500 font-medium">Goal:</span> {activeGoal}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {relevantCharacters.length === 0 && (
                  <div className="text-[11px] text-zinc-600 italic px-1 py-1">
                    No characters attached to this scene yet.
                  </div>
                )}
              </div>
            </div>

            {/* Active Plot Threads in Scene Context */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <span>Plot Threads ({activeThreads.length})</span>
                <button
                  onClick={() => setIsLinkingThread(!isLinkingThread)}
                  className="text-[9px] text-zinc-400 hover:text-zinc-200 flex items-center space-x-1"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>{isLinkingThread ? 'Close' : 'Link'}</span>
                </button>
              </div>

              {/* Inline Link / Quick-Create Thread Panel */}
              {isLinkingThread && (
                <div className="p-2 rounded bg-zinc-900/90 border border-zinc-700/80 space-y-2 text-xs mb-2">
                  <div className="text-[10px] text-zinc-400 font-semibold uppercase">Link to this Scene</div>
                  
                  {project.plotThreads && project.plotThreads.filter(t => !activeThreads.some(at => at.id === t.id)).length > 0 && (
                    <div className="space-y-1">
                      <select
                        onChange={(e) => {
                          if (e.target.value && activeScene) {
                            attachSceneToThread(e.target.value, activeScene.id);
                            setIsLinkingThread(false);
                          }
                        }}
                        defaultValue=""
                        className="w-full bg-black/60 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 outline-none"
                      >
                        <option value="" disabled>Select existing thread...</option>
                        {project.plotThreads
                          .filter(t => !activeThreads.some(at => at.id === t.id))
                          .map(t => (
                            <option key={t.id} value={t.id}>
                              {t.title} ({t.type})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1 pt-1 border-t border-zinc-800">
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={newThreadQuickTitle}
                        onChange={(e) => setNewThreadQuickTitle(e.target.value)}
                        placeholder="Or new thread title..."
                        className="bg-black/60 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 outline-none flex-1 focus:border-zinc-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newThreadQuickTitle.trim() && activeScene) {
                            const newTh = addPlotThread({
                              title: newThreadQuickTitle.trim(),
                              type: 'subplot',
                              status: 'active',
                              color: '#38BDF8',
                              relatedSceneIds: [activeScene.id],
                              introducedIn: activeChapter.id,
                              lastTouchedIn: activeChapter.id,
                            });
                            attachSceneToThread(newTh.id, activeScene.id);
                            setNewThreadQuickTitle('');
                            setIsLinkingThread(false);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newThreadQuickTitle.trim() && activeScene) {
                            const newTh = addPlotThread({
                              title: newThreadQuickTitle.trim(),
                              type: 'subplot',
                              status: 'active',
                              color: '#38BDF8',
                              relatedSceneIds: [activeScene.id],
                              introducedIn: activeChapter.id,
                              lastTouchedIn: activeChapter.id,
                            });
                            attachSceneToThread(newTh.id, activeScene.id);
                            setNewThreadQuickTitle('');
                            setIsLinkingThread(false);
                          }
                        }}
                        disabled={!newThreadQuickTitle.trim()}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] font-medium disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Thread list in scene */}
              <div className="space-y-1">
                {activeThreads.map(thread => (
                  <div
                    key={thread.id}
                    className="w-full p-2 rounded-md bg-zinc-900/40 hover:bg-zinc-800/70 border border-zinc-800/60 hover:border-zinc-700 transition-all flex items-center justify-between group"
                  >
                    <button
                      onClick={() => setInspectorSelection({ type: 'thread', threadId: thread.id })}
                      className="flex items-center space-x-2 truncate flex-1 mr-2 text-left"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: thread.color || '#6366F1' }}
                      />
                      <div className="truncate">
                        <div className="font-medium text-zinc-200 truncate">{thread.title}</div>
                        <div className="text-[10px] text-zinc-500 capitalize">{thread.type} · {thread.status}</div>
                      </div>
                    </button>
                    <div className="flex items-center space-x-1 shrink-0">
                      {activeScene && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            detachSceneFromThread(thread.id, activeScene.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 rounded transition-opacity"
                          title="Unlink thread from this scene"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => setInspectorSelection({ type: 'thread', threadId: thread.id })}
                        className="p-1 text-zinc-600 group-hover:text-zinc-300"
                        title="Inspect Thread Details"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {activeThreads.length === 0 && (
                  <div className="text-[11px] text-zinc-600 italic px-1 py-1">
                    No plot threads attached.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* STATE 2: CHARACTER SELECTED (Dynamic State, Goals, Relationships)          */}
        {/* ========================================================================= */}
        {inspectorSelection.type === 'character' && selectedCharacter && (() => {
          const charThreads = StoryEngineQueries.getCharacterPlotThreads(project, selectedCharacter.id);
          const activeGoals = StoryEngineQueries.getCharacterActiveGoals(project, selectedCharacter.id);

          return (
            <div className="space-y-4">
              {/* Character Header Card */}
              <div className="p-3 rounded-lg border bg-zinc-900/60 space-y-2" style={{ borderColor: theme.pageBorder }}>
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-zinc-100 text-sm">{selectedCharacter.name}</h3>
                    <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400">
                      <span className="font-medium text-indigo-300">{selectedCharacter.role || 'Supporting'}</span>
                      {selectedCharacter.archetype && <span>• {selectedCharacter.archetype}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('codex')}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                    title="Open in Story Bible"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {(selectedCharacter.bio || selectedCharacter.tagline) && (
                  <p className="text-zinc-300 text-[11px] leading-relaxed pt-1 border-t border-zinc-800">
                    {selectedCharacter.bio || selectedCharacter.tagline}
                  </p>
                )}
              </div>

              {/* Current Narrative State */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Current State
                  </div>
                  <button
                    onClick={() => {
                      if (editingCharField === 'state') {
                        setEditingCharField(null);
                      } else {
                        const cur = selectedCharacter.currentState;
                        setQuickEditValue(
                          typeof cur === 'string' ? cur : (cur?.emotional || '')
                        );
                        setEditingCharField('state');
                      }
                    }}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1 rounded transition-colors"
                    title="Quick-edit emotional state"
                  >
                    {editingCharField === 'state' ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {editingCharField === 'state' ? (
                  <div className="space-y-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={quickEditValue}
                      onChange={e => setQuickEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && quickEditValue.trim()) {
                          updateCharacterState(selectedCharacter.id, { emotional: quickEditValue.trim() });
                          setEditingCharField(null);
                          setQuickEditValue('');
                        } else if (e.key === 'Escape') {
                          setEditingCharField(null);
                          setQuickEditValue('');
                        }
                      }}
                      placeholder="Emotional state…"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-[11px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60"
                    />
                    <button
                      onClick={() => {
                        if (quickEditValue.trim()) {
                          updateCharacterState(selectedCharacter.id, { emotional: quickEditValue.trim() });
                          setEditingCharField(null);
                          setQuickEditValue('');
                        }
                      }}
                      className="w-full py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[10px] font-medium transition-colors border border-indigo-500/20"
                    >
                      Save State
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded border border-zinc-800/80 bg-zinc-900/40 space-y-1.5 text-[11px]">
                    {typeof selectedCharacter.currentState === 'object' ? (
                      <>
                        {selectedCharacter.currentState.emotional && (
                          <div className="flex items-start justify-between">
                            <span className="text-zinc-500">Emotional:</span>
                            <span className="text-zinc-200 font-medium text-right">{selectedCharacter.currentState.emotional}</span>
                          </div>
                        )}
                        {selectedCharacter.currentState.physical && (
                          <div className="flex items-start justify-between">
                            <span className="text-zinc-500">Physical:</span>
                            <span className="text-zinc-200 text-right">{selectedCharacter.currentState.physical}</span>
                          </div>
                        )}
                        {selectedCharacter.currentState.currentConflict && (
                          <div className="pt-1 text-[10px] text-amber-300/90 border-t border-zinc-800/60">
                            <span className="text-zinc-500 block font-medium uppercase">Conflict:</span>
                            {selectedCharacter.currentState.currentConflict}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-zinc-300">{selectedCharacter.currentState || 'Active in story'}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Compact quick-edit fields; full history remains in Story workspace */}
              <div className="space-y-2 p-2 border-y border-zinc-800/70">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Quick Context</div>
                {quickStateField('currentGoal', 'Current Goal', 'What are they trying to do?')}
                {quickStateField('currentConflict', 'Current Conflict', 'What is resisting them?')}
                {quickStateField('emotional', 'Emotional State', 'How do they feel?')}
                {quickStateField('physical', 'Physical State', 'What condition are they in?')}
                {quickStateField('mental', 'Mental State', 'What is their mental state?')}
                {quickStateField('motivation', 'Motivation', 'What drives them?')}
              </div>

              {/* Beliefs */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between"><div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Beliefs</div><button onClick={() => { addBelief(selectedCharacter.id, 'New belief'); }} className="text-[10px] text-zinc-500 hover:text-zinc-200">+ Add</button></div>
                {(selectedCharacter.beliefs || []).filter(b => typeof b !== 'string').slice(0, 3).map(b => {
                  if (typeof b === 'string') return null;
                  const editing = editingBeliefId === b.id;
                  return <div key={b.id} className="p-2 border border-zinc-800 bg-zinc-900/40 space-y-1.5">
                    <div className="text-[10px] uppercase text-zinc-500">Belief</div>
                    {editing ? <><input aria-label="Belief statement" autoFocus value={beliefDraft.statement} onChange={e => setBeliefDraft({ ...beliefDraft, statement: e.target.value })} onKeyDown={e => { if (e.key === 'Escape') setEditingBeliefId(null); }} className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200" /><div className="flex gap-1"><select aria-label="Belief certainty" value={beliefDraft.certainty} onChange={e => setBeliefDraft({ ...beliefDraft, certainty: e.target.value as BeliefCertainty })} className="bg-zinc-950 border border-zinc-700 rounded px-1 py-1 text-zinc-300"><option value="strong">Strong</option><option value="moderate">Moderate</option><option value="uncertain">Uncertain</option></select><select aria-label="Belief status" value={beliefDraft.status} onChange={e => setBeliefDraft({ ...beliefDraft, status: e.target.value })} className="bg-zinc-950 border border-zinc-700 rounded px-1 py-1 text-zinc-300"><option value="active">Active</option><option value="challenged">Challenged</option><option value="shattered">Shattered</option><option value="abandoned">Abandoned</option></select></div><button onClick={() => { if (beliefDraft.statement.trim()) updateBelief(selectedCharacter.id, b.id, beliefDraft); setEditingBeliefId(null); }} className="text-[10px] text-indigo-300">Save</button><button onClick={() => setEditingBeliefId(null)} className="ml-2 text-[10px] text-zinc-500">Cancel</button></> : <><div className="text-xs text-zinc-200">“{b.statement}”</div><div className="flex justify-between text-[10px] text-zinc-500"><span>{b.certainty} · {b.status || 'active'}</span><button onClick={() => { setBeliefDraft({ statement: b.statement, certainty: b.certainty, status: b.status || 'active' }); setEditingBeliefId(b.id); }} className="hover:text-zinc-200">Edit</button></div></>}
                  </div>;
                })}
              </div>

              {/* Secrets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between"><div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Secrets</div><button onClick={() => addSecret(selectedCharacter.id, 'New secret')} className="text-[10px] text-zinc-500 hover:text-zinc-200">+ Add</button></div>
                {(Array.isArray(selectedCharacter.secrets) ? selectedCharacter.secrets : []).filter(s => typeof s !== 'string').slice(0, 3).map(s => {
                  if (typeof s === 'string') return null;
                  const editing = editingSecretId === s.id;
                  return <div key={s.id} className="p-2 border border-zinc-800 bg-zinc-900/40 space-y-1.5"><div className="text-[10px] uppercase text-zinc-500">Secret</div>{editing ? <><textarea aria-label="Secret content" autoFocus value={secretDraft.secret} onChange={e => setSecretDraft({ ...secretDraft, secret: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200" /><select aria-label="Secret status" value={secretDraft.status} onChange={e => setSecretDraft({ ...secretDraft, status: e.target.value as SecretStatus })} className="bg-zinc-950 border border-zinc-700 rounded px-1 py-1 text-zinc-300"><option value="hidden">Hidden</option><option value="suspected">Suspected</option><option value="revealed">Revealed</option></select>{secretDraft.status === 'revealed' && <select aria-label="Reveal scene" value={secretDraft.revealedIn} onChange={e => setSecretDraft({ ...secretDraft, revealedIn: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded px-1 py-1 text-zinc-300"><option value="">Select reveal scene</option>{scenes.map(scene => <option key={scene.id} value={scene.id}>{scene.title}</option>)}</select>}<button onClick={() => { if (secretDraft.secret.trim()) updateSecret(selectedCharacter.id, s.id, { secret: secretDraft.secret.trim(), status: secretDraft.status, revealedIn: secretDraft.status === 'revealed' ? secretDraft.revealedIn || undefined : undefined }); setEditingSecretId(null); }} className="text-[10px] text-indigo-300">Save</button><button onClick={() => setEditingSecretId(null)} className="ml-2 text-[10px] text-zinc-500">Cancel</button></> : <><div className="text-xs text-zinc-200">{s.secret || s.content || 'Empty secret'}</div><div className="flex justify-between text-[10px] text-zinc-500"><span>{s.status}</span><button onClick={() => { setSecretDraft({ secret: s.secret || s.content || '', status: s.status, revealedIn: s.revealedIn || '' }); setEditingSecretId(s.id); }} className="hover:text-zinc-200">Edit</button></div></>}</div>;
                })}
              </div>

              {/* Active Goals */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Active Goals ({activeGoals.length})
                  </div>
                  <button
                    onClick={() => {
                      if (editingCharField === 'goal') {
                        setEditingCharField(null);
                        setQuickEditValue('');
                      } else {
                        setQuickEditValue('');
                        setEditingCharField('goal');
                      }
                    }}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1 rounded transition-colors"
                    title="Add goal"
                  >
                    {editingCharField === 'goal' ? 'Cancel' : '+ Add'}
                  </button>
                </div>
                <div className="space-y-1">
                  {activeGoals.map(g => (
                    <div key={g.id} className="p-2 rounded bg-zinc-900/40 border border-zinc-800 text-[11px]">
                      <span className="font-medium text-zinc-200 leading-snug">{g.description}</span>
                    </div>
                  ))}
                  {activeGoals.length === 0 && editingCharField !== 'goal' && (
                    <div className="text-[11px] text-zinc-600 italic px-1">No active goals recorded.</div>
                  )}
                </div>
                {editingCharField === 'goal' && (
                  <div className="space-y-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={quickEditValue}
                      onChange={e => setQuickEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && quickEditValue.trim()) {
                          addGoal(selectedCharacter.id, quickEditValue.trim());
                          setEditingCharField(null);
                          setQuickEditValue('');
                        } else if (e.key === 'Escape') {
                          setEditingCharField(null);
                          setQuickEditValue('');
                        }
                      }}
                      placeholder="Character goal…"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-[11px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60"
                    />
                    <button
                      onClick={() => {
                        if (quickEditValue.trim()) {
                          addGoal(selectedCharacter.id, quickEditValue.trim());
                          setEditingCharField(null);
                          setQuickEditValue('');
                        }
                      }}
                      className="w-full py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[10px] font-medium transition-colors border border-indigo-500/20"
                    >
                      Add Goal
                    </button>
                  </div>
                )}
              </div>

              {/* Interpersonal Relationships */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Relationships ({selectedCharacter.relationships?.length || 0})
                </div>

                <div className="space-y-1">
                  {(selectedCharacter.relationships || []).map((rel, idx) => {
                    const target = project.characters?.find(c => c.id === rel.targetId);
                    return (
                      <div key={idx} className="p-2 rounded bg-zinc-900/40 border border-zinc-800 text-[11px] space-y-1.5">
                        {editingRelationshipKey === `${selectedCharacter.id}:${rel.targetId}` ? <><div className="text-zinc-500">{target?.name || rel.targetName || 'Character'}</div><input aria-label="Relationship" value={relationshipDraft.relation} onChange={e => setRelationshipDraft({ ...relationshipDraft, relation: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200" /><input aria-label="Relationship state" value={relationshipDraft.currentState} onChange={e => setRelationshipDraft({ ...relationshipDraft, currentState: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200" placeholder="Current state" /><input aria-label="Trust level" value={relationshipDraft.trustLevel} onChange={e => setRelationshipDraft({ ...relationshipDraft, trustLevel: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200" placeholder="Trust level" /><input aria-label="Relationship notes" value={relationshipDraft.notes} onChange={e => setRelationshipDraft({ ...relationshipDraft, notes: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200" placeholder="Notes" /><button onClick={() => { addCharacterRelationship(selectedCharacter.id, rel.targetId, relationshipDraft.relation.trim() || rel.relation, { currentState: relationshipDraft.currentState, notes: relationshipDraft.notes, trustLevel: relationshipDraft.trustLevel }); setEditingRelationshipKey(null); }} className="text-[10px] text-indigo-300">Save</button><button onClick={() => setEditingRelationshipKey(null)} className="ml-2 text-[10px] text-zinc-500">Cancel</button></> : <div className="flex items-center justify-between"><span className="font-semibold text-zinc-200">{target?.name || rel.targetName || 'Character'}</span><span className="text-[10px] text-sky-300 font-mono">{rel.relation}</span><button onClick={() => { setRelationshipDraft({ relation: rel.relation, currentState: rel.currentState || '', trustLevel: String(rel.trustLevel || ''), notes: rel.notes || '' }); setEditingRelationshipKey(`${selectedCharacter.id}:${rel.targetId}`); }} className="text-[10px] text-zinc-500 hover:text-zinc-200">Edit</button></div>}
                      </div>
                    );
                  })}
                  {(!selectedCharacter.relationships || selectedCharacter.relationships.length === 0) && (
                    <div className="text-[11px] text-zinc-600 italic px-1">No recorded relationships.</div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* STATE 3: PLOT THREAD SELECTED (Status, Type, Expected Payoff, Linked Scenes) */}
        {/* ========================================================================= */}
        {inspectorSelection.type === 'thread' && selectedThread && (() => {
          return (
            <div className="space-y-4">
              {/* Thread Header Card */}
              <div className="p-3 rounded-lg border bg-zinc-900/60 space-y-2.5" style={{ borderColor: theme.pageBorder }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 flex-1 mr-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: selectedThread.color || '#6366F1' }} 
                    />
                    <input
                      type="text"
                      value={selectedThread.title}
                      onChange={(e) => updatePlotThread(selectedThread.id, { title: e.target.value })}
                      className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 font-bold text-zinc-100 text-sm w-full outline-none py-0.5"
                    />
                  </div>
                  <button
                    onClick={() => setActiveTab('threads')}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 shrink-0"
                    title="Open in Plot Threads Workspace"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80 text-[11px]">
                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase font-semibold block mb-0.5">Type</label>
                    <select
                      value={selectedThread.type}
                      onChange={(e) => updatePlotThread(selectedThread.id, { type: e.target.value as PlotThreadType })}
                      className="w-full bg-black/60 border border-zinc-700 rounded px-1.5 py-1 text-zinc-300 outline-none"
                    >
                      <option value="main-plot">Main Plot</option>
                      <option value="subplot">Subplot</option>
                      <option value="character-arc">Character Arc</option>
                      <option value="mystery">Mystery</option>
                      <option value="romance">Romance</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase font-semibold block mb-0.5">Status</label>
                    <select
                      value={selectedThread.status}
                      onChange={(e) => updatePlotThread(selectedThread.id, { status: e.target.value as PlotThreadStatus })}
                      className="w-full bg-black/60 border border-zinc-700 rounded px-1.5 py-1 text-zinc-200 outline-none capitalize"
                    >
                      <option value="setup">Setup</option>
                      <option value="active">Active</option>
                      <option value="dormant">Dormant</option>
                      <option value="payoff-pending">Payoff Pending</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Core Description */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Dramatic Core / Question
                </div>
                <textarea
                  rows={2}
                  value={selectedThread.description || ''}
                  placeholder="What is at stake? What dramatic tension does this hold?"
                  onChange={(e) => updatePlotThread(selectedThread.id, { description: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded p-2 text-xs text-zinc-300 outline-none focus:border-zinc-600 resize-none leading-relaxed"
                />
              </div>

              {/* Expected Payoff */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Expected Payoff / Climax
                </div>
                <input
                  type="text"
                  value={selectedThread.expectedPayoff || ''}
                  placeholder="Where/how is this thread resolved?"
                  onChange={(e) => updatePlotThread(selectedThread.id, { expectedPayoff: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-600 truncate"
                />
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Notes</div>
                <textarea rows={2} aria-label="Plot thread notes" value={selectedThread.notes || ''} onChange={(e) => updatePlotThread(selectedThread.id, { notes: e.target.value })} className="w-full bg-zinc-900/60 border border-zinc-800 rounded p-2 text-xs text-zinc-300 outline-none focus:border-zinc-600 resize-none" />
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* STATE 4: TEXT SELECTED (Prose Selection, Notes & References)               */}
        {/* ========================================================================= */}
        {inspectorSelection.type === 'text' && (
          <div className="space-y-4">
            <div className="p-2.5 rounded-lg border bg-zinc-900/60 space-y-1.5" style={{ borderColor: theme.pageBorder }}>
              <div className="text-[10px] font-mono uppercase text-zinc-500">Selected Prose Excerpt</div>
              <p className="text-zinc-200 font-serif italic text-xs leading-relaxed line-clamp-3">
                "{inspectorSelection.text}"
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Add Margin Note
              </div>
              <textarea
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                placeholder="Write an editorial comment on this passage..."
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded p-2 text-xs text-zinc-200 resize-none h-16 outline-none focus:border-zinc-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => handleCreateNote(inspectorSelection.text)}
                  disabled={!quickNoteText.trim()}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors disabled:opacity-40"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
};
