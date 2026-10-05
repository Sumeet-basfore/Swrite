/**
 * Swrite World Simulation Engine — Canonical World Apply Safety
 * 
 * Safely applies validated simulation results to the canonical ProjectData:
 * 1. Generates an automated pre-apply safety snapshot.
 * 2. Compiles an explicit audit confirmation of all modified values.
 * 3. Safely mutates the canonical world model.
 * 4. Preserves all existing Story Engine relationship and structural integrity.
 */

import { ProjectData, Event } from '../../types';
import { createSnapshot } from '../snapshot/engine';
import { 
  SimulationScenario, SimulationState, CanonicalApplyConfirmation, 
  Kingdom, WorldRelation 
} from './types';
import { deepClone } from './state';

export interface ApplySimulationOptions {
  ingestMajorEventsToTimeline?: boolean;
}

/**
 * Applies simulated world consequences into the canonical project.
 * Guaranteed to create a safety snapshot before mutating canonical data.
 */
export function applySimulationToProject(
  canonicalProject: ProjectData,
  scenario: SimulationScenario,
  simulatedState: SimulationState,
  options: ApplySimulationOptions = { ingestMajorEventsToTimeline: true }
): { updatedProject: ProjectData; confirmation: CanonicalApplyConfirmation } {
  // 1. Deep clone canonical project
  const updatedProject: ProjectData = deepClone(canonicalProject);

  // 2. Create Pre-Apply Safety Snapshot
  const safetySnapshot = createSnapshot(canonicalProject, {
    type: 'manual',
    source: 'user',
    label: `Pre-Simulation Apply: ${scenario.name}`
  });

  if (!Array.isArray(updatedProject.snapshots)) {
    updatedProject.snapshots = [];
  }
  updatedProject.snapshots.push(safetySnapshot);

  // 3. Track explicit modifications for the confirmation audit
  const modifications: {
    target: string;
    field: string;
    oldValue: any;
    newValue: any;
  }[] = [];

  // 4. Update Kingdoms
  const canonicalKingdoms = ((updatedProject as any).kingdoms || []) as Kingdom[];
  const updatedKingdomMap: Record<string, Kingdom> = {};

  canonicalKingdoms.forEach(k => {
    updatedKingdomMap[k.id] = k;
  });

  for (const [kId, simK] of Object.entries(simulatedState.kingdoms)) {
    const existing = updatedKingdomMap[kId];
    if (existing) {
      if (existing.stability !== simK.stability) {
        modifications.push({ target: existing.name, field: 'stability', oldValue: existing.stability, newValue: simK.stability });
        existing.stability = simK.stability;
      }
      if (existing.treasury !== simK.treasury) {
        modifications.push({ target: existing.name, field: 'treasury', oldValue: existing.treasury, newValue: simK.treasury });
        existing.treasury = simK.treasury;
      }
      if (existing.militaryPower !== simK.militaryPower) {
        modifications.push({ target: existing.name, field: 'militaryPower', oldValue: existing.militaryPower, newValue: simK.militaryPower });
        existing.militaryPower = simK.militaryPower;
      }
      if (existing.foodSupply !== simK.foodSupply) {
        modifications.push({ target: existing.name, field: 'foodSupply', oldValue: existing.foodSupply, newValue: simK.foodSupply });
        existing.foodSupply = simK.foodSupply;
      }
      if (existing.influence !== simK.influence) {
        modifications.push({ target: existing.name, field: 'influence', oldValue: existing.influence, newValue: simK.influence });
        existing.influence = simK.influence;
      }
      if (existing.magicReserve !== simK.magicReserve) {
        modifications.push({ target: existing.name, field: 'magicReserve', oldValue: existing.magicReserve, newValue: simK.magicReserve });
        existing.magicReserve = simK.magicReserve;
      }
    } else {
      // New kingdom created in simulation
      canonicalKingdoms.push(deepClone(simK));
      modifications.push({ target: simK.name, field: 'created', oldValue: null, newValue: simK });
    }
  }

  (updatedProject as any).kingdoms = canonicalKingdoms;

  // 5. Update Relations
  const canonicalRelations = ((updatedProject as any).worldRelations || []) as WorldRelation[];
  const updatedRelMap: Record<string, WorldRelation> = {};

  canonicalRelations.forEach(r => {
    updatedRelMap[r.id] = r;
  });

  for (const [rId, simR] of Object.entries(simulatedState.relations)) {
    const existing = updatedRelMap[rId];
    const srcName = simulatedState.kingdoms[simR.sourceEntityId]?.name || simR.sourceEntityId;
    const tgtName = simulatedState.kingdoms[simR.targetEntityId]?.name || simR.targetEntityId;
    const relLabel = `${srcName} ↔ ${tgtName}`;

    if (existing) {
      if (existing.type !== simR.type) {
        modifications.push({ target: relLabel, field: 'type', oldValue: existing.type, newValue: simR.type });
        existing.type = simR.type;
      }
      if (existing.hostilityValue !== simR.hostilityValue) {
        modifications.push({ target: relLabel, field: 'hostilityValue', oldValue: existing.hostilityValue, newValue: simR.hostilityValue });
        existing.hostilityValue = simR.hostilityValue;
      }
      if (existing.militaryTension !== simR.militaryTension) {
        modifications.push({ target: relLabel, field: 'militaryTension', oldValue: existing.militaryTension, newValue: simR.militaryTension });
        existing.militaryTension = simR.militaryTension;
      }
      if (existing.tradeValue !== simR.tradeValue) {
        modifications.push({ target: relLabel, field: 'tradeValue', oldValue: existing.tradeValue, newValue: simR.tradeValue });
        existing.tradeValue = simR.tradeValue;
      }
      if (existing.trustValue !== simR.trustValue) {
        modifications.push({ target: relLabel, field: 'trustValue', oldValue: existing.trustValue, newValue: simR.trustValue });
        existing.trustValue = simR.trustValue;
      }
    } else {
      canonicalRelations.push(deepClone(simR));
      modifications.push({ target: relLabel, field: 'created', oldValue: null, newValue: simR });
    }
  }

  (updatedProject as any).worldRelations = canonicalRelations;

  // 6. Ingest generated critical simulation events into canonical project.events if enabled
  let ingestedEventCount = 0;
  if (options.ingestMajorEventsToTimeline && simulatedState.activeEvents.length > 0) {
    if (!Array.isArray(updatedProject.events)) {
      updatedProject.events = [];
    }

    const maxOrder = updatedProject.events.reduce((max, e) => Math.max(max, e.order || 0), 0);
    let orderIndex = maxOrder + 1;

    simulatedState.activeEvents.forEach(simEv => {
      const canonEvent: Event = {
        id: `ev-sim-${simEv.id}`,
        title: simEv.title,
        summary: simEv.description,
        description: `${simEv.description}\n\nCauses:\n${simEv.causes.join('\n')}`,
        timelineDate: `Simulation Turn ${simEv.turn}`,
        order: orderIndex++,
        type: simEv.type === 'war' ? 'world-event' : 'backstory',
        impact: simEv.severity === 'critical' ? 'major' : 'minor',
        tags: ['world-simulation', simEv.type]
      };

      if (updatedProject.events) {
        updatedProject.events.push(canonEvent);
      }
      ingestedEventCount++;
      modifications.push({ target: `Timeline Event: ${simEv.title}`, field: 'created', oldValue: null, newValue: canonEvent });
    });
  }

  // 7. Update scenario status to 'applied'
  scenario.status = 'applied';
  scenario.updatedAt = new Date().toISOString();

  // 8. Compile Confirmation Bundle
  const confirmation: CanonicalApplyConfirmation = {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    snapshotId: safetySnapshot.id,
    snapshotLabel: safetySnapshot.label || 'Pre-Simulation Safety Checkpoint',
    timestamp: new Date().toISOString(),
    affectedKingdomCount: Object.keys(simulatedState.kingdoms).length,
    affectedRelationCount: Object.keys(simulatedState.relations).length,
    eventsToIngestCount: ingestedEventCount,
    modifications
  };

  return {
    updatedProject,
    confirmation
  };
}
