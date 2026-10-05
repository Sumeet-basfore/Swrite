import React from 'react';
import { Sparkles, AlertTriangle, UserPlus, Link2, MapPin, Calendar, X, ArrowRight } from 'lucide-react';
import { ContextualSuggestion } from '../../types/intelligence';

interface ContextualSuggestionBannerProps {
  suggestion: ContextualSuggestion;
  onOpenInbox: () => void;
  onQuickAccept?: (proposalId: string) => void;
  onDismiss: (suggestionId: string) => void;
}

export const ContextualSuggestionBanner: React.FC<ContextualSuggestionBannerProps> = ({
  suggestion,
  onOpenInbox,
  onQuickAccept,
  onDismiss
}) => {
  const getIcon = () => {
    switch (suggestion.suggestionType) {
      case 'canon-conflict':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'duplicate-warning':
        return <Link2 className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'new-character':
        return <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'location-mention':
        return <MapPin className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'timeline-event':
        return <Calendar className="w-4 h-4 text-purple-400 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    if (suggestion.priority === 'high') return 'border-amber-500/50 bg-amber-950/20';
    if (suggestion.priority === 'medium') return 'border-indigo-500/40 bg-indigo-950/20';
    return 'border-slate-800 bg-slate-900/80';
  };

  return (
    <div className={`p-3 rounded-lg border text-xs text-slate-200 flex items-start justify-between gap-3 shadow-md backdrop-blur-sm transition ${getBorderColor()}`}>
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        {getIcon()}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="font-semibold text-slate-100 flex items-center gap-2">
            <span>{suggestion.title}</span>
            <span className="text-[10px] text-slate-400 font-normal">({suggestion.domain})</span>
          </div>
          <p className="text-slate-300 line-clamp-2 leading-relaxed">{suggestion.text}</p>
          {suggestion.snippet && (
            <p className="text-[11px] text-slate-400 italic line-clamp-1">"{suggestion.snippet}"</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-center">
        {suggestion.proposalId && onQuickAccept && (
          <button
            onClick={() => onQuickAccept(suggestion.proposalId!)}
            className="px-2.5 py-1 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-500 transition text-[11px]"
          >
            Accept
          </button>
        )}

        <button
          onClick={onOpenInbox}
          className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded font-medium transition text-[11px] flex items-center gap-1"
        >
          <span>View Inbox</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        <button
          onClick={() => onDismiss(suggestion.id)}
          className="p-1 text-slate-500 hover:text-slate-300 rounded transition"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
