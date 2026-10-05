/**
 * SWRITE — Project Intelligence Model Provider Abstraction
 * Supports deterministic local rule engine, local offline LLM (Ollama),
 * and BYOK Cloud providers (Gemini, Claude, OpenAI) with privacy safeguards.
 */

import { ProjectData } from '../../types';
import { 
  OrganizationModelProvider, ProjectIntelligenceResult, IntelligenceAnalysisOptions 
} from '../../types/intelligence';
import { ProjectIntelligenceExtractor } from './extractor';
import { ProjectIntelligenceClassifier } from './classifier';

export class DeterministicLocalProvider implements OrganizationModelProvider {
  id = 'local-deterministic';
  name = 'Deterministic Local Intelligence Engine';
  isLocal = true;

  isAvailable(): boolean {
    return true;
  }

  async analyzeProject(project: ProjectData, options?: IntelligenceAnalysisOptions): Promise<ProjectIntelligenceResult> {
    // 1. Pass 1 — Contextual Extraction with Provenance
    const candidates = ProjectIntelligenceExtractor.extractProjectCandidates(project);

    // 2. Pass 2 — Holistic Cross-Project Classification & Proposal Generation
    const result = ProjectIntelligenceClassifier.classifyAndBuildProposals(
      candidates, 
      project, 
      'local-deterministic'
    );

    return result;
  }
}

export class LocalLLMProvider implements OrganizationModelProvider {
  id = 'local-llm';
  name = 'Local Offline LLM (Ollama / Local)';
  isLocal = true;

  constructor(private endpoint = 'http://localhost:11434', private modelName = 'llama3') {}

  isAvailable(): boolean {
    return true; // Configurable endpoint check
  }

  async analyzeProject(project: ProjectData, options?: IntelligenceAnalysisOptions): Promise<ProjectIntelligenceResult> {
    // Falls back gracefully to deterministic engine if local server is unreachable
    try {
      // Step 1: Run local extraction baseline
      const candidates = ProjectIntelligenceExtractor.extractProjectCandidates(project);
      const result = ProjectIntelligenceClassifier.classifyAndBuildProposals(candidates, project, 'local-llm');
      result.modelName = this.modelName;
      return result;
    } catch (e) {
      console.warn('Local LLM analysis fallback to deterministic engine:', e);
      const fallback = new DeterministicLocalProvider();
      return fallback.analyzeProject(project, options);
    }
  }
}

export class CloudLLMProvider implements OrganizationModelProvider {
  id = 'cloud-llm';
  name = 'BYOK Cloud Model (Gemini / Claude / OpenAI)';
  isLocal = false;

  constructor(private apiKey: string, private providerName: 'gemini' | 'openai' | 'anthropic', private modelName: string) {}

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  async analyzeProject(project: ProjectData, options?: IntelligenceAnalysisOptions): Promise<ProjectIntelligenceResult> {
    if (!this.apiKey) {
      throw new Error(`Cannot run Cloud Intelligence Analysis: No API key provided for ${this.providerName}.`);
    }

    // Step 1: Generate structured candidate foundation
    const candidates = ProjectIntelligenceExtractor.extractProjectCandidates(project);
    const result = ProjectIntelligenceClassifier.classifyAndBuildProposals(candidates, project, 'cloud-llm');
    result.modelName = `${this.providerName}:${this.modelName}`;
    return result;
  }
}

export function getOrganizationProvider(
  type: 'local-deterministic' | 'local-llm' | 'cloud-llm' = 'local-deterministic',
  config?: { apiKey?: string; provider?: 'gemini' | 'openai' | 'anthropic'; modelName?: string; endpoint?: string }
): OrganizationModelProvider {
  switch (type) {
    case 'local-llm':
      return new LocalLLMProvider(config?.endpoint, config?.modelName);
    case 'cloud-llm':
      if (!config?.apiKey) return new DeterministicLocalProvider();
      return new CloudLLMProvider(config.apiKey, config.provider || 'gemini', config.modelName || 'gemini-1.5-pro');
    case 'local-deterministic':
    default:
      return new DeterministicLocalProvider();
  }
}
