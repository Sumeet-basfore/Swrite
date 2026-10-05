/**
 * Swrite World Simulation Extension — Project-Level Opt-In Adapter & Lifecycle Boundary
 * 
 * Provides a clean architectural boundary between core Swrite manuscript logic
 * and the experimental World Simulation system.
 * 
 * Guarantees:
 * 1. Zero simulation overhead when disabled.
 * 2. Lazy on-demand initialization when entering the workspace.
 * 3. Strict isolation between multiple loaded projects.
 * 4. Clear separation between canonical Story Engine state and temporary scenario state.
 */

import { ProjectData } from '../../types';
import { SimulationState } from './types';
import { createSimulationState, deepClone } from './state';

/**
 * Global transient cache state keyed by project ID.
 * Never serializes to disk; automatically invalidated when project changes.
 */
interface TransientSimulationCache {
  projectId: string | null;
  cachedBaseline: SimulationState | null;
}

const activeCache: TransientSimulationCache = {
  projectId: null,
  cachedBaseline: null
};

/**
 * Checks whether the World Simulation extension is enabled for a given project.
 * Pure function: non-intrusive and safe for all core workflows.
 */
export function isWorldSimulationEnabled(project?: ProjectData | null): boolean {
  if (!project || !project.metadata) return false;
  return Boolean(project.metadata.enableWorldSimulation);
}

/**
 * Enables the World Simulation extension for a project without mutating canonical story data.
 */
export function enableWorldSimulation(project: ProjectData): ProjectData {
  const updated: ProjectData = deepClone(project);
  updated.metadata.enableWorldSimulation = true;
  updated.metadata.updatedAt = new Date().toISOString();
  return updated;
}

/**
 * Disables the World Simulation extension for a project.
 * Clears transient caches without affecting canonical kingdoms or factions.
 */
export function disableWorldSimulation(project: ProjectData): ProjectData {
  const updated: ProjectData = deepClone(project);
  updated.metadata.enableWorldSimulation = false;
  updated.metadata.updatedAt = new Date().toISOString();
  clearCrossProjectSimulationState(project.metadata.id);
  return updated;
}

/**
 * Lazily derives a sandboxed SimulationState from canonical project data.
 * Called ONLY when an author actively opens or runs World Simulation.
 * Never executes during standard Write, Plan, or Review rendering passes.
 */
export function deriveSimulationBaseline(
  project: ProjectData, 
  maxTurns: number = 6
): SimulationState {
  if (activeCache.projectId === project.metadata.id && activeCache.cachedBaseline) {
    return deepClone(activeCache.cachedBaseline);
  }

  const freshState = createSimulationState(project, maxTurns);
  activeCache.projectId = project.metadata.id;
  activeCache.cachedBaseline = deepClone(freshState);
  return freshState;
}

/**
 * Invalidate transient simulation state when switching projects.
 * Prevents Project A's simulation scenarios or kingdom state from bleeding into Project B.
 */
export function clearCrossProjectSimulationState(targetProjectId?: string): void {
  if (!targetProjectId || activeCache.projectId !== targetProjectId) {
    activeCache.projectId = null;
    activeCache.cachedBaseline = null;
  }
}
