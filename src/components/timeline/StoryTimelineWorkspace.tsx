import React, { useState, useMemo } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { StoryEngineQueries } from '../../engine';
import { 
  StoryTimelineNode, TimelineViewMode, TimelineTimeType, TimelineFilterConfig 
} from '../../types';
import { 
  Clock, BookOpen, ArrowRight, GitBranch, MapPin, User, 
  Filter, Search, ChevronRight, Eye, Calendar,
  Layers, AlertCircle, Bookmark, Compass, SplitSquareVertical,
  CheckCircle2, Flame, History, FastForward, Rewind, Plus
} from 'lucide-react';

export const StoryTimelineWorkspace: React.FC = () => {
  const { 
    project, 
    setActiveTab, 
    setActiveChapterId,
    setActiveSceneId,
    updateScene,
    updateChapterMetadata,
    updateEvent,
    addEvent,
  } = useSwriteStore();

  const theme = project.metadata.theme;

  // View state
  const [viewMode, setViewMode] = useState<TimelineViewMode>('manuscript');
  const [selectedNode, setSelectedNode] = useState<StoryTimelineNode | null>(null);

  // Filters
  const [selectedCharId, setSelectedCharId] = useState<string>('all');
  const [selectedLocId, setSelectedLocId] = useState<string>('all');
  const [selectedThreadId, setSelectedThreadId] = useState<string>('all');
  const [selectedArcId, setSelectedArcId] = useState<string>('all');
  const [selectedTimeType, setSelectedTimeType] = useState<TimelineTimeType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick edit modal
  const [editingNode, setEditingNode] = useState<StoryTimelineNode | null>(null);
  const [editDateStr, setEditDateStr] = useState('');
  const [editTimeType, setEditTimeType] = useState<TimelineTimeType>('present');

  // Create event modal
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventSummary, setNewEventSummary] = useState('');
  const [newEventDateStr, setNewEventDateStr] = useState('');
  const [newEventType, setNewEventType] = useState<'historical' | 'backstory' | 'world-event' | 'scene-event'>('historical');

  // Filter configuration
  const filterConfig: TimelineFilterConfig = useMemo(() => ({
    characterId: selectedCharId !== 'all' ? selectedCharId : undefined,
    locationId: selectedLocId !== 'all' ? selectedLocId : undefined,
    plotThreadId: selectedThreadId !== 'all' ? selectedThreadId : undefined,
    storyArcId: selectedArcId !== 'all' ? selectedArcId : undefined,
    timeType: selectedTimeType !== 'all' ? selectedTimeType : undefined,
    searchQuery: searchQuery.trim() || undefined,
  }), [selectedCharId, selectedLocId, selectedThreadId, selectedArcId, selectedTimeType, searchQuery]);

  // Query Timeline Data
  const timelineData = useMemo(() => {
    return StoryEngineQueries.getStoryTimelineData(project, filterConfig);
  }, [project, filterConfig]);

  const activeNodes = useMemo(() => {
    if (viewMode === 'chronology') return timelineData.chronologyNodes;
    return timelineData.manuscriptNodes;
  }, [viewMode, timelineData]);

  const handleJumpToEditor = (node: StoryTimelineNode) => {
    if (node.chapterId) {
      setActiveChapterId(node.chapterId);
      if (node.sceneId) {
        setActiveSceneId(node.sceneId);
      }
      setActiveTab('editor');
    }
  };

  const handleOpenEdit = (node: StoryTimelineNode) => {
    setEditingNode(node);
    setEditDateStr(node.timelineDate || '');
    setEditTimeType(node.timeType);
  };

  const handleSaveEdit = () => {
    if (!editingNode) return;

    if (editingNode.type === 'scene' && editingNode.sceneId) {
      const currentTags = (editingNode.tags || []).filter(t => !['flashback', 'flashforward', 'memory', 'backstory', 'present'].includes(t.toLowerCase()));
      if (editTimeType !== 'present') currentTags.push(editTimeType);

      updateScene(editingNode.sceneId, {
        timelineDate: editDateStr.trim() || undefined,
        tags: currentTags,
      });
    } else if (editingNode.type === 'chapter' && editingNode.chapterId) {
      const currentTags = (editingNode.tags || []).filter(t => !['flashback', 'flashforward', 'memory', 'backstory', 'present'].includes(t.toLowerCase()));
      if (editTimeType !== 'present') currentTags.push(editTimeType);

      updateChapterMetadata(editingNode.chapterId, {
        tags: currentTags,
      });
    } else if (editingNode.type === 'event' && editingNode.events[0]) {
      updateEvent(editingNode.events[0].id, {
        timelineDate: editDateStr.trim() || undefined,
      });
    }

    setEditingNode(null);
  };

  const handleSaveNewEvent = () => {
    if (!newEventTitle.trim()) return;

    addEvent({
      title: newEventTitle.trim(),
      summary: newEventSummary.trim(),
      timelineDate: newEventDateStr.trim() || undefined,
      type: newEventType,
      tags: [newEventType],
    });

    setNewEventTitle('');
    setNewEventSummary('');
    setNewEventDateStr('');
    setIsCreatingEvent(false);
  };

  const getTimeTypeBadge = (timeType: TimelineTimeType, dateStr?: string) => {
    switch (timeType) {
      case 'flashback':
      case 'memory':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
            <Rewind className="w-2.5 h-2.5" />
            <span>Flashback {dateStr ? `• ${dateStr}` : ''}</span>
          </span>
        );
      case 'flashforward':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
            <FastForward className="w-2.5 h-2.5" />
            <span>Flashforward {dateStr ? `• ${dateStr}` : ''}</span>
          </span>
        );
      case 'backstory':
      case 'historical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center space-x-1">
            <History className="w-2.5 h-2.5" />
            <span>Historical Beat {dateStr ? `• ${dateStr}` : ''}</span>
          </span>
        );
      default:
        return dateStr ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60 flex items-center space-x-1">
            <Clock className="w-2.5 h-2.5 text-zinc-400" />
            <span>{dateStr}</span>
          </span>
        ) : null;
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden select-none"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Top Header & Perspective Switcher */}
      <div 
        className="px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-4 shrink-0"
        style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
              Story Timeline
            </h1>
            <p className="text-[11px] text-zinc-400">
              Manuscript experience order vs. chronological story history.
            </p>
          </div>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex items-center space-x-2">
          <div className="flex rounded p-0.5 bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setViewMode('manuscript')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1.5 ${
                viewMode === 'manuscript'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manuscript Order</span>
            </button>

            <button
              onClick={() => setViewMode('chronology')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1.5 ${
                viewMode === 'chronology'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Story Chronology</span>
            </button>

            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1.5 ${
                viewMode === 'comparison'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Dual Comparison</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreatingEvent(true)}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>

          {/* Quick Metrics */}
          {timelineData.nonLinearCount > 0 && (
            <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs font-medium">
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span>{timelineData.nonLinearCount} Non-Linear Beats</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div 
        className="px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0"
        style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search timeline..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-44"
            />
          </div>

          {/* Character Filter */}
          <select
            value={selectedCharId}
            onChange={e => setSelectedCharId(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300 focus:outline-none focus:border-zinc-500"
          >
            <option value="all">All Characters</option>
            {project.characters.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={selectedLocId}
            onChange={e => setSelectedLocId(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300 focus:outline-none focus:border-zinc-500"
          >
            <option value="all">All Locations</option>
            {(project.locations || []).map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          {/* Plot Thread Filter */}
          <select
            value={selectedThreadId}
            onChange={e => setSelectedThreadId(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300 focus:outline-none focus:border-zinc-500"
          >
            <option value="all">All Plot Threads</option>
            {(project.plotThreads || []).map(t => (
              <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
            ))}
          </select>

          {/* Time Type Filter */}
          <select
            value={selectedTimeType}
            onChange={e => setSelectedTimeType(e.target.value as any)}
            className="px-2.5 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300 focus:outline-none focus:border-zinc-500"
          >
            <option value="all">All Time Types</option>
            <option value="present">Present Day Narrative</option>
            <option value="flashback">Flashbacks & Memories</option>
            <option value="flashforward">Flashforwards & Visions</option>
            <option value="backstory">Historical & Backstory</option>
          </select>
        </div>

        {/* Perspective Indicator */}
        <div className="text-[11px] text-zinc-400 font-medium">
          {viewMode === 'manuscript' && 'Displaying: Sequential Reader Progression (Page 1 → End)'}
          {viewMode === 'chronology' && 'Displaying: In-Universe Chronological Flow (Ancient → Future)'}
          {viewMode === 'comparison' && 'Displaying: Narrative vs Chronology Delta Comparison'}
        </div>
      </div>

      {/* Main Timeline View Canvas */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ========================================================================= */}
        {/* VIEW MODE 1 & 2: MANUSCRIPT ORDER or STORY CHRONOLOGY                     */}
        {/* ========================================================================= */}
        {(viewMode === 'manuscript' || viewMode === 'chronology') && (
          <div className="max-w-4xl mx-auto">
            {activeNodes.length === 0 ? (
              <div 
                className="py-16 text-center rounded-xl border border-dashed flex flex-col items-center justify-center space-y-3"
                style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
              >
                <Clock className="w-8 h-8 text-zinc-500" />
                <div className="max-w-md">
                  <h3 className="text-sm font-semibold text-zinc-300">
                    No Timeline Beats Match Filters
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Try adjusting the character, location, or time-type filter options above.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
                {activeNodes.map((node, index) => {
                  const isFlashback = node.timeType === 'flashback' || node.timeType === 'memory';
                  const isFlashforward = node.timeType === 'flashforward';
                  const isBackstory = node.timeType === 'backstory' || node.timeType === 'historical';

                  return (
                    <div 
                      key={node.id}
                      className="relative group transition-all"
                    >
                      {/* Timeline Node Dot */}
                      <div 
                        className={`absolute -left-[30px] sm:-left-[35px] top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                          isFlashback ? 'bg-amber-950 border-amber-400 text-amber-300' :
                          isFlashforward ? 'bg-purple-950 border-purple-400 text-purple-300' :
                          isBackstory ? 'bg-sky-950 border-sky-400 text-sky-300' :
                          'bg-zinc-900 border-indigo-500 text-indigo-400'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      </div>

                      {/* Main Node Card */}
                      <div 
                        className="rounded-xl border p-4.5 transition-all shadow-sm hover:shadow-md space-y-3"
                        style={{ 
                          backgroundColor: theme.pageBg,
                          borderColor: isFlashback ? '#f59e0b40' : isFlashforward ? '#a855f740' : theme.pageBorder,
                        }}
                      >
                        {/* Top Metadata Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center space-x-2">
                            {/* Sequence Badges */}
                            <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                              {viewMode === 'manuscript' ? `Order #${node.manuscriptOrder}` : `Chronology #${node.chronologicalOrder}`}
                            </span>

                            {node.actTitle && (
                              <span className="text-zinc-400 font-medium">
                                {node.actTitle}
                              </span>
                            )}

                            {node.chapterTitle && (
                              <span className="text-zinc-300 font-semibold">
                                • {node.chapterTitle}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {getTimeTypeBadge(node.timeType, node.timelineDate)}

                            <button
                              onClick={() => handleOpenEdit(node)}
                              className="px-2 py-0.5 rounded text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-700/40 transition-colors"
                              title="Edit chronological date & time type"
                            >
                              Edit Time
                            </button>
                          </div>
                        </div>

                        {/* Title & Dramatic Synopsis */}
                        <div>
                          <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                            <span>{node.title}</span>
                            {node.wordCount && (
                              <span className="text-[10px] font-normal text-zinc-500 font-mono">
                                ({node.wordCount} words)
                              </span>
                            )}
                          </h3>

                          {node.synopsis && (
                            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                              {node.synopsis}
                            </p>
                          )}
                        </div>

                        {/* Entities Ribbon: POV, Cast, Locations, Threads */}
                        <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* POV Character */}
                            {node.povCharacter && (
                              <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium">
                                <User className="w-3 h-3" />
                                <span>POV: {node.povCharacter.name}</span>
                              </div>
                            )}

                            {/* Participating Characters */}
                            {node.characters.filter(c => c.id !== node.povCharacter?.id).map(c => (
                              <span 
                                key={c.id} 
                                className="px-2 py-0.5 rounded bg-zinc-800/70 border border-zinc-700/50 text-zinc-300 text-[11px]"
                              >
                                {c.name}
                              </span>
                            ))}

                            {/* Locations */}
                            {node.locations.map(l => (
                              <div 
                                key={l.id} 
                                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>{l.name}</span>
                              </div>
                            ))}

                            {/* Plot Threads */}
                            {node.plotThreads.map(t => (
                              <div 
                                key={t.id} 
                                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px]"
                              >
                                <GitBranch className="w-3 h-3" />
                                <span>{t.title}</span>
                              </div>
                            ))}
                          </div>

                          {/* Jump to Manuscript Editor */}
                          <button
                            onClick={() => handleJumpToEditor(node)}
                            className="px-3 py-1 rounded-md text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center space-x-1.5 shrink-0 ml-auto"
                          >
                            <span>Open in Editor</span>
                            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 3: DUAL COMPARISON (Manuscript vs Chronology)                   */}
        {/* ========================================================================= */}
        {viewMode === 'comparison' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div 
              className="p-4 rounded-xl border flex items-center justify-between"
              style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                  <SplitSquareVertical className="w-4 h-4 text-indigo-400" />
                  <span>Dual-Perspective Chronology Alignment</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Compares the reader's sequence of discovery against the objective chronological universe order.
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1.5 text-zinc-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Manuscript Track</span>
                </div>
                <div className="flex items-center space-x-1.5 text-zinc-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Chronology Track</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Manuscript Order */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>1. Manuscript Reading Sequence</span>
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    {timelineData.manuscriptNodes.length} beats
                  </span>
                </div>

                <div className="space-y-3">
                  {timelineData.manuscriptNodes.map((node, i) => (
                    <div 
                      key={node.id}
                      onClick={() => handleJumpToEditor(node)}
                      className="p-3.5 rounded-lg border bg-zinc-900/60 hover:bg-zinc-800/80 cursor-pointer transition-all space-y-1.5"
                      style={{ borderColor: theme.pageBorder }}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-indigo-400">
                          #{node.manuscriptOrder} • Ch {node.chapterNumber || ''}
                        </span>
                        {getTimeTypeBadge(node.timeType, node.timelineDate)}
                      </div>
                      <div className="text-xs font-bold text-zinc-200 truncate">
                        {node.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>{node.povCharacter ? `POV: ${node.povCharacter.name}` : (node.locations[0]?.name || 'Scene')}</span>
                        <span className="font-mono text-zinc-500">In-Universe: #{node.chronologicalOrder}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Story Chronology */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>2. True In-Universe Chronology</span>
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    {timelineData.chronologyNodes.length} beats
                  </span>
                </div>

                <div className="space-y-3">
                  {timelineData.chronologyNodes.map((node, i) => (
                    <div 
                      key={node.id}
                      onClick={() => handleJumpToEditor(node)}
                      className="p-3.5 rounded-lg border bg-zinc-900/60 hover:bg-zinc-800/80 cursor-pointer transition-all space-y-1.5"
                      style={{ 
                        borderColor: node.isNonLinear ? '#f59e0b50' : theme.pageBorder,
                      }}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-amber-400">
                          Time Step #{node.chronologicalOrder}
                        </span>
                        {getTimeTypeBadge(node.timeType, node.timelineDate)}
                      </div>
                      <div className="text-xs font-bold text-zinc-200 truncate">
                        {node.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>{node.povCharacter ? `POV: ${node.povCharacter.name}` : (node.locations[0]?.name || 'Scene')}</span>
                        <span className="font-mono text-indigo-400 font-semibold">Told in Chapter {node.chapterNumber || '?'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QUICK TIME EDIT MODAL */}
      {editingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div 
            className="w-full max-w-md rounded-lg border p-5 space-y-4 shadow-xl"
            style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-zinc-100 font-bold text-sm">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span>Edit In-Universe Chronology</span>
              </div>
              <button 
                onClick={() => setEditingNode(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-zinc-200">
                {editingNode.title}
              </div>
              <div className="text-[11px] text-zinc-400">
                Manuscript Order #{editingNode.manuscriptOrder} • Chapter {editingNode.chapterNumber || ''}
              </div>
            </div>

            {/* Time Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Timeline Classification:
              </label>
              <select
                value={editTimeType}
                onChange={e => setEditTimeType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                <option value="present">Present Day Narrative</option>
                <option value="flashback">Flashback (Narrated later)</option>
                <option value="flashforward">Flashforward (Future vision)</option>
                <option value="memory">Character Memory / Reminiscence</option>
                <option value="backstory">Historical Backstory</option>
              </select>
            </div>

            {/* In-Universe Date String */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                In-Universe Chronological Timestamp / Era:
              </label>
              <input
                type="text"
                value={editDateStr}
                onChange={e => setEditDateStr(e.target.value)}
                placeholder="e.g. Year 1042, Day 3, 14 years earlier, Dawn..."
                className="w-full text-xs p-2.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
              <p className="text-[11px] text-zinc-500">
                Numeric values (e.g. 1042 or -500) will automatically order the true timeline.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setEditingNode(null)}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-900 shadow-xs"
              >
                Save Timeline Position
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isCreatingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div 
            className="w-full max-w-md rounded-lg border p-5 space-y-4 shadow-xl"
            style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-zinc-100 font-bold text-sm">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Add Timeline Event</span>
              </div>
              <button 
                onClick={() => setIsCreatingEvent(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            {/* Event Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Event Title:
              </label>
              <input
                type="text"
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                placeholder="e.g. The Siege of Oakhaven, The Crown Jewel Robbery..."
                className="w-full text-xs p-2.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                autoFocus
              />
            </div>

            {/* Event Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Dramatic Summary / Narrative Beat:
              </label>
              <textarea
                value={newEventSummary}
                onChange={e => setNewEventSummary(e.target.value)}
                rows={2}
                placeholder="Brief summary of what transpired..."
                className="w-full text-xs p-2.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            {/* Event Type Classification */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Event Classification:
              </label>
              <select
                value={newEventType}
                onChange={e => setNewEventType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                <option value="historical">Historical Landmark (World History)</option>
                <option value="backstory">Backstory Turning Point</option>
                <option value="world-event">World Event / War / Treaty</option>
                <option value="scene-event">Scene-Specific Event</option>
              </select>
            </div>

            {/* In-Universe Date String */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                In-Universe Chronological Timestamp / Era:
              </label>
              <input
                type="text"
                value={newEventDateStr}
                onChange={e => setNewEventDateStr(e.target.value)}
                placeholder="e.g. Year 1042, Day 3, 14 years earlier, 400 BCE..."
                className="w-full text-xs p-2.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsCreatingEvent(false)}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewEvent}
                disabled={!newEventTitle.trim()}
                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-xs"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
