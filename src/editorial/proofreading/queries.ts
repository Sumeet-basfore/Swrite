import { ProjectData } from '../../types';
import { ProofreadingEngine } from './engine';
import { Finding, FindingCategory, ProofreadingPassId, ProofreadingScope, ProofreadingSummary } from './types';

/**
 * Pure Functional Queries for Proofreading & Editorial Review
 */
export const ProofreadingQueries = {
  /**
   * Run audit and return all active findings
   */
  getFindings(
    project: ProjectData,
    options?: {
      scope?: ProofreadingScope;
      activeChapterId?: string;
      activeSceneId?: string;
    }
  ): Finding[] {
    return ProofreadingEngine.runAudit(project, options);
  },

  /**
   * Get proofreading summary with category breakdown
   */
  getSummary(
    project: ProjectData,
    options?: {
      scope?: ProofreadingScope;
      activeChapterId?: string;
      activeSceneId?: string;
    }
  ): ProofreadingSummary {
    const findings = this.getFindings(project, options);
    return ProofreadingEngine.getSummary(findings);
  },

  /**
   * Filter findings by specific category
   */
  getFindingsByCategory(
    project: ProjectData,
    category: FindingCategory,
    options?: {
      scope?: ProofreadingScope;
      activeChapterId?: string;
      activeSceneId?: string;
    }
  ): Finding[] {
    const findings = this.getFindings(project, options);
    return findings.filter(f => f.category === category);
  },

  /**
   * Filter findings by specific pass ID
   */
  getFindingsByPass(
    project: ProjectData,
    passId: ProofreadingPassId,
    options?: {
      scope?: ProofreadingScope;
      activeChapterId?: string;
      activeSceneId?: string;
    }
  ): Finding[] {
    const findings = this.getFindings(project, options);
    return findings.filter(f => f.passId === passId);
  },

  /**
   * Check if a specific word is in the project custom dictionary
   */
  isWordInCustomDictionary(project: ProjectData, word: string): boolean {
    const customDict: string[] = project.metadata?.proofreadingConfig?.customDictionary || [];
    return customDict.map((w: string) => w.toLowerCase()).includes(word.toLowerCase());
  }
};
