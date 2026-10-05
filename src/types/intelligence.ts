/**
 * SWRITE — Project Intelligence & Universal Organization Types
 * Defines the contract for entity extraction, cross-project classification,
 * confidence scoring, provenance tracking, duplicate/alias resolution,
 * canon conflict detection, and non-destructive proposal application.
 */

export type OrganizationDomain = 
  | 'character' 
  | 'location' 
  | 'faction' 
  | 'item' 
  | 'plotThread' 
  | 'timeline' 
  | 'outline' 
  | 'event' 
  | 'research' 
  | 'unknown';

export type ProposalOperation = 
  | 'create' 
  | 'update' 
  | 'merge' 
  | 'link' 
  | 'move' 
  | 'reclassify' 
  | 'split' 
  | 'deduplicate';

export interface SourceReference {
  documentId: string;
  documentTitle: string;
  documentType: 'chapter' | 'scene' | 'research' | 'file' | 'character' | 'location' | 'faction' | 'item';
  sourceCategory?: 'primary-manuscript' | 'codex' | 'notes' | 'cut-drawer' | 'research';
  paragraphIndex?: number;
  characterRange?: [number, number];
  snippet: string;
  reason: string;
}

export interface ProposedChange {
  field: string;
  currentValue?: any;
  proposedValue: any;
  changeType: 'create' | 'update' | 'merge' | 'link' | 'move' | 'reclassify';
}

export interface CanonConflict {
  field: string;
  existingValue: any;
  detectedValue: any;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  sourceDocumentTitle?: string;
  isStaleSourceWarning?: boolean;
  resolutionOptions: Array<'keep-existing' | 'update-canon' | 'create-revision-note' | 'ignore'>;
  chosenResolution?: 'keep-existing' | 'update-canon' | 'create-revision-note' | 'ignore';
}

export interface DuplicateCandidate {
  targetEntityId: string;
  targetEntityName: string;
  targetDomain: OrganizationDomain;
  similarityScore: number;
  aliasCandidateName: string;
  isPotentialTitleOrNickname: boolean;
  sharedContextCount?: number;
  contextualEvidence?: string[];
  isSameEntityLikelihood?: 'high' | 'medium' | 'low';
  reasonNotToMerge?: string;
  evidence: string;
}

export interface OrganizationProposal {
  id: string;
  domain: OrganizationDomain;
  operation: ProposalOperation;
  targetEntityId?: string;
  targetName: string;
  confidence: number; // 0.0 to 1.0
  confidenceLevel: 'high' | 'medium' | 'low';
  temporalCertainty?: 'known' | 'inferred' | 'unknown';
  entityNature?: 'active' | 'incidental' | 'historical' | 'research-reference';
  isStaleDraftWarning?: boolean;
  reasoning: string;
  sourceReferences: SourceReference[];
  proposedData: Record<string, any>;
  existingCanonData?: Record<string, any>;
  conflictsWithCanon?: boolean;
  canonConflicts?: CanonConflict[];
  duplicateCandidate?: DuplicateCandidate;
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
  appliedAt?: string;
}

export interface ProjectIntelligenceResult {
  projectId: string;
  analyzedAt: string;
  provider: 'local-deterministic' | 'local-llm' | 'cloud-llm';
  modelName?: string;
  proposals: OrganizationProposal[];
  domainCounts: Record<OrganizationDomain, number>;
  needsReviewCount: number;
  highConfidenceCount: number;
  canonConflictsCount: number;
  duplicateCandidatesCount: number;
  safetySnapshotId?: string;
}

export interface IntelligenceAnalysisOptions {
  provider?: 'local-deterministic' | 'local-llm' | 'cloud-llm';
  confidenceThreshold?: number;
  includeTimeline?: boolean;
  includeOutlineReconstruction?: boolean;
  includeDuplicateDetection?: boolean;
  domains?: OrganizationDomain[];
}

export interface OrganizationModelProvider {
  id: string;
  name: string;
  isLocal: boolean;
  isAvailable(): boolean;
  analyzeProject(project: any, options?: IntelligenceAnalysisOptions): Promise<ProjectIntelligenceResult>;
}

/**
 * Continuous Intelligence Status indicator for UI and indexing
 */
export type IntelligenceStatus = 
  | 'up-to-date' 
  | 'changes-detected' 
  | 'analysis-pending' 
  | 'needs-review' 
  | 'conflict-detected';

/**
 * Record tracking the content hash and dirty state of a single document/entity
 */
export interface ContentHashRecord {
  id: string;
  title: string;
  type: 'chapter' | 'scene' | 'character' | 'location' | 'faction' | 'item' | 'research' | 'cut-drawer' | 'event';
  hash: string;
  lastModified: string;
  lastAnalyzed?: string;
  status: IntelligenceStatus;
}

/**
 * Non-canonical intelligence index stored alongside project state or generated on demand
 */
export interface ProjectIntelligenceIndex {
  projectId: string;
  lastFullAnalysis?: string;
  lastIncrementalAnalysis?: string;
  contentHashes: Record<string, ContentHashRecord>;
  extractedEntityIds: string[];
  knownAliases: Record<string, string[]>;
  dirtyDocumentIds: string[];
  inboxItemIds: string[];
}

/**
 * Delta calculation between current project data and previous intelligence index
 */
export interface IncrementalChangeDelta {
  projectId: string;
  dirtyDocumentIds: string[];
  addedDocumentIds: string[];
  updatedDocumentIds: string[];
  deletedDocumentIds: string[];
  retrievalScopeIds: string[];
  timestamp: string;
}

export type InboxItemStatus = 'pending' | 'accepted' | 'rejected' | 'ignored' | 'remember-later';
export type InboxFilterCategory = 'all' | 'characters' | 'timeline' | 'outline' | 'relationships' | 'research' | 'conflicts' | 'duplicates';

/**
 * Organization Inbox item representing a single proposal under author review
 */
export interface OrganizationInboxItem {
  id: string;
  proposal: OrganizationProposal;
  category: InboxFilterCategory;
  status: InboxItemStatus;
  createdTimestamp: string;
  updatedTimestamp?: string;
  userFacingReason: string;
  contextSnippet?: string;
}

/**
 * Subtle inline suggestion for Editor, Timeline, Outliner, or Inspector
 */
export interface ContextualSuggestion {
  id: string;
  domain: OrganizationDomain;
  targetId?: string;
  targetName: string;
  suggestionType: 'new-character' | 'alias-link' | 'location-mention' | 'timeline-event' | 'canon-conflict' | 'duplicate-warning';
  title: string;
  text: string;
  snippet?: string;
  proposalId?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

