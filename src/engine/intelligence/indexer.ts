/**
 * SWRITE — Project Intelligence Indexer
 * Calculates content hashes, tracks dirty document states, maintains non-canonical
 * index metadata, and builds scoped retrieval contexts for incremental analysis.
 */

import { ProjectData } from '../../types';
import { 
  ProjectIntelligenceIndex, 
  ContentHashRecord, 
  IncrementalChangeDelta, 
  IntelligenceStatus 
} from '../../types/intelligence';

/**
 * Fast deterministic string hashing function (FNV-1a 32-bit hex)
 */
export function computeContentHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export interface HashableDocument {
  id: string;
  title: string;
  type: 'chapter' | 'scene' | 'character' | 'location' | 'faction' | 'item' | 'research' | 'cut-drawer' | 'event';
  contentToHash: string;
}

/**
 * Extracts all hashable items from ProjectData
 */
export function extractHashableDocuments(project: ProjectData): HashableDocument[] {
  const docs: HashableDocument[] = [];

  // Chapters & Scenes
  if (project.acts) {
    project.acts.forEach(act => {
      act.chapters.forEach(chapter => {
        docs.push({
          id: chapter.id,
          title: chapter.title,
          type: 'chapter',
          contentToHash: `${chapter.title}\n${chapter.synopsis || ''}\n${chapter.content}`
        });

        if (chapter.scenes) {
          chapter.scenes.forEach(scene => {
            docs.push({
              id: scene.id,
              title: scene.title,
              type: 'scene',
              contentToHash: `${scene.title}\n${scene.purpose || ''}\n${scene.content}\n${(scene.characterIds || []).join(',')}`
            });
          });
        }
      });
    });
  }

  // Characters
  if (project.characters) {
    project.characters.forEach(char => {
      docs.push({
        id: char.id,
        title: char.name,
        type: 'character',
        contentToHash: `${char.name}\n${char.role || ''}\n${char.bio || ''}\n${char.motivations || ''}\n${(char.aliases || []).join(',')}`
      });
    });
  }


  // Locations
  if (project.locations) {
    project.locations.forEach(loc => {
      docs.push({
        id: loc.id,
        title: loc.name,
        type: 'location',
        contentToHash: `${loc.name}\n${loc.summary || ''}\n${loc.description || ''}`
      });
    });
  }

  // Factions
  if (project.factions) {
    project.factions.forEach(fac => {
      docs.push({
        id: fac.id,
        title: fac.name,
        type: 'faction',
        contentToHash: `${fac.name}\n${fac.summary || ''}\n${fac.description || ''}`
      });
    });
  }

  // Items
  if (project.items) {
    project.items.forEach(item => {
      docs.push({
        id: item.id,
        title: item.name,
        type: 'item',
        contentToHash: `${item.name}\n${item.summary || ''}\n${item.description || ''}`
      });
    });
  }

  // Research Notes
  if (project.researchNotes) {
    project.researchNotes.forEach(res => {
      docs.push({
        id: res.id,
        title: res.title,
        type: 'research',
        contentToHash: `${res.title}\n${res.content}\n${(res.tags || []).join(',')}`
      });
    });
  }

  // Cut Drawer
  if (project.cutScenes) {
    project.cutScenes.forEach(cut => {
      docs.push({
        id: cut.id,
        title: cut.title,
        type: 'cut-drawer',
        contentToHash: `${cut.title}\n${cut.content}`
      });
    });
  }

  return docs;
}

export class ProjectIntelligenceIndexer {
  /**
   * Scans ProjectData and updates the non-canonical ProjectIntelligenceIndex,
   * returning both the updated index and the calculated change delta.
   */
  static indexProject(
    project: ProjectData,
    existingIndex?: ProjectIntelligenceIndex
  ): { index: ProjectIntelligenceIndex; delta: IncrementalChangeDelta } {
    const projectId = project.metadata?.id || 'default-project';
    const now = new Date().toISOString();

    const previousHashes = existingIndex?.contentHashes || {};
    const newHashes: Record<string, ContentHashRecord> = {};
    
    const hashableDocs = extractHashableDocuments(project);
    const currentDocIds = new Set(hashableDocs.map(d => d.id));

    const dirtyIds: string[] = [];
    const addedIds: string[] = [];
    const updatedIds: string[] = [];
    const deletedIds: string[] = [];

    // Check added and updated docs
    hashableDocs.forEach(doc => {
      const hash = computeContentHash(doc.contentToHash);
      const prevRecord = previousHashes[doc.id];

      if (!prevRecord) {
        // Brand new document
        addedIds.push(doc.id);
        dirtyIds.push(doc.id);
        newHashes[doc.id] = {
          id: doc.id,
          title: doc.title,
          type: doc.type,
          hash,
          lastModified: now,
          status: 'changes-detected'
        };
      } else if (prevRecord.hash !== hash) {
        // Updated content
        updatedIds.push(doc.id);
        dirtyIds.push(doc.id);
        newHashes[doc.id] = {
          ...prevRecord,
          title: doc.title,
          hash,
          lastModified: now,
          status: 'changes-detected'
        };
      } else {
        // Unchanged
        newHashes[doc.id] = {
          ...prevRecord
        };
      }
    });

    // Check deleted docs
    Object.keys(previousHashes).forEach(prevId => {
      if (!currentDocIds.has(prevId)) {
        deletedIds.push(prevId);
      }
    });

    // Determine retrieval scope (dirty documents + immediate related entities)
    const retrievalScopeIds = this.calculateRetrievalScope(project, dirtyIds);

    const delta: IncrementalChangeDelta = {
      projectId,
      dirtyDocumentIds: dirtyIds,
      addedDocumentIds: addedIds,
      updatedDocumentIds: updatedIds,
      deletedDocumentIds: deletedIds,
      retrievalScopeIds,
      timestamp: now
    };

    const index: ProjectIntelligenceIndex = {
      projectId,
      lastFullAnalysis: existingIndex?.lastFullAnalysis,
      lastIncrementalAnalysis: dirtyIds.length > 0 ? now : (existingIndex?.lastIncrementalAnalysis || now),
      contentHashes: newHashes,
      extractedEntityIds: existingIndex?.extractedEntityIds || [],
      knownAliases: existingIndex?.knownAliases || {},
      dirtyDocumentIds: dirtyIds,
      inboxItemIds: existingIndex?.inboxItemIds || []
    };

    return { index, delta };
  }

  /**
   * Calculates the retrieval scope for incremental analysis.
   * Includes dirty items and related entity contexts (characters, locations, chapter containers).
   */
  static calculateRetrievalScope(project: ProjectData, dirtyIds: string[]): string[] {
    const scopeSet = new Set<string>(dirtyIds);

    if (dirtyIds.length === 0) {
      return [];
    }

    const dirtySet = new Set(dirtyIds);

    // Expand scope to parent chapters or scenes referenced characters/locations
    if (project.acts) {
      project.acts.forEach(act => {
        act.chapters.forEach(chapter => {
          const chapterIsDirty = dirtySet.has(chapter.id);
          if (chapter.scenes) {
            chapter.scenes.forEach(scene => {
              const sceneIsDirty = dirtySet.has(scene.id);
              if (chapterIsDirty || sceneIsDirty) {
                scopeSet.add(chapter.id);
                scopeSet.add(scene.id);

                // Add referenced characters & locations
                if (scene.characterIds) scene.characterIds.forEach(id => scopeSet.add(id));
                if (scene.locationIds) scene.locationIds.forEach(id => scopeSet.add(id));
              }

            });
          }
        });
      });
    }

    return Array.from(scopeSet);
  }
}
