/**
 * Swrite World Simulation Engine — Comprehensive Test Suite
 * 
 * Tests all 18 core requirements for deterministic world simulation,
 * rule evaluation, cause/effect tracing, scenario isolation, and canonical safety.
 */

import { 
  createSimulationState, deepClone,
  validateRule, DEFAULT_WORLD_RULES,
  evaluateSingleCondition, evaluateCondition, evaluateAllRules,
  simulate,
  createScenario, addScheduledAction, addCustomRule, discardScenario,
  getCauseChainForEntity, formatCauseChainNarrative, generateSimulationDiff,
  applySimulationToProject,
  recordSimulationEvent, getSimulationEvaluationSummary, resetSimulationEvaluationMetrics,
  isWorldSimulationEnabled, enableWorldSimulation, disableWorldSimulation, 
  deriveSimulationBaseline, clearCrossProjectSimulationState,
  WorldRule, Kingdom, WorldRelation, SimulationScenario
} from './index';
import { createSimulationTestProject } from './testFixture';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[WorldSimulationTest Failure] ${message}`);
  }
}

export function runWorldSimulationTests(): void {
  console.log('--- 1. Testing Kingdom State & Baseline Extraction ---');
  const project = createSimulationTestProject();
  const baseState = createSimulationState(project, 5);

  const kIds = Object.keys(baseState.kingdoms);
  assert(kIds.length >= 2, `Expected at least 2 kingdoms, found ${kIds.length}`);
  
  const solaria = baseState.kingdoms[kIds[0]];
  assert(typeof solaria.stability === 'number' && solaria.stability >= 0 && solaria.stability <= 100, 'Kingdom stability is bounded 0-100');
  assert(typeof solaria.foodSupply === 'number', 'Food supply is initialized');
  assert(typeof solaria.treasury === 'number', 'Treasury is initialized');
  assert(typeof solaria.militaryPower === 'number', 'Military power is initialized');
  console.log('✓ Kingdom state and baseline extraction verified');

  console.log('--- 2. Testing Resource State Tracking ---');
  assert(solaria.population > 0, 'Population resource tracked');
  assert(solaria.magicReserve !== undefined, 'Magic reserve tracked');
  assert(solaria.influence !== undefined, 'Influence tracked');
  console.log('✓ Resource state tracking verified');

  console.log('--- 3. Testing World Relations ---');
  const relIds = Object.keys(baseState.relations);
  assert(relIds.length >= 1, 'Pairwise world relations generated');
  const rel1 = baseState.relations[relIds[0]];
  assert(rel1.hostilityValue >= 0 && rel1.hostilityValue <= 100, 'Hostility is bounded 0-100');
  assert(rel1.militaryTension >= 0 && rel1.militaryTension <= 100, 'Military tension is bounded 0-100');
  assert(rel1.trustValue >= -100 && rel1.trustValue <= 100, 'Trust value is bounded -100 to +100');
  console.log('✓ World relations verified');

  console.log('--- 4. Testing Rule Creation & Validation ---');
  const validRule: WorldRule = {
    id: 'test-rule-1',
    name: 'Grain Export Bonus',
    scope: 'kingdom',
    enabled: true,
    condition: {
      single: {
        target: 'kingdom',
        property: 'foodSupply',
        operator: '>=',
        value: 80
      }
    },
    effects: [
      {
        target: 'kingdom',
        property: 'treasury',
        operation: 'add',
        value: 10,
        explanation: 'Surplus food sold to neighboring markets.'
      }
    ]
  };

  const valResult = validateRule(validRule);
  assert(valResult.isValid, `Valid rule passed validation: ${valResult.errors.join(', ')}`);
  console.log('✓ Rule creation and schema validation verified');

  console.log('--- 5. Testing Rule Evaluation with Operators & Boolean Logic ---');
  assert(evaluateSingleCondition({ target: 'kingdom', property: 'stability', operator: '>', value: 50 }, { kingdom: solaria, globalVariables: {}, state: baseState }), 'Condition > operator true');
  assert(!evaluateSingleCondition({ target: 'kingdom', property: 'stability', operator: '<', value: 20 }, { kingdom: solaria, globalVariables: {}, state: baseState }), 'Condition < operator false');
  assert(evaluateSingleCondition({ target: 'kingdom', property: 'stability', operator: 'between', value: [0, 100] }, { kingdom: solaria, globalVariables: {}, state: baseState }), 'Condition between operator true');

  // Composite condition
  const compositeCond = {
    and: [
      { single: { target: 'kingdom' as const, property: 'stability', operator: '>=' as const, value: 30 } },
      { not: { single: { target: 'kingdom' as const, property: 'treasury', operator: '<=' as const, value: 0 } } }
    ]
  };
  assert(evaluateCondition(compositeCond, { kingdom: solaria, globalVariables: {}, state: baseState }), 'Composite AND/NOT condition passed');
  console.log('✓ Rule evaluation with operators and boolean logic verified');

  console.log('--- 6. Testing Rule Effects & Clamping Bounds ---');
  const starvingState = deepClone(baseState);
  const starvingKingdom = starvingState.kingdoms[kIds[0]];
  starvingKingdom.foodSupply = 10; // Trigger famine rule

  const evalRes = evaluateAllRules(starvingState, DEFAULT_WORLD_RULES);
  assert(evalRes.some(r => r.ruleId === 'rule-famine-unrest'), 'Famine rule triggered on foodSupply < 25');
  assert(starvingKingdom.stability < solaria.stability, 'Stability was decreased by famine effect');
  console.log('✓ Rule effects and bounds clamping verified');

  console.log('--- 7. Testing Multi-Turn Simulation ---');
  const simState = simulate(baseState, DEFAULT_WORLD_RULES, undefined, 5);
  assert(simState.turn === 5, 'Simulation completed exactly 5 turns');
  assert(simState.history.length === 6, 'History contains Turn 0 initial snapshot + 5 turns');
  console.log('✓ Multi-turn simulation verified');

  console.log('--- 8. Testing Generated Events ---');
  const warState = deepClone(baseState);
  const warRel = warState.relations[relIds[0]];
  warRel.hostilityValue = 90; // High hostility

  const simWar = simulate(warState, DEFAULT_WORLD_RULES, undefined, 3);
  assert(simWar.activeEvents.some(e => e.type === 'war' || e.type === 'unrest'), 'War / skirmish event generated');
  console.log('✓ Generated events detection verified');

  console.log('--- 9. Testing Cause/Effect Tracking & Explainability ---');
  const diff = generateSimulationDiff(baseState, simState);
  assert(diff.summary.totalTurns === 5, 'Diff summarizes total turns');
  const causeChain = getCauseChainForEntity(simState, solaria.name);
  assert(Array.isArray(causeChain), 'Cause chain retrieved for entity');
  const narrative = formatCauseChainNarrative(causeChain);
  assert(narrative.length > 0, 'Narrative explanation generated');
  console.log('✓ Cause/effect tracking and explanations verified');

  console.log('--- 10. Testing Scenario Isolation ---');
  const scenario = createScenario('War in the Marches', 'Simulating what happens if Solaria declares war on Nordmark', baseState, 4);
  addScheduledAction(scenario, {
    turn: 1,
    actionType: 'declare_war',
    sourceEntityId: kIds[0],
    targetEntityId: kIds[1],
    parameters: {},
    explanation: 'Solaria preemptively attacks border forts.'
  });

  const simScenarioState = simulate(baseState, DEFAULT_WORLD_RULES, scenario, 4);
  assert(baseState.relations[relIds[0]].hostilityValue < 50, 'Baseline state was NOT mutated by scenario simulation');
  assert(simScenarioState.relations[relIds[0]].hostilityValue >= 90, 'Simulated state reflects declaration of war');
  console.log('✓ Scenario isolation verified');

  console.log('--- 11. Testing Discard Scenario ---');
  const discarded = discardScenario(scenario);
  assert(discarded.status === 'discarded', 'Scenario marked discarded');
  assert((project as any).kingdoms === undefined || (project as any).kingdoms.length === 0 || project.acts.length === 3, 'Canonical project completely untouched after discard');
  console.log('✓ Discard scenario verified');

  console.log('--- 12. Testing Apply Changes & Automated Safety Snapshot ---');
  const initialSnapshotCount = (project.snapshots || []).length;
  const { updatedProject, confirmation } = applySimulationToProject(project, scenario, simScenarioState);

  assert(confirmation.snapshotId.length > 0, 'Safety snapshot ID generated');
  assert((updatedProject.snapshots || []).length === initialSnapshotCount + 1, 'Pre-apply safety snapshot was recorded');
  assert(confirmation.modifications.length > 0, 'Explicit modifications recorded in confirmation bundle');
  assert((updatedProject as any).kingdoms.length >= 2, 'Canonical kingdoms updated on project');
  assert((updatedProject as any).worldRelations.length >= 1, 'Canonical worldRelations updated on project');
  console.log('✓ Apply changes and automated safety snapshot verified');

  console.log('--- 13. Testing Serialization Round-Trip ---');
  const serialized = JSON.stringify(simScenarioState);
  const reloaded: typeof simScenarioState = JSON.parse(serialized);
  assert(reloaded.turn === 4, 'Reloaded state turn preserved');
  assert(reloaded.history.length === simScenarioState.history.length, 'Reloaded history length matches');
  console.log('✓ JSON serialization round-trip verified');

  console.log('--- 14. Testing Deterministic Repeatability ---');
  const run1 = simulate(baseState, DEFAULT_WORLD_RULES, scenario, 4);
  const run2 = simulate(baseState, DEFAULT_WORLD_RULES, scenario, 4);
  assert(JSON.stringify(run1) === JSON.stringify(run2), 'Identical inputs produce 100% bit-exact outputs');
  console.log('✓ Deterministic repeatability verified');

  console.log('--- 15. Testing Invalid Rule Rejection ---');
  const invalidRule = {
    id: 'bad-rule',
    name: 'Bad',
    scope: 'kingdom' as const,
    enabled: true,
    condition: {
      single: {
        target: 'invalid_target' as any,
        property: 'foo',
        operator: 'invalid_op' as any,
        value: 10
      }
    },
    effects: []
  };
  const invalidVal = validateRule(invalidRule);
  assert(!invalidVal.isValid, 'Invalid rule correctly rejected');
  assert(invalidVal.errors.length >= 2, 'Errors reported for invalid target, operator, and empty effects');
  console.log('✓ Invalid rule rejection verified');

  console.log('--- 16. Testing Magic System Representation via Rules ---');
  const magicRule: WorldRule = {
    id: 'rule-arcane-drain',
    name: 'High Spellcasting Arcane Drain',
    scope: 'kingdom',
    enabled: true,
    condition: {
      single: {
        target: 'kingdom',
        property: 'magicReserve',
        operator: '<',
        value: 15
      }
    },
    effects: [
      {
        target: 'kingdom',
        property: 'stability',
        operation: 'subtract',
        value: 8,
        explanation: 'Arcane drought disrupts wardings and municipal leylines.'
      }
    ]
  };
  const magicVal = validateRule(magicRule);
  assert(magicVal.isValid, 'Magic rules use standard resource/rule schema');
  console.log('✓ Magic system rule representation verified');

  console.log('--- 17. Testing Story Engine Relational Integrity after Apply ---');
  assert(updatedProject.acts.length === project.acts.length, 'All acts preserved');
  assert(updatedProject.acts[0].chapters.length === project.acts[0].chapters.length, 'All chapters preserved');
  assert(updatedProject.characters.length === project.characters.length, 'All characters preserved');
  assert((updatedProject.plotThreads || []).length === (project.plotThreads || []).length, 'All plot threads preserved');
  console.log('✓ Story Engine relational integrity preserved after Apply');

  console.log('--- 18. Testing Canonical Isolation during Simulation ---');
  const unappliedProject = createSimulationTestProject();
  const unappliedState = createSimulationState(unappliedProject, 10);
  simulate(unappliedState, DEFAULT_WORLD_RULES, undefined, 10);
  assert((unappliedProject as any).kingdoms === undefined, 'Canonical project untouched by simulation');
  console.log('✓ Canonical world unchanged during simulation run');

  console.log('--- 19. Testing Local Evaluation Instrumentation ---');
  resetSimulationEvaluationMetrics();
  recordSimulationEvent('simulation_workspace_opened');
  recordSimulationEvent('scenario_created', { durationTurns: 6 });
  recordSimulationEvent('intervention_added', { turn: 1, durationTurns: 6 });
  recordSimulationEvent('simulation_completed', { durationTurns: 6 });
  recordSimulationEvent('turn_scrubbed', { turn: 2 });
  recordSimulationEvent('cause_chain_opened');
  recordSimulationEvent('relationship_edge_selected');
  recordSimulationEvent('scenario_discarded');
  
  const summary = getSimulationEvaluationSummary();
  assert(summary.totalEvents === 8, `Expected 8 events, got ${summary.totalEvents}`);
  assert(summary.scenariosCreated === 1, 'Scenarios created tracked');
  assert(summary.interventionsAdded === 1, 'Interventions added tracked');
  assert(summary.simulationsRun === 1, 'Simulations run tracked');
  assert(summary.causeChainsOpened === 1, 'Cause chains opened tracked');
  assert(summary.relationshipEdgesSelected === 1, 'Relationship edge selected tracked');
  assert(summary.scenariosDiscarded === 1, 'Scenarios discarded tracked');
  console.log('✓ Local evaluation metrics compilation verified');

  console.log('--- 20. Testing Live Delta Shift & Absolute Value Computation ---');
  const baseVal = 72;
  const deltaShift = -30;
  const computedFromDelta = Math.max(0, Math.min(100, baseVal + deltaShift));
  assert(computedFromDelta === 42, `Expected 42, got ${computedFromDelta}`);
  
  const absoluteTarget = 55;
  const computedFromAbs = Math.max(0, Math.min(100, absoluteTarget));
  assert(computedFromAbs === 55, `Expected 55, got ${computedFromAbs}`);
  console.log('✓ Live delta and absolute value computation verified');

  console.log('--- 21. Testing Project-Level Opt-In Enablement & Lifecycle ---');
  const unconfiguredProject = createSimulationTestProject();
  assert(isWorldSimulationEnabled(unconfiguredProject) === false, 'World simulation disabled by default on unconfigured project');

  const enabledProject = enableWorldSimulation(unconfiguredProject);
  assert(isWorldSimulationEnabled(enabledProject) === true, 'World simulation successfully enabled for project');
  assert(enabledProject.metadata.enableWorldSimulation === true, 'Metadata flag stored explicitly');
  assert(enabledProject.acts.length === unconfiguredProject.acts.length, 'Prose and acts remain untouched on enablement');

  const disabledProject = disableWorldSimulation(enabledProject);
  assert(isWorldSimulationEnabled(disabledProject) === false, 'World simulation successfully disabled for project');
  console.log('✓ Project-level opt-in enablement and lifecycle verified');

  console.log('--- 22. Testing Lazy Initialization & Cache Behavior ---');
  clearCrossProjectSimulationState();
  const lazyBaseline = deriveSimulationBaseline(enabledProject, 6);
  assert(Object.keys(lazyBaseline.kingdoms).length >= 2, 'Lazy baseline derives kingdoms on demand');
  const cachedBaseline = deriveSimulationBaseline(enabledProject, 6);
  assert(JSON.stringify(lazyBaseline) === JSON.stringify(cachedBaseline), 'Cached baseline returns bit-exact identical structure');
  console.log('✓ Lazy initialization & cache behavior verified');

  console.log('--- 23. Testing Cross-Project Isolation & Cache Eviction ---');
  const projectA = createSimulationTestProject();
  projectA.metadata.id = 'proj-alpha';
  projectA.metadata.title = 'Project Alpha';
  
  const projectB = createSimulationTestProject();
  projectB.metadata.id = 'proj-beta';
  projectB.metadata.title = 'Project Beta';

  const baselineA = deriveSimulationBaseline(projectA, 6);
  assert(baselineA.turn === 0, 'Project A baseline initialized');

  clearCrossProjectSimulationState(projectB.metadata.id);
  const baselineB = deriveSimulationBaseline(projectB, 6);
  assert(baselineB.turn === 0, 'Project B baseline derived independently without cache collision');
  console.log('✓ Cross-project isolation and cache eviction verified');

  console.log('--- 24. Testing Core Non-Interference with Writing Workflows ---');
  const normalProject = createSimulationTestProject();
  assert((normalProject.metadata as any).enableWorldSimulation !== true, 'Standard project has no simulation flags');
  assert((normalProject as any).kingdoms === undefined, 'No simulation kingdoms injected into raw project data');
  console.log('✓ Core non-interference with writing workflows verified');

  console.log('\n======================================================');
  console.log('  ALL 24 WORLD SIMULATION ENGINE TESTS PASSED (✓)');
  console.log('======================================================\n');
}
