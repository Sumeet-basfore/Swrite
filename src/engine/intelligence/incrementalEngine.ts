/**
 * SWRITE — Continuous Incremental Intelligence Engine
 * Orchestrates background incremental indexing, scoped delta analysis,
 * Organization Inbox state management, cross-project async cancellation guards,
 * and reversible proposal application.
 */

import { ProjectData } from '../../types';
import { 
  ProjectIntelligenceIndex, 
  IncrementalChangeDelta, 
  OrganizationInboxItem, 
  ContextualSuggestion, 
  InboxFilterCategory, 
  InboxItemStatus, 
  IntelligenceStatus,
  IntelligenceAnalysisOptions,
  OrganizationModelProvider,
  OrganizationProposal
} from '../../types/intelligence';
import { ProjectIntelligenceIndexer } from './indexer';
import { DeterministicLocalProvider } from './provider';
import { ProjectIntelligenceApplier } from './applier';

export class IncrementalIntelligenceEngine {
  private indices: Map<string, ProjectIntelligenceIndex> = new Map();
  private inboxStore: Map<string, OrganizationInboxItem[]> = new Map();
  private activeProjectId: string | null = null;
  private currentAnalysisToken: number = 0;
  private provider: OrganizationModelProvider;

  constructor(provider?: OrganizationModelProvider) {
    this.provider = provider || new DeterministicLocalProvider();
  }

  /**
   * Sets the active project and cancels any running background analysis for previous projects
   */
  setActiveProject(projectId: string) {
    if (this.activeProjectId !== projectId) {
      this.activeProjectId = projectId;
      this.currentAnalysisToken++;
    }
  }

  /**
   * Retrieves the current non-canonical index for a project
   */
  getIndex(projectId: string): ProjectIntelligenceIndex | undefined {
    return this.indices.get(projectId);
  }

  /**
   * Gets the overall intelligence status for a project
   */
  getStatus(projectId: string): IntelligenceStatus {
    const index = this.indices.get(projectId);
    if (!index) return 'up-to-date';
    if (index.dirtyDocumentIds.length > 0) return 'changes-detected';
    
    const items = this.inboxStore.get(projectId) || [];
    const pendingItems = items.filter(i => i.status === 'pending');
    if (pendingItems.some(i => i.proposal.conflictsWithCanon)) return 'conflict-detected';
    if (pendingItems.length > 0) return 'needs-review';
    
    return 'up-to-date';
  }

