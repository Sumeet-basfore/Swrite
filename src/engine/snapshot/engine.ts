import { ProjectData, Chapter } from '../../types';
import { 
  ManuscriptSnapshot, SnapshotType, SnapshotScope, SnapshotRestoreOptions, 
  SnapshotRestoreResult 
} from '../../types/snapshot';

/**
 * Deterministic FNV-1a hash algorithm for strings.
 */
export function computeStringHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Calculates a content hash representing the manuscript text.
 */
export function computeManuscriptHash(project: ProjectData): string {
  const parts: string[] = [];
  project.acts.forEach(act => {
    parts.push(`act:${act.id}:${act.title}`);
    act.chapters.forEach(ch => {
      parts.push(`ch:${ch.id}:${ch.title}:${ch.content || ''}`);
      ch.scenes?.forEach(sc => {
        parts.push(`sc:${sc.id}:${sc.title}:${sc.content || ''}`);
      });
    });
  });
  return computeStringHash(parts.join('|'));
}

/**
 * Calculates a hash representing Story Engine entities and structure metadata.
 */
export function computeMetadataHash(project: ProjectData): string {
  const parts: string[] = [
    project.metadata.id,
    project.metadata.title,
    project.metadata.genre,
    `chars:${(project.characters || []).map(c => `${c.id}:${c.name}`).join(',')}`,
    `threads:${(project.plotThreads || []).map(t => `${t.id}:${t.title}:${t.status}`).join(',')}`,
    `locations:${(project.locations || []).map(l => `${l.id}:${l.name}`).join(',')}`,
    `arcs:${(project.storyArcs || []).map(a => `${a.id}:${a.title}`).join(',')}`
  ];
  return computeStringHash(parts.join('|'));
}

export interface CreateSnapshotOptions {
  label?: string;
  description?: string;
  type?: SnapshotType;
  source?: string;
  scope?: SnapshotScope;
  targetChapterId?: string;
  targetSceneId?: string;
  pinned?: boolean;
}

/**
 * Creates a clean, isolated Manuscript Snapshot from the current ProjectData.
 */
export function createSnapshot(
  project: ProjectData,
  options: CreateSnapshotOptions = {}
): ManuscriptSnapshot {
  const now = new Date().toISOString();
  const snapshotType = options.type || 'manual';
  const scope = options.scope || 'manuscript';
  const source = options.source || 'user';

  // Calculate metrics
  let totalWords = 0;
  let totalChapters = 0;
  let totalScenes = 0;

  let targetChapterTitle: string | undefined;
  let targetSceneTitle: string | undefined;

  project.acts.forEach(act => {
    totalChapters += act.chapters.length;
    act.chapters.forEach(ch => {
      totalWords += ch.wordCount || (ch.content ? ch.content.trim().split(/\s+/).filter(Boolean).length : 0);
      if (ch.scenes && ch.scenes.length > 0) {
        totalScenes += ch.scenes.length;
        if (options.targetSceneId) {
          const sc = ch.scenes.find(s => s.id === options.targetSceneId);
          if (sc) targetSceneTitle = sc.title;
        }
      }
      if (ch.id === options.targetChapterId) {
        targetChapterTitle = ch.title;
      }
    });
  });

  const defaultLabel = snapshotType === 'manual'
    ? `Snapshot ${new Date().toLocaleString()}`
    : `${snapshotType.charAt(0).toUpperCase() + snapshotType.slice(1)} Snapshot (${new Date().toLocaleTimeString()})`;

  const label = options.label || defaultLabel;

  // Deep clone projectData to ensure full isolation
  const clonedProject: ProjectData = JSON.parse(JSON.stringify(project));
  // Omit the snapshots array inside the snapshot itself to avoid recursive storage growth
  delete clonedProject.snapshots;

  const contentHash = computeManuscriptHash(project);
  const metadataHash = computeMetadataHash(project);

  const snapshot: ManuscriptSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    projectId: project.metadata.id,
    label,
    description: options.description,
    createdAt: now,
    snapshotType,
    source,
    scope,
    targetChapterId: options.targetChapterId,
    targetChapterTitle,
    targetSceneId: options.targetSceneId,
    targetSceneTitle,
    wordCount: totalWords,
    chapterCount: totalChapters,
    sceneCount: totalScenes,
    characterCount: project.characters?.length || 0,
    plotThreadCount: project.plotThreads?.length || 0,
    contentHash,
    metadataHash,
    schemaVersion: 2,
    pinned: options.pinned || false,
    projectData: clonedProject
  };

  return snapshot;
}

/**
 * Verifies the integrity of a snapshot object.
 */
export function verifySnapshotIntegrity(snapshot: ManuscriptSnapshot): { isValid: boolean; error?: string } {
  if (!snapshot || !snapshot.id || !snapshot.createdAt) {
    return { isValid: false, error: 'Malformed snapshot header or missing ID.' };
  }

  if (!snapshot.projectData || !Array.isArray(snapshot.projectData.acts)) {
    return { isValid: false, error: 'Snapshot payload does not contain valid manuscript acts.' };
  }

  const computedContent = computeManuscriptHash(snapshot.projectData);
  if (snapshot.contentHash && snapshot.contentHash !== computedContent) {
    return { 
      isValid: false, 
      error: `Content hash mismatch (expected: ${snapshot.contentHash}, actual: ${computedContent}).` 
    };
  }

  return { isValid: true };
}

