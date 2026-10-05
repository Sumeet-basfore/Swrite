/**
 * Swrite World Simulation Engine — Type Definitions
 * 
 * Defines the core domain model for deterministic, turn-based world simulation,
 * scenario sandboxing, rule evaluation, cause/effect tracing, and safe canonical application.
 */

import { Faction, Location, ProjectData } from '../../types';

export type ResourceType = 'food' | 'gold' | 'military' | 'influence' | 'magic' | 'population' | string;

export type RelationType = 
  | 'alliance' 
  | 'rivalry' 
  | 'trade' 
  | 'control' 
  | 'hostility' 
  | 'neutrality' 
  | 'dependency' 
  | string;

export type SimulationEventType = 
  | 'war' 
  | 'embargo' 
  | 'famine' 
  | 'rebellion' 
  | 'treaty' 
  | 'unrest' 
  | 'magic_surge' 
  | 'economic_boom'
  | 'custom';

/**
 * 1. Kingdom Entity
 */
export interface Kingdom {
  id: string;
  name: string;
  description: string;
  population: number;
  stability: number;       // 0 to 100
  treasury: number;        // Gold / wealth units
  militaryPower: number;   // Military force rating
  foodSupply: number;      // Food surplus / deficit rating (0 to 100 baseline)
  influence: number;       // Political / diplomatic leverage (0 to 100)
  magicReserve: number;    // Arcane / energy reserves (0 to 100)
  controlledLocationIds: string[];
  factionIds: string[];
  customResources?: Record<string, number>;
  color?: string;
  isCustom?: boolean;
}

/**
 * 2. World Relationship Entity
 */
export interface WorldRelation {
  id: string;
  sourceEntityId: string;  // Kingdom, Faction, etc.
  targetEntityId: string;
  type: RelationType;
  value: number;           // General disposition: -100 (abyssal war) to +100 (eternal alliance)
  tradeValue: number;      // Volume/wealth of bilateral trade
  trustValue: number;      // Diplomatic trust: -100 to +100
  hostilityValue: number;  // Direct enmity: 0 (peaceful) to 100 (active war)
  militaryTension: number; // Border tension: 0 (relaxed) to 100 (brink of conflict)
  notes?: string;
}

/**
 * 3. Rule Condition Definition (Strictly constrained, safe, serializable)
 */
export type ConditionOperator = '<' | '<=' | '==' | '!=' | '>=' | '>' | 'between';

export interface SingleCondition {
  target: 'kingdom' | 'relation' | 'global' | 'faction';
  property: string;
  operator: ConditionOperator;
  value: number | string | [number, number];
  entityId?: string; // 'source' | 'target' | 'any' | specific entity ID
}

export interface RuleCondition {
  single?: SingleCondition;
  and?: RuleCondition[];
  or?: RuleCondition[];
  not?: RuleCondition;
}

/**
 * 4. Rule Effect Definition
 */
export type EffectOperation = 'add' | 'subtract' | 'set' | 'multiply' | 'trigger_event';

