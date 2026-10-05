import React, { useState, useMemo } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { 
  RevisionQueries, RevisionEngine 
} from '../../editorial';
import { 
  RevisionRound, RevisionItem, RevisionItemCategory, 
  RevisionItemPriority, RevisionItemStatus, RevisionPassType, 
  RevisionScope, RevisionGroupingMode, StoryAwareRevisionContext 
} from '../../types';
import { ContinuityEngine } from '../../engine';
import { 
  CheckCircle2, Clock, AlertCircle, Sparkles, Filter, Plus, 
  Layers, ArrowRight, Play, Check, X, Shield, Search, Eye, 
  BookOpen, ChevronRight, ChevronDown, User, GitBranch, 
  Calendar, Flame, Bookmark, ArrowUpRight, HelpCircle, Archive, ShieldAlert
} from 'lucide-react';

const PASS_LABELS: Record<RevisionPassType, string> = {
  structure: 'Structure Pass',
  plot: 'Plot Pass',
  character: 'Character Pass',
  pacing: 'Pacing Pass',
  dialogue: 'Dialogue Pass',
  worldbuilding: 'Worldbuilding Pass',
  description: 'Description Pass',
  continuity: 'Continuity Pass',
  repetition: 'Repetition Pass',
  prose: 'Prose & Polish Pass',
  proofreading: 'Proofreading Pass',
  custom: 'Custom Pass',
};

