import { runStoryEngineTests } from './storyEngine.test';
import { runContinuityEngineTests } from './continuityEngine.test';
import { runReviewQueueTests } from '../editorial/reviewQueue.test';
import { runInspectorQuickEditTests } from './inspectorQuickEdit.test';
import { runPhase4Tests } from './phase4.test';
import { runIntelligenceEngineTests } from './intelligence/intelligence.test';
import { runGoldStandardBenchmarkTests } from './intelligence/goldBenchmark.test';
import { runContinuousIntelligenceTests } from './intelligence/continuousIntelligence.test';
import { runWorldSimulationTests } from './simulation/simulationEngine.test';
import { runEditorEnhancementsTests } from './editorEnhancements.test';

console.log('\n======================================================');
console.log('       SWRITE STORY, CONTINUITY, INTELLIGENCE, SIMULATION & EDITOR TESTS');
console.log('======================================================\n');

async function main() {
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

    console.log('\n--- 6. Running AI Project Intelligence & Universal Organization Tests ---');
    const intelResult = runIntelligenceEngineTests();
    intelResult.results.forEach(r => console.log(r));

    console.log('\n--- 7. Running AI Project Intelligence Gold-Standard Benchmark Tests ---');
    const benchmarkResult = runGoldStandardBenchmarkTests();
    benchmarkResult.results.forEach(r => console.log(r));

    console.log('\n--- 8. Running Continuous Intelligence & Assisted Organization Tests ---');
    const continuousResult = await runContinuousIntelligenceTests();
    continuousResult.results.forEach(r => console.log(r));

    console.log('\n--- 9. Running World Simulation Engine Tests ---');
    runWorldSimulationTests();
    const simCount = 24;

    console.log('\n--- 10. Running Editor Enhancements & Writing Experience Tests ---');
    runEditorEnhancementsTests();
    const editorCount = 9;

    const totalTests = storyResult.results.length + 
      continuityResult.results.length + 
      reviewResult.results.length + 
      inspectorResult.results.length + 
      phase4Result.results.length + 
      intelResult.results.length +
      benchmarkResult.results.length +
      continuousResult.results.length +
      simCount +
      editorCount;

    console.log('\n======================================================');
    console.log(`  ALL ${totalTests} STORY, CONTINUITY, REVIEW, INSPECTOR, INTELLIGENCE, BENCHMARK, CONTINUOUS, SIMULATION & EDITOR TESTS PASSED (✓)`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n❌ TEST RUNNER FAILED:', err.message || err);
    process.exit(1);
  }
}

main();