  /**
   * Runs an incremental change detection and scoped intelligence analysis
   */
  async analyzeIncremental(
    project: ProjectData,
    options?: IntelligenceAnalysisOptions
  ): Promise<{
    index: ProjectIntelligenceIndex;
    delta: IncrementalChangeDelta;
    newInboxItems: OrganizationInboxItem[];
    suggestions: ContextualSuggestion[];
    status: IntelligenceStatus;
    wasCancelled?: boolean;
  }> {
    const projectId = project.metadata?.id || 'default-project';
    this.setActiveProject(projectId);
    const analysisToken = this.currentAnalysisToken;

    // 1. Index Project & Calculate Delta
    const existingIndex = this.indices.get(projectId);
    const { index, delta } = ProjectIntelligenceIndexer.indexProject(project, existingIndex);

    // Save updated index
    this.indices.set(projectId, index);

    // If no changes, return early
    if (delta.dirtyDocumentIds.length === 0 && (this.inboxStore.get(projectId) || []).length > 0) {
      return {
        index,
        delta,
        newInboxItems: [],
        suggestions: this.generateContextualSuggestions(project, projectId),
        status: this.getStatus(projectId)
      };
    }

    // 2. Perform Scoped Intelligence Analysis via Provider
    const result = await this.provider.analyzeProject(project, options);

    // Async Cancellation Guard Check: Verify active project hasn't changed during async operation
    if (this.currentAnalysisToken !== analysisToken || this.activeProjectId !== projectId) {
      return {
        index,
        delta,
        newInboxItems: [],
        suggestions: [],
        status: 'up-to-date',
        wasCancelled: true
      };
    }

    // 3. Process proposals into Organization Inbox Items
    const existingInbox = this.inboxStore.get(projectId) || [];
    const existingProposalKeys = new Set(existingInbox.map(i => `${i.proposal.domain}-${i.proposal.targetName.toLowerCase()}`));

    const newInboxItems: OrganizationInboxItem[] = [];

    result.proposals.forEach(prop => {
      const propKey = `${prop.domain}-${prop.targetName.toLowerCase()}`;
      if (!existingProposalKeys.has(propKey)) {
        const category = this.mapDomainToCategory(prop.domain, prop);
        const item: OrganizationInboxItem = {
          id: `inbox-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          proposal: prop,
          category,
          status: 'pending',
          createdTimestamp: new Date().toISOString(),
          userFacingReason: prop.reasoning,
          contextSnippet: prop.sourceReferences[0]?.snippet || ''
        };
        newInboxItems.push(item);
        existingInbox.unshift(item);
      }
    });

    this.inboxStore.set(projectId, existingInbox);

    // Mark analyzed documents as up-to-date in index
    delta.dirtyDocumentIds.forEach(id => {
      if (index.contentHashes[id]) {
        index.contentHashes[id].status = 'up-to-date';
        index.contentHashes[id].lastAnalyzed = new Date().toISOString();
      }
    });
    index.dirtyDocumentIds = [];
    index.inboxItemIds = existingInbox.map(i => i.id);

    const suggestions = this.generateContextualSuggestions(project, projectId);

    return {
      index,
      delta,
      newInboxItems,
      suggestions,
      status: this.getStatus(projectId)
    };
  }

  /**
   * Map proposal domain and properties to Inbox filter category
   */
  private mapDomainToCategory(domain: string, proposal: OrganizationProposal): InboxFilterCategory {
    if (proposal.duplicateCandidate) return 'duplicates';
    if (proposal.conflictsWithCanon || (proposal.canonConflicts && proposal.canonConflicts.length > 0)) return 'conflicts';

    switch (domain) {
      case 'character': return 'characters';
      case 'timeline':
      case 'event': return 'timeline';
      case 'outline': return 'outline';
      case 'plotThread':
      case 'faction':
      case 'item': return 'relationships';
      case 'research': return 'research';
      default: return 'all';
    }
  }

  /**
   * Retrieves inbox items for a project, optionally filtered by category
   */
  getInboxItems(projectId: string, category: InboxFilterCategory = 'all'): OrganizationInboxItem[] {
    const items = this.inboxStore.get(projectId) || [];
    if (category === 'all') return items;

    if (category === 'conflicts') {
      return items.filter(i => i.proposal.conflictsWithCanon || (i.proposal.canonConflicts && i.proposal.canonConflicts.length > 0));
    }
    if (category === 'duplicates') {
      return items.filter(i => !!i.proposal.duplicateCandidate);
    }

    return items.filter(i => i.category === category);
  }

  /**
   * Updates an inbox item status
   */
  updateInboxItemStatus(projectId: string, itemId: string, newStatus: InboxItemStatus) {
    const items = this.inboxStore.get(projectId) || [];
    const target = items.find(i => i.id === itemId);
    if (target) {
      target.status = newStatus;
      target.updatedTimestamp = new Date().toISOString();
      if (newStatus === 'accepted') target.proposal.status = 'accepted';
      if (newStatus === 'rejected') target.proposal.status = 'rejected';
    }
  }

  /**
   * Applies all pending accepted proposals or specific inbox items with safety snapshot
   */
  applyInboxProposals(
    project: ProjectData,
    itemIdsToApply?: string[]
  ): { updatedProject: ProjectData; appliedCount: number; safetySnapshotId: string } {
    const projectId = project.metadata?.id || 'default-project';
    const items = this.inboxStore.get(projectId) || [];

    let targetItems: OrganizationInboxItem[];
    if (itemIdsToApply && itemIdsToApply.length > 0) {
      const idSet = new Set(itemIdsToApply);
      targetItems = items.filter(i => idSet.has(i.id));
    } else {
      // Default to items marked accepted or high-confidence pending
      targetItems = items.filter(i => i.status === 'accepted' || (i.status === 'pending' && i.proposal.confidence >= 0.8 && !i.proposal.conflictsWithCanon));
    }

    const proposalsToApply = targetItems.map(i => i.proposal);

    const result = ProjectIntelligenceApplier.applyApprovedProposals(project, proposalsToApply);

    // Update inbox statuses
    targetItems.forEach(item => {
      item.status = 'accepted';
      item.proposal.status = 'applied';
      item.proposal.appliedAt = new Date().toISOString();
    });

    return result;
  }

  /**
   * Reverts an organization batch using safety snapshot ID
   */
  rollbackProposals(project: ProjectData, safetySnapshotId: string): ProjectData {
    return ProjectIntelligenceApplier.rollbackOrganization(project, safetySnapshotId);
  }

  /**
   * Generates non-intrusive contextual suggestions for active manuscript documents
   */
  generateContextualSuggestions(project: ProjectData, projectId: string, activeDocId?: string): ContextualSuggestion[] {
    const items = this.getInboxItems(projectId, 'all').filter(i => i.status === 'pending');
    const suggestions: ContextualSuggestion[] = [];

    items.forEach(item => {
      const prop = item.proposal;
      
      // If active document specified, prioritize suggestions referencing this document
      if (activeDocId) {
        const matchesDoc = prop.sourceReferences.some(r => r.documentId === activeDocId);
        if (!matchesDoc) return;
      }

      let suggestionType: ContextualSuggestion['suggestionType'] = 'new-character';
      let title = `Discovered ${prop.targetName}`;
      let priority: ContextualSuggestion['priority'] = 'low';

      if (prop.conflictsWithCanon) {
        suggestionType = 'canon-conflict';
        title = `Canon Conflict: ${prop.targetName}`;
        priority = 'high';
      } else if (prop.duplicateCandidate) {
        suggestionType = 'duplicate-warning';
        title = `Possible Duplicate: ${prop.targetName}`;
        priority = 'medium';
      } else if (prop.domain === 'character') {
        suggestionType = 'new-character';
        title = `Character Suggestion: ${prop.targetName}`;
        priority = prop.confidence >= 0.8 ? 'medium' : 'low';
      } else if (prop.domain === 'timeline' || prop.domain === 'event') {
        suggestionType = 'timeline-event';
        title = `Timeline Event: ${prop.targetName}`;
        priority = 'low';
      } else if (prop.domain === 'location') {
        suggestionType = 'location-mention';
        title = `Location Mention: ${prop.targetName}`;
        priority = 'low';
      }

      suggestions.push({
        id: `sug-${item.id}`,
        domain: prop.domain,
        targetId: prop.targetEntityId,
        targetName: prop.targetName,
        suggestionType,
        title,
        text: item.userFacingReason,
        snippet: item.contextSnippet,
        proposalId: prop.id,
        priority,
        createdAt: item.createdTimestamp
      });
    });

    return suggestions.sort((a, b) => {
      const pMap = { high: 3, medium: 2, low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    });
  }
}
