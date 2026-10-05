/**
 * SWRITE — Project Intelligence Engine: Pass 2 (Holistic Classification & Proposal Construction)
 * Analyzes raw extracted candidates globally across existing canonical entities,
 * performs duplicate & alias detection, detects canon conflicts, and builds
 * non-destructive OrganizationProposal objects.
 */

import { ProjectData } from '../../types';
import { 
  OrganizationDomain, OrganizationProposal, CanonConflict, DuplicateCandidate, 
  ProjectIntelligenceResult 
} from '../../types/intelligence';
import { RawExtractedCandidate } from './extractor';

function computeLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;

  for (let i = 0; i <= lenA; i++) matrix[i] = [i];
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[lenA][lenB];
}

function calculateSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (n1 === n2) return 1.0;
  
  // Prefix / Substring match (e.g. "Lucan" inside "Lord Lucan" or "Luc")
  if (n1.startsWith(n2) || n2.startsWith(n1) || n1.includes(n2) || n2.includes(n1)) {
    const minLen = Math.min(n1.length, n2.length);
    const maxLen = Math.max(n1.length, n2.length);
    return 0.85 + (minLen / maxLen) * 0.10;
  }

  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 1.0;
  const dist = computeLevenshteinDistance(n1, n2);
  return Math.max(0, 1 - dist / maxLen);
}

