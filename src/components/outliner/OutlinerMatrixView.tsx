import React, { useState } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { 
  LayoutGrid, Table as TableIcon, Plus, User, FileText, CheckCircle2, 
  Clock, Flame, ArrowUpDown, ChevronRight, ChevronDown, Edit3, Trash2, Scissors,
  Layers, Filter, MoveRight, MapPin, GitBranch
} from 'lucide-react';
import { Chapter, Scene } from '../../types';

export const OutlinerMatrixView: React.FC = () => {
  const { 
    project, activeChapterId, activeSceneId, setActiveChapterId, setActiveSceneId, setActiveTab,
    updateChapterMetadata, updateScene, addNewChapter, addScene, deleteChapterToCutDrawer,
    setOrganizerModalOpen
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const [viewMode, setViewMode] = useState<'matrix' | 'corkboard'>('matrix');
  const [corkboardScope, setCorkboardScope] = useState<'chapters' | 'scenes'>('chapters');
  const [expandedChapterRows, setExpandedChapterRows] = useState<Record<string, boolean>>({});
  const [selectedActId, setSelectedActId] = useState<string>('all');
  const [filterPov, setFilterPov] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const toggleChapterRow = (chapterId: string) => {
    setExpandedChapterRows(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const allChaptersWithAct: { chapter: Chapter; actTitle: string; actId: string }[] = [];
  project.acts.forEach(act => {
    act.chapters.forEach(ch => {
      allChaptersWithAct.push({ chapter: ch, actTitle: act.title, actId: act.id });
    });
  });

  const filteredItems = allChaptersWithAct.filter(({ chapter, actId }) => {
    if (selectedActId !== 'all' && actId !== selectedActId) return false;
    if (filterPov !== 'all' && chapter.povCharacterId !== filterPov) return false;
    if (filterStatus !== 'all' && chapter.status !== filterStatus) return false;
    return true;
  });

  const totalWords = project.metadata.currentWordCount;
  const avgWords = allChaptersWithAct.length > 0 ? Math.round(totalWords / allChaptersWithAct.length) : 0;

  const handleOpenChapter = (chapterId: string, sceneId?: string) => {
    setActiveChapterId(chapterId);
    if (sceneId) {
      setActiveSceneId(sceneId);
    }
    setActiveTab('editor');
  };

  const getStatusBadge = (status: Chapter['status'] | Scene['status'] | string) => {
    switch (status) {
      case 'final':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300 bg-zinc-800 border border-zinc-700">Final</span>;
      case 'revised':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300 bg-zinc-800/80 border border-zinc-700">Revised</span>;
      case 'in-progress':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">Drafting</span>;
      case 'cut':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-red-400 bg-red-950/40 border border-red-900/60">Cut</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800">Draft</span>;
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden select-none font-sans"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Top Toolbar */}
      <div 
        className="h-11 border-b px-5 flex items-center justify-between shrink-0"
        style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-medium text-xs text-zinc-200">
            <span>Manuscript Outliner</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              ({filteredItems.length} chapters)
            </span>
          </div>

          <div className="h-3.5 w-[1px] bg-zinc-800" />

          {/* View Mode Toggle: Matrix vs Corkboard */}
          <div className="flex rounded p-0.5 bg-zinc-900 border" style={{ borderColor: theme.pageBorder }}>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2 py-0.5 rounded text-xs flex items-center space-x-1 transition-colors ${
                viewMode === 'matrix' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('corkboard')}
              className={`px-2 py-0.5 rounded text-xs flex items-center space-x-1 transition-colors ${
                viewMode === 'corkboard' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Corkboard</span>
            </button>
          </div>

          {/* Corkboard Scope Toggle */}
          {viewMode === 'corkboard' && (
            <div className="flex rounded p-0.5 bg-zinc-900 border" style={{ borderColor: theme.pageBorder }}>
              <button
                onClick={() => setCorkboardScope('chapters')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  corkboardScope === 'chapters' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Chapters
              </button>
              <button
                onClick={() => setCorkboardScope('scenes')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  corkboardScope === 'scenes' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Scenes
              </button>
            </div>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Act/Folder filter */}
          <select
            value={selectedActId}
            onChange={(e) => setSelectedActId(e.target.value)}
            className="bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
          >
            <option value="all">All Folders</option>
            {project.acts.map(act => (
              <option key={act.id} value={act.id}>{act.title}</option>
            ))}
          </select>

          {/* POV Filter */}
          <select
            value={filterPov}
            onChange={(e) => setFilterPov(e.target.value)}
            className="bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
          >
            <option value="all">All POVs</option>
            {project.characters.map(char => (
              <option key={char.id} value={char.id}>POV: {char.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in-progress">In Progress</option>
            <option value="revised">Revised</option>
            <option value="final">Final</option>
          </select>

          <button
            onClick={() => setOrganizerModalOpen(true)}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Layers className="w-3 h-3 text-zinc-400" />
            <span>Curate</span>
          </button>

          <button
            onClick={() => addNewChapter()}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-xs font-medium flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>+ Chapter</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Bar */}
      <div 
        className="px-5 py-2 border-b bg-zinc-950/40 flex items-center justify-between text-[11px] text-zinc-400"
        style={{ borderColor: theme.pageBorder }}
      >
        <div className="flex items-center space-x-4">
          <span>Total Words: <strong className="text-zinc-200">{totalWords.toLocaleString()}</strong></span>
          <span>•</span>
          <span>Avg Chapter: <strong className="text-zinc-200">{avgWords.toLocaleString()} words</strong></span>
          <span>•</span>
          <span>Target: <strong className="text-zinc-200">{project.metadata.targetWordCount.toLocaleString()} words</strong> ({Math.round((totalWords / project.metadata.targetWordCount) * 100)}%)</span>
        </div>
        <span className="text-zinc-500 italic">Double-click any row or card to open in editor</span>
      </div>

      {/* VIEW A: MATRIX SPREADSHEET TABLE */}
      {viewMode === 'matrix' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-lg border overflow-hidden shadow-xs" style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-zinc-900/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider" style={{ borderColor: theme.pageBorder }}>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Item / Scene Title</th>
                  <th className="py-2.5 px-3 w-32">Folder / Section</th>
                  <th className="py-2.5 px-3 w-32">POV Character</th>
                  <th className="py-2.5 px-3 w-24">Status</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Plot Threads</th>
                  <th className="py-2.5 px-3 w-20 text-right">Words</th>
                  <th className="py-2.5 px-3">Synopsis / Core Beat</th>
                  <th className="py-2.5 px-3 w-14 text-center">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredItems.map(({ chapter, actTitle }, index) => {
                  const povChar = project.characters.find(c => c.id === chapter.povCharacterId);
                  const isExpanded = expandedChapterRows[chapter.id] ?? true;
                  const hasScenes = chapter.scenes && chapter.scenes.length > 0;

                  const chapterThreads = (project.plotThreads || []).filter(t =>
                    (chapter.plotThreadIds || []).includes(t.id) ||
                    (chapter.scenes || []).some(s => (s.plotThreadIds || []).includes(t.id) || (t.relatedSceneIds || []).includes(s.id)) ||
                    (t.relatedSceneIds || []).includes(`scene-${chapter.id}`)
                  );

                  return (
                    <React.Fragment key={chapter.id}>
                      {/* Chapter Row */}
                      <tr 
                        onDoubleClick={() => handleOpenChapter(chapter.id)}
                        className="hover:bg-zinc-800/40 transition-colors group cursor-pointer bg-zinc-900/30 font-medium"
                      >
                        {/* # Number / Expand */}
                        <td className="py-2 px-3 text-center text-zinc-400 font-mono text-[11px]">
                          <div className="flex items-center justify-center space-x-1">
                            {hasScenes ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleChapterRow(chapter.id);
                                }}
                                className="p-0.5 text-zinc-500 hover:text-zinc-300 rounded"
                              >
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </button>
                            ) : (
                              <span className="w-3" />
                            )}
                            <span>{index + 1}</span>
                          </div>
                        </td>

                        {/* Title (Inline editable) */}
                        <td className="py-2 px-3 font-semibold text-zinc-100">
                          <input
                            type="text"
                            value={chapter.title}
                            onChange={(e) => updateChapterMetadata(chapter.id, { title: e.target.value })}
                            className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 text-xs text-zinc-100 outline-none w-full py-0.5"
                          />
                        </td>

                        {/* Folder / Arc */}
                        <td className="py-2 px-3 text-zinc-400 text-[11px] truncate">
                          {actTitle}
                        </td>

                        {/* POV Selector */}
                        <td className="py-2 px-3">
                          <select
                            value={chapter.povCharacterId || ''}
                            onChange={(e) => updateChapterMetadata(chapter.id, { povCharacterId: e.target.value })}
                            className="bg-[#121215] border border-zinc-700/80 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 outline-none w-full"
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="">(Unassigned)</option>
                            {project.characters.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Status Selector */}
                        <td className="py-2 px-3">
                          <select
                            value={chapter.status}
                            onChange={(e) => updateChapterMetadata(chapter.id, { status: e.target.value as any })}
                            className="bg-[#121215] border border-zinc-700/80 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 outline-none w-full"
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="draft">Draft</option>
                            <option value="in-progress">In Progress</option>
                            <option value="revised">Revised</option>
                            <option value="final">Final</option>
                          </select>
                        </td>

                        {/* Plot Threads Column */}
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {chapterThreads.map(t => (
                              <span
                                key={t.id}
                                className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center space-x-1 shrink-0"
                                title={`${t.title} (${t.type})`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color || '#6366F1' }} />
                                <span className="truncate max-w-[80px]">{t.title}</span>
                              </span>
                            ))}
                            {chapterThreads.length === 0 && (
                              <span className="text-zinc-600 text-[10px] italic">—</span>
                            )}
                          </div>
                        </td>

                        {/* Word Count */}
                        <td className="py-2 px-3 text-right font-mono text-[11px] text-zinc-300 font-semibold">
                          {chapter.wordCount.toLocaleString()}
                        </td>

                        {/* Synopsis (Inline editable) */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={chapter.synopsis || ''}
                            placeholder="Brief description or conflict..."
                            onChange={(e) => updateChapterMetadata(chapter.id, { synopsis: e.target.value })}
                            className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 text-[11px] text-zinc-300 placeholder-zinc-600 outline-none w-full py-0.5 truncate"
                            onClick={e => e.stopPropagation()}
                          />
                        </td>

                        {/* Open Button */}
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleOpenChapter(chapter.id)}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            title="Open in Editor"
                          >
                            <MoveRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Nested Scene Rows */}
                      {hasScenes && isExpanded && chapter.scenes?.map((scene, sIdx) => {
                        const scenePovChar = project.characters.find(c => c.id === scene.povCharacterId);
                        const sceneThreads = (project.plotThreads || []).filter(t =>
                          (scene.plotThreadIds || []).includes(t.id) || (t.relatedSceneIds || []).includes(scene.id)
                        );

                        return (
                          <tr 
                            key={scene.id}
                            onDoubleClick={() => handleOpenChapter(chapter.id, scene.id)}
                            className="hover:bg-zinc-800/20 transition-colors group cursor-pointer bg-zinc-950/20 text-zinc-400"
                          >
                            {/* Scene Index */}
                            <td className="py-1.5 px-3 text-right pr-4 text-zinc-600 font-mono text-[10px]">
                              {index + 1}.{sIdx + 1}
                            </td>

                            {/* Scene Title */}
                            <td className="py-1.5 px-3 pl-6 text-zinc-300">
                              <div className="flex items-center space-x-2">
                                <span className="text-zinc-600 text-[10px]">↳</span>
                                <input
                                  type="text"
                                  value={scene.title || `Scene ${sIdx + 1}`}
                                  onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                                  className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 text-[11px] text-zinc-200 outline-none w-full py-0.5"
                                  onClick={e => e.stopPropagation()}
                                />
                              </div>
                            </td>

                            {/* Location / Context */}
                            <td className="py-1.5 px-3 text-zinc-500 text-[10px] truncate">
                              {scene.locationIds && scene.locationIds.length > 0 ? (
                                <span className="flex items-center space-x-1">
                                  <MapPin className="w-2.5 h-2.5 text-zinc-500" />
                                  <span>{project.locations?.find(l => scene.locationIds?.includes(l.id))?.name || 'Location'}</span>
                                </span>
                              ) : (
                                <span className="italic text-zinc-600">—</span>
                              )}
                            </td>

                            {/* Scene POV Selector */}
                            <td className="py-1.5 px-3">
                              <select
                                value={scene.povCharacterId || ''}
                                onChange={(e) => updateScene(scene.id, { povCharacterId: e.target.value })}
                                className="bg-[#121215]/80 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 outline-none w-full"
                                onClick={e => e.stopPropagation()}
                              >
                                <option value="">(Inherit Chapter POV)</option>
                                {project.characters.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </td>

                            {/* Scene Status Selector */}
                            <td className="py-1.5 px-3">
                              <select
                                value={scene.status}
                                onChange={(e) => updateScene(scene.id, { status: e.target.value as any })}
                                className="bg-[#121215]/80 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 outline-none w-full"
                                onClick={e => e.stopPropagation()}
                              >
                                <option value="draft">Draft</option>
                                <option value="in-progress">In Progress</option>
                                <option value="revised">Revised</option>
                                <option value="final">Final</option>
                              </select>
                            </td>

                            {/* Scene Plot Threads */}
                            <td className="py-1.5 px-3">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {sceneThreads.map(t => (
                                  <span
                                    key={t.id}
                                    className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-900/80 border border-zinc-800 text-zinc-400 flex items-center space-x-1 shrink-0"
                                    title={`${t.title} (${t.type})`}
                                  >
                                    <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: t.color || '#6366F1' }} />
                                    <span className="truncate max-w-[70px]">{t.title}</span>
                                  </span>
                                ))}
                                {sceneThreads.length === 0 && (
                                  <span className="text-zinc-700 text-[10px] italic">—</span>
                                )}
                              </div>
                            </td>

                            {/* Scene Word Count */}
                            <td className="py-1.5 px-3 text-right font-mono text-[10px] text-zinc-500">
                              {scene.wordCount.toLocaleString()}
                            </td>

                            {/* Scene Synopsis / Dramatic Goal */}
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={scene.synopsis || scene.goal || ''}
                                placeholder="Scene goal / outcome..."
                                onChange={(e) => updateScene(scene.id, { synopsis: e.target.value })}
                                className="bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 text-[10px] text-zinc-400 placeholder-zinc-700 outline-none w-full py-0.5 truncate"
                                onClick={e => e.stopPropagation()}
                              />
                            </td>

                            {/* Open Scene Button */}
                            <td className="py-1.5 px-3 text-center">
                              <button
                                onClick={() => handleOpenChapter(chapter.id, scene.id)}
                                className="p-0.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                                title="Open Scene in Editor"
                              >
                                <MoveRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW B: CORKBOARD INDEX CARDS */}
      {viewMode === 'corkboard' && (
        <div className="flex-1 overflow-auto p-5 space-y-6">
          {project.acts
            .filter(act => selectedActId === 'all' || act.id === selectedActId)
            .map(act => (
              <div key={act.id} className="space-y-3">
                <div className="flex items-center space-x-2 border-b pb-1.5" style={{ borderColor: theme.pageBorder }}>
                  <h3 className="font-semibold text-xs text-zinc-300 uppercase tracking-wider">{act.title}</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    ({corkboardScope === 'chapters' 
                      ? `${act.chapters.length} chapters` 
                      : `${act.chapters.reduce((sum, c) => sum + (c.scenes?.length || 1), 0)} scenes`})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {corkboardScope === 'chapters' ? (
                    act.chapters
                      .filter(c => {
                        if (filterPov !== 'all' && c.povCharacterId !== filterPov) return false;
                        if (filterStatus !== 'all' && c.status !== filterStatus) return false;
                        return true;
                      })
                      .map((ch, idx) => {
                        const povChar = project.characters.find(c => c.id === ch.povCharacterId);
                        const chThreads = (project.plotThreads || []).filter(t =>
                          (ch.plotThreadIds || []).includes(t.id) ||
                          (ch.scenes || []).some(s => (s.plotThreadIds || []).includes(t.id) || (t.relatedSceneIds || []).includes(s.id)) ||
                          (t.relatedSceneIds || []).includes(`scene-${ch.id}`)
                        );

                        return (
                          <div
                            key={ch.id}
                            onDoubleClick={() => handleOpenChapter(ch.id)}
                            className="rounded-lg border p-3.5 space-y-2.5 shadow-sm hover:shadow-md hover:border-zinc-600 transition-all cursor-pointer flex flex-col justify-between group"
                            style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-zinc-500">#{idx + 1}</span>
                                {getStatusBadge(ch.status)}
                              </div>

                              <h4 className="font-semibold text-xs text-zinc-200 line-clamp-1 group-hover:text-zinc-100 transition-colors">
                                {ch.title}
                              </h4>

                              <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                                {ch.synopsis || 'No synopsis added yet. Double-click to write.'}
                              </p>

                              {chThreads.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {chThreads.slice(0, 3).map(t => (
                                    <span key={t.id} className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center space-x-1">
                                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: t.color || '#6366F1' }} />
                                      <span className="truncate max-w-[70px]">{t.title}</span>
                                    </span>
                                  ))}
                                  {chThreads.length > 3 && (
                                    <span className="text-[9px] text-zinc-500 font-mono">+{chThreads.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t flex items-center justify-between text-[10px] text-zinc-500" style={{ borderColor: theme.pageBorder }}>
                              <span className="truncate max-w-[100px]">
                                {povChar ? `POV: ${povChar.name.split(' ')[0]}` : 'No POV'}
                              </span>
                              <span className="font-mono">{ch.wordCount.toLocaleString()}w</span>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    act.chapters.flatMap((ch, chIdx) => 
                      (ch.scenes || []).map((sc, scIdx) => {
                        const scPov = project.characters.find(c => c.id === sc.povCharacterId) || project.characters.find(c => c.id === ch.povCharacterId);
                        const scLoc = project.locations?.find(l => sc.locationIds?.includes(l.id));
                        const scThreads = (project.plotThreads || []).filter(t =>
                          (sc.plotThreadIds || []).includes(t.id) || (t.relatedSceneIds || []).includes(sc.id)
                        );

                        return (
                          <div
                            key={sc.id}
                            onDoubleClick={() => handleOpenChapter(ch.id, sc.id)}
                            className="rounded-lg border p-3.5 space-y-2.5 shadow-sm hover:shadow-md hover:border-zinc-600 transition-all cursor-pointer flex flex-col justify-between group"
                            style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-zinc-500">{chIdx + 1}.{scIdx + 1} · {ch.title}</span>
                                {getStatusBadge(sc.status)}
                              </div>

                              <h4 className="font-semibold text-xs text-zinc-200 line-clamp-1 group-hover:text-zinc-100 transition-colors">
                                {sc.title || `Scene ${scIdx + 1}`}
                              </h4>

                              <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                                {sc.synopsis || sc.goal || 'No synopsis added yet. Double-click to edit.'}
                              </p>

                              {scThreads.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {scThreads.slice(0, 3).map(t => (
                                    <span key={t.id} className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center space-x-1">
                                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: t.color || '#6366F1' }} />
                                      <span className="truncate max-w-[70px]">{t.title}</span>
                                    </span>
                                  ))}
                                  {scThreads.length > 3 && (
                                    <span className="text-[9px] text-zinc-500 font-mono">+{scThreads.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t flex items-center justify-between text-[10px] text-zinc-500" style={{ borderColor: theme.pageBorder }}>
                              <div className="flex items-center space-x-2 truncate">
                                {scPov && (
                                  <span className="truncate max-w-[80px]">
                                    POV: {scPov.name.split(' ')[0]}
                                  </span>
                                )}
                                {scLoc && (
                                  <span className="truncate max-w-[70px] text-zinc-500">
                                    📍 {scLoc.name}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono">{sc.wordCount.toLocaleString()}w</span>
                            </div>
                          </div>
                        );
                      })
                    )
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
