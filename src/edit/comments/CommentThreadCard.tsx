import React, { useState } from 'react';
import { Comment } from '../../types/ipc';

interface CommentThreadCardProps {
  comment: Comment;
  isStale?: boolean;
  staleReason?: string;
  onAddReply: (content: string) => void;
  onResolve: (resolved: boolean) => void;
  onDelete: () => void;
  onJump: () => void;
  onReattach?: () => void;
}

export const CommentThreadCard: React.FC<CommentThreadCardProps> = ({
  comment,
  isStale,
  staleReason,
  onAddReply,
  onResolve,
  onDelete,
  onJump,
  onReattach,
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddReply(replyText.trim());
    setReplyText('');
    setShowReplyBox(false);
  };

  const isResolved = comment.status === 'resolved';

  return (
    <div className={`comment-thread-card ${isResolved ? 'resolved' : ''} ${isStale ? 'stale' : ''}`}>
      {/* Anchored text excerpt */}
      <div className="comment-anchor-box" onClick={onJump} title="Click to jump to passage">
        <div className="comment-anchor-header">
          <span className="comment-anchor-doc">
            {comment.anchor.relative_path.split('/').pop()}
          </span>
          {isStale && (
            <span className="comment-stale-badge" title={staleReason || 'Anchor position shifted or text modified'}>
              ⚠ Stale Anchor
            </span>
          )}
        </div>
        <blockquote className="comment-anchor-quote">
          "{comment.anchor.exact_text}"
        </blockquote>
      </div>

      {isStale && onReattach && (
        <div className="comment-stale-banner">
          <span>The passage this comment was attached to has moved or changed.</span>
          <button
            type="button"
            className="comment-btn-reattach"
            onClick={onReattach}
          >
            Reattach to Cursor
          </button>
        </div>
      )}

      {/* Main Comment Content */}
      <div className="comment-main-body">
        <div className="comment-author-row">
          <span className="comment-author-name">Author Note</span>
          <span className="comment-time">
            {new Date(comment.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="comment-content-text">{comment.content}</div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="comment-replies-list">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="comment-reply-item">
              <div className="comment-reply-meta">
                <span className="comment-reply-author">Reply</span>
                <span className="comment-time">
                  {new Date(reply.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="comment-reply-content">{reply.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input box */}
      {showReplyBox && (
        <form onSubmit={handleSendReply} className="comment-reply-form">
          <textarea
            className="comment-reply-input"
            rows={2}
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
          />
          <div className="comment-reply-form-actions">
            <button
              type="button"
              className="comment-btn-secondary"
              onClick={() => setShowReplyBox(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="comment-btn-primary"
              disabled={!replyText.trim()}
            >
              Reply
            </button>
          </div>
        </form>
      )}

      {/* Footer action bar */}
      <div className="comment-card-actions">
        <button
          type="button"
          className="comment-action-btn"
          onClick={() => setShowReplyBox(!showReplyBox)}
        >
          Reply
        </button>
        <button
          type="button"
          className="comment-action-btn"
          onClick={() => onResolve(!isResolved)}
        >
          {isResolved ? 'Reopen' : 'Resolve'}
        </button>
        <button
          type="button"
          className="comment-action-btn comment-action-danger"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