export const ProjectIntelligenceClassifier = {
  /**
   * Pass 2: Classify candidates, detect duplicates, check canon conflicts, and generate proposals.
   */
  classifyAndBuildProposals(
    candidates: RawExtractedCandidate[],
    project: ProjectData,
    providerType: 'local-deterministic' | 'local-llm' | 'cloud-llm' = 'local-deterministic'
  ): ProjectIntelligenceResult {
    const proposals: OrganizationProposal[] = [];
    const domainCounts: Record<OrganizationDomain, number> = {
      character: 0,
      location: 0,
      faction: 0,
      item: 0,
      plotThread: 0,
      timeline: 0,
      outline: 0,
      event: 0,
      research: 0,
      unknown: 0,
    };

    let needsReviewCount = 0;
    let highConfidenceCount = 0;
    let canonConflictsCount = 0;
    let duplicateCandidatesCount = 0;

    const existingCharacters = project.characters || [];
    const existingLocations = project.locations || [];
    const existingFactions = project.factions || [];
    const existingThreads = project.plotThreads || [];
    const existingEvents = project.events || [];

    // Helper to find existing entity by name or alias
    const findExistingEntity = (domain: OrganizationDomain, name: string) => {
      const lower = name.toLowerCase().trim();
      switch (domain) {
        case 'character':
          return existingCharacters.find(c => c.name.toLowerCase() === lower || c.aliases?.some(a => a.toLowerCase() === lower));
        case 'location':
          return existingLocations.find(l => l.name.toLowerCase() === lower || l.aliases?.some(a => a.toLowerCase() === lower));
        case 'faction':
          return existingFactions.find(f => f.name.toLowerCase() === lower || f.aliases?.some(a => a.toLowerCase() === lower));
        case 'plotThread':
          return existingThreads.find(t => t.title.toLowerCase() === lower);
        case 'timeline':
        case 'event':
          return existingEvents.find(e => e.title.toLowerCase() === lower);
        default:
          return undefined;
      }
    };

    candidates.forEach((cand, index) => {
      const existing = findExistingEntity(cand.domain, cand.name);
      let operation: OrganizationProposal['operation'] = existing ? 'update' : 'create';
      let confidence = cand.confidence;
      let duplicateCandidate: DuplicateCandidate | undefined = undefined;
      const canonConflicts: CanonConflict[] = [];

      // Check for Duplicate / Alias candidate in existing canon
      if (!existing) {
        if (cand.domain === 'character') {
          for (const char of existingCharacters) {
            const sim = calculateSimilarity(cand.name, char.name);
            if (sim >= 0.75) {
              duplicateCandidate = {
                targetEntityId: char.id,
                targetEntityName: char.name,
                targetDomain: 'character',
                similarityScore: Math.round(sim * 100),
                aliasCandidateName: cand.name,
                isPotentialTitleOrNickname: cand.name.length < char.name.length || cand.name.startsWith('The '),
                evidence: `High lexical similarity (${Math.round(sim * 100)}%) with canonical character "${char.name}".`
              };
              duplicateCandidatesCount++;
              confidence = Math.max(0.60, confidence - 0.15); // Require review for ambiguous duplicate
              break;
            }
          }
        } else if (cand.domain === 'location') {
          for (const loc of existingLocations) {
            const sim = calculateSimilarity(cand.name, loc.name);
            if (sim >= 0.80) {
              duplicateCandidate = {
                targetEntityId: loc.id,
                targetEntityName: loc.name,
                targetDomain: 'location',
                similarityScore: Math.round(sim * 100),
                aliasCandidateName: cand.name,
                isPotentialTitleOrNickname: false,
                evidence: `Similarity (${Math.round(sim * 100)}%) with location "${loc.name}".`
              };
              duplicateCandidatesCount++;
              break;
            }
          }
        }
      }

      // Check for Canon Conflicts if entity already exists
      if (existing) {
        if (cand.domain === 'character') {
          const char = existing as any;
          if (cand.attributes.role && char.role && cand.attributes.role !== char.role) {
            canonConflicts.push({
              field: 'role',
              existingValue: char.role,
              detectedValue: cand.attributes.role,
              severity: 'medium',
              explanation: `Existing character role is "${char.role}", but newly detected text suggests "${cand.attributes.role}".`,
              resolutionOptions: ['keep-existing', 'update-canon', 'create-revision-note', 'ignore']
            });
            canonConflictsCount++;
          }

          if (cand.attributes.physicalDetail && (char.bio || char.traits)) {
            const bioText = `${char.bio || ''} ${(char.traits || []).join(' ')}`.toLowerCase();
            const traitType = cand.attributes.traitType || 'eyes';
            if (bioText.includes(traitType)) {
              if (!bioText.includes(cand.attributes.physicalDetail)) {
                canonConflicts.push({
                  field: 'traits',
                  existingValue: bioText,
                  detectedValue: cand.attributes.physicalDetail,
                  severity: 'high',
                  explanation: `Existing canon bio/traits record "${bioText}", but manuscript describes "${cand.attributes.physicalDetail}".`,
                  resolutionOptions: ['keep-existing', 'update-canon', 'create-revision-note', 'ignore']
                });
                canonConflictsCount++;
              }
            }
          }
        }
      }

      // Categorize confidence level
      const confidenceLevel: 'high' | 'medium' | 'low' = 
        confidence >= 0.85 ? 'high' : confidence >= 0.55 ? 'medium' : 'low';

      if (confidenceLevel === 'high') {
        highConfidenceCount++;
      } else {
        needsReviewCount++;
      }

      domainCounts[cand.domain] = (domainCounts[cand.domain] || 0) + 1;

      const proposal: OrganizationProposal = {
        id: `prop-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        domain: cand.domain,
        operation,
        targetEntityId: existing?.id,
        targetName: cand.name,
        confidence: Math.round(confidence * 100) / 100,
        confidenceLevel,
        reasoning: cand.reasoning,
        sourceReferences: cand.sourceReferences,
        proposedData: {
          name: cand.name,
          domain: cand.domain,
          ...cand.attributes,
        },
        existingCanonData: existing ? (existing as any) : undefined,
        conflictsWithCanon: canonConflicts.length > 0,
        canonConflicts: canonConflicts.length > 0 ? canonConflicts : undefined,
        duplicateCandidate,
        status: 'pending'
      };

      proposals.push(proposal);
    });

    // Check for Outline Reconstruction proposals (e.g. chapters with no scenes, or unformatted titles)
    let unorganizedChapterCount = 0;
    project.acts.forEach(act => {
      act.chapters.forEach(ch => {
        if (!ch.scenes || ch.scenes.length === 0) {
          unorganizedChapterCount++;
        }
      });
    });

    if (unorganizedChapterCount > 0) {
      proposals.push({
        id: `prop-outline-recon-${Date.now()}`,
        domain: 'outline',
        operation: 'split',
        targetName: 'Manuscript Scene Architecture',
        confidence: 0.88,
        confidenceLevel: 'high',
        reasoning: `Detected ${unorganizedChapterCount} chapters with unsegmented continuous prose. Proposing structured scene boundary insertion based on paragraph rhythm and scene ornaments (* * *).`,
        sourceReferences: [{
          documentId: 'project-outline',
          documentTitle: 'Manuscript Structural Matrix',
          documentType: 'chapter',
          snippet: `${unorganizedChapterCount} chapters without explicit scene subdivisions.`,
          reason: 'Structural analysis of chapter scene counts.'
        }],
        proposedData: {
          unorganizedChapterCount,
          action: 'generate-default-scenes'
        },
        status: 'pending'
      });
      domainCounts.outline = (domainCounts.outline || 0) + 1;
      highConfidenceCount++;
    }

    return {
      projectId: project.metadata.id,
      analyzedAt: new Date().toISOString(),
      provider: providerType,
      proposals,
      domainCounts,
      needsReviewCount,
      highConfidenceCount,
      canonConflictsCount,
      duplicateCandidatesCount,
    };
  }
};
