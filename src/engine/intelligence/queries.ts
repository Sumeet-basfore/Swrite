/**
 * SWRITE — Project Intelligence Query & Filter Utilities
 */

import { OrganizationProposal, OrganizationDomain } from '../../types/intelligence';

export interface ProposalFilterOptions {
  domain?: OrganizationDomain | 'all';
  confidenceLevel?: 'all' | 'high' | 'medium' | 'low';
  status?: 'all' | 'pending' | 'accepted' | 'rejected' | 'applied';
  conflictsOnly?: boolean;
  duplicatesOnly?: boolean;
  searchQuery?: string;
}

export function filterProposals(
  proposals: OrganizationProposal[],
  options: ProposalFilterOptions
): OrganizationProposal[] {
  return proposals.filter(p => {
    // 1. Domain filter
    if (options.domain && options.domain !== 'all' && p.domain !== options.domain) {
      return false;
    }

    // 2. Confidence Level filter
    if (options.confidenceLevel && options.confidenceLevel !== 'all' && p.confidenceLevel !== options.confidenceLevel) {
      return false;
    }

    // 3. Status filter
    if (options.status && options.status !== 'all' && p.status !== options.status) {
      return false;
    }

    // 4. Conflicts Only filter
    if (options.conflictsOnly && !p.conflictsWithCanon) {
      return false;
    }

    // 5. Duplicates Only filter
    if (options.duplicatesOnly && !p.duplicateCandidate) {
      return false;
    }

    // 6. Search Query filter
    if (options.searchQuery && options.searchQuery.trim().length > 0) {
      const q = options.searchQuery.toLowerCase().trim();
      const matchName = p.targetName.toLowerCase().includes(q);
      const matchReason = p.reasoning.toLowerCase().includes(q);
      const matchSnippet = p.sourceReferences.some(r => r.snippet.toLowerCase().includes(q));
      if (!matchName && !matchReason && !matchSnippet) return false;
    }

    return true;
  });
}

export function getProposalStats(proposals: OrganizationProposal[]) {
  const stats = {
    totalCount: proposals.length,
    pendingCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    appliedCount: 0,
    highConfidenceCount: 0,
    mediumConfidenceCount: 0,
    lowConfidenceCount: 0,
    canonConflictsCount: 0,
    duplicatesCount: 0,
    domainCounts: {
      character: 0,
      location: 0,
      faction: 0,
      item: 0,
      plotThread: 0,
      timeline: 0,
      outline: 0,
      event: 0,
      research: 0,
      unknown: 0
    } as Record<OrganizationDomain, number>
  };

  proposals.forEach(p => {
    if (p.status === 'pending') stats.pendingCount++;
    if (p.status === 'accepted') stats.acceptedCount++;
    if (p.status === 'rejected') stats.rejectedCount++;
    if (p.status === 'applied') stats.appliedCount++;

    if (p.confidenceLevel === 'high') stats.highConfidenceCount++;
    if (p.confidenceLevel === 'medium') stats.mediumConfidenceCount++;
    if (p.confidenceLevel === 'low') stats.lowConfidenceCount++;

    if (p.conflictsWithCanon) stats.canonConflictsCount++;
    if (p.duplicateCandidate) stats.duplicatesCount++;

    stats.domainCounts[p.domain] = (stats.domainCounts[p.domain] || 0) + 1;
  });

  return stats;
}