const CATEGORY_COLORS: Record<RevisionItemCategory, { bg: string; text: string; border: string }> = {
  structure: { bg: 'bg-indigo-950/40', text: 'text-indigo-300', border: 'border-indigo-800/60' },
  plot: { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/60' },
  character: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/60' },
  pacing: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/60' },
  dialogue: { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/60' },
  worldbuilding: { bg: 'bg-teal-950/40', text: 'text-teal-300', border: 'border-teal-800/60' },
  description: { bg: 'bg-teal-950/40', text: 'text-teal-300', border: 'border-teal-800/60' },
  continuity: { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-800/60' },
  repetition: { bg: 'bg-orange-950/40', text: 'text-orange-300', border: 'border-orange-800/60' },
  prose: { bg: 'bg-blue-950/40', text: 'text-blue-300', border: 'border-blue-800/60' },
  proofreading: { bg: 'bg-indigo-950/40', text: 'text-indigo-300', border: 'border-indigo-800/60' },
  sensory: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/60' },
  research: { bg: 'bg-zinc-800/60', text: 'text-zinc-300', border: 'border-zinc-700' },
  other: { bg: 'bg-zinc-800/60', text: 'text-zinc-400', border: 'border-zinc-700' },
};

const PRIORITY_BADGES: Record<RevisionItemPriority, { label: string; dot: string }> = {
  critical: { label: 'Critical', dot: 'bg-red-500 ring-red-400/30' },
  high: { label: 'High', dot: 'bg-amber-500 ring-amber-400/30' },
  medium: { label: 'Medium', dot: 'bg-blue-500 ring-blue-400/30' },
  low: { label: 'Low', dot: 'bg-zinc-500 ring-zinc-400/30' },
};

export const RevisionWorkspace: React.FC = () => {
  const { 
    project, activeRevisionRoundId, setActiveRevisionRoundId, 
    activeRevisionItemId, setActiveRevisionItemId,
    setActiveChapterId, setActiveSceneId, setActiveTab,
    setIsRevisionReviewModeOpen,
    addRevisionRound, updateRevisionRound, deleteRevisionRound, completeRevisionRound,
    addRevisionItem, updateRevisionItem, deleteRevisionItem, resolveRevisionItem, deferRevisionItem,
    convertContinuityToRevisionItem
  } = useSwriteStore();

  const theme = project.metadata.theme;

  // View & Grouping State
  const [groupingMode, setGroupingMode] = useState<RevisionGroupingMode>('status');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<RevisionItemCategory | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<RevisionItemPriority | 'all'>('all');
  const [filterChapterId, setFilterChapterId] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modals & Drawers
  const [showNewRoundModal, setShowNewRoundModal] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [showContinuityDrawer, setShowContinuityDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<RevisionItem | null>(null);

  // Form States for New Round
  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundPass, setNewRoundPass] = useState<RevisionPassType>('structure');
  const [newRoundScope, setNewRoundScope] = useState<RevisionScope>('manuscript');
  const [newRoundDesc, setNewRoundDesc] = useState('');

  // Form States for New Item
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<RevisionItemCategory>('structure');
  const [newItemPriority, setNewItemPriority] = useState<RevisionItemPriority>('medium');
  const [newItemChapterId, setNewItemChapterId] = useState('');
  const [newItemSceneId, setNewItemSceneId] = useState('');
  const [newItemCharId, setNewItemCharId] = useState('');
  const [newItemThreadId, setNewItemThreadId] = useState('');

  // Revision Rounds
  const revisionRounds = useMemo(() => RevisionQueries.getRevisionRounds(project), [project]);
  const activeRound = useMemo(() => {
    if (activeRevisionRoundId) {
      return revisionRounds.find(r => r.id === activeRevisionRoundId) || revisionRounds[0];
    }
    return revisionRounds.find(r => r.status === 'in-progress') || revisionRounds[0];
  }, [revisionRounds, activeRevisionRoundId]);

  // Filtered Revision Items
  const filteredItems = useMemo(() => {
    return RevisionQueries.getRevisionItems(project, {
      roundId: activeRound?.id,
      category: filterCategory === 'all' ? undefined : filterCategory,
      priority: filterPriority === 'all' ? undefined : filterPriority,
      chapterId: filterChapterId === 'all' ? undefined : filterChapterId,
      searchQuery: searchQuery.trim() || undefined,
    });
  }, [project, activeRound?.id, filterCategory, filterPriority, filterChapterId, searchQuery]);

  // Selected Item and Story-Aware Context
  const selectedItem = useMemo(() => {
    if (!activeRevisionItemId) return filteredItems[0] || null;
    return filteredItems.find(i => i.id === activeRevisionItemId) || filteredItems[0] || null;
  }, [filteredItems, activeRevisionItemId]);

  const storyContext: StoryAwareRevisionContext | null = useMemo(() => {
    if (!selectedItem) return null;
    return RevisionQueries.getStoryAwareRevisionContext(project, selectedItem);
  }, [project, selectedItem]);

  // Available Chapters and Scenes
  const allChapters = useMemo(() => project.acts.flatMap(a => a.chapters), [project]);
  const selectedChapterScenes = useMemo(() => {
    const ch = allChapters.find(c => c.id === newItemChapterId);
    return ch?.scenes || [];
  }, [allChapters, newItemChapterId]);

  // Continuity Warnings
  const continuityWarnings = useMemo(() => {
    return ContinuityEngine.runAudit(project).filter(w => !w.isIgnored && !w.isIntentional);
  }, [project]);

  // Round Creation Handler
  const handleCreateRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoundName.trim()) return;

    const round = addRevisionRound({
      name: newRoundName.trim(),
      description: newRoundDesc.trim() || undefined,
      passType: newRoundPass,
      scope: newRoundScope,
    });

    setActiveRevisionRoundId(round.id);
    setNewRoundName('');
    setNewRoundDesc('');
    setShowNewRoundModal(false);
  };

  // Item Creation Handler
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const item = addRevisionItem({
      revisionRoundId: activeRound?.id,
      title: newItemTitle.trim(),
      description: newItemDesc.trim() || undefined,
      category: newItemCategory,
      priority: newItemPriority,
      chapterId: newItemChapterId || undefined,
      sceneId: newItemSceneId || undefined,
      relatedCharacterIds: newItemCharId ? [newItemCharId] : [],
      relatedPlotThreadIds: newItemThreadId ? [newItemThreadId] : [],
    });

    setActiveRevisionItemId(item.id);
    setNewItemTitle('');
    setNewItemDesc('');
    setShowNewItemModal(false);
  };

  // Open In Manuscript Scene
  const handleOpenScene = (item: RevisionItem) => {
    if (item.chapterId) {
      setActiveChapterId(item.chapterId);
      if (item.sceneId) {
        setActiveSceneId(item.sceneId);
      }
      setActiveTab('editor');
    }
  };

  // Start Sequential Manuscript Review Mode
  const handleStartReviewMode = () => {
    if (selectedItem) {
      handleOpenScene(selectedItem);
    } else if (filteredItems[0]) {
      handleOpenScene(filteredItems[0]);
    }
    setIsRevisionReviewModeOpen(true);
    setActiveTab('editor');
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden select-none"
      style={{ backgroundColor: theme.colors?.background || theme.bg }}
    >
      {/* 1. Header Toolbar */}
      <div 
        className="h-14 px-6 border-b flex items-center justify-between shrink-0 select-none z-10"
        style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-sm tracking-tight text-zinc-100 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Manuscript Revision</span>
            </span>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* Active Round Switcher */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-zinc-500 uppercase font-mono">Round:</span>
            {revisionRounds.length > 0 ? (
              <select
                value={activeRound?.id || ''}
                onChange={(e) => setActiveRevisionRoundId(e.target.value)}
                className="bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none font-medium"
              >
                {revisionRounds.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({PASS_LABELS[r.passType] || r.passType}) — {r.status}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-zinc-500 italic">No revision rounds yet</span>
            )}

            <button
              onClick={() => setShowNewRoundModal(true)}
              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              title="Create New Revision Round"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-3">
          {/* Continuity Warning Converter */}
          {continuityWarnings.length > 0 && (
            <button
              onClick={() => setShowContinuityDrawer(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/40 transition-colors"
              title="Import Continuity Findings into Revision"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>{continuityWarnings.length} Continuity Issue{continuityWarnings.length === 1 ? '' : 's'}</span>
            </button>
          )}

          {/* New Revision Item Button */}
          <button
            onClick={() => setShowNewItemModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium transition-colors border border-zinc-700"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            <span>Add Note</span>
          </button>

          {/* Sequential Review Mode Button */}
          <button
            onClick={handleStartReviewMode}
            disabled={filteredItems.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-1 rounded text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Review ({filteredItems.filter(i => i.status === 'open').length})</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Editorial Filter Bar & Grouping Switcher */}
      <div 
        className="px-6 py-2.5 border-b flex items-center justify-between text-xs select-none shrink-0"
        style={{ borderColor: theme.pageBorder, backgroundColor: theme.bg }}
      >
        <div className="flex items-center space-x-3">
          {/* Grouping Mode */}
          <div className="flex items-center space-x-1 bg-zinc-900/80 p-0.5 rounded border border-zinc-800 text-[11px]">
            <button
              onClick={() => setGroupingMode('status')}
              className={`px-2.5 py-0.5 rounded transition-colors ${groupingMode === 'status' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              By Status
            </button>
            <button
              onClick={() => setGroupingMode('pass')}
              className={`px-2.5 py-0.5 rounded transition-colors ${groupingMode === 'pass' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              By Category
            </button>
            <button
              onClick={() => setGroupingMode('chapter')}
              className={`px-2.5 py-0.5 rounded transition-colors ${groupingMode === 'chapter' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              By Chapter
            </button>
            <button
              onClick={() => setGroupingMode('priority')}
              className={`px-2.5 py-0.5 rounded transition-colors ${groupingMode === 'priority' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              By Priority
            </button>
          </div>

          <div className="h-3.5 w-[1px] bg-zinc-800" />

          {/* Quick Search */}
          <div className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-300">
            <Search className="w-3 h-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-xs w-36 text-zinc-200 placeholder-zinc-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs transition-colors ${showFilters || filterCategory !== 'all' || filterPriority !== 'all' || filterChapterId !== 'all' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Filter className="w-3 h-3" />
            <span>Filters</span>
          </button>
        </div>

        {/* Round Progress Status */}
        {activeRound && (
          <div className="flex items-center space-x-3 text-[11px] text-zinc-400 font-mono">
            <span>
              {filteredItems.filter(i => i.status === 'resolved' || i.status === 'wont-change').length} / {filteredItems.length} Resolved
            </span>
            {activeRound.status === 'in-progress' && (
              <button
                onClick={() => completeRevisionRound(activeRound.id)}
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center space-x-1 font-sans"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Mark Round Completed</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progressive Disclosure Filter Bar */}
      {showFilters && (
        <div className="px-6 py-2 border-b bg-zinc-900/60 border-zinc-800 flex items-center space-x-4 text-xs select-none">
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500 text-[11px]">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 outline-none capitalize"
            >
              <option value="all">All Categories</option>
              {Object.keys(CATEGORY_COLORS).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500 text-[11px]">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 outline-none capitalize"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500 text-[11px]">Chapter:</span>
            <select
              value={filterChapterId}
              onChange={(e) => setFilterChapterId(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 outline-none"
            >
              <option value="all">All Chapters</option>
              {allChapters.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.title}</option>
              ))}
            </select>
          </div>

          {(filterCategory !== 'all' || filterPriority !== 'all' || filterChapterId !== 'all') && (
            <button
              onClick={() => {
                setFilterCategory('all');
                setFilterPriority('all');
                setFilterChapterId('all');
              }}
              className="text-indigo-400 hover:text-indigo-300 text-xs underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* 3. Main Board Body + Side Story-Aware Context Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Revision Items Board View */}
        <div className="flex-1 overflow-y-auto p-6">
          {groupingMode === 'status' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
              {(['open', 'in-progress', 'resolved', 'deferred'] as RevisionItemStatus[]).map(statusKey => {
                const statusItems = filteredItems.filter(i => i.status === statusKey);
                const statusTitle = statusKey === 'in-progress' ? 'In Progress' : statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
                
                return (
                  <div key={statusKey} className="flex flex-col bg-[#141416] border border-zinc-800/80 rounded-lg p-3 min-h-[400px]">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
                      <span className="font-medium text-xs text-zinc-300 flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusKey === 'open' ? 'bg-amber-400' : statusKey === 'in-progress' ? 'bg-blue-400' : statusKey === 'resolved' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        <span>{statusTitle}</span>
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono font-medium">{statusItems.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                      {statusItems.map(item => (
                        <RevisionCard
                          key={item.id}
                          item={item}
                          isSelected={selectedItem?.id === item.id}
                          onSelect={() => setActiveRevisionItemId(item.id)}
                          onOpenScene={() => handleOpenScene(item)}
                          onResolve={() => resolveRevisionItem(item.id)}
                          onDefer={() => deferRevisionItem(item.id)}
                          onDelete={() => deleteRevisionItem(item.id)}
                        />
                      ))}
                      {statusItems.length === 0 && (
                        <div className="text-center py-8 text-zinc-600 text-xs italic">
                          No {statusTitle.toLowerCase()} items
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grouped by Category, Chapter, or Priority */}
              {renderGroupedItems(
                groupingMode,
                filteredItems,
                allChapters,
                selectedItem,
                setActiveRevisionItemId,
                handleOpenScene,
                resolveRevisionItem,
                deferRevisionItem,
                deleteRevisionItem
              )}
            </div>
          )}
        </div>

        {/* Story-Aware Context Inspector Drawer */}
        {selectedItem && (
          <div className="w-80 md:w-96 border-l border-zinc-800 bg-[#141416] flex flex-col h-full overflow-hidden shrink-0">
            <div className="h-12 px-4 border-b border-zinc-800 flex items-center justify-between text-xs shrink-0 select-none">
              <span className="font-semibold text-zinc-200 flex items-center space-x-1.5">
                <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                <span>Revision Context</span>
              </span>
              <button
                onClick={() => handleOpenScene(selectedItem)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 hover:underline"
              >
                <span>Jump to Scene</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Note Details */}
              <div className="space-y-2 bg-zinc-900/60 p-3 rounded border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider border ${CATEGORY_COLORS[selectedItem.category].bg} ${CATEGORY_COLORS[selectedItem.category].text} ${CATEGORY_COLORS[selectedItem.category].border}`}>
                    {selectedItem.category}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_BADGES[selectedItem.priority].dot}`} />
                    <span className="text-[11px] text-zinc-400 capitalize">{selectedItem.priority}</span>
                  </div>
                </div>

                <div className="font-semibold text-zinc-100 text-sm">{selectedItem.title}</div>
                {selectedItem.description && (
                  <p className="text-zinc-300 text-xs leading-relaxed">{selectedItem.description}</p>
                )}

                {selectedItem.anchoredText && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/80">
                    <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Anchored Prose:</div>
                    <div className="italic text-zinc-400 bg-zinc-950 p-2 rounded text-[11px] border border-zinc-800/60">
                      "{selectedItem.anchoredText}"
                    </div>
                  </div>
                )}
              </div>

              {/* Story Engine Scene Context */}
              {storyContext?.scene && (
                <div className="space-y-2 bg-zinc-900/60 p-3 rounded border border-zinc-800">
                  <div className="font-semibold text-zinc-200 text-xs flex items-center space-x-1.5 border-b border-zinc-800/80 pb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Scene Context: {storyContext.scene.title}</span>
                  </div>
                  {storyContext.scene.goal && (
                    <div><span className="text-zinc-500 font-medium">Goal: </span><span className="text-zinc-300">{storyContext.scene.goal}</span></div>
                  )}
                  {storyContext.scene.conflict && (
                    <div><span className="text-zinc-500 font-medium">Conflict: </span><span className="text-zinc-300">{storyContext.scene.conflict}</span></div>
                  )}
                  {storyContext.scene.outcome && (
                    <div><span className="text-zinc-500 font-medium">Outcome: </span><span className="text-zinc-300">{storyContext.scene.outcome}</span></div>
                  )}
                  {storyContext.scene.povCharacterName && (
                    <div><span className="text-zinc-500 font-medium">POV: </span><span className="text-indigo-400 font-medium">{storyContext.scene.povCharacterName}</span></div>
                  )}
                </div>
              )}

              {/* Story Engine Character State Context */}
              {storyContext?.character && (
                <div className="space-y-2 bg-zinc-900/60 p-3 rounded border border-zinc-800">
                  <div className="font-semibold text-zinc-200 text-xs flex items-center space-x-1.5 border-b border-zinc-800/80 pb-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Character State: {storyContext.character.name}</span>
                  </div>
                  {storyContext.character.currentState && (
                    <div>
                      <span className="text-zinc-500 font-medium">State: </span>
                      <span className="text-emerald-300 font-medium">{storyContext.character.currentState}</span>
                    </div>
                  )}
                  {storyContext.character.lastSeenChapterTitle && (
                    <div>
                      <span className="text-zinc-500 font-medium">Last Seen: </span>
                      <span className="text-zinc-300">{storyContext.character.lastSeenChapterTitle}</span>
                    </div>
                  )}
                  {storyContext.character.goals && storyContext.character.goals.length > 0 && (
                    <div>
                      <span className="text-zinc-500 font-medium">Active Goal: </span>
                      <span className="text-zinc-300">{storyContext.character.goals[0].statement}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Story Engine Plot Thread Context */}
              {storyContext?.plotThread && (
                <div className="space-y-2 bg-zinc-900/60 p-3 rounded border border-zinc-800">
                  <div className="font-semibold text-zinc-200 text-xs flex items-center space-x-1.5 border-b border-zinc-800/80 pb-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                    <span>Plot Thread: {storyContext.plotThread.title}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-medium">Status: </span>
                    <span className="text-purple-300 capitalize font-medium">{storyContext.plotThread.status}</span>
                  </div>
                  {storyContext.plotThread.expectedPayoff && (
                    <div>
                      <span className="text-zinc-500 font-medium">Expected Payoff: </span>
                      <span className="text-zinc-300">{storyContext.plotThread.expectedPayoff}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="pt-2 flex items-center space-x-2">
                <button
                  onClick={() => resolveRevisionItem(selectedItem.id)}
                  className="flex-1 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center justify-center space-x-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Resolve Item</span>
                </button>
                <button
                  onClick={() => deferRevisionItem(selectedItem.id)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors border border-zinc-700"
                >
                  Defer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Modal: Create New Revision Round */}
      {showNewRoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
          <form onSubmit={handleCreateRound} className="bg-[#18181b] border border-zinc-700 rounded-lg p-5 w-full max-w-md shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-zinc-100 text-sm">Create New Revision Round</span>
              <button type="button" onClick={() => setShowNewRoundModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Round Name</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Structural Overhaul, Character Pass, Polish..."
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-100 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">Pass Type</label>
                <select
                  value={newRoundPass}
                  onChange={(e) => setNewRoundPass(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-200 text-xs outline-none"
                >
                  {Object.entries(PASS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Scope</label>
                <select
                  value={newRoundScope}
                  onChange={(e) => setNewRoundScope(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-200 text-xs outline-none capitalize"
                >
                  <option value="manuscript">Whole Manuscript</option>
                  <option value="act">Current Act</option>
                  <option value="chapter">Current Chapter</option>
                  <option value="scene">Current Scene</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Description / Goal (Optional)</label>
              <textarea
                rows={2}
                placeholder="What are the key editorial goals for this round?"
                value={newRoundDesc}
                onChange={(e) => setNewRoundDesc(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-200 text-xs outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowNewRoundModal(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newRoundName.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded text-xs transition-colors"
              >
                Create Round
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Modal: Create New Revision Item */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
          <form onSubmit={handleCreateItem} className="bg-[#18181b] border border-zinc-700 rounded-lg p-5 w-full max-w-lg shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-zinc-100 text-sm">Add Revision Note</span>
              <button type="button" onClick={() => setShowNewItemModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Note Title</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Dialogue reveals secret too early, Pacing drags here..."
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-100 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-200 text-xs outline-none capitalize"
                >
                  {Object.keys(CATEGORY_COLORS).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Priority</label>
                <select
                  value={newItemPriority}
                  onChange={(e) => setNewItemPriority(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-200 text-xs outline-none capitalize"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">Chapter</label>
                <select
                  value={newItemChapterId}
                  onChange={(e) => {
                    setNewItemChapterId(e.target.value);
                    setNewItemSceneId('');
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-200 text-xs outline-none"
                >
                  <option value="">(No specific chapter)</option>
                  {allChapters.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Scene</label>
                <select
                  value={newItemSceneId}
                  onChange={(e) => setNewItemSceneId(e.target.value)}
                  disabled={!newItemChapterId || selectedChapterScenes.length === 0}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-200 text-xs outline-none disabled:opacity-40"
                >
                  <option value="">(Entire Chapter / No Scene)</option>
                  {selectedChapterScenes.map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Detailed Explanation & Suggestions</label>
              <textarea
                rows={3}
                placeholder="What needs attention and how should it be resolved?"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-200 text-xs outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowNewItemModal(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newItemTitle.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded text-xs transition-colors"
              >
                Save Revision Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Drawer: Import Continuity Warnings */}
      {showContinuityDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#18181b] border-l border-zinc-700 h-full flex flex-col p-5 shadow-2xl text-xs space-y-4 animate-in slide-in-from-right duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-zinc-100 text-sm flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Continuity Findings</span>
              </span>
              <button onClick={() => setShowContinuityDrawer(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-zinc-400 text-xs">
              Convert detected story engine continuity warnings into deliberate revision action items.
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {continuityWarnings.map(warn => (
                <div key={warn.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200 text-xs">{warn.title}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-900">
                      {warn.severity}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{warn.description}</p>
                  
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      onClick={() => {
                        convertContinuityToRevisionItem(warn, { revisionRoundId: activeRound?.id });
                        setShowContinuityDrawer(false);
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Convert to Revision Note</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Revision Card
const RevisionCard: React.FC<{
  item: RevisionItem;
  isSelected: boolean;
  onSelect: () => void;
  onOpenScene: () => void;
  onResolve: () => void;
  onDefer: () => void;
  onDelete: () => void;
}> = ({ item, isSelected, onSelect, onOpenScene, onResolve, onDefer, onDelete }) => {
  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded border text-xs cursor-pointer transition-all space-y-2 ${
        isSelected 
          ? 'bg-zinc-800/90 border-indigo-500 ring-1 ring-indigo-500/40 shadow-md' 
          : 'bg-[#18181b] border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono tracking-wider border ${CATEGORY_COLORS[item.category].bg} ${CATEGORY_COLORS[item.category].text} ${CATEGORY_COLORS[item.category].border}`}>
          {item.category}
        </span>
        <div className="flex items-center space-x-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_BADGES[item.priority].dot}`} />
          <span className="text-[10px] text-zinc-400 capitalize">{item.priority}</span>
        </div>
      </div>

      <div className="font-medium text-zinc-200 line-clamp-2 leading-snug">{item.title}</div>

      {item.anchoredText && (
        <div className="text-[11px] text-zinc-400 italic line-clamp-1 border-l-2 border-zinc-700 pl-1.5">
          "{item.anchoredText}"
        </div>
      )}

      <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500 border-t border-zinc-800/60">
        <span className="truncate max-w-[120px]">
          {item.chapterId ? 'Manuscript anchored' : 'General note'}
        </span>

        <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
          {item.status !== 'resolved' && (
            <button
              onClick={onResolve}
              className="p-1 text-zinc-500 hover:text-emerald-400 rounded"
              title="Mark Resolved"
            >
              <Check className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={onOpenScene}
            className="p-1 text-zinc-500 hover:text-zinc-200 rounded"
            title="Open Scene"
          >
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper: Render grouped items for Category, Chapter, or Priority modes
function renderGroupedItems(
  mode: RevisionGroupingMode,
  items: RevisionItem[],
  chapters: any[],
  selectedItem: RevisionItem | null,
  onSelect: (id: string) => void,
  onOpenScene: (item: RevisionItem) => void,
  onResolve: (id: string) => void,
  onDefer: (id: string) => void,
  onDelete: (id: string) => void
) {
  let groups: Array<{ key: string; title: string; items: RevisionItem[] }> = [];

  if (mode === 'pass') {
    const cats = Object.keys(CATEGORY_COLORS) as RevisionItemCategory[];
    groups = cats.map(cat => ({
      key: cat,
      title: cat.toUpperCase(),
      items: items.filter(i => i.category === cat),
    })).filter(g => g.items.length > 0);
  } else if (mode === 'chapter') {
    groups = chapters.map(ch => ({
      key: ch.id,
      title: ch.title,
      items: items.filter(i => i.chapterId === ch.id),
    })).filter(g => g.items.length > 0);

    const unassigned = items.filter(i => !i.chapterId);
    if (unassigned.length > 0) {
      groups.push({ key: 'unassigned', title: 'General / Unanchored', items: unassigned });
    }
  } else if (mode === 'priority') {
    groups = (['critical', 'high', 'medium', 'low'] as RevisionItemPriority[]).map(pri => ({
      key: pri,
      title: `${pri.toUpperCase()} PRIORITY`,
      items: items.filter(i => i.priority === pri),
    })).filter(g => g.items.length > 0);
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-600 text-xs italic">
        No revision items found for this view
      </div>
    );
  }

  return groups.map(group => (
    <div key={group.key} className="space-y-3">
      <div className="flex items-center space-x-2 border-b border-zinc-800 pb-1.5">
        <span className="font-semibold text-xs text-zinc-300">{group.title}</span>
        <span className="text-[11px] text-zinc-500 font-mono">({group.items.length})</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {group.items.map(item => (
          <RevisionCard
            key={item.id}
            item={item}
            isSelected={selectedItem?.id === item.id}
            onSelect={() => onSelect(item.id)}
            onOpenScene={() => onOpenScene(item)}
            onResolve={() => onResolve(item.id)}
            onDefer={() => onDefer(item.id)}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </div>
    </div>
  ));
}
