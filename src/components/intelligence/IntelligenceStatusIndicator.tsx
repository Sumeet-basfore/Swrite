import React from 'react';
import { CheckCircle2, RefreshCw, Sparkles, AlertTriangle, Inbox } from 'lucide-react';
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
          <span>{conflictCount} Canon Conflict{conflictCount > 1 ? 's' : ''}</span>
        </div>
      );
    }

    if (status === 'needs-review' || pendingCount > 0) {
      return (
        <div className="flex items-center gap-1.5 text-indigo-300 bg-indigo-950/40 border border-indigo-800/50 px-2.5 py-1 rounded-full text-xs font-medium">
          <Inbox className="w-3.5 h-3.5 text-indigo-400" />
          <span>{pendingCount} Pending Proposal{pendingCount > 1 ? 's' : ''}</span>
        </div>
      );
    }

    if (status === 'changes-detected' || status === 'analysis-pending') {
      return (
        <div className="flex items-center gap-1.5 text-sky-400 bg-sky-950/40 border border-sky-800/50 px-2.5 py-1 rounded-full text-xs font-medium">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Analyzing changes...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 rounded-full text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Intelligence up to date</span>
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
