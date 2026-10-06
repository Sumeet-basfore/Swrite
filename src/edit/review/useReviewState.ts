import { useState, useEffect, useCallback, useMemo } from 'react';
import { SwriteIpc } from '../../lib/ipc';
import { reportError } from '../../lib/errors';
import { DiscoveredFile } from '../../types/ipc';
import {
  ReviewFilters,
  ReviewQueueItem,
} from '../types';

interface UseReviewStateProps {
  currentDocumentPath: string | null;
  manuscriptFiles: DiscoveredFile[];
  onNavigateToPassage?: (filePath: string, startOffset?: number, endOffset?: number) => void;
}

export function useReviewState({
  currentDocumentPath,
  manuscriptFiles,
  onNavigateToPassage,
}: UseReviewStateProps) {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [filters, setFilters] = useState<ReviewFilters>({
    scope: 'current_doc',
    typeFilter: 'all',
    severityFilter: 'all',
    searchQuery: '',
  });

  // Calculate files in current scope
  const targetFiles = useMemo(() => {
    if (filters.scope === 'current_doc') {
      return manuscriptFiles.filter((f) => f.relative_path === currentDocumentPath);
    }
    if (filters.scope === 'current_chapter') {
      if (!currentDocumentPath) return [];
      const parts = currentDocumentPath.split('/');
      const parentDir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
      return manuscriptFiles.filter((f) => {
        const fileParts = f.relative_path.split('/');
        const fileParent = fileParts.length > 1 ? fileParts.slice(0, -1).join('/') : '';
        return fileParent === parentDir;
      });
    }
    // all_manuscript
    return manuscriptFiles;
  }, [filters.scope, currentDocumentPath, manuscriptFiles]);

  const loadAllReviewItems = useCallback(async () => {
    setLoading(true);
    try {
      const [commentsData, revisionsData, dictData] = await Promise.all([
        SwriteIpc.commentsLoad().catch(() => ({ comments: [] })),
        SwriteIpc.revisionsLoad().catch(() => ({ revisions: [] })),
        SwriteIpc.dictionaryLoad().catch(() => ({ custom_words: [], ignored_patterns: [], ignored_findings: [] })),
      ]);

      const ignoredSet = new Set(dictData.ignored_findings || []);
      const queue: ReviewQueueItem[] = [];

      // 1. Comments
      for (const comment of commentsData.comments) {
        if (comment.status !== 'open') continue;
        const inScope = targetFiles.some((f) => f.relative_path === comment.anchor.relative_path);
        if (!inScope && filters.scope !== 'all_manuscript') continue;

        queue.push({
          id: comment.id,
          type: 'comment',
          title: `Comment on "${comment.anchor.exact_text.slice(0, 30)}${comment.anchor.exact_text.length > 30 ? '...' : ''}"`,
          detail: comment.content,
          documentPath: comment.anchor.relative_path,
          documentId: comment.anchor.document_id,
          anchor: comment.anchor,
          severity: 'medium',
          status: comment.status,
          rawComment: comment,
        });
      }

      // 2. Revision Notes
      for (const rev of revisionsData.revisions) {
        if (rev.status !== 'open') continue;
        if (rev.target_path) {
          const inScope = targetFiles.some((f) => f.relative_path === rev.target_path);
          if (!inScope && filters.scope !== 'all_manuscript') continue;
        }

        queue.push({
          id: rev.id,
          type: 'revision',
          title: `[${rev.category}] ${rev.title}`,
          detail: rev.description,
          documentPath: rev.target_path || (currentDocumentPath || 'Manuscript'),
          anchor: rev.anchor,
          severity: rev.severity,
          category: rev.category,
          status: rev.status,
          rawRevision: rev,
        });
      }

      // 3. Proofreading scans on scoped files
      for (const file of targetFiles) {
        try {
          const content = await SwriteIpc.fileRead(file.relative_path);
          const findings = await SwriteIpc.proofreadText(content);

          for (const finding of findings) {
            if (ignoredSet.has(finding.id)) continue;

            queue.push({
              id: `${file.relative_path}::${finding.id}`,
              type: 'proofreading',
              title: finding.message,
              detail: `"${finding.matched_text}" ${finding.suggested_replacement ? `→ Suggestion: "${finding.suggested_replacement}"` : ''}`,
              documentPath: file.relative_path,
              severity: finding.severity,
              status: 'open',
              matchedText: finding.matched_text,
              suggestedReplacement: finding.suggested_replacement,
              lineNumber: finding.line_number,
              columnNumber: finding.column_number,
              rawFinding: finding,
            });
          }
        } catch {
          // continue
        }
      }

      setItems(queue);
      setSelectedIndex(0);
    } catch (e) {
      reportError('review-load', e);
    } finally {
      setLoading(false);
    }
  }, [targetFiles, filters.scope, currentDocumentPath]);

  useEffect(() => {
    loadAllReviewItems();
  }, [loadAllReviewItems]);

  // Filtered list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type filter
      if (filters.typeFilter !== 'all') {
        if (filters.typeFilter === 'proofreading' && item.type !== 'proofreading') return false;
        if (filters.typeFilter === 'comments' && item.type !== 'comment') return false;
        if (filters.typeFilter === 'revisions' && item.type !== 'revision') return false;
      }
      // Severity filter
      if (filters.severityFilter !== 'all') {
        if (filters.severityFilter === 'high' && item.severity !== 'high' && item.severity !== 'error') return false;
        if (filters.severityFilter === 'medium' && item.severity !== 'medium' && item.severity !== 'warning') return false;
        if (filters.severityFilter === 'low' && item.severity !== 'low' && item.severity !== 'info') return false;
      }
      // Search filter
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDetail = item.detail.toLowerCase().includes(query);
        const matchPath = item.documentPath.toLowerCase().includes(query);
        if (!matchTitle && !matchDetail && !matchPath) return false;
      }
      return true;
    });
  }, [items, filters]);

  // Actions
  const resolveItem = useCallback(
    async (item: ReviewQueueItem) => {
      if (item.type === 'comment' && item.rawComment) {
        await SwriteIpc.commentResolve(item.rawComment.id, true);
      } else if (item.type === 'revision' && item.rawRevision) {
        await SwriteIpc.revisionUpdate({
          ...item.rawRevision,
          status: 'resolved',
        });
      } else if (item.type === 'proofreading' && item.rawFinding) {
        await SwriteIpc.dictionaryAddIgnore(item.rawFinding.id);
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    },
    []
  );

  const ignoreItem = useCallback(
    async (item: ReviewQueueItem) => {
      if (item.type === 'comment' && item.rawComment) {
        await SwriteIpc.commentResolve(item.rawComment.id, true);
      } else if (item.type === 'revision' && item.rawRevision) {
        await SwriteIpc.revisionUpdate({
          ...item.rawRevision,
          status: 'ignored',
        });
      } else if (item.type === 'proofreading' && item.rawFinding) {
        await SwriteIpc.dictionaryAddIgnore(item.rawFinding.id);
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    },
    []
  );

  const applyReplacement = useCallback(
    async (item: ReviewQueueItem) => {
      if (item.type !== 'proofreading' || !item.rawFinding || !item.suggestedReplacement) return;
      try {
        const content = await SwriteIpc.fileRead(item.documentPath);
        const finding = item.rawFinding;
        if (
          finding.start_offset < content.length &&
          finding.end_offset <= content.length &&
          content.slice(finding.start_offset, finding.end_offset) === finding.matched_text
        ) {
          const updated =
            content.slice(0, finding.start_offset) +
            item.suggestedReplacement +
            content.slice(finding.end_offset);
          await SwriteIpc.fileWrite(item.documentPath, updated);
          // Auto resolve
          await SwriteIpc.dictionaryAddIgnore(finding.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        }
      } catch (e) {
        reportError('review-apply-replacement', e, { notify: true });
      }
    },
    []
  );

  const jumpToItem = useCallback(
    (item: ReviewQueueItem) => {
      if (!onNavigateToPassage) return;
      if (item.anchor) {
        onNavigateToPassage(item.documentPath, item.anchor.start_offset, item.anchor.end_offset);
      } else if (item.rawFinding) {
        onNavigateToPassage(item.documentPath, item.rawFinding.start_offset, item.rawFinding.end_offset);
      } else {
        onNavigateToPassage(item.documentPath);
      }
    },
    [onNavigateToPassage]
  );

  // Keyboard navigation
  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => (filteredItems.length === 0 ? 0 : (prev + 1) % filteredItems.length));
  }, [filteredItems.length]);

  const selectPrevious = useCallback(() => {
    setSelectedIndex((prev) =>
      filteredItems.length === 0 ? 0 : (prev - 1 + filteredItems.length) % filteredItems.length
    );
  }, [filteredItems.length]);

  return {
    items: filteredItems,
    allItemsCount: items.length,
    loading,
    filters,
    setFilters,
    selectedIndex,
    setSelectedIndex,
    resolveItem,
    ignoreItem,
    applyReplacement,
    jumpToItem,
    selectNext,
    selectPrevious,
    refresh: loadAllReviewItems,
  };
}
