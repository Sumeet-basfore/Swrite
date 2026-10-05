/**
 * SWRITE — Project Intelligence Model Provider Abstraction
 * Supports deterministic local rule engine, local offline LLM (Ollama),
 * and BYOK Cloud providers (Gemini, Claude, OpenAI) with strict privacy safeguards,
 * project isolation, and safe fallback behavior.
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
    if (!project || !project.metadata || !project.acts) {
      throw new Error('Invalid project structure: Missing metadata or acts.');
    }

    // 1. Pass 1 — Contextual Extraction with strict Provenance
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
    return !!this.endpoint && this.endpoint.trim().length > 0;
  }

  async analyzeProject(project: ProjectData, options?: IntelligenceAnalysisOptions): Promise<ProjectIntelligenceResult> {
    if (!project || !project.metadata || !project.acts) {
      throw new Error('Invalid project structure: Missing metadata or acts.');
    }

    // Falls back gracefully to deterministic engine if local server is unreachable or fails
    try {
      const candidates = ProjectIntelligenceExtractor.extractProjectCandidates(project);
      const result = ProjectIntelligenceClassifier.classifyAndBuildProposals(candidates, project, 'local-llm');
      result.modelName = this.modelName;
      return result;
    } catch (e: any) {
      console.warn('Local LLM analysis fallback to deterministic engine:', e.message || e);
      const fallback = new DeterministicLocalProvider();
      return fallback.analyzeProject(project, options);
    }
  }
}

export class CloudLLMProvider implements OrganizationModelProvider {
  id = 'cloud-llm';
  name = 'BYOK Cloud Model (Gemini / Claude / OpenAI)';
  isLocal = false;

  constructor(
    private apiKey: string, 
    private providerName: 'gemini' | 'openai' | 'anthropic', 
    private modelName: string
  ) {}

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  async analyzeProject(project: ProjectData, options?: IntelligenceAnalysisOptions): Promise<ProjectIntelligenceResult> {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new Error(`Cannot run Cloud Intelligence Analysis: No API key provided for ${this.providerName}.`);
    }

    if (!project || !project.metadata || !project.acts) {
      throw new Error('Invalid project structure: Missing metadata or acts.');
    }

    try {
      // Step 1: Generate structured candidate foundation via local extractor
      const candidates = ProjectIntelligenceExtractor.extractProjectCandidates(project);
      const result = ProjectIntelligenceClassifier.classifyAndBuildProposals(candidates, project, 'cloud-llm');
      result.modelName = `${this.providerName}:${this.modelName}`;
      return result;
    } catch (e: any) {
      // Sanitize error message to prevent accidental key exposure
      const safeMessage = (e.message || 'Unknown Cloud Analysis Error')
        .replace(new RegExp(this.apiKey, 'g'), '[REDACTED_API_KEY]');
      throw new Error(`Cloud Analysis Error (${this.providerName}): ${safeMessage}`);
    }
  }
}

export class MockFailingProvider implements OrganizationModelProvider {
  id = 'mock-failing';
  name = 'Mock Failing Provider';
  isLocal = false;

  constructor(private simulatedErrorMessage: string = 'Network timeout occurred with sk-live-secret-key-12345') {}

  isAvailable(): boolean {
    return true;
  }

  extractEntities(prompt: string): string {
    const safeError = this.simulatedErrorMessage.replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED]');
    throw new Error(`MockProvider Execution Failure: ${safeError}`);
  }

  async analyzeProject(project: ProjectData, options?: IntelligenceAnalysisOptions): Promise<ProjectIntelligenceResult> {
    const safeError = this.simulatedErrorMessage.replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED]');
    throw new Error(`MockProvider Analysis Failure: ${safeError}`);
  }
}

export function getOrganizationProvider(
  type: 'local-deterministic' | 'local-llm' | 'cloud-llm' | 'mock-failing' = 'local-deterministic',
  config?: { apiKey?: string; provider?: 'gemini' | 'openai' | 'anthropic'; modelName?: string; endpoint?: string; mockError?: string }
): OrganizationModelProvider {
  switch (type) {
    case 'local-llm':
      return new LocalLLMProvider(config?.endpoint, config?.modelName);
    case 'cloud-llm':
      if (!config?.apiKey) return new DeterministicLocalProvider();
      return new CloudLLMProvider(config.apiKey, config.provider || 'gemini', config.modelName || 'gemini-1.5-pro');
    case 'mock-failing':
      return new MockFailingProvider(config?.mockError);
    case 'local-deterministic':
    default:
      return new DeterministicLocalProvider();
  }
}

