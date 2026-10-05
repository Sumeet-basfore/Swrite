/**
 * Swrite World Simulation Engine — Simulation State & Scenario Isolation
 * 
 * Manages sandboxed simulation states isolated from the canonical project,
 * applies scheduled scenario actions, and handles deep state cloning.
 */

import { ProjectData, Faction, Location } from '../../types';
import { 
  SimulationState, Kingdom, WorldRelation, ScheduledScenarioAction, 
  CauseChainNode, SimulationEvent 
} from './types';

/**
 * Deep clones an object safely without structuredClone dependencies or reference leakage.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Initializes a sandboxed SimulationState from canonical project data.
 * Pure function: never mutates or retains references to canonical ProjectData.
 */
export function createSimulationState(
  project: ProjectData,
  maxTurns: number = 5
): SimulationState {
  const kingdoms: Record<string, Kingdom> = {};
  const relations: Record<string, WorldRelation> = {};
  const globalVariables: Record<string, number> = {
    globalStability: 75,
    arcaneFluctuation: 20,
    tradeTariffBaseline: 10
  };

  // 1. Extract or initialize kingdoms from project factions / locations
  const rawKingdoms = (project as any).kingdoms as Kingdom[] | undefined;

  if (Array.isArray(rawKingdoms) && rawKingdoms.length > 0) {
    rawKingdoms.forEach(k => {
      kingdoms[k.id] = deepClone(k);
    });
  } else if (Array.isArray(project.factions) && project.factions.length > 0) {
    // Derive kingdom baseline representations from key factions
    project.factions.forEach((f, idx) => {
      const kId = `kingdom-${f.id.replace('fac-', '')}`;
      kingdoms[kId] = {
        id: kId,
        name: f.name || `Realm of ${f.name}`,
        description: f.description || 'Major sovereign realm',
        population: 50000 + (idx * 25000),
        stability: (f as any).alignment?.toLowerCase().includes('chaotic') ? 45 : 70,
        treasury: 100 + (idx * 30),
        militaryPower: 60 + (idx * 10),
        foodSupply: 65,
        influence: 50,
        magicReserve: 40,
        controlledLocationIds: (project.locations || []).slice(idx * 2, (idx + 1) * 2).map(l => l.id),
        factionIds: [f.id],
        color: f.color || '#6366F1'
      };
    });
  } else {
    // Default baseline realms if project has no factions
    kingdoms['kingdom-solaria'] = {
      id: 'kingdom-solaria',
      name: 'Kingdom of Solaria',
      description: 'The fertile southern realm of high agriculture and maritime trade.',
      population: 120000,
      stability: 80,
      treasury: 150,
      militaryPower: 65,
      foodSupply: 90,
      influence: 75,
      magicReserve: 30,
      controlledLocationIds: [],
      factionIds: [],
      color: '#F59E0B'
    };

    kingdoms['kingdom-nordmark'] = {
      id: 'kingdom-nordmark',
      name: 'The Iron Reaches of Nordmark',
      description: 'Mountain stronghold of heavy iron foundries and fortified garrisons.',
      population: 85000,
      stability: 65,
      treasury: 90,
      militaryPower: 95,
      foodSupply: 40,
      influence: 50,
      magicReserve: 20,
      controlledLocationIds: [],
      factionIds: [],
      color: '#6366F1'
    };
  }

  // 2. Extract or build default relations
  const rawRelations = (project as any).worldRelations as WorldRelation[] | undefined;

  if (Array.isArray(rawRelations) && rawRelations.length > 0) {
    rawRelations.forEach(r => {
      relations[r.id] = deepClone(r);
    });
  } else {
    // Generate pairwise relations between existing kingdoms
    const kList = Object.values(kingdoms);
    for (let i = 0; i < kList.length; i++) {
      for (let j = i + 1; j < kList.length; j++) {
        const kA = kList[i];
        const kB = kList[j];
        const relId = `rel-${kA.id}-${kB.id}`;

        relations[relId] = {
          id: relId,
          sourceEntityId: kA.id,
          targetEntityId: kB.id,
          type: 'trade',
          value: 20,
          tradeValue: 50,
          trustValue: 30,
          hostilityValue: 15,
          militaryTension: 20,
          notes: `Bilateral diplomatic channel between ${kA.name} and ${kB.name}`
        };
      }
    }
  }

  return {
    turn: 0,
    maxTurns,
    kingdoms,
    relations,
    globalVariables,
    activeEvents: [],
    history: []
  };
}

/**
 * Applies a scheduled scenario action (e.g. declare war, block trade, disaster)
 * to mutate state and log a cause trace node.
 */
