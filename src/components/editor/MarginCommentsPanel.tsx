import React, { useState } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { 
  MessageSquare, X, Check, Trash2, Send, CornerDownRight, 
  Filter, CheckCircle2, Clock, Sparkles 
} from 'lucide-react';
import { AnnotationThread, AnnotationComment } from '../../types/editorEnhancements';

interface MarginCommentsPanelProps {
  sceneId: string;
}

export const MarginCommentsPanel: React.FC<MarginCommentsPanelProps> = ({ sceneId }) => {
  const { 
    project, activeAnnotationId, setActiveAnnotationId, setIsMarginCommentsOpen,
    addCommentToThread, resolveAnnotationThread, deleteAnnotationThread
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [replyText, setReplyText] = useState<{ [threadId: string]: string }>({});

  const allThreads = project.annotationThreads || [];
  const sceneThreads = allThreads.filter(t => t.sceneId === sceneId || !t.sceneId);

  const filteredThreads = sceneThreads.filter(t => {
    if (filter === 'active') return !t.isResolved;
    if (filter === 'resolved') return t.isResolved;
    return true;
  });

  const handleSendReply = (threadId: string) => {
    const text = replyText[threadId]?.trim();
    if (!text) return;

    addCommentToThread(threadId, text, 'Author');
    setReplyText(prev => ({ ...prev, [threadId]: '' }));
  };

  return (
    <div 
      className="h-full w-80 border-l flex flex-col shadow-lg select-none overflow-hidden"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{
          backgroundColor: theme.colors.elevatedSurface,
          borderColor: theme.colors.borderStrong
        }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" style={{ color: theme.colors.accent }} />
          <span className="text-xs font-bold" style={{ color: theme.colors.text }}>
            Margin Annotations ({sceneThreads.length})
          </span>
        </div>

        <button
          onClick={() => setIsMarginCommentsOpen(false)}
          className="p-1 rounded hover:opacity-80"
          style={{ color: theme.colors.textMuted }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Chips */}
      <div className="px-4 py-2 border-b flex items-center gap-1.5 text-[11px]" style={{ borderColor: theme.colors.border }}>
        {(['all', 'active', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-all ${
              filter === f ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: filter === f ? theme.colors.accent : 'transparent',
              color: filter === f ? '#fff' : theme.colors.text
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {filteredThreads.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6" style={{ color: theme.colors.textMuted }}>
            <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs font-medium">No {filter !== 'all' ? filter : ''} annotations</p>
            <p className="text-[11px] mt-1 opacity-70">
              Select text in the manuscript to add inline notes and comments.
            </p>
          </div>
        ) : (
          filteredThreads.map(thread => {
            const isActive = activeAnnotationId === thread.id;

            return (
              <div
                key={thread.id}
                onClick={() => setActiveAnnotationId(thread.id)}
                className={`p-3 rounded-xl border transition-all text-xs space-y-2.5 ${
                  isActive ? 'ring-2' : ''
                } ${thread.isResolved ? 'opacity-60 hover:opacity-100' : ''}`}
                style={{
                  backgroundColor: theme.colors.elevatedSurface,
                  borderColor: isActive ? theme.colors.accent : theme.colors.border,
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.08)' : undefined
                }}
              >
                {/* Highlighted text snippet */}
                {thread.highlightedText && (
                  <div 
                    className="p-2 rounded border-l-2 text-[11px] italic"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.accent,
                      color: theme.colors.textMuted
                    }}
                  >
                    "{thread.highlightedText}"
                  </div>
                )}

                {/* Comments list */}
                <div className="space-y-2">
                  {thread.comments.map((comment: AnnotationComment) => (
                    <div key={comment.id} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px]" style={{ color: theme.colors.textMuted }}>
                        <span className="font-bold" style={{ color: theme.colors.accent }}>{comment.author}</span>
                        <span>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: theme.colors.text }}>
                        {comment.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Actions & Reply Form */}
                <div className="pt-2 border-t flex flex-col gap-2" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resolveAnnotationThread(thread.id, !thread.isResolved);
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold hover:opacity-80 transition-opacity"
                      style={{ color: thread.isResolved ? '#10b981' : theme.colors.textMuted }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {thread.isResolved ? 'Resolved' : 'Mark Resolved'}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotationThread(thread.id);
                      }}
                      className="p-1 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                      title="Delete Thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Reply Input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Reply to thread..."
                      value={replyText[thread.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [thread.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReply(thread.id)}
                      className="flex-1 px-2.5 py-1 text-xs rounded border bg-transparent focus:outline-none"
                      style={{ borderColor: theme.colors.border, color: theme.colors.text }}
                    />
                    <button
                      onClick={() => handleSendReply(thread.id)}
                      className="p-1.5 rounded transition-opacity hover:opacity-80"
                      style={{ backgroundColor: theme.colors.accent, color: '#fff' }}
                      title="Send Reply"
                    >
                      <Send className="w-3 h-3" />
                    </button>
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
