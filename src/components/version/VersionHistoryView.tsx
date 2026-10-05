import React, { useState, useMemo, useEffect } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { 
  ManuscriptSnapshot, SnapshotType, SnapshotScope, SnapshotDiffResult, TextDiffSegment, DiffParagraph 
} from '../../types/snapshot';
import { 
  groupSnapshotsByTime, filterSnapshots, getSnapshotStats 
} from '../../engine/snapshot/queries';
import { diffWords } from '../../engine/snapshot/diff';
import { 
  History, Camera, Pin, Trash2, ArrowLeftRight, RotateCcw, 
  Search, Shield, Check, Clock, FileText, ChevronRight, X, Sparkles, BookOpen, AlertTriangle
} from 'lucide-react';

interface VersionHistoryViewProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const VersionHistoryView: React.FC<VersionHistoryViewProps> = ({ onClose, isModal = false }) => {
  const { 
    project, 
    createManualSnapshot, 
    restoreSnapshotById, 
    deleteSnapshotById, 
    toggleSnapshotPinned,
    compareWithSnapshot, activeChapterId, activeSceneId, setActiveChapterId, setActiveSceneId, setActiveTab
  } = useSwriteStore();

  const snapshots = useMemo(() => project.snapshots || [], [project.snapshots]);
  const stats = useMemo(() => getSnapshotStats(snapshots), [snapshots]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SnapshotType | 'all'>('all');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    snapshots.length > 0 ? snapshots[0].id : null
  );
  
  // Creation dialog state
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');
  const [newSnapshotDesc, setNewSnapshotDesc] = useState('');

  // Comparison state
  const [isComparing, setIsComparing] = useState(false);
  const [diffResult, setDiffResult] = useState<SnapshotDiffResult | null>(null);
  const [diffMode, setDiffMode] = useState<'inline' | 'side-by-side'>(() => (localStorage.getItem('swrite-diff-mode') as 'inline' | 'side-by-side') || 'inline');
  const [diffGranularity, setDiffGranularity] = useState<'paragraph' | 'word'>('paragraph');
  const [diffScope, setDiffScope] = useState<'manuscript' | 'chapter' | 'scene'>('manuscript');
  const [diffChapterId, setDiffChapterId] = useState(activeChapterId || '');
  const [diffSceneId, setDiffSceneId] = useState(activeSceneId || '');
  const [expandedParagraphs, setExpandedParagraphs] = useState<Set<string>>(new Set());

  // Restore confirmation modal
  const [confirmRestoreSnap, setConfirmRestoreSnap] = useState<ManuscriptSnapshot | null>(null);
  const [restoreScope, setRestoreScope] = useState<SnapshotScope>('manuscript');
  const [selectedChapterIdForRestore, setSelectedChapterIdForRestore] = useState<string>('');

  // Filtered & grouped snapshots
  const filteredSnapshots = useMemo(() => {
    return filterSnapshots(snapshots, {
      searchQuery,
      snapshotType: typeFilter === 'all' ? undefined : typeFilter
    });
  }, [snapshots, searchQuery, typeFilter]);

  const groupedSnapshots = useMemo(() => {
    return groupSnapshotsByTime(filteredSnapshots);
  }, [filteredSnapshots]);

