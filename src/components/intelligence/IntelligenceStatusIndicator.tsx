import React from 'react';
import { CheckCircle2, RefreshCw, AlertTriangle, Inbox, AlertCircle } from 'lucide-react';
import { IntelligenceStatus } from '../../types/intelligence';

interface IntelligenceStatusIndicatorProps {
  status: IntelligenceStatus;
  pendingCount: number;
  conflictCount?: number;
  onClick: () => void;
}

export const IntelligenceStatusIndicator: React.FC<IntelligenceStatusIndicatorProps> = ({
  status,
  pendingCount,
  conflictCount = 0,
  onClick
}) => {
  const renderStatusContent = () => {
    if (status === 'conflict-detected' || conflictCount > 0) {
      return (
        <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-full text-xs font-medium">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{conflictCount || 1} Canon Conflict{conflictCount > 1 ? 's' : ''}</span>
        </div>
      );
    }

    if (status === 'review-available' || pendingCount > 0) {
      return (
        <div className="flex items-center gap-1.5 text-indigo-300 bg-indigo-950/40 border border-indigo-800/50 px-2.5 py-1 rounded-full text-xs font-medium">
          <Inbox className="w-3.5 h-3.5 text-indigo-400" />
          <span>{pendingCount} Review Available</span>
        </div>
      );
    }

    if (status === 'analyzing') {
      return (
        <div className="flex items-center gap-1.5 text-sky-400 bg-sky-950/40 border border-sky-800/50 px-2.5 py-1 rounded-full text-xs font-medium">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Analyzing</span>
        </div>
      );
    }

    if (status === 'analysis-unavailable') {
      return (
        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/50 border border-slate-700/50 px-2.5 py-1 rounded-full text-xs font-medium">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Analysis unavailable</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 rounded-full text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Up to date</span>
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      className="hover:opacity-85 transition focus:outline-none"
      title="Open Organization Inbox"
    >
      {renderStatusContent()}
    </button>
  );
};
