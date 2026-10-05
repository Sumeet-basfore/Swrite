import { 
  ManuscriptSnapshot, SnapshotFilterOptions, SnapshotGroup, SnapshotType 
} from '../../types/snapshot';

/**
 * Groups snapshots into user-friendly literary time buckets.
 */
export function groupSnapshotsByTime(snapshots: ManuscriptSnapshot[]): SnapshotGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const sevenDaysAgo = today - (7 * 86400000);
  const thirtyDaysAgo = today - (30 * 86400000);

  const groups: Record<SnapshotGroup['timeGroup'], ManuscriptSnapshot[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'Earlier this Month': [],
    'Older': []
  };

  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const snap of sorted) {
    const time = new Date(snap.createdAt).getTime();
    if (time >= today) {
      groups['Today'].push(snap);
    } else if (time >= yesterday) {
      groups['Yesterday'].push(snap);
    } else if (time >= sevenDaysAgo) {
      groups['This Week'].push(snap);
    } else if (time >= thirtyDaysAgo) {
      groups['Earlier this Month'].push(snap);
    } else {
      groups['Older'].push(snap);
    }
  }

  const result: SnapshotGroup[] = [];
  const order: SnapshotGroup['timeGroup'][] = [
    'Today', 'Yesterday', 'This Week', 'Earlier this Month', 'Older'
  ];

  for (const key of order) {
    if (groups[key].length > 0) {
      result.push({
        timeGroup: key,
        snapshots: groups[key]
      });
    }
  }

  return result;
}

/**
 * Filters a list of snapshots based on multiple criteria.
 */
export function filterSnapshots(
  snapshots: ManuscriptSnapshot[],
  filter: SnapshotFilterOptions
): ManuscriptSnapshot[] {
  return snapshots.filter(snap => {
    if (filter.pinnedOnly && !snap.pinned) {
      return false;
    }

    if (filter.snapshotType && snap.snapshotType !== filter.snapshotType) {
      return false;
    }

    if (filter.scope && snap.scope !== filter.scope) {
      return false;
    }

    if (filter.targetChapterId) {
      if (snap.scope === 'chapter' && snap.targetChapterId !== filter.targetChapterId) {
        return false;
      }
      if (snap.scope === 'manuscript') {
        const containsCh = snap.projectData.acts.some(a => 
          a.chapters.some(c => c.id === filter.targetChapterId)
        );
        if (!containsCh) return false;
      }
    }

    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      const matchLabel = snap.label.toLowerCase().includes(q);
      const matchDesc = snap.description?.toLowerCase().includes(q) || false;
      const matchType = snap.snapshotType.toLowerCase().includes(q);
      const matchChTitle = snap.targetChapterTitle?.toLowerCase().includes(q) || false;
      if (!matchLabel && !matchDesc && !matchType && !matchChTitle) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Returns summary statistics for snapshots in a project.
 */
export function getSnapshotStats(snapshots: ManuscriptSnapshot[]): {
  totalCount: number;
  manualCount: number;
  autoCount: number;
  safetyCount: number;
  pinnedCount: number;
  earliestDate: string | null;
  latestDate: string | null;
} {
  let manualCount = 0;
  let autoCount = 0;
  let safetyCount = 0;
  let pinnedCount = 0;

  for (const s of snapshots) {
    if (s.pinned) pinnedCount++;
    if (s.snapshotType === 'manual') manualCount++;
    else if (s.snapshotType === 'auto') autoCount++;
    else if (s.snapshotType === 'pre-restore' || s.snapshotType === 'recovery' || s.snapshotType === 'pre-export') {
      safetyCount++;
    }
  }

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return {
    totalCount: snapshots.length,
    manualCount,
    autoCount,
    safetyCount,
    pinnedCount,
    earliestDate: sorted.length > 0 ? sorted[0].createdAt : null,
    latestDate: sorted.length > 0 ? sorted[sorted.length - 1].createdAt : null
  };
}

/**
 * Returns snapshot versions specifically touching a chapter.
 */
export function getChapterSnapshots(
  snapshots: ManuscriptSnapshot[],
  chapterId: string
): ManuscriptSnapshot[] {
  return snapshots.filter(snap => {
    if (snap.scope === 'chapter' && snap.targetChapterId === chapterId) {
      return true;
    }
    return snap.projectData.acts.some(a => a.chapters.some(c => c.id === chapterId));
  });
}
