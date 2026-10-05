/**
 * SWRITE — Continuous Incremental Intelligence Engine
 * Orchestrates Deep Organization and Continuous Maintenance analysis modes,
 * noise suppression, intelligent proposal batching, evidence hash anti-alerting,
 * Organization Inbox state management, cross-project async cancellation guards,
 * and reversible proposal application.
 */

import { ProjectData } from '../../types';
import { 
  ProjectIntelligenceIndex, 
  ProjectIntelligenceBaseline,
  IncrementalChangeDelta, 
  OrganizationInboxItem, 
  BatchedInboxGroup,
  ContextualSuggestion, 
  InboxFilterCategory, 
  InboxItemStatus, 
  IntelligenceStatus,
  IntelligenceAnalysisOptions,
  OrganizationModelProvider,
  OrganizationProposal,
  ContextualActionType
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
  private isAnalyzing: boolean = false;

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
      this.isAnalyzing = false;
    }
  }

  /**
   * Retrieves the current non-canonical index for a project
   */
  getIndex(projectId: string): ProjectIntelligenceIndex | undefined {
    return this.indices.get(projectId);
  }

  /**
   * Gets the factual editorial intelligence status for a project
   */
  getStatus(projectId: string): IntelligenceStatus {
    if (this.isAnalyzing) return 'analyzing';
    if (!this.provider.isAvailable()) return 'analysis-unavailable';

    const index = this.indices.get(projectId);
    if (!index) return 'up-to-date';
    
    const items = (this.inboxStore.get(projectId) || []).filter(i => i.status === 'pending');
    if (items.some(i => i.proposal.conflictsWithCanon)) return 'conflict-detected';
    if (items.length > 0) return 'review-available';
    
    return 'up-to-date';
  }

  /**
   * Deep Organization Mode: Whole-project analysis pass triggered by explicit author action.
   * Establishes/updates the ProjectIntelligenceBaseline.
   */
  async analyzeDeep(
    project: ProjectData,
    options?: IntelligenceAnalysisOptions
  ): Promise<{
    index: ProjectIntelligenceIndex;
    newInboxItems: OrganizationInboxItem[];
    batchedGroups: BatchedInboxGroup[];
    status: IntelligenceStatus;
    usefulOrganizationRate?: number;
    noiseRate?: number;
    wasCancelled?: boolean;
  }> {
    const projectId = project.metadata?.id || 'default-project';
    this.setActiveProject(projectId);
    const analysisToken = this.currentAnalysisToken;
    this.isAnalyzing = true;

    try {
      const deepOptions: IntelligenceAnalysisOptions = {
        ...options,
        mode: 'deep-organization'
      };

      const result = await this.provider.analyzeProject(project, deepOptions);

      // Async Cancellation Guard Check
      if (this.currentAnalysisToken !== analysisToken || this.activeProjectId !== projectId) {
        this.isAnalyzing = false;
        return {
          index: this.indices.get(projectId) || ProjectIntelligenceIndexer.indexProject(project).index,
          newInboxItems: [],
          batchedGroups: [],
          status: 'up-to-date',
          wasCancelled: true
        };
      }

      // Build baseline
      const baseline: ProjectIntelligenceBaseline = {
        projectId,
        createdAt: new Date().toISOString(),
        entityCount: (project.characters?.length || 0) + (project.locations?.length || 0),
        canonicalHashes: {},
        knownAliases: {}
      };

      const { index } = ProjectIntelligenceIndexer.indexProject(project);
      index.baseline = baseline;

      // Populate inbox without suppressing low-importance items during Deep Organization
      const newInboxItems = this.processProposalsIntoInbox(projectId, result.proposals, index, false);

      this.indices.set(projectId, index);
      this.isAnalyzing = false;

      return {
        index,
        newInboxItems,
        batchedGroups: this.getBatchedInboxGroups(projectId),
        status: this.getStatus(projectId),
        usefulOrganizationRate: result.usefulOrganizationRate,
        noiseRate: result.noiseRate
      };
    } catch (err) {
      this.isAnalyzing = false;
      throw err;
    }
  }

  /**
   * Continuous Maintenance Mode: Low-noise incremental change detection and scoped analysis.
   * Suppresses low-importance observations and ignored evidence hashes.
   */
  async analyzeIncremental(
    project: ProjectData,
    options?: IntelligenceAnalysisOptions
  ): Promise<{
    index: ProjectIntelligenceIndex;
    delta: IncrementalChangeDelta;
    newInboxItems: OrganizationInboxItem[];
    batchedGroups: BatchedInboxGroup[];
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

    this.indices.set(projectId, index);

    // If no dirty items, return current state early
    if (delta.dirtyDocumentIds.length === 0 && (this.inboxStore.get(projectId) || []).length > 0) {
      return {
        index,
        delta,
        newInboxItems: [],
        batchedGroups: this.getBatchedInboxGroups(projectId),
        suggestions: this.generateContextualSuggestions(project, projectId),
        status: this.getStatus(projectId)
      };
    }

    this.isAnalyzing = true;

    try {
      const incOptions: IntelligenceAnalysisOptions = {
        ...options,
        mode: 'continuous-maintenance'
      };

      // 2. Perform Scoped Intelligence Analysis via Provider
      const result = await this.provider.analyzeProject(project, incOptions);

      // Async Cancellation Guard Check
      if (this.currentAnalysisToken !== analysisToken || this.activeProjectId !== projectId) {
        this.isAnalyzing = false;
        return {
          index,
          delta,
          newInboxItems: [],
          batchedGroups: [],
          suggestions: [],
          status: 'up-to-date',
          wasCancelled: true
        };
      }

      // 3. Process proposals with Anti-Noise Suppression (suppress low-importance)
      const newInboxItems = this.processProposalsIntoInbox(projectId, result.proposals, index, true);

      // Mark analyzed documents as up-to-date in index
      delta.dirtyDocumentIds.forEach(id => {
        if (index.contentHashes[id]) {
          index.contentHashes[id].status = 'up-to-date';
          index.contentHashes[id].lastAnalyzed = new Date().toISOString();
        }
      });
      index.dirtyDocumentIds = [];

      this.isAnalyzing = false;

      return {
        index,
        delta,
        newInboxItems,
        batchedGroups: this.getBatchedInboxGroups(projectId),
        suggestions: this.generateContextualSuggestions(project, projectId),
        status: this.getStatus(projectId)
      };
    } catch (err) {
      this.isAnalyzing = false;
      throw err;
    }
  }

  /**
   * Converts raw proposals into Organization Inbox items with anti-noise suppression and evidence hash checks
   */
  private processProposalsIntoInbox(
    projectId: string,
    proposals: OrganizationProposal[],
    index: ProjectIntelligenceIndex,
    suppressLowImportance: boolean
  ): OrganizationInboxItem[] {
    const existingInbox = this.inboxStore.get(projectId) || [];
    const existingProposalKeys = new Set(existingInbox.map(i => `${i.proposal.domain}-${i.proposal.targetName.toLowerCase()}`));
    const ignoredHashes = new Set(index.ignoredEvidenceHashes || []);

    const newInboxItems: OrganizationInboxItem[] = [];

    proposals.forEach(prop => {
      // Noise Suppression Rule: In Continuous Maintenance, skip low importance proposals
      if (suppressLowImportance && prop.importance === 'low') {
        return;
      }

      // Anti-Realerting Rule: If evidence hash was previously ignored, suppress unless evidence changed
      if (prop.evidenceHash && ignoredHashes.has(prop.evidenceHash)) {
        return;
      }

      const propKey = `${prop.domain}-${prop.targetName.toLowerCase()}`;
      if (!existingProposalKeys.has(propKey)) {
        const category = this.mapDomainToCategory(prop.domain, prop);
        const availableActions = this.mapAvailableActions(prop);

        const item: OrganizationInboxItem = {
          id: `inbox-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          proposal: prop,
          category,
          status: 'pending',
          createdTimestamp: new Date().toISOString(),
          userFacingReason: prop.reasoning,
          contextSnippet: prop.sourceReferences[0]?.snippet || '',
          availableActions
        };

        newInboxItems.push(item);
        existingInbox.unshift(item);
      }
    });

    this.inboxStore.set(projectId, existingInbox);
    index.inboxItemIds = existingInbox.map(i => i.id);

    return newInboxItems;
  }

  /**
   * Maps proposal properties to contextual action options
   */
  private mapAvailableActions(proposal: OrganizationProposal): ContextualActionType[] {
    if (proposal.duplicateCandidate) {
      return ['merge', 'keep-separate', 'remember-later'];
    }
    if (proposal.conflictsWithCanon || (proposal.canonConflicts && proposal.canonConflicts.length > 0)) {
      return ['keep-existing', 'accept-new-evidence', 'create-revision-note', 'remember-later'];
    }
    if (proposal.domain === 'timeline' || proposal.domain === 'event') {
      return ['set-timeline-date', 'keep-existing', 'remember-later'];
    }
    if (proposal.domain === 'plotThread' || proposal.domain === 'faction' || proposal.domain === 'item') {
      return ['update-relationship', 'keep-existing', 'ignore', 'remember-later'];
    }
    if (proposal.operation === 'create') {
      return ['create', 'ignore', 'remember-later'];
    }
    return ['accept-new-evidence', 'ignore', 'remember-later'];
  }

  /**
   * Maps proposal domain and properties to Inbox filter category
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
   * Intelligent Batching: Groups related inbox items for a entity into a single BatchedInboxGroup card
   */
  getBatchedInboxGroups(projectId: string): BatchedInboxGroup[] {
    const items = (this.inboxStore.get(projectId) || []).filter(i => i.status === 'pending');
    const groupMap = new Map<string, OrganizationInboxItem[]>();

    items.forEach(item => {
      const key = `${item.proposal.domain}-${item.proposal.targetName.toLowerCase()}`;
      const list = groupMap.get(key) || [];
      list.push(item);
      groupMap.set(key, list);
    });

    const groups: BatchedInboxGroup[] = [];

    groupMap.forEach((itemList, key) => {
      const first = itemList[0];
      const hasConflict = itemList.some(i => i.proposal.conflictsWithCanon);
      const summaryReason = itemList.length > 1
        ? `${itemList.length} related findings for ${first.proposal.targetName} (${itemList.map(i => i.proposal.operation).join(', ')})`
        : first.userFacingReason;

      groups.push({
        id: `group-${key}`,
        targetName: first.proposal.targetName,
        domain: first.proposal.domain,
        items: itemList,
        summaryReason,
        hasConflict,
        createdTimestamp: first.createdTimestamp
      });
    });

    return groups.sort((a, b) => (b.hasConflict ? 1 : 0) - (a.hasConflict ? 1 : 0));
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
   * Updates an inbox item status (supporting explicit Remember Later and Ignore evidence hashing)
   */
  updateInboxItemStatus(projectId: string, itemId: string, newStatus: InboxItemStatus) {
    const items = this.inboxStore.get(projectId) || [];
    const target = items.find(i => i.id === itemId);
    const index = this.indices.get(projectId);

    if (target) {
      target.status = newStatus;
      target.updatedTimestamp = new Date().toISOString();

      if (newStatus === 'accepted') {
        target.proposal.status = 'accepted';
      } else if (newStatus === 'rejected') {
        target.proposal.status = 'rejected';
      } else if (newStatus === 'ignored') {
        target.proposal.status = 'rejected';
        // Record evidence hash to suppress re-alerting
        if (index && target.proposal.evidenceHash) {
          if (!index.ignoredEvidenceHashes) index.ignoredEvidenceHashes = [];
          if (!index.ignoredEvidenceHashes.includes(target.proposal.evidenceHash)) {
            index.ignoredEvidenceHashes.push(target.proposal.evidenceHash);
          }
        }
      } else if (newStatus === 'remember-later') {
        // Retain finding in inbox under remember-later, do not ignore or accept
        if (index) {
          if (!index.deferredItemIds) index.deferredItemIds = [];
          if (!index.deferredItemIds.includes(target.id)) {
            index.deferredItemIds.push(target.id);
          }
        }
      }
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
      // Default to items marked accepted or high-confidence non-conflicting
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
   * Generates non-intrusive contextual suggestions strictly scoped to active manuscript view
   */
  generateContextualSuggestions(project: ProjectData, projectId: string, activeDocId?: string): ContextualSuggestion[] {
    const items = this.getInboxItems(projectId, 'all').filter(i => i.status === 'pending');
    const suggestions: ContextualSuggestion[] = [];

    items.forEach(item => {
      const prop = item.proposal;
      
      // Strict Context Scoping Rule: In active writing mode, display suggestions ONLY relevant to active document
      if (activeDocId) {
        const matchesDoc = prop.sourceReferences.some(r => r.documentId === activeDocId);
        if (!matchesDoc) return;
      }

      // Suppress low-importance suggestions from active prose view
      if (prop.importance === 'low') return;

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
        title = `Character Evidence: ${prop.targetName}`;
        priority = prop.importance === 'high' ? 'medium' : 'low';
      } else if (prop.domain === 'timeline' || prop.domain === 'event') {
        suggestionType = 'timeline-event';
        title = `Chronology Finding: ${prop.targetName}`;
        priority = 'medium';
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
        importance: prop.importance,
        createdAt: item.createdTimestamp
      });
    });

    return suggestions.sort((a, b) => {
      const pMap = { high: 3, medium: 2, low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    });
  }
}
