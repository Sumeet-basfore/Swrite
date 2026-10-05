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