  const selectedSnapshot = useMemo(() => {
    return snapshots.find(s => s.id === selectedSnapshotId) || null;
  }, [snapshots, selectedSnapshotId]);

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapshotLabel.trim()) return;

    const snap = createManualSnapshot({
      label: newSnapshotLabel.trim(),
      description: newSnapshotDesc.trim() || undefined,
      type: 'manual',
      source: 'user'
    });

    setNewSnapshotLabel('');
    setNewSnapshotDesc('');
    setIsCreatingSnapshot(false);
    setSelectedSnapshotId(snap.id);
  };

  useEffect(() => {
    localStorage.setItem('swrite-diff-mode', diffMode);
  }, [diffMode]);

  const handleStartCompare = (snapId: string) => {
    const diff = compareWithSnapshot(snapId);
    if (diff) {
      setDiffResult(diff);
      setIsComparing(true);
      setSelectedSnapshotId(snapId);
    }
  };

  const changedParagraphCount = diffResult?.chapterDiffs.reduce((count, chapter) => count + (chapter.paragraphs || []).filter(p => p.changeType !== 'unchanged').length, 0) || 0;
  const diffChapters = diffResult?.chapterDiffs.filter(chapter => diffScope === 'manuscript' || chapter.chapterId === diffChapterId) || [];
  const diffScenes = diffResult?.sceneDiffs?.filter(scene => scene.changeType !== 'unchanged' && (diffScope !== 'scene' || scene.sceneId === diffSceneId)) || [];
  const revisionAdded = project.metadata.theme.colors?.revisionAdded || 'rgba(52, 211, 153, 0.18)';
  const revisionRemoved = project.metadata.theme.colors?.revisionRemoved || 'rgba(248, 113, 113, 0.18)';
  const renderWordSegments = (paragraph: DiffParagraph) => {
    const segments = paragraph.wordSegments || diffWords(paragraph.before, paragraph.after);
    return segments.map((segment, index) => <span key={index} style={{ backgroundColor: segment.type === 'added' ? revisionAdded : segment.type === 'removed' ? revisionRemoved : undefined, textDecoration: segment.type === 'removed' ? 'line-through' : undefined }}>{segment.text}</span>);
  };

  const handleConfirmRestore = () => {
    if (!confirmRestoreSnap) return;

    restoreSnapshotById(confirmRestoreSnap.id, {
      restoreScope,
      targetChapterId: restoreScope === 'chapter' ? selectedChapterIdForRestore : undefined
    });

    setConfirmRestoreSnap(null);
    setIsComparing(false);
    setDiffResult(null);
  };

  const getTypeBadge = (type: SnapshotType) => {
    switch (type) {
      case 'manual':
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">Manual</span>;
      case 'pre-restore':
      case 'recovery':
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-950/70 text-amber-300 border border-amber-800/60">Safety</span>;
      case 'revision-round':
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800/60">Revision</span>;
      case 'pre-export':
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-950/70 text-purple-300 border border-purple-800/60">Export</span>;
      case 'auto':
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Auto</span>;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#121214] text-zinc-100 ${isModal ? 'max-h-[90vh]' : ''}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#17171a]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 tracking-wide flex items-center space-x-2">
              <span>Version History & Manuscript Snapshots</span>
              <span className="text-xs text-zinc-400 font-normal">({stats.totalCount} saved points)</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Safe, non-destructive recovery and literary diffing across your writing journey.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreatingSnapshot(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-medium transition-all shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Create Snapshot</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Snapshots Timeline & Filter */}
        <div className="w-84 border-r border-zinc-800/80 bg-[#151518] flex flex-col flex-shrink-0">
          {/* Search and Filters */}
          <div className="p-3 border-b border-zinc-800/60 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search versions..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#1e1e24] border border-zinc-700/60 rounded-md text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Type tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px]">
              {(['all', 'manual', 'auto', 'pre-restore', 'revision-round'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                    typeFilter === type 
                      ? 'bg-zinc-700 text-zinc-100 font-medium' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'pre-restore' ? 'Safety' : type === 'revision-round' ? 'Revision' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {groupedSnapshots.length === 0 ? (
              <div className="text-center py-10 px-4 text-zinc-500">
                <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No snapshots found.</p>
                <p className="text-[11px] mt-1 text-zinc-600">Create a manual snapshot or continue writing.</p>
              </div>
            ) : (
              groupedSnapshots.map(group => (
                <div key={group.timeGroup} className="space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-1">
                    {group.timeGroup}
                  </div>

                  <div className="space-y-1">
                    {group.snapshots.map(snap => {
                      const isSelected = selectedSnapshotId === snap.id;
                      const date = new Date(snap.createdAt);

                      return (
                        <div
                          key={snap.id}
                          onClick={() => {
                            setSelectedSnapshotId(snap.id);
                            if (isComparing) {
                              handleStartCompare(snap.id);
                            }
                          }}
                          className={`group relative p-2.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#22222a] border-zinc-600 shadow-xs' 
                              : 'bg-[#1a1a1f] border-zinc-800/70 hover:border-zinc-700 hover:bg-[#1f1f26]'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              <div className="flex items-center space-x-1.5">
                                {snap.pinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400/20 flex-shrink-0" />}
                                <span className={`text-xs font-medium truncate ${isSelected ? 'text-zinc-100' : 'text-zinc-300'}`}>
                                  {snap.label}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 mt-1 text-[10px] text-zinc-500">
                                <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>•</span>
                                <span>{snap.wordCount.toLocaleString()} words</span>
                                <span>•</span>
                                <span>{snap.chapterCount} ch</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1">
                              {getTypeBadge(snap.snapshotType)}
                            </div>
                          </div>

                          {snap.description && (
                            <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-1 italic">
                              "{snap.description}"
                            </p>
                          )}

                          {/* Quick action buttons on hover */}
                          <div className="flex items-center justify-end space-x-1 mt-2 pt-1 border-t border-zinc-800/40 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSnapshotPinned(snap.id);
                              }}
                              className={`p-1 rounded hover:bg-zinc-700/60 transition-colors ${snap.pinned ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                              title={snap.pinned ? 'Unpin' : 'Pin indefinitely'}
                            >
                              <Pin className="w-3 h-3" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartCompare(snap.id);
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 transition-colors"
                              title="Compare with current manuscript"
                            >
                              <ArrowLeftRight className="w-3 h-3" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmRestoreSnap(snap);
                                setSelectedChapterIdForRestore(snap.projectData.acts[0]?.chapters[0]?.id || '');
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-emerald-300 hover:bg-emerald-950/50 transition-colors"
                              title="Restore"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSnapshotById(snap.id);
                              }}
                              className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                              title="Delete snapshot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Content: Snapshot Inspection or Compare Mode */}
        <div className="flex-1 flex flex-col bg-[#101013] overflow-hidden">
          {isComparing && diffResult ? (
            // ================= COMPARE / DIFF VIEW =================
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Diff Control Bar */}
              <div className="px-6 py-3 border-b border-zinc-800 bg-[#161619] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-medium text-zinc-300">Comparing:</span>
                    <span className="text-zinc-400 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60">{diffResult.baseLabel}</span>
                    <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-200 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60">{diffResult.targetLabel}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center gap-1 text-[11px]">
                    <button onClick={() => setDiffMode('inline')} className={`px-2 py-1 rounded ${diffMode === 'inline' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800'}`}>Inline</button>
                    <button onClick={() => setDiffMode('side-by-side')} className={`px-2 py-1 rounded ${diffMode === 'side-by-side' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800'}`}>Side-by-side</button>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]"><button onClick={() => setDiffGranularity('paragraph')} className={`px-2 py-1 rounded ${diffGranularity === 'paragraph' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800'}`}>Paragraphs</button><button onClick={() => setDiffGranularity('word')} className={`px-2 py-1 rounded ${diffGranularity === 'word' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800'}`}>Word detail</button></div>
                  <div className="flex items-center gap-1 text-[11px]">
                    {(['manuscript', 'chapter', 'scene'] as const).map(scope => <button key={scope} onClick={() => setDiffScope(scope)} className={`px-2 py-1 rounded capitalize ${diffScope === scope ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800'}`}>{scope}</button>)}
                  </div>
                  <select aria-label="Diff chapter scope" value={diffChapterId} onChange={e => setDiffChapterId(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-300"><option value="">All chapters</option>{project.acts.flatMap(act => act.chapters).map(ch => <option key={ch.id} value={ch.id}>{ch.title}</option>)}</select>
                  {diffScope === 'scene' && <select aria-label="Diff scene scope" value={diffSceneId} onChange={e => setDiffSceneId(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-300"><option value="">All scenes</option>{project.acts.flatMap(act => act.chapters.flatMap(ch => ch.scenes || [])).map(scene => <option key={scene.id} value={scene.id}>{scene.title}</option>)}</select>}
                  {/* Delta Badges */}
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="text-emerald-400">+{diffResult.totalAddedWords.toLocaleString()} words</span>
                    <span className="text-rose-400">-{diffResult.totalRemovedWords.toLocaleString()} words</span>
                    <span className="text-zinc-400 font-sans">
                      (Net: {diffResult.netWordDelta >= 0 ? `+${diffResult.netWordDelta}` : diffResult.netWordDelta} words)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedSnapshot) setConfirmRestoreSnap(selectedSnapshot);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Base Snapshot</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsComparing(false);
                      setDiffResult(null);
                    }}
                    className="px-2.5 py-1 rounded border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors"
                  >
                    Exit Diff
                  </button>
                </div>
              </div>

              {/* Diff Content Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-5xl mx-auto w-full">
                <div className="text-xs text-zinc-400 border-b border-zinc-800 pb-3">+{diffResult.totalAddedWords.toLocaleString()} words · -{diffResult.totalRemovedWords.toLocaleString()} words · {changedParagraphCount} paragraphs changed · {diffResult.modifiedChapters.length} chapters modified</div>
                {(diffScope === 'scene' ? diffScenes : diffChapters).map(section => {
                  const paragraphs = 'paragraphs' in section ? section.paragraphs || [] : [];
                  return <div key={'sceneId' in section ? section.sceneId : section.chapterId} className="space-y-3">
                    <div className="flex items-center justify-between"><button onClick={() => { setActiveChapterId(section.chapterId); if ('sceneId' in section) setActiveSceneId(section.sceneId); setActiveTab('editor'); }} className="text-sm font-serif text-zinc-100 hover:text-white text-left">{'sceneTitle' in section ? section.sceneTitle : section.chapterTitle}</button><span className="text-[10px] uppercase text-zinc-500">{section.changeType}</span></div>
                    {paragraphs.filter(p => p.changeType !== 'unchanged').map(paragraph => {
                      const key = `${'sceneId' in section ? section.sceneId : section.chapterId}:${paragraph.id}`;
                      const expanded = expandedParagraphs.has(key) || diffGranularity === 'word';
                      return <div key={key} className="border border-zinc-800 rounded bg-[#141417] p-3">
                        {paragraph.substantiallyRewritten && !expanded ? <><div className="text-xs text-zinc-300">Paragraph substantially rewritten</div><button onClick={() => setExpandedParagraphs(prev => new Set(prev).add(key))} className="text-[11px] text-zinc-500 hover:text-zinc-200 mt-1">Show detailed changes</button></> : diffMode === 'side-by-side' ? <div className="grid grid-cols-2 gap-3 font-serif text-sm leading-relaxed"><div className="p-2" style={{ backgroundColor: revisionRemoved }}>{paragraph.before || <span className="text-zinc-600 italic">No paragraph</span>}</div><div className="p-2" style={{ backgroundColor: revisionAdded }}>{paragraph.after || <span className="text-zinc-600 italic">No paragraph</span>}</div></div> : <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap">{expanded ? renderWordSegments(paragraph) : <><span className="line-through" style={{ backgroundColor: revisionRemoved }}>{paragraph.before}</span> <span style={{ backgroundColor: revisionAdded }}>{paragraph.after}</span></>}</div>}
                        {expanded && <button onClick={() => setExpandedParagraphs(prev => { const next = new Set(prev); next.delete(key); return next; })} className="text-[11px] text-zinc-500 hover:text-zinc-200 mt-2">Hide detailed changes</button>}
                      </div>;
                    })}
                  </div>;
                })}
              </div>
            </div>
          ) : selectedSnapshot ? (
            // ================= SNAPSHOT PREVIEW VIEW =================
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Snapshot Detail Header */}
              <div className="px-6 py-4 border-b border-zinc-800 bg-[#161619] flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-base font-medium text-zinc-100">{selectedSnapshot.label}</h3>
                    {getTypeBadge(selectedSnapshot.snapshotType)}
                    {selectedSnapshot.pinned && (
                      <span className="flex items-center space-x-1 text-[11px] text-amber-400">
                        <Pin className="w-3 h-3 fill-amber-400/20" />
                        <span>Pinned</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Captured on {new Date(selectedSnapshot.createdAt).toLocaleString()} • Scope: {selectedSnapshot.scope}
                  </p>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => handleStartCompare(selectedSnapshot.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Compare with Current</span>
                  </button>

                  <button
                    onClick={() => {
                      setConfirmRestoreSnap(selectedSnapshot);
                      setSelectedChapterIdForRestore(selectedSnapshot.projectData.acts[0]?.chapters[0]?.id || '');
                    }}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Manuscript</span>
                  </button>
                </div>
              </div>

              {/* Metrics bar */}
              <div className="px-6 py-2 border-b border-zinc-800/60 bg-[#131316] flex items-center space-x-6 text-xs text-zinc-400">
                <div>Words: <strong className="text-zinc-200 font-mono">{selectedSnapshot.wordCount.toLocaleString()}</strong></div>
                <div>Chapters: <strong className="text-zinc-200 font-mono">{selectedSnapshot.chapterCount}</strong></div>
                <div>Scenes: <strong className="text-zinc-200 font-mono">{selectedSnapshot.sceneCount}</strong></div>
                <div>Characters: <strong className="text-zinc-200 font-mono">{selectedSnapshot.characterCount}</strong></div>
                <div>Plot Threads: <strong className="text-zinc-200 font-mono">{selectedSnapshot.plotThreadCount}</strong></div>
              </div>

              {/* Manuscript Preview Reader */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto space-y-10">
                  {selectedSnapshot.projectData.acts.map(act => (
                    <div key={act.id} className="space-y-6">
                      <div className="border-b border-zinc-800 pb-2">
                        <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">{act.title}</h4>
                      </div>

                      {act.chapters.map(ch => (
                        <div key={ch.id} className="space-y-3 rounded-lg p-5 bg-[#141418] border border-zinc-800/80">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-serif font-semibold text-zinc-200">{ch.title}</h5>
                            <span className="text-xs text-zinc-500 font-mono">{ch.wordCount || 0} words</span>
                          </div>

                          <div 
                            className="font-serif text-sm leading-relaxed text-zinc-400/90 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: ch.content || '<em class="text-zinc-600">Empty chapter</em>' }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
              Select a snapshot to preview or compare.
            </div>
          )}
        </div>
      </div>

      {/* Create Snapshot Modal */}
      {isCreatingSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#18181c] border border-zinc-700 rounded-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center space-x-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Create Manuscript Snapshot</span>
              </h3>
              <button 
                onClick={() => setIsCreatingSnapshot(false)} 
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
                  Snapshot Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSnapshotLabel}
                  onChange={e => setNewSnapshotLabel(e.target.value)}
                  placeholder="e.g., Before Major Act II Rewrite"
                  className="w-full px-3 py-2 bg-[#222228] border border-zinc-700 rounded-md text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
                  Notes / Intent (Optional)
                </label>
                <textarea
                  value={newSnapshotDesc}
                  onChange={e => setNewSnapshotDesc(e.target.value)}
                  placeholder="Why are you taking this snapshot? What changes are planned?"
                  rows={3}
                  className="w-full px-3 py-2 bg-[#222228] border border-zinc-700 rounded-md text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingSnapshot(false)}
                  className="px-3 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs"
                >
                  Save Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Non-Destructive Restore Confirmation Modal */}
      {confirmRestoreSnap && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#18181c] border border-amber-800/80 rounded-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-full bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Restore Manuscript from "{confirmRestoreSnap.label}"?
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Swrite guarantees safety: a pre-restore snapshot of your current manuscript will be created automatically before this action is executed.
                </p>
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-medium text-zinc-300 block">Restore Scope:</label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRestoreScope('manuscript')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    restoreScope === 'manuscript'
                      ? 'border-emerald-600 bg-emerald-950/30 text-zinc-100'
                      : 'border-zinc-800 bg-[#202026] text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-semibold">Entire Manuscript</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">All acts, chapters, scenes, characters</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRestoreScope('chapter')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    restoreScope === 'chapter'
                      ? 'border-emerald-600 bg-emerald-950/30 text-zinc-100'
                      : 'border-zinc-800 bg-[#202026] text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-semibold">Single Chapter Only</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Restore one chapter; keep rest unchanged</div>
                </button>
              </div>

              {restoreScope === 'chapter' && (
                <div className="pt-2">
                  <label className="text-xs text-zinc-300 block mb-1">Select Chapter to Restore:</label>
                  <select
                    value={selectedChapterIdForRestore}
                    onChange={e => setSelectedChapterIdForRestore(e.target.value)}
                    className="w-full px-3 py-2 bg-[#222228] border border-zinc-700 rounded-md text-xs text-zinc-200"
                  >
                    {confirmRestoreSnap.projectData.acts.flatMap(a => a.chapters).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.wordCount || 0} words)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setConfirmRestoreSnap(null)}
                className="px-3.5 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs"
              >
                Confirm Safe Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
