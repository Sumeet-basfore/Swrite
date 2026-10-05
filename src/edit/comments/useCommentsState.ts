import { useState, useEffect, useCallback } from 'react';
import { SwriteIpc } from '../../lib/ipc';
import { Comment, CommentReply, TextAnchor } from '../../types/ipc';

interface StaleAnchorInfo {
  isStale: boolean;
  reason?: 'file_missing' | 'text_mismatch' | 'offset_shifted';
  foundAtNewOffset?: number;
}

export function useCommentsState(currentDocumentPath: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const [docFilter, setDocFilter] = useState<'current' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [staleMap, setStaleMap] = useState<Record<string, StaleAnchorInfo>>({});

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SwriteIpc.commentsLoad();
      setComments(data.comments || []);

      // Check anchors for staleness
      const staleCheck: Record<string, StaleAnchorInfo> = {};
      const fileCache: Record<string, string> = {};

      for (const comment of data.comments) {
        const path = comment.anchor.relative_path;
        if (!fileCache[path]) {
          try {
            fileCache[path] = await SwriteIpc.fileRead(path);
          } catch {
            staleCheck[comment.id] = { isStale: true, reason: 'file_missing' };
            continue;
          }
        }

        const content = fileCache[path];
        const { start_offset, end_offset, exact_text } = comment.anchor;

        if (
          start_offset < content.length &&
          end_offset <= content.length &&
          content.slice(start_offset, end_offset) === exact_text
        ) {
          staleCheck[comment.id] = { isStale: false };
        } else {
          // Check if exact_text exists elsewhere in document
          const foundIdx = content.indexOf(exact_text);
          if (foundIdx !== -1) {
            staleCheck[comment.id] = {
              isStale: true,
              reason: 'offset_shifted',
              foundAtNewOffset: foundIdx,
            };
          } else {
            staleCheck[comment.id] = { isStale: true, reason: 'text_mismatch' };
          }
        }
      }

      setStaleMap(staleCheck);
    } catch (e) {
      console.error('Failed to load comments:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addReply = useCallback(
    async (commentId: string, replyContent: string) => {
      if (!replyContent.trim()) return;
      const target = comments.find((c) => c.id === commentId);
      if (!target) return;

      const newReply: CommentReply = {
        id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        created_at: new Date().toISOString(),
        content: replyContent.trim(),
      };

      const updated = {
        ...target,
        replies: [...target.replies, newReply],
        updated_at: new Date().toISOString(),
      };

      const newComments = comments.map((c) => (c.id === commentId ? updated : c));
      setComments(newComments);
      await SwriteIpc.commentsSave({ comments: newComments });
    },
    [comments]
  );

  const resolveComment = useCallback(
    async (commentId: string, resolved: boolean) => {
      await SwriteIpc.commentResolve(commentId, resolved);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, status: resolved ? 'resolved' : 'open' } : c
        )
      );
    },
    []
  );

  const deleteComment = useCallback(async (commentId: string) => {
    await SwriteIpc.commentDelete(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  const reattachAnchor = useCallback(
    async (commentId: string, newAnchor: TextAnchor) => {
      const target = comments.find((c) => c.id === commentId);
      if (!target) return;

      const updated: Comment = {
        ...target,
        anchor: newAnchor,
        updated_at: new Date().toISOString(),
      };

      const newComments = comments.map((c) => (c.id === commentId ? updated : c));
      setComments(newComments);
      setStaleMap((prev) => ({ ...prev, [commentId]: { isStale: false } }));
      await SwriteIpc.commentsSave({ comments: newComments });
    },
    [comments]
  );

  // Filtered comments
  const filteredComments = comments.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (docFilter === 'current' && currentDocumentPath && c.anchor.relative_path !== currentDocumentPath) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = c.content.toLowerCase().includes(q);
      const matchAnchor = c.anchor.exact_text.toLowerCase().includes(q);
      const matchReply = c.replies.some((r) => r.content.toLowerCase().includes(q));
      if (!matchText && !matchAnchor && !matchReply) return false;
    }
    return true;
  });

  return {
    comments: filteredComments,
    allCommentsCount: comments.length,
    loading,
    statusFilter,
    setStatusFilter,
    docFilter,
    setDocFilter,
    searchQuery,
    setSearchQuery,
    staleMap,
    addReply,
    resolveComment,
    deleteComment,
    reattachAnchor,
    refresh: loadComments,
  };
}
