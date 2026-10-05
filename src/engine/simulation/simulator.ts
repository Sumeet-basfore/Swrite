/**
 * Swrite World Simulation Engine — Multi-Turn Deterministic Simulator
 * 
 * Executes turn-based simulation passes deterministically:
 * 1. Executes scheduled scenario actions for the current turn.
 * 2. Evaluates all active world rules.
 * 3. Records state deltas, cause chains, and generated events.
 * 4. Advances turn history snapshot.
 */

import { 
  SimulationState, WorldRule, SimulationScenario, TurnHistoryEntry, 
  CauseChainNode, SimulationEvent 
} from './types';
import { evaluateAllRules } from './evaluator';
import { applyScenarioAction, deepClone } from './state';
import { DEFAULT_WORLD_RULES } from './rules';

/**
 * Runs a multi-turn simulation from a given initialState.
 * Pure and deterministic: identical inputs always yield identical states.
 */
export function simulate(
  initialState: SimulationState,
  rules: WorldRule[] = DEFAULT_WORLD_RULES,
  scenario?: SimulationScenario,
  durationTurns: number = 5
): SimulationState {
  // Deep clone initial state so the baseline state is never mutated directly
  const state: SimulationState = deepClone(initialState);
  state.maxTurns = durationTurns;

  const combinedRules = [
    ...rules,
    ...(scenario?.customRules || [])
  ];

  // Record Turn 0 initial snapshot in history if empty
  if (state.history.length === 0) {
    state.history.push({
      turn: 0,
      stateSnapshot: {
        kingdoms: deepClone(state.kingdoms),
        relations: deepClone(state.relations),
        globalVariables: deepClone(state.globalVariables)
      },
      appliedRules: [],
      eventsGenerated: [],
      causeChains: []
    });
  }

  // Iterate turn by turn
  for (let t = 1; t <= durationTurns; t++) {
    state.turn = t;
    const turnCauseChains: CauseChainNode[] = [];
    const turnGeneratedEvents: SimulationEvent[] = [];
    const turnAppliedRules: {
      ruleId: string;
      ruleName: string;
      entityId: string;
      entityName: string;
      explanation: string;
    }[] = [];

    // Step 1: Apply scheduled actions for this turn
    if (scenario?.scheduledActions) {
      const actionsForTurn = scenario.scheduledActions.filter(a => a.turn === t);
      for (const action of actionsForTurn) {
        const { causeNode, generatedEvent } = applyScenarioAction(state, action);
        if (causeNode) turnCauseChains.push(causeNode);
        if (generatedEvent) {
          turnGeneratedEvents.push(generatedEvent);
          state.activeEvents.push(generatedEvent);
        }
      }
    }

    // Step 2: Evaluate and apply all valid rules
    const evalResults = evaluateAllRules(state, combinedRules);

    for (const res of evalResults) {
      turnAppliedRules.push({
        ruleId: res.ruleId,
        ruleName: res.ruleName,
        entityId: res.matchedEntityId,
        entityName: res.matchedEntityName,
        explanation: `Rule "${res.ruleName}" fired on ${res.matchedEntityName}`
      });

      if (res.causeNodes.length > 0) {
        turnCauseChains.push(...res.causeNodes);
      }

      if (res.generatedEvents.length > 0) {
        for (let eIdx = 0; eIdx < res.generatedEvents.length; eIdx++) {
          const ev = res.generatedEvents[eIdx];
          // Ensure deterministic event ID
          ev.id = `ev-t${t}-${res.ruleId}-${res.matchedEntityId}-${eIdx + 1}`;
          turnGeneratedEvents.push(ev);
          state.activeEvents.push(ev);
        }
      }
    }

    // Step 3: Record turn history snapshot
    const historyEntry: TurnHistoryEntry = {
      turn: t,
      stateSnapshot: {
        kingdoms: deepClone(state.kingdoms),
        relations: deepClone(state.relations),
        globalVariables: deepClone(state.globalVariables)
      },
      appliedRules: turnAppliedRules,
      eventsGenerated: turnGeneratedEvents,
      causeChains: turnCauseChains
    };

    state.history.push(historyEntry);
  }

  return state;
}
