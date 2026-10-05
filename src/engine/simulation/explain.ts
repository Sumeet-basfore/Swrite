/**
 * Swrite World Simulation Engine — Cause/Effect Reasoning & Diff Explainability
 * 
 * Computes transparent explanations, cause chains, and resource deltas
 * between the canonical base world and the simulated scenario.
 */

import { 
  SimulationState, SimulationDiff, ResourceDelta, RelationDelta, 
  CauseChainNode, SimulationEvent 
} from './types';

/**
 * Extracts the full sequential cause chain that affected a specific entity property across all turns.
 */
export function getCauseChainForEntity(
  state: SimulationState,
  entityNameOrId: string,
  property?: string
): CauseChainNode[] {
  const nodes: CauseChainNode[] = [];

  for (const entry of state.history) {
    for (const node of entry.causeChains) {
      const matchEntity = node.sourceEntityName.includes(entityNameOrId) || node.targetProperty.includes(entityNameOrId);
      const matchProp = property ? node.targetProperty.includes(property) : true;

      if (matchEntity && matchProp) {
        nodes.push(node);
      }
    }
  }

  return nodes;
}

/**
 * Generates a structured narrative explanation string from a list of cause nodes.
 */
export function formatCauseChainNarrative(causeNodes: CauseChainNode[]): string[] {
  if (causeNodes.length === 0) {
    return ['No recorded external triggers or rule effects affected this property.'];
  }

  return causeNodes.map(node => {
    const deltaStr = typeof node.beforeValue === 'number' && typeof node.afterValue === 'number'
      ? ` (${node.beforeValue} → ${node.afterValue})`
      : '';
    return `Turn ${node.turn}: ${node.trigger} → ${node.rationale}${deltaStr}`;
  });
}

/**
 * Compares a baseline state against a simulated outcome state.
 */
export function generateSimulationDiff(
  baseState: SimulationState,
  simulatedState: SimulationState
): SimulationDiff {
  const resourceDeltas: ResourceDelta[] = [];
  const relationDeltas: RelationDelta[] = [];
  const criticalRisks: string[] = [];

  // 1. Compute Kingdom Resource Deltas
  for (const [kId, baseK] of Object.entries(baseState.kingdoms)) {
    const simK = simulatedState.kingdoms[kId];
    if (!simK) continue;

    const numericProps: (keyof typeof baseK)[] = [
      'stability', 'treasury', 'militaryPower', 'foodSupply', 'influence', 'magicReserve', 'population'
    ];

    for (const prop of numericProps) {
      const baseVal = Number(baseK[prop]) || 0;
      const simVal = Number(simK[prop]) || 0;
      const delta = simVal - baseVal;

      if (delta !== 0) {
        const causeChain = getCauseChainForEntity(simulatedState, baseK.name, String(prop));
        resourceDeltas.push({
          entityId: kId,
          entityName: baseK.name,
          property: String(prop),
          baseValue: baseVal,
          simulatedValue: simVal,
          delta,
          causeChain
        });
      }
    }

    // Check critical state thresholds
    if (simK.stability <= 25) {
      criticalRisks.push(`Severe instability in ${simK.name} (${simK.stability}/100) — high risk of civil revolt.`);
    }
    if (simK.foodSupply <= 20) {
      criticalRisks.push(`Famine conditions in ${simK.name} (Food: ${simK.foodSupply}/100).`);
    }
    if (simK.treasury <= 0) {
      criticalRisks.push(`Treasury bankruptcy in ${simK.name} (${simK.treasury} gold).`);
    }
  }

  // 2. Compute Relation Deltas
  for (const [rId, baseR] of Object.entries(baseState.relations)) {
    const simR = simulatedState.relations[rId];
    if (!simR) continue;

    const srcName = baseState.kingdoms[baseR.sourceEntityId]?.name || baseR.sourceEntityId;
    const tgtName = baseState.kingdoms[baseR.targetEntityId]?.name || baseR.targetEntityId;

    const hostilityDelta = simR.hostilityValue - baseR.hostilityValue;
    const tensionDelta = simR.militaryTension - baseR.militaryTension;
    const tradeDelta = simR.tradeValue - baseR.tradeValue;

    if (hostilityDelta !== 0 || tensionDelta !== 0 || tradeDelta !== 0 || simR.type !== baseR.type) {
      const causeChain = getCauseChainForEntity(simulatedState, `${srcName} ↔ ${tgtName}`);
      relationDeltas.push({
        relationId: rId,
        sourceEntityId: baseR.sourceEntityId,
        sourceName: srcName,
        targetEntityId: baseR.targetEntityId,
        targetName: tgtName,
        type: simR.type,
        baseHostility: baseR.hostilityValue,
        simulatedHostility: simR.hostilityValue,
        baseTension: baseR.militaryTension,
        simulatedTension: simR.militaryTension,
        baseTrade: baseR.tradeValue,
        simulatedTrade: simR.tradeValue,
        causeChain
      });
    }

    if (simR.hostilityValue >= 80) {
      criticalRisks.push(`High risk of active armed conflict between ${srcName} and ${tgtName} (Hostility: ${simR.hostilityValue}/100).`);
    }
  }

  // 3. Collect Generated Events
  const generatedEvents: SimulationEvent[] = [...simulatedState.activeEvents];

  return {
    resourceDeltas,
    relationDeltas,
    generatedEvents,
    criticalRisks,
    summary: {
      totalTurns: simulatedState.turn,
      kingdomsAffected: new Set(resourceDeltas.map(d => d.entityId)).size,
      relationsAffected: relationDeltas.length,
      eventsTriggered: generatedEvents.length
    }
  };
}
