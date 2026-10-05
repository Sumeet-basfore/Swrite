/**
 * SWRITE — Project Intelligence Engine: Pass 2 (Holistic Classification & Proposal Construction)
 * Analyzes raw extracted candidates globally across existing canonical entities,
 * performs contextual duplicate & alias detection (using co-occurrences and relationships),
 * detects canon conflicts (including stale draft precedence), and builds
 * non-destructive OrganizationProposal objects with calibrated confidence.
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
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[lenA][lenB];
}

function calculateSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (n1 === n2) return 1.0;
  
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
   * Pass 2: Classify candidates, detect duplicates with contextual evidence, check canon conflicts, and generate proposals.
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
    const existingItems = project.items || [];
    const existingThreads = project.plotThreads || [];
    const existingEvents = project.events || [];

    // Helper to find exact match in same domain
    const findExistingEntity = (domain: OrganizationDomain, name: string) => {
      const lower = name.toLowerCase().trim();
      switch (domain) {
        case 'character':
          return existingCharacters.find(c => c.name.toLowerCase() === lower);
        case 'location':
          return existingLocations.find(l => l.name.toLowerCase() === lower);
        case 'faction':
          return existingFactions.find(f => f.name.toLowerCase() === lower);
        case 'item':
          return existingItems.find(i => i.name.toLowerCase() === lower);
        case 'plotThread':
          return existingThreads.find(t => t.title.toLowerCase() === lower);
        case 'timeline':
        case 'event':
          return existingEvents.find(e => e.title.toLowerCase() === lower);
        default:
          return undefined;
      }
    };

    // Helper to detect domain collision (same name in a DIFFERENT domain)
    const findCrossDomainCollisions = (domain: OrganizationDomain, name: string) => {
      const lower = name.toLowerCase().trim();
      const collisions: { domain: OrganizationDomain; name: string }[] = [];

      if (domain !== 'character' && existingCharacters.some(c => c.name.toLowerCase() === lower)) {
        collisions.push({ domain: 'character', name });
      }
      if (domain !== 'location' && existingLocations.some(l => l.name.toLowerCase() === lower)) {
        collisions.push({ domain: 'location', name });
      }
      if (domain !== 'faction' && existingFactions.some(f => f.name.toLowerCase() === lower)) {
        collisions.push({ domain: 'faction', name });
      }
      if (domain !== 'item' && existingItems.some(i => i.name.toLowerCase() === lower)) {
        collisions.push({ domain: 'item', name });
      }

      return collisions;
    };

    candidates.forEach((cand, index) => {
      const existing = findExistingEntity(cand.domain, cand.name);
      let operation: OrganizationProposal['operation'] = existing ? 'update' : 'create';
      let confidence = cand.confidence;
      let duplicateCandidate: DuplicateCandidate | undefined = undefined;
      const canonConflicts: CanonConflict[] = [];

      // 1. Contextual Duplicate & Alias Evaluation
      if (!existing) {
        if (cand.domain === 'character') {
          for (const char of existingCharacters) {
            const sim = calculateSimilarity(cand.name, char.name);
            const isDeclaredAlias = !!(
              char.aliases?.some(a => a.toLowerCase() === cand.name.toLowerCase() || calculateSimilarity(cand.name, a) >= 0.90) ||
              cand.attributes?.isAliasOf === char.name
            );

            if (sim >= 0.75 || isDeclaredAlias) {
              // Contextual Check: Did cand and char co-occur in the same scene as distinct entities?
              const coOccurred = cand.coOccurringEntities?.some(e => e.toLowerCase() === char.name.toLowerCase());

              if (coOccurred && !isDeclaredAlias) {
                // False Merge Resistance: Characters interact in the same scene, so they are distinct!
                duplicateCandidate = {
                  targetEntityId: char.id,
                  targetEntityName: char.name,
                  targetDomain: 'character',
                  similarityScore: Math.round(sim * 100),
                  aliasCandidateName: cand.name,
                  isPotentialTitleOrNickname: false,
                  isSameEntityLikelihood: 'low',
                  reasonNotToMerge: `Characters "${cand.name}" and "${char.name}" co-occur in the same scene as distinct interacting participants.`,
                  evidence: `Co-occurrence in scene proves distinct individuals despite name similarity (${Math.round(sim * 100)}%).`
                };
              } else {
                // Contextual Alias: High probability alias or title
                const contextualEvidence: string[] = [];
                if (isDeclaredAlias) {
                  contextualEvidence.push(`Exact match with established canonical alias "${cand.name}".`);
                }
                if (cand.name.length < char.name.length && char.name.includes(cand.name)) {
                  contextualEvidence.push(`Shortened familiar nickname of "${char.name}".`);
                }
                if (cand.attributes.role) {
                  contextualEvidence.push(`Shared narrative role "${cand.attributes.role}".`);
                }


                duplicateCandidate = {
                  targetEntityId: char.id,
                  targetEntityName: char.name,
                  targetDomain: 'character',
                  similarityScore: Math.round(sim * 100),
                  aliasCandidateName: cand.name,
                  isPotentialTitleOrNickname: cand.name.length < char.name.length || cand.name.startsWith('The '),
                  isSameEntityLikelihood: 'high',
                  sharedContextCount: contextualEvidence.length + 1,
                  contextualEvidence,
                  evidence: contextualEvidence.join(' ') || `Lexical similarity (${Math.round(sim * 100)}%) with character "${char.name}".`
                };
                duplicateCandidatesCount++;
                confidence = Math.max(0.60, confidence - 0.15);
              }
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
                isSameEntityLikelihood: 'high',
                evidence: `High geographic name similarity (${Math.round(sim * 100)}%) with location "${loc.name}".`
              };
              duplicateCandidatesCount++;
              break;
            }
          }
        }
      }

      // 2. Check for Canon Conflicts against Existing Entities (Direct or Alias Target)
      const targetEntity = existing || (duplicateCandidate ? findExistingEntity(cand.domain, duplicateCandidate.targetEntityName) : undefined);
      const isStaleSource = !!(cand.isStaleDraft || cand.sourceReferences.some(r => r.sourceCategory === 'cut-drawer' || r.documentTitle?.toLowerCase().includes('cut drawer') || r.documentTitle?.toLowerCase().includes('cut scene')));

      if (targetEntity) {
        if (cand.domain === 'character') {
          const char = targetEntity as any;

          // Role Conflict
          if (cand.attributes.role && char.role && cand.attributes.role !== char.role) {
            canonConflicts.push({
              field: 'role',
              existingValue: char.role,
              detectedValue: cand.attributes.role,
              severity: 'medium',
              sourceDocumentTitle: cand.sourceReferences[0]?.documentTitle,
              isStaleSourceWarning: isStaleSource,
              explanation: `Existing character role is "${char.role}", but newly detected text suggests "${cand.attributes.role}".`,
              resolutionOptions: ['keep-existing', 'update-canon', 'create-revision-note', 'ignore']
            });
            canonConflictsCount++;
          }

          // Physical Appearance / Trait Conflict (e.g. violet vs brown eyes)
          if (cand.attributes.physicalDetail && (char.bio || char.traits)) {
            const bioText = `${char.bio || ''} ${(char.traits || []).join(' ')}`.toLowerCase();
            const traitType = cand.attributes.traitType || 'eyes';
            if (bioText.includes(traitType) && !bioText.includes(cand.attributes.physicalDetail)) {
              canonConflicts.push({
                field: 'traits',
                existingValue: bioText,
                detectedValue: cand.attributes.physicalDetail,
                severity: 'high',
                sourceDocumentTitle: cand.sourceReferences[0]?.documentTitle,
                isStaleSourceWarning: isStaleSource,
                explanation: `Existing canon bio describes "${bioText}", but manuscript explicitly describes "${cand.attributes.physicalDetail}".`,
                resolutionOptions: ['keep-existing', 'update-canon', 'create-revision-note', 'ignore']
              });
              canonConflictsCount++;
            }
          }

          // Age Conflict (e.g. 27 vs 29)
          const existingAge = char.age || (char.bio?.match(/\b(?:Age|age)\s+(\d{1,3})\b/)?.[1] ? parseInt(char.bio.match(/\b(?:Age|age)\s+(\d{1,3})\b/)[1], 10) : undefined);
          if (cand.attributes.age && existingAge && cand.attributes.age !== existingAge) {
            canonConflicts.push({
              field: 'age',
              existingValue: existingAge,
              detectedValue: cand.attributes.age,
              severity: 'high',
              sourceDocumentTitle: cand.sourceReferences[0]?.documentTitle,
              isStaleSourceWarning: isStaleSource,
              explanation: isStaleSource 
                ? `Deleted/Cut draft states age ${cand.attributes.age}, but canonical manuscript states age ${existingAge}. Primary manuscript takes precedence.`
                : `Manuscript text states age ${cand.attributes.age}, conflicting with canonical record of age ${existingAge}.`,
              resolutionOptions: ['keep-existing', 'update-canon', 'create-revision-note', 'ignore']
            });
            canonConflictsCount++;
          }
        }
      }


      // 3. Domain Collision Disambiguation Note
      const crossCollisions = findCrossDomainCollisions(cand.domain, cand.name);
      let reasoning = cand.reasoning;
      if (crossCollisions.length > 0) {
        reasoning += ` Note: Disambiguated from existing ${crossCollisions.map(c => `${c.domain} "${c.name}"`).join(', ')}.`;
      }

      // 4. Research Reference Suppression: Suppress bulk character creation from research documentation
      let entityNature = cand.entityNature || 'active';
      if (entityNature === 'research-reference') {
        confidence = Math.min(0.40, confidence);
        reasoning = `Historical / academic reference in research documentation. Recommended to keep as reference to prevent cast pollution.`;
      }

      // 5. Confidence Calibration
      let confidenceLevel: 'high' | 'medium' | 'low' = 
        confidence >= 0.85 ? 'high' : confidence >= 0.55 ? 'medium' : 'low';

      // Stale drafts or inferred relative timelines should always require review (medium/low)
      if (cand.isStaleDraft || cand.temporalCertainty === 'inferred') {
        if (confidenceLevel === 'high') confidenceLevel = 'medium';
      }

      if (confidenceLevel === 'high' && canonConflicts.length === 0) {
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
        confidence,
        confidenceLevel,
        temporalCertainty: cand.temporalCertainty || (cand.domain === 'timeline' ? 'inferred' : undefined),
        entityNature,
        isStaleDraftWarning: cand.isStaleDraft,
        reasoning,
        sourceReferences: cand.sourceReferences,
        proposedData: {
          name: cand.name,
          ...cand.attributes
        },
        existingCanonData: existing ? (existing as any) : undefined,
        conflictsWithCanon: canonConflicts.length > 0,
        canonConflicts: canonConflicts.length > 0 ? canonConflicts : undefined,
        duplicateCandidate,
        status: 'pending'
      };

      proposals.push(proposal);
    });

    // 6. Outline Reconstruction: Guard against false structural boundaries
    // Only propose scene splits when chapters have explicit scene break ornaments (* * * or ---)
    project.acts.forEach(act => {
      act.chapters.forEach(ch => {
        const hasExplicitSceneBreakOrnament = ch.content && /(\*\s*\*\s*\*|---|#{2,3}\s+|§)/.test(ch.content);
        if (hasExplicitSceneBreakOrnament && (!ch.scenes || ch.scenes.length <= 1)) {
          proposals.push({
            id: `prop-outline-break-${ch.id}`,
            domain: 'outline',
            operation: 'split',
            targetName: `Structured Scenes for "${ch.title}"`,
            confidence: 0.90,
            confidenceLevel: 'high',
            reasoning: `Detected explicit scene break ornaments (* * *) in "${ch.title}". Proposing structured scene boundary division.`,
            sourceReferences: [{
              documentId: ch.id,
              documentTitle: `${act.title} · ${ch.title}`,
              documentType: 'chapter',
              sourceCategory: 'primary-manuscript',
              snippet: `Explicit scene ornament breaks (* * *) detected in chapter text.`,
              reason: 'Scene boundary ornament detection.'
            }],
            proposedData: {
              chapterId: ch.id,
              action: 'split-by-ornaments'
            },
            status: 'pending'
          });
          domainCounts.outline = (domainCounts.outline || 0) + 1;
          highConfidenceCount++;
        }
      });
    });

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
