/**
 * Swrite World Simulation Engine — Local-Only Evaluation Instrumentation
 * 
 * Tracks anonymized event categories locally for dogfooding evaluation.
 * STRICT PRIVACY: Never records manuscript prose, titles, or private project contents.
 * Purely in-memory and local storage aggregations.
 */

export type SimulationEvaluationEventCategory =
  | 'simulation_workspace_opened'
  | 'simulation_workspace_closed'
  | 'scenario_created'
  | 'intervention_added'
  | 'intervention_removed'
  | 'simulation_started'
  | 'simulation_completed'
  | 'turn_scrubbed'
  | 'cause_chain_opened'
  | 'node_selected'
  | 'relationship_edge_selected'
  | 'scenario_discarded'
  | 'scenario_applied';

export interface SimulationEvaluationEvent {
  category: SimulationEvaluationEventCategory;
  timestamp: string;
  turn?: number;
  durationTurns?: number;
}

export interface SimulationEvaluationSummary {
  sessionStartTime: string;
  totalEvents: number;
  scenariosCreated: number;
  interventionsAdded: number;
  simulationsRun: number;
  turnScrubCount: number;
  causeChainsOpened: number;
  relationshipEdgesSelected: number;
  nodesSelected: number;
  scenariosDiscarded: number;
  scenariosApplied: number;
  recentEvents: SimulationEvaluationEvent[];
}

const STORAGE_KEY = 'swrite_sim_eval_metrics';

let inMemoryEvents: SimulationEvaluationEvent[] = [];

function loadStoredEvents(): SimulationEvaluationEvent[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return [];
}

function saveEvents(events: SimulationEvaluationEvent[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-200)));
    }
  } catch (e) {
    // Ignore storage write errors
  }
}

// Initialize on module load
inMemoryEvents = loadStoredEvents();

/**
 * Records an anonymized evaluation event locally.
 */
export function recordSimulationEvent(
  category: SimulationEvaluationEventCategory,
  extra?: { turn?: number; durationTurns?: number }
): void {
  const event: SimulationEvaluationEvent = {
    category,
    timestamp: new Date().toISOString(),
    turn: extra?.turn,
    durationTurns: extra?.durationTurns
  };

  inMemoryEvents.push(event);
  if (inMemoryEvents.length > 500) {
    inMemoryEvents = inMemoryEvents.slice(-500);
  }
  saveEvents(inMemoryEvents);
}

/**
 * Compiles a structured evaluation summary.
 */
export function getSimulationEvaluationSummary(): SimulationEvaluationSummary {
  const events = inMemoryEvents.length > 0 ? inMemoryEvents : loadStoredEvents();

  const countCategory = (cat: SimulationEvaluationEventCategory) =>
    events.filter(e => e.category === cat).length;

  return {
    sessionStartTime: events[0]?.timestamp || new Date().toISOString(),
    totalEvents: events.length,
    scenariosCreated: countCategory('scenario_created'),
    interventionsAdded: countCategory('intervention_added'),
    simulationsRun: countCategory('simulation_completed'),
    turnScrubCount: countCategory('turn_scrubbed'),
    causeChainsOpened: countCategory('cause_chain_opened'),
    relationshipEdgesSelected: countCategory('relationship_edge_selected'),
    nodesSelected: countCategory('node_selected'),
    scenariosDiscarded: countCategory('scenario_discarded'),
    scenariosApplied: countCategory('scenario_applied'),
    recentEvents: events.slice(-30)
  };
}

/**
 * Clears all recorded evaluation metrics.
 */
export function resetSimulationEvaluationMetrics(): void {
  inMemoryEvents = [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    // Ignore
  }
}