/**
 * Restores a snapshot non-destructively.
 * Crucial Rule: Always generates a pre-restore safety snapshot before applying changes.
 */
export function restoreSnapshot(
  currentProject: ProjectData,
  snapshot: ManuscriptSnapshot,
  options: SnapshotRestoreOptions = {}
): SnapshotRestoreResult {
  const scope = options.restoreScope || snapshot.scope || 'manuscript';

  // 1. Create automatic pre-restore safety snapshot
  const safetyLabel = options.customSafetyLabel || `Before restoring "${snapshot.label}"`;
  const preRestoreSnapshot = createSnapshot(currentProject, {
    label: safetyLabel,
    description: `Auto-generated safety snapshot created prior to restoring snapshot ${snapshot.id}`,
    type: 'pre-restore',
    source: 'restore-operation',
    scope
  });

  let restoredProject: ProjectData;
  let restoredEntitiesSummary = '';

  if (scope === 'chapter' && (options.targetChapterId || snapshot.targetChapterId)) {
    const chapterId = options.targetChapterId || snapshot.targetChapterId!;
    
    // Find chapter in snapshot
    let snapshotChapter: Chapter | null = null;
    for (const act of snapshot.projectData.acts) {
      const found = act.chapters.find(c => c.id === chapterId);
      if (found) {
        snapshotChapter = JSON.parse(JSON.stringify(found));
        break;
      }
    }

    if (!snapshotChapter) {
      throw new Error(`Chapter ${chapterId} was not found in snapshot "${snapshot.label}".`);
    }

    // Clone current project
    restoredProject = JSON.parse(JSON.stringify(currentProject));
    
    // Replace in current project
    let replaced = false;
    for (const act of restoredProject.acts) {
      const idx = act.chapters.findIndex(c => c.id === chapterId);
      if (idx !== -1) {
        act.chapters[idx] = snapshotChapter;
        replaced = true;
        break;
      }
    }

    // If chapter had been deleted from current project, insert it into first act or matching act
    if (!replaced) {
      if (restoredProject.acts.length === 0) {
        restoredProject.acts.push({
          id: `act-${Date.now()}`,
          title: 'Act I',
          order: 1,
          chapters: [snapshotChapter]
        });
      } else {
        restoredProject.acts[0].chapters.push(snapshotChapter);
      }
    }

    restoredEntitiesSummary = `Restored Chapter "${snapshotChapter.title}" (${snapshotChapter.wordCount || 0} words)`;
  } else {
    // Full Manuscript Restore
    restoredProject = JSON.parse(JSON.stringify(snapshot.projectData));
    
    // Preserve existing snapshots history in restored project
    const existingSnapshots = currentProject.snapshots || [];
    restoredProject.snapshots = [preRestoreSnapshot, ...existingSnapshots];

    // Update metadata timestamp
    restoredProject.metadata.updatedAt = new Date().toISOString();

    restoredEntitiesSummary = `Full Manuscript Restored (${snapshot.chapterCount} chapters, ${snapshot.wordCount} words, ${snapshot.characterCount} characters)`;
    return {
      restoredProject,
      preRestoreSnapshot,
      restoredScope: 'manuscript',
      restoredEntitiesSummary
    };
  }

  // Prepend safety snapshot to snapshots history
  const existingSnapshots = currentProject.snapshots || [];
  restoredProject.snapshots = [preRestoreSnapshot, ...existingSnapshots];
  restoredProject.metadata.updatedAt = new Date().toISOString();

  return {
    restoredProject,
    preRestoreSnapshot,
    restoredScope: scope,
    restoredEntitiesSummary
  };
}

/**
 * Pruning policy for automatic snapshots to ensure storage remains lightweight.
 * Retains all manual, pinned, revision-round, pre-export, and pre-restore snapshots indefinitely.
 * Caps ephemeral auto-saves to maxAutoCount.
 */
export function pruneAutoSnapshots(
  snapshots: ManuscriptSnapshot[],
  maxAutoCount: number = 20
): ManuscriptSnapshot[] {
  const manualOrPinned: ManuscriptSnapshot[] = [];
  const autoSnapshots: ManuscriptSnapshot[] = [];

  for (const s of snapshots) {
    if (s.pinned || s.snapshotType === 'manual' || s.snapshotType === 'revision-round' || s.snapshotType === 'pre-migration' || s.snapshotType === 'pre-restore') {
      manualOrPinned.push(s);
    } else {
      autoSnapshots.push(s);
    }
  }

  // Sort auto snapshots by date descending
  autoSnapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Keep latest maxAutoCount
  const keptAuto = autoSnapshots.slice(0, maxAutoCount);

  // Return combined sorted list
  const combined = [...manualOrPinned, ...keptAuto];
  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return combined;
}
