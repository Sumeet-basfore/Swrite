/**
 * Swrite World Simulation Engine — Scenario Sandboxing & Management
 * 
 * Creates and configures sandboxed What-If scenarios without modifying canonical data.
 */

import { 
  SimulationScenario, SimulationState, ScheduledScenarioAction, 
  WorldRule 
} from './types';
import { deepClone } from './state';

/**
 * Creates a new sandboxed simulation scenario attached to a baseline state.
 */
export function createScenario(
  name: string,
  description: string,
  baseState: SimulationState,
  durationTurns: number = 5
): SimulationScenario {
  const timestamp = new Date().toISOString();
  return {
    id: `scenario-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim() || 'Untitled Scenario',
    description: description.trim() || 'Experimental What-If scenario',
    createdAt: timestamp,
    updatedAt: timestamp,
    baseWorldHash: `hash-${Date.now()}`,
    initialOverrides: {},
    scheduledActions: [],
    customRules: [],
    durationTurns,
    status: 'draft'
  };
}

/**
 * Adds a scheduled What-If intervention to the scenario.
 */
export function addScheduledAction(
  scenario: SimulationScenario,
  action: Omit<ScheduledScenarioAction, 'id'>
): ScheduledScenarioAction {
  const newAction: ScheduledScenarioAction = {
    ...action,
    id: `action-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };

  scenario.scheduledActions.push(newAction);
  scenario.updatedAt = new Date().toISOString();
  return newAction;
}

/**
 * Adds a custom author-defined rule to the scenario.
 */
export function addCustomRule(
  scenario: SimulationScenario,
  rule: WorldRule
): void {
  scenario.customRules.push(rule);
  scenario.updatedAt = new Date().toISOString();
}

/**
 * Discards a simulation scenario.
 * Pure function: sets scenario status to 'discarded' and leaves canonical project untouched.
 */
export function discardScenario(scenario: SimulationScenario): SimulationScenario {
  const updated = deepClone(scenario);
  updated.status = 'discarded';
  updated.updatedAt = new Date().toISOString();
  return updated;
}
