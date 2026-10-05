import React, { useState } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { StoryEngineQueries } from '../../engine';
import { 
  GitBranch, Plus, Search, Filter, AlertCircle, CheckCircle2, 
  Clock, ArrowRight, User, Eye, Edit3, Trash2, ChevronRight, 
  ExternalLink, Zap, HelpCircle, Layers, Flame, BookOpen,
  Check, X, Link, Tag
} from 'lucide-react';
import { PlotThread, PlotThreadType, PlotThreadStatus, Character } from '../../types';

const THREAD_TYPES: { id: PlotThreadType; label: string; color: string; desc: string }[] = [
  { id: 'main-plot', label: 'Main plot', color: '#6366F1', desc: 'Central dramatic spine of the narrative' },
  { id: 'subplot', label: 'Subplot', color: '#38BDF8', desc: 'Secondary story thread supporting main arc' },
  { id: 'mystery', label: 'Mystery', color: '#A855F7', desc: 'Unanswered riddle, crime, or hidden truth' },
  { id: 'romance', label: 'Romance', color: '#F43F5E', desc: 'Relationship dynamics and emotional stakes' },
  { id: 'character-arc', label: 'Character arc', color: '#10B981', desc: 'Internal transformation / lie vs truth' },
  { id: 'foreshadowing', label: 'Foreshadowing', color: '#F59E0B', desc: 'Subtle clues or promises of future events' },
  { id: 'conflict', label: 'Conflict', color: '#EF4444', desc: 'Antagonistic clash or escalating obstacle' },
  { id: 'custom', label: 'Custom', color: '#EC4899', desc: 'Bespoke narrative strand' },
];

