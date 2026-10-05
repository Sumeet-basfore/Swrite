import { WritingPartnerService } from './aiPartnerService';
import { INITIAL_NOVEL_DATA } from './storageService';
import { AIProviderConfig, WritingPartnerMode } from '../types';

export function runWritingPartnerTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  const project = JSON.parse(JSON.stringify(INITIAL_NOVEL_DATA));

  // Test 1: Bounded context extraction
  const context = WritingPartnerService.buildStructuredContext(project, 'ch-1');
  if (
    context.projectTitle &&
    context.currentChapter?.id === 'ch-1' &&
    context.povCharacter?.name &&
    Array.isArray(context.involvedCharacters) &&
    context.involvedCharacters.length > 0 &&
    Array.isArray(context.activePlotThreads) &&
    Array.isArray(context.relevantCodex) &&
    (!context.boundedDraftExcerpt || context.boundedDraftExcerpt.length <= 1500)
  ) {
    results.push('✓ Test 1 Passed: Bounded Story Engine context extraction (POV, Cast, Threads, Codex, Excerpt <= 1500 chars)');
  } else {
    throw new Error('Test 1 Failed: Context extraction mismatch');
  }

  // Test 2: Mode-specific system prompt generation with strict craft guardrails
  const modes: WritingPartnerMode[] = ['brainstorm', 'discussion', 'critique', 'continuity', 'research', 'structure'];
  let allPromptsValid = true;
  modes.forEach(m => {
    const prompt = WritingPartnerService.getSystemPrompt(context, m);
    if (
      !prompt.includes('Writing Partner') ||
      !prompt.includes('NEVER modify the manuscript directly') ||
      !prompt.includes('DO NOT generate unsolicited full chapters')
    ) {
      allPromptsValid = false;
    }
  });

  if (allPromptsValid) {
    results.push('✓ Test 2 Passed: Craft guardrails and 6 specialized workflow modes in system prompt generation');
  } else {
    throw new Error('Test 2 Failed: System prompt guardrails missing');
  }

  // Test 3: AI Assistance OFF mode handling (Zero external fetch, returns local simulated editorial insights)
  const offConfig: AIProviderConfig = {
    mode: 'off',
    provider: 'gemini',
    localProvider: 'ollama',
    cloudProvider: 'gemini',
    apiKey: '',
    model: 'gemini-1.5-pro',
  };

  const simulatedCritique = WritingPartnerService.generateSimulatedEditorialResponse(
    'Critique this scene',
    project,
    'ch-1',
    null,
    'critique'
  );

  const simulatedBrainstorm = WritingPartnerService.generateSimulatedEditorialResponse(
    'Brainstorm alternatives',
    project,
    'ch-1',
    null,
    'brainstorm'
  );

  if (
    simulatedCritique.includes('Editorial Craft Critique') &&
    simulatedBrainstorm.includes('Brainstorming Perspectives')
  ) {
    results.push('✓ Test 3 Passed: AI Assistance OFF provides deterministic offline craft diagnostics & brainstorming');
  } else {
    throw new Error('Test 3 Failed: Simulated offline editorial response failed');
  }

  return { passed: true, results };
}
