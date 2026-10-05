import React, { useState } from 'react';
import { Check, X, EyeOff, Clock, AlertTriangle, ShieldCheck, Sparkles, Filter, RotateCcw, ArrowRight } from 'lucide-react';
import { OrganizationInboxItem, InboxFilterCategory, InboxItemStatus } from '../../types/intelligence';

interface OrganizationInboxProps {
  items: OrganizationInboxItem[];
  activeCategory: InboxFilterCategory;
  onSelectCategory: (category: InboxFilterCategory) => void;
  onUpdateStatus: (itemId: string, status: InboxItemStatus) => void;
  onBatchApply: () => void;
  onRollback?: () => void;
  lastSnapshotId?: string;
}

export const OrganizationInbox: React.FC<OrganizationInboxProps> = ({
  items,
  activeCategory,
  onSelectCategory,
  onUpdateStatus,
  onBatchApply,
  onRollback,
  lastSnapshotId
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { key: InboxFilterCategory; label: string }[] = [
    { key: 'all', label: 'All Proposals' },
    { key: 'characters', label: 'Characters' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'outline', label: 'Outline' },
    { key: 'relationships', label: 'Relationships' },
    { key: 'research', label: 'Research' },
    { key: 'conflicts', label: 'Conflicts' },
    { key: 'duplicates', label: 'Duplicates' }
  ];

  const filteredItems = items.filter(item => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.proposal.targetName.toLowerCase().includes(q);
      const matchReason = item.userFacingReason.toLowerCase().includes(q);
      if (!matchName && !matchReason) return false;
    }
    return true;
  });

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const safeToApplyCount = items.filter(i => (i.status === 'accepted' || i.status === 'pending') && i.proposal.confidence >= 0.8 && !i.proposal.conflictsWithCanon).length;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-l border-slate-800 w-96 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide">Organization Inbox</h3>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-full font-medium border border-indigo-500/30">
              {pendingCount} new
            </span>
          )}
        </div>
        {lastSnapshotId && onRollback && (
          <button
            onClick={onRollback}
            title="Rollback last organization apply"
            className="flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded hover:bg-amber-500/20 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rollback</span>
          </button>
        )}
      </div>

      {/* Categories Filter Bar */}
      <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {categories.map(cat => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium transition ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Batch Accept Banner */}
      {safeToApplyCount > 0 && (
        <div className="p-3 bg-indigo-950/40 border-b border-indigo-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-indigo-200">
              {safeToApplyCount} safe proposal{safeToApplyCount > 1 ? 's' : ''} ready
            </span>
          </div>
          <button
            onClick={onBatchApply}
            className="flex items-center gap-1 text-xs px-3 py-1 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-500 transition shadow-sm"
          >
            <span>Apply Safe</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800">
        <input
          type="text"
          placeholder="Filter proposals..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Proposals List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No proposals matching current filter.</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const prop = item.proposal;
            const isPending = item.status === 'pending';
            const isAccepted = item.status === 'accepted';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border text-xs transition ${
                  isAccepted
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : isRejected
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : prop.conflictsWithCanon
                    ? 'bg-amber-950/30 border-amber-800/50'
                    : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="uppercase text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {prop.domain}
                    </span>
                    <span className="font-semibold text-slate-100">{prop.targetName}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    prop.confidence >= 0.8 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {Math.round(prop.confidence * 100)}% conf
                  </span>
                </div>

                {/* Reasoning / User Facing Explanation */}
                <p className="text-slate-300 mb-2 leading-relaxed">{item.userFacingReason}</p>

                {/* Context Provenance Snippet */}
                {item.contextSnippet && (
                  <div className="mb-2.5 p-2 bg-slate-950/60 rounded border border-slate-800 text-slate-400 italic text-[11px] line-clamp-2">
                    "{item.contextSnippet}"
                  </div>
                )}

                {/* Canon Conflict Warning */}
                {prop.conflictsWithCanon && (
                  <div className="mb-2.5 p-2 bg-amber-900/30 border border-amber-700/50 rounded flex items-start gap-1.5 text-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Conflicts with existing canon. Review details carefully.</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Status: {item.status}
                  </span>

                  <div className="flex items-center gap-1">
                    {isPending && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(item.id, 'accepted')}
                          title="Accept Proposal"
                          className="p-1 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onUpdateStatus(item.id, 'rejected')}
                          title="Reject Proposal"
                          className="p-1 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white rounded transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onUpdateStatus(item.id, 'ignored')}
                          title="Ignore"
                          className="p-1 bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onUpdateStatus(item.id, 'remember-later')}
                          title="Remember Later"
                          className="p-1 bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {!isPending && (
                      <button
                        onClick={() => onUpdateStatus(item.id, 'pending')}
                        className="text-[11px] text-indigo-400 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