export interface RuleEffect {
  target: 'kingdom' | 'relation' | 'global' | 'faction' | 'event';
  property?: string;
  operation: EffectOperation;
  value: number | string;
  entityId?: string; // 'source' | 'target' | 'current' | specific ID | 'all'
  explanation: string;
  eventDetails?: {
    type: SimulationEventType;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

/**
 * 5. World Rule Entity
 */
export interface WorldRule {
  id: string;
  name: string;
  description?: string;
  scope: 'global' | 'kingdom' | 'relation' | 'faction';
  targetEntityId?: string; // Optional filter to specific kingdom/relation
  condition: RuleCondition;
  effects: RuleEffect[];
  priority?: number; // Higher numbers run first
  enabled: boolean;
  category?: 'economy' | 'military' | 'diplomacy' | 'magic' | 'social' | 'custom';
}

/**
 * 6. Cause Chain Node (Explainable reasoning)
 */
export interface CauseChainNode {
  turn: number;
  trigger: string;
  sourceEntityName: string;
  targetProperty: string;
  beforeValue: number | string;
  afterValue: number | string;
  rationale: string;
  ruleId?: string;
  ruleName?: string;
}

/**
 * 7. Simulation Event
 */
export interface SimulationEvent {
  id: string;
  turn: number;
  title: string;
  description: string;
  type: SimulationEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  primaryEntityId?: string;
  primaryEntityName?: string;
  secondaryEntityId?: string;
  secondaryEntityName?: string;
  causes: string[];
  effectsSummary: string[];
  resolvedTurn?: number;
}

/**
 * 8. Turn History Entry
 */
export interface TurnHistoryEntry {
  turn: number;
  stateSnapshot: {
    kingdoms: Record<string, Kingdom>;
    relations: Record<string, WorldRelation>;
    globalVariables: Record<string, number>;
  };
  appliedRules: {
    ruleId: string;
    ruleName: string;
    entityId: string;
    entityName: string;
    explanation: string;
  }[];
  eventsGenerated: SimulationEvent[];
  causeChains: CauseChainNode[];
}

/**
 * 9. Simulation State
 */
export interface SimulationState {
  turn: number;
  maxTurns: number;
  kingdoms: Record<string, Kingdom>;
  relations: Record<string, WorldRelation>;
  globalVariables: Record<string, number>;
  activeEvents: SimulationEvent[];
  history: TurnHistoryEntry[];
}

/**
 * 10. Scheduled Scenario Action (What-if Intervention)
 */
export interface ScheduledScenarioAction {
  id: string;
  turn: number;
  actionType: 
    | 'declare_war' 
    | 'block_trade' 
    | 'break_alliance' 
    | 'adjust_resource' 
    | 'transfer_territory' 
    | 'trigger_disaster'
    | 'custom';
  sourceEntityId?: string;
  targetEntityId?: string;
  parameters: Record<string, any>;
  explanation: string;
}

/**
 * 11. Simulation Scenario (Sandboxed What-If Experiment)
 */
export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  baseWorldHash: string;
  initialOverrides?: {
    kingdoms?: Record<string, Partial<Kingdom>>;
    relations?: Record<string, Partial<WorldRelation>>;
    globalVariables?: Record<string, number>;
  };
  scheduledActions: ScheduledScenarioAction[];
  customRules: WorldRule[];
  durationTurns: number;
  lastSimulatedState?: SimulationState;
  status: 'draft' | 'running' | 'completed' | 'applied' | 'discarded';
}

/**
 * 12. Simulation Diff (Base World vs Simulated Consequence)
 */
export interface ResourceDelta {
  entityId: string;
  entityName: string;
  property: string;
  baseValue: number;
  simulatedValue: number;
  delta: number;
  causeChain: CauseChainNode[];
}

export interface RelationDelta {
  relationId: string;
  sourceEntityId: string;
  sourceName: string;
  targetEntityId: string;
  targetName: string;
  type: RelationType;
  baseHostility: number;
  simulatedHostility: number;
  baseTension: number;
  simulatedTension: number;
  baseTrade: number;
  simulatedTrade: number;
  causeChain: CauseChainNode[];
}

export interface SimulationDiff {
  resourceDeltas: ResourceDelta[];
  relationDeltas: RelationDelta[];
  generatedEvents: SimulationEvent[];
  criticalRisks: string[];
  summary: {
    totalTurns: number;
    kingdomsAffected: number;
    relationsAffected: number;
    eventsTriggered: number;
  };
}

/**
 * 13. Canonical Apply Confirmation Bundle
 */
export interface CanonicalApplyConfirmation {
  scenarioId: string;
  scenarioName: string;
  snapshotId: string;
  snapshotLabel: string;
  timestamp: string;
  affectedKingdomCount: number;
  affectedRelationCount: number;
  eventsToIngestCount: number;
  modifications: {
    target: string;
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