export function applyScenarioAction(
  state: SimulationState, 
  action: ScheduledScenarioAction
): { causeNode?: CauseChainNode; generatedEvent?: SimulationEvent } {
  const currentTurn = state.turn;

  switch (action.actionType) {
    case 'declare_war': {
      if (!action.sourceEntityId || !action.targetEntityId) return {};
      const rel = Object.values(state.relations).find(
        r => (r.sourceEntityId === action.sourceEntityId && r.targetEntityId === action.targetEntityId) ||
             (r.sourceEntityId === action.targetEntityId && r.targetEntityId === action.sourceEntityId)
      );

      const srcName = state.kingdoms[action.sourceEntityId]?.name || action.sourceEntityId;
      const tgtName = state.kingdoms[action.targetEntityId]?.name || action.targetEntityId;

      if (rel) {
        rel.type = 'hostility';
        rel.hostilityValue = 95;
        rel.militaryTension = 90;
        rel.tradeValue = 0;
        rel.trustValue = -80;
      }

      const causeNode: CauseChainNode = {
        turn: currentTurn,
        trigger: 'Author Scenario Action: Declare War',
        sourceEntityName: `${srcName} ⚔ ${tgtName}`,
        targetProperty: `Relation(${srcName}, ${tgtName}).hostilityValue`,
        beforeValue: rel ? 15 : 0,
        afterValue: 95,
        rationale: action.explanation || `War officially declared between ${srcName} and ${tgtName}.`
      };

      const generatedEvent: SimulationEvent = {
        id: `ev-action-${currentTurn}-war-${action.sourceEntityId}-${action.targetEntityId}`,
        turn: currentTurn,
        title: `Declaration of War: ${srcName} against ${tgtName}`,
        description: action.explanation || `Envoys recalled and formal hostilities declared.`,
        type: 'war',
        severity: 'critical',
        primaryEntityId: action.sourceEntityId,
        primaryEntityName: srcName,
        secondaryEntityId: action.targetEntityId,
        secondaryEntityName: tgtName,
        causes: ['Scheduled Scenario Action'],
        effectsSummary: ['Trade severed', 'Hostility maximized', 'Border tension spiked']
      };

      return { causeNode, generatedEvent };
    }

    case 'block_trade': {
      if (!action.sourceEntityId || !action.targetEntityId) return {};
      const rel = Object.values(state.relations).find(
        r => (r.sourceEntityId === action.sourceEntityId && r.targetEntityId === action.targetEntityId) ||
             (r.sourceEntityId === action.targetEntityId && r.targetEntityId === action.sourceEntityId)
      );

      const srcName = state.kingdoms[action.sourceEntityId]?.name || action.sourceEntityId;
      const tgtName = state.kingdoms[action.targetEntityId]?.name || action.targetEntityId;

      if (rel) {
        rel.tradeValue = 0;
        rel.trustValue = Math.max(-100, rel.trustValue - 30);
        rel.militaryTension = Math.min(100, rel.militaryTension + 25);
      }

      const causeNode: CauseChainNode = {
        turn: currentTurn,
        trigger: 'Author Scenario Action: Trade Embargo',
        sourceEntityName: `${srcName} ⊘ ${tgtName}`,
        targetProperty: `Relation(${srcName}, ${tgtName}).tradeValue`,
        beforeValue: 50,
        afterValue: 0,
        rationale: action.explanation || `Naval blockade and merchant route closure enacted by ${srcName}.`
      };

      const generatedEvent: SimulationEvent = {
        id: `ev-action-${currentTurn}-embargo-${action.sourceEntityId}-${action.targetEntityId}`,
        turn: currentTurn,
        title: `Trade Embargo Imposed: ${srcName} on ${tgtName}`,
        description: action.explanation || `All bilateral freight and merchant transit suspended.`,
        type: 'embargo',
        severity: 'high',
        primaryEntityId: action.sourceEntityId,
        primaryEntityName: srcName,
        secondaryEntityId: action.targetEntityId,
        secondaryEntityName: tgtName,
        causes: ['Scheduled Scenario Action'],
        effectsSummary: ['Trade value set to 0', 'Tension increased']
      };

      return { causeNode, generatedEvent };
    }

    case 'adjust_resource': {
      const kId = action.sourceEntityId;
      if (!kId || !state.kingdoms[kId]) return {};
      const kingdom = state.kingdoms[kId];
      const prop = action.parameters.property;
      const delta = Number(action.parameters.delta) || 0;

      if (prop && (kingdom as any)[prop] !== undefined) {
        const before = (kingdom as any)[prop];
        let after = before + delta;
        if (['stability', 'foodSupply', 'influence', 'magicReserve'].includes(prop)) {
          after = Math.max(0, Math.min(100, after));
        } else if (['treasury', 'militaryPower', 'population'].includes(prop)) {
          after = Math.max(0, after);
        }
        (kingdom as any)[prop] = after;

        const causeNode: CauseChainNode = {
          turn: currentTurn,
          trigger: 'Author Scenario Action: Resource Adjustment',
          sourceEntityName: kingdom.name,
          targetProperty: `${kingdom.name}.${prop}`,
          beforeValue: before,
          afterValue: after,
          rationale: action.explanation || `Manual adjustment of ${prop} by ${delta > 0 ? `+${delta}` : delta}.`
        };

        return { causeNode };
      }
      return {};
    }

    case 'break_alliance': {
      if (!action.sourceEntityId || !action.targetEntityId) return {};
      const rel = Object.values(state.relations).find(
        r => (r.sourceEntityId === action.sourceEntityId && r.targetEntityId === action.targetEntityId) ||
             (r.sourceEntityId === action.targetEntityId && r.targetEntityId === action.sourceEntityId)
      );

      const srcName = state.kingdoms[action.sourceEntityId]?.name || action.sourceEntityId;
      const tgtName = state.kingdoms[action.targetEntityId]?.name || action.targetEntityId;

      if (rel) {
        rel.type = 'neutrality';
        rel.value = 0;
        rel.trustValue = Math.max(-100, rel.trustValue - 50);
      }

      const causeNode: CauseChainNode = {
        turn: currentTurn,
        trigger: 'Author Scenario Action: Pact Renunciation',
        sourceEntityName: `${srcName} ↔ ${tgtName}`,
        targetProperty: `Relation(${srcName}, ${tgtName}).type`,
        beforeValue: 'alliance',
        afterValue: 'neutrality',
        rationale: action.explanation || `Bilateral treaties unilaterally revoked.`
      };

      return { causeNode };
    }

    default:
      return {};
  }
}