const THREAD_STATUSES: { id: PlotThreadStatus; label: string; badgeClass: string }[] = [
  { id: 'setup', label: 'Setup', badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700 font-mono text-[10px]' },
  { id: 'active', label: 'Active', badgeClass: 'bg-zinc-800 text-zinc-200 border-zinc-700 font-mono text-[10px]' },
  { id: 'dormant', label: 'Dormant', badgeClass: 'bg-zinc-900 text-amber-400/90 border-zinc-800 font-mono text-[10px]' },
  { id: 'payoff-pending', label: 'Payoff Pending', badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700 font-mono text-[10px]' },
  { id: 'resolved', label: 'Resolved', badgeClass: 'bg-zinc-900 text-zinc-400 border-zinc-800 font-mono text-[10px]' },
];

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#38BDF8', // Sky
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#EAB308', // Yellow
  '#94A3B8', // Slate
];

export const PlotThreadsWorkspace: React.FC = () => {
  const { 
    project, activeChapterId, setActiveChapterId, setActiveTab,
    addPlotThread, updatePlotThread, deletePlotThread,
    toggleThreadChapterLink
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const matrixData = StoryEngineQueries.getPlotThreadMatrix(project);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCharacter, setFilterCharacter] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'matrix' | 'cards'>('matrix');

  // Drawer / Modal states
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  // New Thread Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<PlotThreadType>('subplot');
  const [newStatus, setNewStatus] = useState<PlotThreadStatus>('active');
  const [newColor, setNewColor] = useState('#38BDF8');
  const [newDescription, setNewDescription] = useState('');
  const [newExpectedPayoff, setNewExpectedPayoff] = useState('');
  const [newSelectedCharacters, setNewSelectedCharacters] = useState<string[]>([]);
  const [newSelectedChapters, setNewSelectedChapters] = useState<string[]>([]);

  // Filtered rows
  const filteredRows = matrixData.rows.filter(({ thread }) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = thread.title.toLowerCase().includes(q);
      const matchDesc = (thread.description || '').toLowerCase().includes(q);
      const matchPayoff = (thread.expectedPayoff || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchPayoff) return false;
    }
    if (filterType !== 'all' && thread.type !== filterType) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'dormant') {
        const isActuallyDormant = thread.status === 'dormant' || matrixData.rows.find(r => r.thread.id === thread.id)?.isDormant;
        if (!isActuallyDormant) return false;
      } else if (thread.status !== filterStatus) {
        return false;
      }
    }
    if (filterCharacter !== 'all' && !(thread.relatedCharacterIds || []).includes(filterCharacter)) {
      return false;
    }
    return true;
  });

  const selectedThread = project.plotThreads?.find(t => t.id === selectedThreadId);

  const handleNavigateToChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setActiveTab('editor');
  };

  const handleCreateNewThread = () => {
    if (!newTitle.trim()) return;

    const created = addPlotThread({
      title: newTitle.trim(),
      type: newType,
      status: newStatus,
      color: newColor,
      description: newDescription.trim(),
      expectedPayoff: newExpectedPayoff.trim(),
      relatedCharacterIds: newSelectedCharacters,
      relatedSceneIds: newSelectedChapters.map(chId => `scene-${chId}`),
      introducedIn: newSelectedChapters[0] || undefined,
      lastTouchedIn: newSelectedChapters[newSelectedChapters.length - 1] || undefined,
    });

    // Also link selected chapters
    newSelectedChapters.forEach(chId => {
      toggleThreadChapterLink(created.id, chId);
    });

    // Reset
    setNewTitle('');
    setNewDescription('');
    setNewExpectedPayoff('');
    setNewSelectedCharacters([]);
    setNewSelectedChapters([]);
    setIsCreatingThread(false);
    setSelectedThreadId(created.id);
  };

  const getTypeInfo = (type: PlotThreadType) => {
    return THREAD_TYPES.find(t => t.id === type) || {
      id: type,
      label: type,
      color: '#94A3B8',
      desc: ''
    };
  };

  const getStatusBadge = (status: PlotThreadStatus) => {
    const s = THREAD_STATUSES.find(st => st.id === status) || {
      id: status,
      label: status,
      badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${s.badgeClass}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden select-none font-sans"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* 1. Header Toolbar */}
      <div 
        className="h-12 border-b px-5 flex items-center justify-between shrink-0"
        style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-xs text-zinc-200">Plot Threads</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {filteredRows.length} of {matrixData.totalThreads}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* View switcher */}
          <div className="flex rounded p-0.5 bg-zinc-900 border" style={{ borderColor: theme.pageBorder }}>
            <button
              onClick={() => setViewLayout('matrix')}
              className={`px-2.5 py-0.5 rounded text-xs flex items-center space-x-1 transition-colors ${
                viewLayout === 'matrix' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Matrix Timeline</span>
            </button>
            <button
              onClick={() => setViewLayout('cards')}
              className={`px-2.5 py-0.5 rounded text-xs flex items-center space-x-1 transition-colors ${
                viewLayout === 'cards' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Dossiers</span>
            </button>
          </div>
        </div>

        {/* Right Filter & Action Bar */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search threads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#121215] border border-zinc-700/80 rounded pl-7 pr-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 outline-none w-36 sm:w-48 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#121215] border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
          >
            <option value="all">All Types</option>
            {THREAD_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#121215] border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
          >
            <option value="all">All Statuses</option>
            {THREAD_STATUSES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* Character Filter */}
          <select
            value={filterCharacter}
            onChange={(e) => setFilterCharacter(e.target.value)}
            className="bg-[#121215] border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-300 outline-none hidden md:inline"
          >
            <option value="all">All Characters</option>
            {project.characters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Add Thread Button */}
          <button
            onClick={() => setIsCreatingThread(true)}
            className="px-3 py-1 rounded bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-medium flex items-center space-x-1 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Thread</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Status Ribbon */}
      <div 
        className="px-5 py-2 border-b bg-zinc-950/40 flex items-center justify-between text-[11px] text-zinc-400 shrink-0"
        style={{ borderColor: theme.pageBorder }}
      >
        <div className="flex items-center space-x-4">
          <span>Active: <strong className="text-indigo-400">{matrixData.activeCount}</strong></span>
          <span>•</span>
          <span>Dormant / In Gap: <strong className="text-amber-400">{matrixData.dormantCount}</strong></span>
          <span>•</span>
          <span>Resolved: <strong className="text-emerald-400">{matrixData.resolvedCount}</strong></span>
        </div>

        <div className="flex items-center space-x-3 text-[10px] text-zinc-500">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
            <span>● Touchpoint</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-zinc-500 inline-block" />
            <span>─ Continuity Span</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400/80 inline-block animate-pulse" />
            <span>Dormant Alert (&gt;3 ch gap)</span>
          </span>
        </div>
      </div>

      {/* 3. Main Content: Matrix or Cards */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIEW A: PRIMARY TIMELINE MATRIX GRID */}
        {viewLayout === 'matrix' && (
          <div className="flex-1 overflow-auto p-4">
            <div 
              className="rounded-lg border overflow-hidden shadow-xs min-w-max"
              style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
            >
              <table className="w-full text-left border-collapse text-xs">
                {/* Header Row: Chapter Columns */}
                <thead>
                  <tr 
                    className="border-b bg-zinc-900/90 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider"
                    style={{ borderColor: theme.pageBorder }}
                  >
                    {/* Fixed Thread Info Header */}
                    <th className="py-2.5 px-4 sticky left-0 z-20 bg-[#141418] min-w-[240px] max-w-[280px] border-r border-zinc-800">
                      Thread / Arc Title
                    </th>
                    <th className="py-2.5 px-2.5 w-24 text-center border-r border-zinc-800/80">
                      Status
                    </th>

                    {/* Dynamic Chapter Columns */}
                    {matrixData.columns.map((col) => (
                      <th 
                        key={col.chapterId}
                        onClick={() => handleNavigateToChapter(col.chapterId)}
                        className="py-2.5 px-2 text-center min-w-[48px] max-w-[70px] border-r border-zinc-800/40 hover:bg-zinc-800/60 cursor-pointer transition-colors group"
                        title={`Click to open "${col.chapterTitle}" (${col.wordCount}w)`}
                      >
                        <div className="text-[10px] font-mono font-medium text-zinc-300 group-hover:text-indigo-300">
                          Ch {col.chapterNumber}
                        </div>
                        <div className="text-[9px] text-zinc-500 font-normal truncate max-w-[60px] lowercase group-hover:text-zinc-300">
                          {col.chapterTitle}
                        </div>
                      </th>
                    ))}

                    {/* Payoff Column */}
                    <th className="py-2.5 px-3 min-w-[180px] text-left">
                      Expected Payoff / Climax
                    </th>
                  </tr>
                </thead>

                {/* Body Rows */}
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredRows.map(({ thread, cells, isDormant, dormantGapLength, relatedCharacters }) => {
                    const typeInfo = getTypeInfo(thread.type);
                    const threadColor = thread.color || typeInfo.color;
                    const isSelected = selectedThreadId === thread.id;

                    return (
                      <tr 
                        key={thread.id}
                        className={`hover:bg-zinc-800/20 transition-colors group ${
                          isSelected ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* 1. Left Sticky Thread Identity Column */}
                        <td 
                          className="py-2.5 px-4 sticky left-0 z-10 bg-[#141418] border-r border-zinc-800 cursor-pointer"
                          onClick={() => setSelectedThreadId(isSelected ? null : thread.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                              style={{ backgroundColor: threadColor }}
                            />

                            <div className="truncate flex-1">
                              <div className="font-medium text-zinc-200 text-xs truncate flex items-center space-x-1.5">
                                <span className="truncate">{thread.title}</span>
                                {isDormant && (
                                  <span 
                                    className="px-1.5 py-0.2 rounded text-[9px] bg-amber-950/80 text-amber-300 border border-amber-500/40 shrink-0 flex items-center space-x-0.5"
                                    title={`Thread hasn't appeared for ${dormantGapLength} chapters`}
                                  >
                                    <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse mr-0.5" />
                                    <span>{dormantGapLength}ch gap</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 text-[10px] text-zinc-500 mt-0.5">
                                <span className="capitalize">{typeInfo.label}</span>
                                {relatedCharacters.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">
                                      {relatedCharacters.map(c => c.name.split(' ')[0]).join(', ')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedThreadId(thread.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                              title="Edit Thread Details"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 2. Status Selector Cell */}
                        <td className="py-2 px-2 text-center border-r border-zinc-800/80">
                          <select
                            value={thread.status}
                            onChange={(e) => updatePlotThread(thread.id, { status: e.target.value as PlotThreadStatus })}
                            className="bg-transparent text-[10px] font-medium text-zinc-300 outline-none cursor-pointer text-center"
                          >
                            {THREAD_STATUSES.map(s => (
                              <option key={s.id} value={s.id} className="bg-[#18181c] text-zinc-200">
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 3. Horizontal Chapter Progression Points */}
                        {cells.map((cell) => {
                          const isTouch = cell.state === 'touchpoint';
                          const isSpan = cell.state === 'span';

                          return (
                            <td
                              key={cell.chapterId}
                              className="py-2 px-1 text-center border-r border-zinc-800/40 relative h-10 group/cell"
                            >
                              {/* Background Span Connector Line */}
                              {isSpan && (
                                <div 
                                  className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 opacity-60"
                                  style={{ backgroundColor: `${threadColor}66` }}
                                />
                              )}

                              {/* Active Touchpoint Point `●` */}
                              {isTouch ? (
                                <button
                                  onClick={() => handleNavigateToChapter(cell.chapterId)}
                                  className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 mx-auto group/dot"
                                  title={`Present in Chapter. Click to navigate directly to chapter in Editor.`}
                                >
                                  {/* Connector stub */}
                                  <div 
                                    className="absolute top-1/2 left-[-12px] right-[-12px] h-[2px] -translate-y-1/2 -z-10 opacity-60"
                                    style={{ backgroundColor: `${threadColor}88` }}
                                  />
                                  <div 
                                    className="w-3.5 h-3.5 rounded-full shadow-sm flex items-center justify-center border border-white/20"
                                    style={{ backgroundColor: threadColor }}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
                                  </div>
                                </button>
                              ) : (
                                /* Empty Cell — Subtle click to toggle link */
                                <button
                                  onClick={() => toggleThreadChapterLink(thread.id, cell.chapterId)}
                                  className="w-full h-full opacity-0 group-hover/cell:opacity-100 flex items-center justify-center text-zinc-600 hover:text-indigo-400 transition-opacity"
                                  title="Click to link thread to this chapter"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* 4. Payoff / Outcome Note */}
                        <td className="py-2 px-3 text-zinc-300 text-[11px] truncate max-w-[220px]">
                          <span 
                            className="cursor-pointer hover:underline truncate block"
                            onClick={() => setSelectedThreadId(thread.id)}
                            title={thread.expectedPayoff || 'No payoff planned yet. Click to define.'}
                          >
                            {thread.expectedPayoff || <span className="text-zinc-600 italic">Define payoff...</span>}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={matrixData.columns.length + 3} className="py-12 text-center text-zinc-500">
                        <GitBranch className="w-8 h-8 mx-auto text-zinc-600 mb-2 opacity-60" />
                        <p className="text-xs font-medium">No plot threads match your filter.</p>
                        <button
                          onClick={() => setIsCreatingThread(true)}
                          className="mt-2 text-xs text-indigo-400 hover:underline"
                        >
                          + Create your first Plot Thread
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW B: CARD DOSSIER VIEW */}
        {viewLayout === 'cards' && (
          <div className="flex-1 overflow-auto p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRows.map(({ thread, touchCount, isDormant, dormantGapLength, relatedCharacters }) => {
                const typeInfo = getTypeInfo(thread.type);
                const threadColor = thread.color || typeInfo.color;

                return (
                  <div
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className="rounded-lg border p-4 flex flex-col justify-between space-y-3 cursor-pointer hover:border-zinc-600 shadow-sm transition-all group"
                    style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: threadColor }} />
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
                            {typeInfo.label}
                          </span>
                        </div>
                        {getStatusBadge(thread.status)}
                      </div>

                      <h4 className="font-semibold text-xs text-zinc-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {thread.title}
                      </h4>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {thread.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Payoff Note */}
                    {thread.expectedPayoff && (
                      <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 text-[10px] space-y-0.5">
                        <span className="text-zinc-500 font-semibold uppercase tracking-wider block text-[9px]">Planned Payoff</span>
                        <p className="text-zinc-300 line-clamp-2">{thread.expectedPayoff}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t flex items-center justify-between text-[10px] text-zinc-500" style={{ borderColor: theme.pageBorder }}>
                      <span>{touchCount} chapter touchpoints</span>
                      {isDormant && (
                        <span className="text-amber-400 font-medium">⚠️ {dormantGapLength}ch dormant</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Thread Details / Edit Inspector Drawer */}
        {selectedThread && (
          <aside 
            className="w-80 border-l flex flex-col h-full bg-[#121215] shrink-0 z-30 shadow-lg animate-in slide-in-from-right duration-150"
            style={{ borderColor: theme.pageBorder }}
          >
            {/* Drawer Header */}
            <div className="p-3.5 border-b flex items-center justify-between" style={{ borderColor: theme.pageBorder }}>
              <div className="flex items-center space-x-2 truncate">
                <span 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: selectedThread.color || '#6366F1' }} 
                />
                <span className="font-semibold text-xs text-zinc-200 truncate">
                  {selectedThread.title}
                </span>
              </div>
              <button 
                onClick={() => setSelectedThreadId(null)}
                className="p-1 text-zinc-500 hover:text-zinc-200 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Drawer Form Fields */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-400">Thread Title</label>
                <input
                  type="text"
                  value={selectedThread.title}
                  onChange={(e) => updatePlotThread(selectedThread.id, { title: e.target.value })}
                  className="w-full bg-black/60 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-zinc-500"
                />
              </div>

              {/* Type & Status Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-zinc-400">Type</label>
                  <select
                    value={selectedThread.type}
                    onChange={(e) => updatePlotThread(selectedThread.id, { type: e.target.value as PlotThreadType })}
                    className="w-full bg-black/60 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 outline-none"
                  >
                    {THREAD_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-zinc-400">Status</label>
                  <select
                    value={selectedThread.status}
                    onChange={(e) => updatePlotThread(selectedThread.id, { status: e.target.value as PlotThreadStatus })}
                    className="w-full bg-black/60 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 outline-none"
                  >
                    {THREAD_STATUSES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color Palette Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-zinc-400">Timeline Color</label>
                <div className="flex items-center space-x-1.5">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updatePlotThread(selectedThread.id, { color: c })}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        selectedThread.color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Description / Reader Promise */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-400">Dramatic Question / Narrative Core</label>
                <textarea
                  rows={3}
                  value={selectedThread.description || ''}
                  placeholder="What question is posed? What promise is made to the reader?"
                  onChange={(e) => updatePlotThread(selectedThread.id, { description: e.target.value })}
                  className="w-full bg-black/60 border border-zinc-700 rounded p-2 text-xs text-zinc-200 outline-none focus:border-zinc-500 resize-none leading-relaxed"
                />
              </div>

              {/* Expected Payoff */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-400">Expected Payoff / Climax</label>
                <textarea
                  rows={2}
                  value={selectedThread.expectedPayoff || ''}
                  placeholder="Where and how will this thread resolve or peak?"
                  onChange={(e) => updatePlotThread(selectedThread.id, { expectedPayoff: e.target.value })}
                  className="w-full bg-black/60 border border-zinc-700 rounded p-2 text-xs text-zinc-200 outline-none focus:border-zinc-500 resize-none leading-relaxed"
                />
              </div>

              {/* Related Characters */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-zinc-400">Key Characters</label>
                <div className="flex flex-wrap gap-1.5">
                  {project.characters.map(char => {
                    const isLinked = (selectedThread.relatedCharacterIds || []).includes(char.id);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => {
                          const current = selectedThread.relatedCharacterIds || [];
                          const updated = isLinked
                            ? current.filter(id => id !== char.id)
                            : [...current, char.id];
                          updatePlotThread(selectedThread.id, { relatedCharacterIds: updated });
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] border transition-colors flex items-center space-x-1 ${
                          isLinked 
                            ? 'bg-zinc-800 border-zinc-600 text-zinc-100 font-medium' 
                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <User className="w-2.5 h-2.5" />
                        <span>{char.name}</span>
                        {isLinked && <Check className="w-2.5 h-2.5 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Linked Chapters Quick Toggles */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-zinc-400">Chapter Touchpoints</label>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded bg-black/40 border border-zinc-800">
                  {project.acts.flatMap(a => a.chapters).map((ch, idx) => {
                    const isLinked = (ch.plotThreadIds || []).includes(selectedThread.id) ||
                      (selectedThread.relatedSceneIds || []).some(sId => sId === `scene-${ch.id}` || (ch.scenes || []).some(s => s.id === sId));

                    return (
                      <div 
                        key={ch.id} 
                        className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-zinc-800/40 text-[11px]"
                      >
                        <span className="truncate flex-1 text-zinc-300 mr-2">
                          Ch {idx + 1}: {ch.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleThreadChapterLink(selectedThread.id, ch.id)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium border transition-colors ${
                            isLinked 
                              ? 'bg-zinc-200 text-zinc-900 border-zinc-300' 
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          {isLinked ? 'Active' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delete Button */}
              <div className="pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete plot thread "${selectedThread.title}"?`)) {
                      deletePlotThread(selectedThread.id);
                      setSelectedThreadId(null);
                    }
                  }}
                  className="w-full py-1.5 rounded text-red-400 hover:bg-red-950/40 border border-red-500/20 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Thread</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 5. Create Thread Modal */}
      {isCreatingThread && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md rounded-lg border p-5 space-y-4 shadow-xl animate-in zoom-in-95 duration-100"
            style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme.pageBorder }}>
              <div className="flex items-center space-x-2 font-semibold text-sm text-zinc-100">
                <GitBranch className="w-4 h-4 text-zinc-300" />
                <span>Create Plot Thread</span>
              </div>
              <button onClick={() => setIsCreatingThread(false)} className="p-1 text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-400">Thread Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. The King's Poison, Identity Truth, Cael's Redemption..."
                  autoFocus
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-zinc-400">Thread Type</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const t = e.target.value as PlotThreadType;
                      setNewType(t);
                      const tInfo = getTypeInfo(t);
                      if (tInfo) setNewColor(tInfo.color);
                    }}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 outline-none"
                  >
                    {THREAD_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-zinc-400">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as PlotThreadStatus)}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 outline-none"
                  >
                    {THREAD_STATUSES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-400">Color</label>
                <div className="flex items-center space-x-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        newColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-400">Narrative Question / Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What is at stake? What dramatic tension does this create?"
                  className="w-full bg-black border border-zinc-700 rounded p-2 text-xs text-zinc-200 outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-400">Expected Payoff</label>
                <input
                  type="text"
                  value={newExpectedPayoff}
                  onChange={(e) => setNewExpectedPayoff(e.target.value)}
                  placeholder="e.g. Climax in Act III, confrontation with Malric..."
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t" style={{ borderColor: theme.pageBorder }}>
              <button
                onClick={() => setIsCreatingThread(false)}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                disabled={!newTitle.trim()}
                onClick={handleCreateNewThread}
                className="px-3.5 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-900 disabled:opacity-50 text-xs font-semibold shadow-xs"
              >
                Create Thread
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
