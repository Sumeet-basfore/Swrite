import { useState, useEffect, useCallback } from 'react';
import { SwriteIpc } from '../../lib/ipc';
import { DocumentDiffResult, SnapshotMetadata } from '../../types/ipc';

interface UseHistoryDiffStateProps {
  currentDocumentPath: string | null;
}

export function useHistoryDiffState({ currentDocumentPath }: UseHistoryDiffStateProps) {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotMetadata[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);
  const [diffResult, setDiffResult] = useState<DocumentDiffResult | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [currentContent, setCurrentContent] = useState<string>('');

  // 1. Load document identity and current content
  useEffect(() => {
    if (!currentDocumentPath) {
      setDocumentId(null);
      setSnapshots([]);
      setDiffResult(null);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setLoadingSnapshots(true);
        const doc = await SwriteIpc.documentRead(currentDocumentPath);
        const rawContent = await SwriteIpc.fileRead(currentDocumentPath);
        if (!isMounted) return;

        setDocumentId(doc.id);
        setCurrentContent(rawContent);

        const list = await SwriteIpc.historyList(doc.id);
        if (!isMounted) return;
        setSnapshots(list);
        if (list.length > 0) {
          setSelectedSnapshotId(list[0].snapshot_id);
        } else {
          setSelectedSnapshotId(null);
        }
      } catch (e) {
        console.error('Failed to load history list for document:', e);
      } finally {
        if (isMounted) setLoadingSnapshots(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentDocumentPath]);

  // 2. Compute diff when selectedSnapshotId or compareWithPrevious changes
  useEffect(() => {
    if (!documentId || !selectedSnapshotId || !currentDocumentPath) {
      setDiffResult(null);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setLoadingDiff(true);

        if (compareWithPrevious) {
          // Find index of selected snapshot
          const idx = snapshots.findIndex((s) => s.snapshot_id === selectedSnapshotId);
          if (idx < snapshots.length - 1) {
            const prevSnapshot = snapshots[idx + 1];
            const diff = await SwriteIpc.historyDiffSnapshots(
              documentId,
              prevSnapshot.snapshot_id,
              selectedSnapshotId
            );
            if (isMounted) setDiffResult(diff);
          } else {
            // No previous snapshot, compare against empty
            const diff = await SwriteIpc.historyDiffCurrent(
              documentId,
              selectedSnapshotId,
              ''
            );
            if (isMounted) setDiffResult(diff);
          }
        } else {
          // Compare snapshot vs current content
          const diff = await SwriteIpc.historyDiffCurrent(
            documentId,
            selectedSnapshotId,
            currentContent
          );
          if (isMounted) setDiffResult(diff);
        }
      } catch (e) {
        console.error('Failed to compute diff:', e);
      } finally {
        if (isMounted) setLoadingDiff(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [documentId, selectedSnapshotId, compareWithPrevious, currentContent, snapshots, currentDocumentPath]);

  // 3. Create snapshot on demand
  const createSnapshot = useCallback(
    async (label?: string) => {
      if (!documentId || !currentDocumentPath) return;
      try {
        const rawContent = await SwriteIpc.fileRead(currentDocumentPath);
        const meta = await SwriteIpc.historyRecord(
          documentId,
          currentDocumentPath,
          rawContent,
          label || 'Manual snapshot'
        );
        setSnapshots((prev) => [meta, ...prev]);
        setSelectedSnapshotId(meta.snapshot_id);
      } catch (e) {
        console.error('Failed to create snapshot:', e);
      }
    },
    [documentId, currentDocumentPath]
  );

  // 4. Safe Restore
  const safeRestore = useCallback(
    async (snapshotId: string) => {
      if (!documentId || !currentDocumentPath) return null;
      try {
        setRestoring(true);
        const restoredContent = await SwriteIpc.historySafeRestore(
          documentId,
          currentDocumentPath,
          snapshotId,
          currentContent
        );
        setCurrentContent(restoredContent);

        // Refresh snapshots list
        const updatedList = await SwriteIpc.historyList(documentId);
        setSnapshots(updatedList);
        setSelectedSnapshotId(snapshotId);
        return restoredContent;
      } catch (e) {
        console.error('Failed to restore snapshot:', e);
        throw e;
      } finally {
        setRestoring(false);
      }
    },
    [documentId, currentDocumentPath, currentContent]
  );

  return {
    documentId,
    snapshots,
    loadingSnapshots,
    selectedSnapshotId,
    setSelectedSnapshotId,
    compareWithPrevious,
    setCompareWithPrevious,
    diffResult,
    loadingDiff,
    restoring,
    createSnapshot,
    safeRestore,
  };
}
