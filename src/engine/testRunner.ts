import { runStoryEngineTests } from './storyEngine.test';
import { runContinuityEngineTests } from './continuityEngine.test';
import { runReviewQueueTests } from '../editorial/reviewQueue.test';
import { runInspectorQuickEditTests } from './inspectorQuickEdit.test';
import { runPhase4Tests } from './phase4.test';
import { runWorldSimulationTests } from './simulation/simulationEngine.test';

console.log('\n======================================================');
console.log('       SWRITE STORY, CONTINUITY & SIMULATION TESTS');
console.log('======================================================\n');

try {
  console.log('--- 1. Running Story Engine Tests ---');
  const storyResult = runStoryEngineTests();
  storyResult.results.forEach(r => console.log(r));

  console.log('\n--- 2. Running Continuity Engine Tests ---');
  const continuityResult = runContinuityEngineTests();
  continuityResult.results.forEach(r => console.log(r));

  console.log('\n--- 3. Running Unified Review Queue Tests ---');
  const reviewResult = runReviewQueueTests();
  reviewResult.results.forEach(r => console.log(r));

  console.log('\n--- 4. Running Inspector Quick Edit Tests ---');
  const inspectorResult = runInspectorQuickEditTests();
  inspectorResult.results.forEach(r => console.log(r));

  console.log('\n--- 5. Running Phase 4 Split & Diff Tests ---');
  const phase4Result = runPhase4Tests();
  phase4Result.results.forEach(r => console.log(r));

  console.log('\n--- 6. Running World Simulation Engine Tests ---');
  runWorldSimulationTests();

  console.log('\n======================================================');
  console.log(`  ALL ${storyResult.results.length + continuityResult.results.length + reviewResult.results.length + inspectorResult.results.length + phase4Result.results.length + 18} STORY, CONTINUITY, REVIEW & SIMULATION TESTS PASSED (✓)`);
  console.log('======================================================\n');
} catch (err: any) {
  console.error('\n❌ TEST RUNNER FAILED:', err.message || err);
  process.exit(1);
}
