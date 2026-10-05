import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Check, CheckCircle2, ExternalLink, Search, X } from 'lucide-react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { ContinuityEngine } from '../../engine';
import { ProofreadingEngine, RevisionQueries } from '../../editorial';
import { buildReviewQueue, filterReviewQueue, ReviewQueueItem, ReviewScope } from '../../editorial/reviewQueue';
import { Finding } from '../../editorial/proofreading/types';
import { ContinuityWarning } from '../../types/continuity';
import { RevisionItem } from '../../types/revision';

const scopes: Array<[ReviewScope, string]> = [['scene', 'Review Scene'], ['chapter', 'Review Chapter'], ['act', 'Review Act'], ['manuscript', 'Review Manuscript']];

export const ReviewWorkspace: React.FC = () => {
  const {
    project, activeChapterId, activeSceneId, setActiveChapterId, setActiveSceneId, setActiveTab,
    acceptProofreadingFinding, ignoreProofreadingFinding, markProofreadingFindingIntentional,
    dismissContinuityWarning, markWarningIntentional, resolveRevisionItem, deferRevisionItem,
    convertContinuityToRevisionItem, setActiveRevisionItemId, setInspectorSelection,
  } = useSwriteStore();
  const theme = project.metadata.theme;
  const activeActId = useMemo(() => project.acts.find(a => a.chapters.some(c => c.id === activeChapterId))?.id, [project, activeChapterId]);
  const [scope, setScope] = useState<ReviewScope>('scene');
  const [typeFilter, setTypeFilter] = useState<'all' | 'language-proofing' | 'story-craft'>('all');
  const [statusFilter, setStatusFilter] = useState<'open' | 'all'>('open');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(true);

  const findings = useMemo(() => ProofreadingEngine.runAudit(project, { scope: 'manuscript' }), [project]);
  const warnings = useMemo(() => ContinuityEngine.runAudit(project), [project]);
  const revisions = useMemo(() => RevisionQueries.getRevisionItems(project), [project]);
  const queue = useMemo(() => buildReviewQueue(project, findings, warnings, revisions), [project, findings, warnings, revisions]);
  const openQueue = useMemo(() => queue.filter(item => ['open', 'in-progress'].includes(item.status)), [queue]);
  const scopedQueue = useMemo(() => filterReviewQueue(statusFilter === 'all' ? queue : openQueue, scope, project, activeSceneId || undefined, activeChapterId || undefined, activeActId), [queue, openQueue, scope, statusFilter, project, activeSceneId, activeChapterId, activeActId]);
  const filteredQueue = useMemo(() => scopedQueue.filter(item => {
    if (typeFilter !== 'all' && item.tier !== typeFilter) return false;
    if (!query.trim()) return true;
    const text = `${item.title} ${item.message} ${item.category}`.toLowerCase();
    return text.includes(query.toLowerCase());
  }), [scopedQueue, typeFilter, query]);
  const selected = filteredQueue.find(item => item.id === selectedId) || filteredQueue[0] || null;

  const selectItem = (item: ReviewQueueItem, open = true) => {
    setSelectedId(item.id);
    setDetailOpen(open);
    if (item.chapterId) setActiveChapterId(item.chapterId);
    if (item.sceneId) setActiveSceneId(item.sceneId);
    if (item.sourceType === 'revision') setActiveRevisionItemId(item.sourceMetadata.revisionItem?.id || null);
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('swrite:review-range', { detail: { text: item.originalText, focus: open } })), 0);
  };

  useEffect(() => {
    if (selectedId && !filteredQueue.some(item => item.id === selectedId)) setSelectedId(filteredQueue[0]?.id || null);
  }, [filteredQueue, selectedId]);

  const move = (delta: number) => {
    if (!filteredQueue.length) return;
    const index = Math.max(0, filteredQueue.findIndex(item => item.id === selected?.id));
    selectItem(filteredQueue[(index + delta + filteredQueue.length) % filteredQueue.length]);
  };

  const nextAfter = (id: string) => {
    const index = filteredQueue.findIndex(item => item.id === id);
    setSelectedId(filteredQueue[index + 1]?.id || filteredQueue[0]?.id || null);
    setDetailOpen(true);
  };

  const openScene = (item: ReviewQueueItem) => {
    if (item.chapterId) setActiveChapterId(item.chapterId);
    if (item.sceneId) setActiveSceneId(item.sceneId);
    setActiveTab('editor');
  };

  const actOnSelected = (action: 'accept' | 'ignore' | 'resolve' | 'defer' | 'intentional' | 'convert') => {
    if (!selected) return;
    const source = selected.sourceMetadata;
    if (action === 'accept' && source.finding) acceptProofreadingFinding(source.finding);
    if (action === 'ignore' && source.finding) ignoreProofreadingFinding(source.finding.id);
    if (action === 'intentional' && source.finding) markProofreadingFindingIntentional(source.finding.id);
    if (action === 'intentional' && source.warning) markWarningIntentional(source.warning.id, source.warning.title, source.warning.type);
    if (action === 'resolve' && source.revisionItem) resolveRevisionItem(source.revisionItem.id);
    if (action === 'defer' && source.revisionItem) deferRevisionItem(source.revisionItem.id);
    if (action === 'ignore' && source.warning) dismissContinuityWarning(source.warning.id);
    if (action === 'convert' && source.warning) {
      convertContinuityToRevisionItem(source.warning);
      dismissContinuityWarning(source.warning.id);
    }
    nextAfter(selected.id);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target?.isContentEditable || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.key === 'j' || event.key === 'J' || event.key === 'ArrowDown') { event.preventDefault(); move(1); }
      else if (event.key === 'k' || event.key === 'K' || event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
      else if (event.key === 'Enter' && selected) { event.preventDefault(); openScene(selected); }
      else if (event.key === 'Escape') { event.preventDefault(); setDetailOpen(false); }
      else if ((event.key === 'a' || event.key === 'A') && selected?.sourceType === 'proofreading') { event.preventDefault(); actOnSelected('accept'); }
      else if ((event.key === 'i' || event.key === 'I') && selected) { event.preventDefault(); actOnSelected('ignore'); }
      else if ((event.key === 'r' || event.key === 'R') && selected) { event.preventDefault(); actOnSelected(selected.sourceType === 'revision' ? 'resolve' : selected.sourceType === 'continuity' ? 'convert' : 'accept'); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const counts = {
    open: openQueue.length,
    language: openQueue.filter(item => item.tier === 'language-proofing').length,
    story: openQueue.filter(item => item.tier === 'story-craft').length,
  };

  return <div className="flex-1 flex flex-col h-full overflow-hidden select-none font-sans" style={{ backgroundColor: theme.bg, color: theme.text }}>
    <header className="h-14 px-6 border-b flex items-center justify-between shrink-0" style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><strong className="font-serif text-sm">Review</strong></div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Open <b className="text-zinc-200">{counts.open}</b> · Language &amp; Proofing <b className="text-zinc-200">{counts.language}</b> · Story &amp; Craft <b className="text-zinc-200">{counts.story}</b></div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="hidden lg:inline text-zinc-500">J/K navigate · Enter open · Esc close</span>
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded p-0.5">
          {(['all', 'language-proofing', 'story-craft'] as const).map(value => <button key={value} onClick={() => setTypeFilter(value)} className={`px-2 py-1 rounded ${typeFilter === value ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'}`}>{value === 'all' ? 'All' : value === 'language-proofing' ? 'Language & Proofing' : 'Story & Craft'}</button>)}
        </div>
        <label className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded px-2 py-1"><Search className="w-3 h-3 text-zinc-500" /><input aria-label="Filter review queue" value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter" className="bg-transparent outline-none w-24 text-zinc-200" /></label>
      </div>
    </header>

    <div className="flex items-center justify-between px-5 py-2 border-b text-xs" style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}>
      <div className="flex gap-1">{scopes.map(([value, label]) => <button key={value} onClick={() => { setScope(value); setSelectedId(null); }} className={`px-2.5 py-1 rounded ${scope === value ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}>{label}</button>)}</div>
      <label className="text-zinc-500">Status <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'open' | 'all')} className="ml-1 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300"><option value="open">Open</option><option value="all">All statuses</option></select></label>
    </div>

    <main className="flex-1 flex overflow-hidden">
      <section className="w-1/2 border-r overflow-y-auto p-3 space-y-2" style={{ borderColor: theme.pageBorder }}>
        <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500">{scope === 'scene' ? 'Current Scene' : scope === 'chapter' ? 'Current Chapter' : scope === 'act' ? 'Current Act' : 'Current Manuscript'} · {filteredQueue.length}</div>
        {filteredQueue.map((item, index) => <button key={item.id} onClick={() => selectItem(item)} className={`w-full text-left p-3 rounded border transition-colors ${selected?.id === item.id ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/70'}`}>
          <div className="flex justify-between gap-2"><span className="text-[10px] uppercase tracking-wider text-zinc-500">{item.tier === 'language-proofing' ? 'Language & Proofing' : 'Story & Craft'} · {item.category}</span><span className="text-[10px] text-zinc-600">{index + 1}</span></div>
          <div className="mt-1 text-xs font-semibold text-zinc-100">{item.title}</div><div className="mt-1 text-[11px] text-zinc-400 line-clamp-2">{item.message}</div>
        </button>)}
        {!filteredQueue.length && <div className="py-16 text-center"><h3 className="text-sm font-serif text-zinc-200">Review complete</h3><p className="mt-1 text-xs text-zinc-500">No open items in this scope.</p></div>}
      </section>

      <section className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.pageBg }}>
        {selected && detailOpen ? <div className="max-w-xl space-y-5">
          <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: theme.pageBorder }}><div><div className="text-[10px] uppercase tracking-wider text-zinc-500">{selected.sourceType === 'proofreading' ? 'Language & Proofing' : 'Story & Craft'} · {selected.category}</div><h2 className="mt-2 text-lg font-serif font-bold text-zinc-100">{selected.title}</h2><p className="mt-2 text-sm text-zinc-300 leading-relaxed">{selected.message}</p></div><button aria-label="Close review detail" onClick={() => setDetailOpen(false)} className="text-zinc-500 hover:text-zinc-200"><X className="w-4 h-4" /></button></div>
          <div className="text-xs text-zinc-500">Location: {selected.sourceMetadata.chapterTitle || 'Manuscript'}{selected.sourceMetadata.sceneTitle ? ` · ${selected.sourceMetadata.sceneTitle}` : ''}</div>
          {(selected.sourceMetadata.relatedCharacterIds?.length || selected.sourceMetadata.relatedPlotThreadIds?.length) ? <div className="flex flex-wrap gap-2 text-xs">{selected.sourceMetadata.relatedCharacterIds?.map(id => { const character = project.characters.find(c => c.id === id); return character ? <button key={id} onClick={() => setInspectorSelection({ type: 'character', characterId: id })} className="text-zinc-300 underline decoration-zinc-600 underline-offset-2">Character · {character.name}</button> : null; })}{selected.sourceMetadata.relatedPlotThreadIds?.map(id => { const thread = project.plotThreads?.find(t => t.id === id); return thread ? <button key={id} onClick={() => setInspectorSelection({ type: 'thread', threadId: id })} className="text-zinc-300 underline decoration-zinc-600 underline-offset-2">Plot thread · {thread.title}</button> : null; })}</div> : null}
          {selected.originalText && <div className="p-3 rounded border border-zinc-800 bg-zinc-900/60"><div className="text-[10px] uppercase text-zinc-500">Original text</div><p className="mt-1 font-serif italic text-zinc-200">“{selected.originalText}”</p>{selected.suggestedText && <><div className="mt-3 text-[10px] uppercase text-emerald-400">Suggestion</div><p className="mt-1 font-serif text-emerald-300">“{selected.suggestedText}”</p></>}</div>}
          {selected.sourceType === 'continuity' && selected.sourceMetadata.warning?.evidence?.length ? <div className="text-xs text-zinc-400"><div className="text-[10px] uppercase text-zinc-500 mb-2">Why it is flagged</div>{selected.sourceMetadata.warning.evidence.map((e, i) => <p key={i} className="mb-1">{e.label}: {e.details}</p>)}</div> : null}
          <div className="flex flex-wrap gap-2 pt-4 border-t" style={{ borderColor: theme.pageBorder }}>
            {selected.sourceType === 'proofreading' && <><button onClick={() => actOnSelected('accept')} className="action bg-emerald-600"><Check className="w-3 h-3" /> Accept</button><button onClick={() => actOnSelected('ignore')} className="action bg-zinc-800">Ignore</button><button onClick={() => actOnSelected('intentional')} className="action bg-zinc-800">Intentional</button></>}
            {selected.sourceType === 'revision' && <><button onClick={() => actOnSelected('resolve')} className="action bg-emerald-600"><Check className="w-3 h-3" /> Resolve</button><button onClick={() => actOnSelected('defer')} className="action bg-zinc-800">Defer</button></>}
            {selected.sourceType === 'continuity' && <><button onClick={() => actOnSelected('intentional')} className="action bg-zinc-800">Mark Intentional</button><button onClick={() => actOnSelected('ignore')} className="action bg-zinc-800">Ignore</button><button onClick={() => actOnSelected('convert')} className="action bg-zinc-800">Open as Revision</button></>}
            <button onClick={() => openScene(selected)} className="action bg-zinc-800"><ExternalLink className="w-3 h-3" /> Open Scene</button><button onClick={() => move(1)} className="action bg-zinc-800">Next <ArrowRight className="w-3 h-3" /></button>
          </div>
        </div> : selected ? <button onClick={() => setDetailOpen(true)} className="text-sm text-zinc-400 hover:text-zinc-200">Open current review item</button> : <div className="text-sm text-zinc-500">No open items in this scope.</div>}
      </section>
    </main>
    <style>{`.action{display:inline-flex;align-items:center;gap:.35rem;padding:.5rem .75rem;border-radius:.25rem;color:#f4f4f5;font-size:.75rem}.action:hover{filter:brightness(1.15)}`}</style>
  </div>;
};
