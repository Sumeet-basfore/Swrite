import { useState, useEffect, useCallback } from 'react';
import { SwriteIpc } from '../../lib/ipc';
import { RevisionCategory, RevisionNote, RevisionSeverity, RevisionStatus, TextAnchor } from '../../types/ipc';

export function useRevisionsState(currentDocumentPath: string | null) {
  const [revisions, setRevisions] = useState<RevisionNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RevisionStatus | 'all'>('open');
  const [categoryFilter, setCategoryFilter] = useState<RevisionCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<RevisionSeverity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadRevisions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SwriteIpc.revisionsLoad();
      setRevisions(data.revisions || []);
    } catch (e) {
      console.error('Failed to load revisions:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  const addRevision = useCallback(
    async (
      title: string,
      description: string,
      category: RevisionCategory,
      severity: RevisionSeverity,
      targetPath?: string | null,
      anchor?: TextAnchor | null
    ) => {
      const now = new Date().toISOString();
      const newRev: RevisionNote = {
        id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title,
        description,
        category,
        severity,
        status: 'open',
        target_path: targetPath || currentDocumentPath || undefined,
        anchor: anchor || undefined,
        created_at: now,
        updated_at: now,
      };

      await SwriteIpc.revisionAdd(newRev);
      setRevisions((prev) => [newRev, ...prev]);
      return newRev;
    },
    [currentDocumentPath]
  );

  const updateRevision = useCallback(
    async (rev: RevisionNote) => {
      const updated = {
        ...rev,
        updated_at: new Date().toISOString(),
      };
      await SwriteIpc.revisionUpdate(updated);
      setRevisions((prev) => prev.map((r) => (r.id === rev.id ? updated : r)));
    },
    []
  );

  const deleteRevision = useCallback(async (id: string) => {
    await SwriteIpc.revisionDelete(id);
    setRevisions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const setStatus = useCallback(
    async (id: string, status: RevisionStatus) => {
      const target = revisions.find((r) => r.id === id);
      if (!target) return;
      const updated: RevisionNote = {
        ...target,
        status,
        updated_at: new Date().toISOString(),
      };
      await SwriteIpc.revisionUpdate(updated);
      setRevisions((prev) => prev.map((r) => (r.id === id ? updated : r)));
    },
    [revisions]
  );

  const filteredRevisions = revisions.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchCat = r.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  return {
    revisions: filteredRevisions,
    allRevisionsCount: revisions.length,
    loading,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    severityFilter,
    setSeverityFilter,
    searchQuery,
    setSearchQuery,
    addRevision,
    updateRevision,
    deleteRevision,
    setStatus,
    refresh: loadRevisions,
  };
}
