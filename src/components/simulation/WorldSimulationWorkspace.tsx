import React, { useState, useMemo, useEffect } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { 
  SimulationScenario, SimulationState, ScheduledScenarioAction, 
  CanonicalApplyConfirmation 
} from '../../engine/simulation/types';
import { 
  createSimulationState, deepClone 
} from '../../engine/simulation/state';
import { 
  isWorldSimulationEnabled, enableWorldSimulation, disableWorldSimulation, 
  deriveSimulationBaseline, clearCrossProjectSimulationState 
} from '../../engine/simulation/extension';
import { 
  createScenario, addScheduledAction, discardScenario 
} from '../../engine/simulation/scenarios';
import { simulate } from '../../engine/simulation/simulator';
import { applySimulationToProject } from '../../engine/simulation/apply';
import { DEFAULT_WORLD_RULES } from '../../engine/simulation/rules';
import { 
  recordSimulationEvent, getSimulationEvaluationSummary, 
  resetSimulationEvaluationMetrics, SimulationEvaluationSummary 
} from '../../engine/simulation/analytics';

import { WorldStateMap2D } from './WorldStateMap2D';
import { ScenarioBuilderPanel } from './ScenarioBuilderPanel';
import { SimulationResultsPanel } from './SimulationResultsPanel';
import { SimulationTurnTimeline } from './SimulationTurnTimeline';
import { ApplyScenarioModal } from './ApplyScenarioModal';

import { 
  Globe2, Plus, Play, Trash2, ShieldCheck, CheckCircle2, 
  Sliders, AlertCircle, RotateCcw, ArrowRight, BookOpen, Layers, X, BarChart3,
  Power
} from 'lucide-react';

export const WorldSimulationWorkspace: React.FC = () => {
  const { project, setProject, setActiveTab } = useSwriteStore();
  const theme = project.metadata.theme;
  const isEnabled = isWorldSimulationEnabled(project);

  // Track workspace open event on mount
  useEffect(() => {
    recordSimulationEvent('simulation_workspace_opened');
  }, []);

  // 1. Initialize Baseline Simulation State from Canonical Project (Lazy on enablement)
  const baseState = useMemo(() => {
    if (!isEnabled) {
      return { turn: 0, maxTurns: 6, kingdoms: {}, relations: {}, globalVariables: {}, activeEvents: [], history: [] };
    }
    return deriveSimulationBaseline(project, 6);
  }, [project, isEnabled]);

  // 2. Scenario state
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);
  const [simulatedState, setSimulatedState] = useState<SimulationState | null>(null);
  const [viewingTurn, setViewingTurn] = useState<number>(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null);

  // Modals & Confirmation state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('Drought & Frontier Friction');
  const [newScenarioDesc, setNewScenarioDesc] = useState('Testing agricultural disruption and border tensions');
  const [newScenarioDuration, setNewScenarioDuration] = useState(6);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyConfirmation, setApplyConfirmation] = useState<CanonicalApplyConfirmation | null>(null);
  const [isEvalSummaryOpen, setIsEvalSummaryOpen] = useState(false);
  const [evalSummary, setEvalSummary] = useState<SimulationEvaluationSummary | null>(null);

  // Current display state for 2D map based on viewingTurn
  const currentDisplayState = useMemo(() => {
    if (!simulatedState || viewingTurn === 0) {
      return baseState;
    }
    const historyEntry = simulatedState.history.find(h => h.turn === viewingTurn);
    if (!historyEntry) return simulatedState;

    return {
      ...simulatedState,
      turn: viewingTurn,
      kingdoms: historyEntry.stateSnapshot.kingdoms,
      relations: historyEntry.stateSnapshot.relations,
      globalVariables: historyEntry.stateSnapshot.globalVariables
    };
  }, [baseState, simulatedState, viewingTurn]);

  // Handle Scenario Creation
  const handleCreateScenario = () => {
    const scenario = createScenario(
      newScenarioName,
      newScenarioDesc,
      baseState,
      newScenarioDuration
    );

    setActiveScenario(scenario);
    setSimulatedState(null);
    setViewingTurn(0);
    setIsCreateModalOpen(false);
    recordSimulationEvent('scenario_created', { durationTurns: newScenarioDuration });
  };

  // Handle Add Action
  const handleAddAction = (action: Omit<ScheduledScenarioAction, 'id'>) => {
    if (!activeScenario) return;
    const updated = deepClone(activeScenario);
    addScheduledAction(updated, action);
    setActiveScenario(updated);
    // Reset simulation on scenario change
    setSimulatedState(null);
    setViewingTurn(0);
  };

  // Handle Remove Action
  const handleRemoveAction = (actionId: string) => {
    if (!activeScenario) return;
    const updated = deepClone(activeScenario);
    updated.scheduledActions = updated.scheduledActions.filter(a => a.id !== actionId);
    setActiveScenario(updated);
    setSimulatedState(null);
    setViewingTurn(0);
  };

  // Handle Run Simulation
  const handleRunSimulation = () => {
    if (!activeScenario) return;
    recordSimulationEvent('simulation_started', { durationTurns: activeScenario.durationTurns });
    
    const finalState = simulate(
      baseState,
      DEFAULT_WORLD_RULES,
      activeScenario,
      activeScenario.durationTurns
    );

    setSimulatedState(finalState);
    const updatedScenario: SimulationScenario = { ...activeScenario, status: 'completed' };
    setActiveScenario(updatedScenario);
    setViewingTurn(activeScenario.durationTurns);
    recordSimulationEvent('simulation_completed', { durationTurns: activeScenario.durationTurns });
  };

  // Handle Turn Scrubbing
  const handleSelectTurn = (turn: number) => {
    setViewingTurn(turn);
    recordSimulationEvent('turn_scrubbed', { turn });
  };

  // Handle Discard Scenario
  const handleDiscardScenario = () => {
    if (activeScenario) {
      discardScenario(activeScenario);
    }
    setActiveScenario(null);
    setSimulatedState(null);
    setViewingTurn(0);
    setSelectedEntityId(null);
    setSelectedRelationId(null);
    setApplyConfirmation(null);
    recordSimulationEvent('scenario_discarded');
  };

  // Handle Apply Scenario
  const handleConfirmApply = (options: { ingestMajorEventsToTimeline: boolean }) => {
    if (!activeScenario || !simulatedState) return;

    // Apply safely using the simulation apply engine
    const { updatedProject, confirmation } = applySimulationToProject(
      project,
      activeScenario,
      simulatedState,
      options
    );

    setProject(updatedProject);
    setApplyConfirmation(confirmation);
    setIsApplyModalOpen(false);
    recordSimulationEvent('scenario_applied');
  };

  // Open Eval Summary
  const handleOpenEvalSummary = () => {
    setEvalSummary(getSimulationEvaluationSummary());
    setIsEvalSummaryOpen(true);
  };

  const kingdomCount = Object.keys(baseState.kingdoms).length;
  const relationCount = Object.keys(baseState.relations).length;

  // 0. Render Opt-In Extension Enablement Screen if not enabled for this project
  if (!isEnabled) {
    return (
      <div 
        className="flex-1 flex flex-col h-full overflow-y-auto select-none font-sans p-8 items-center justify-center"
        style={{ 
          backgroundColor: theme.colors?.background || theme.bg || '#101012',
          color: theme.colors?.text || theme.text || '#f4f4f5'
        }}
        data-testid="world-simulation-opt-in-screen"
      >
        <div className="max-w-xl w-full mx-auto space-y-6 text-center">
          {/* Badge & Title */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-mono">
            <Globe2 className="w-3.5 h-3.5" />
            <span>OPTIONAL PROJECT EXTENSION</span>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-zinc-100">
              World Simulation Extension
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              An isolated causal sandbox designed for speculative, historical, and political fiction. Model realm resources, trade embargos, and diplomatic friction across multi-turn what-if scenarios without altering your manuscript.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-3 gap-3 text-left">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3.5 space-y-1">
              <div className="font-serif font-semibold text-xs text-zinc-200 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Isolated Sandbox</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                What-if changes run in transient memory. Canonical prose and codex entries stay 100% safe.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3.5 space-y-1">
              <div className="font-serif font-semibold text-xs text-zinc-200 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Causal Chains</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Deterministic cause/effect evaluators trace exact second-order consequences turn by turn.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3.5 space-y-1">
              <div className="font-serif font-semibold text-xs text-zinc-200 flex items-center space-x-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Safety Snapshots</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Applying consequences generates instant rollback snapshots in Version History.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => {
                setProject(enableWorldSimulation(project));
              }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center space-x-2 cursor-pointer"
              data-testid="btn-enable-simulation-extension"
            >
              <Plus className="w-4 h-4" />
              <span>Enable for this Project</span>
            </button>

            <button
              onClick={() => setActiveTab('write')}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg text-xs transition-colors cursor-pointer"
              data-testid="btn-cancel-simulation-extension"
            >
              <span>Return to Writing</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden select-none font-sans"
      style={{ 
        backgroundColor: theme.colors?.background || theme.bg || '#101012',
        color: theme.colors?.text || theme.text || '#f4f4f5'
      }}
      data-testid="world-simulation-workspace"
    >
      {/* Workspace Sub-Header */}
      <div 
        className="h-12 px-6 border-b flex items-center justify-between shrink-0"
        style={{ 
          borderColor: theme.colors?.border || theme.pageBorder || '#27272a',
          backgroundColor: theme.colors?.surface || theme.pageBg || '#141416'
        }}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Globe2 className="w-4 h-4 text-indigo-400" />
            <span className="font-serif font-bold text-sm tracking-tight text-zinc-100">
              World Simulation
            </span>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {activeScenario ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-zinc-200">
                {activeScenario.name}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-semibold border border-amber-500/30">
                SANDBOX (CANONICAL SAFE)
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-400 font-medium">
                Canonical World Baseline
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 font-mono text-[10px] border border-indigo-800/60">
                EXTENSION ACTIVE
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Developer Eval Summary Trigger */}
          <button
            onClick={handleOpenEvalSummary}
            className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center space-x-1 cursor-pointer border border-zinc-800"
            title="Local Evaluation Metrics"
            data-testid="btn-eval-summary"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Metrics</span>
          </button>

          {/* Disable Extension Button */}
          <button
            onClick={() => {
              setProject(disableWorldSimulation(project));
            }}
            className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-rose-300 hover:bg-zinc-800 transition-colors flex items-center space-x-1 cursor-pointer border border-zinc-800"
            title="Disable World Simulation Extension for this Project"
            data-testid="btn-disable-simulation-extension"
          >
            <Power className="w-3.5 h-3.5 text-zinc-500" />
            <span>Disable</span>
          </button>

          {activeScenario ? (
            <>
              <button
                onClick={handleDiscardScenario}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-rose-300 hover:bg-zinc-800 transition-colors flex items-center space-x-1 cursor-pointer"
                data-testid="btn-discard-scenario"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Discard Scenario</span>
              </button>

              <button
                onClick={handleRunSimulation}
                className="px-3.5 py-1.5 rounded text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center space-x-1.5 shadow-md cursor-pointer"
                data-testid="btn-run-simulation"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate ({activeScenario.durationTurns} Turns)</span>
              </button>

              {simulatedState && (
                <button
                  onClick={() => setIsApplyModalOpen(true)}
                  className="px-3.5 py-1.5 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors flex items-center space-x-1.5 shadow-md cursor-pointer"
                  data-testid="btn-open-apply-modal"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Apply to World</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center space-x-1.5 shadow-md cursor-pointer"
              data-testid="btn-create-scenario-entry"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create What-If Scenario</span>
            </button>
          )}
        </div>
      </div>

      {/* Applied Confirmation Success Banner */}
      {applyConfirmation && (
        <div 
          className="bg-emerald-950/80 border-b border-emerald-800/80 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-200"
          data-testid="apply-success-banner"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Applied <strong>{applyConfirmation.modifications.length} modifications</strong> to canonical world. Safety snapshot created (<span className="font-mono text-emerald-300">{applyConfirmation.snapshotId}</span>).
            </span>
          </div>
          <button
            onClick={() => setApplyConfirmation(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs px-2 py-0.5 rounded hover:bg-emerald-900/50 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      {!activeScenario ? (
        /* Entry Screen: Overview of Canonical World */
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto flex flex-col justify-center space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl font-bold text-zinc-100">
              Deterministic World Simulation
            </h2>
            <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Explore dynamic consequences of famine, war, trade embargos, and arcane shifts in an isolated sandbox. Your canonical story and codex remain completely safe.
            </p>
          </div>

          {/* Compact Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 flex flex-col">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Kingdoms & Realms</span>
              <span className="font-mono text-2xl font-bold text-zinc-100 mt-1">{kingdomCount}</span>
              <span className="text-zinc-500 text-[11px] mt-1">Sovereign territories and factions</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 flex flex-col">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Diplomatic Relations</span>
              <span className="font-mono text-2xl font-bold text-zinc-100 mt-1">{relationCount}</span>
              <span className="text-zinc-500 text-[11px] mt-1">Alliances, trade channels, and border friction</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 flex flex-col">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Active World Rules</span>
              <span className="font-mono text-2xl font-bold text-zinc-100 mt-1">{DEFAULT_WORLD_RULES.length}</span>
              <span className="text-zinc-500 text-[11px] mt-1">Deterministic cause/effect evaluators</span>
            </div>
          </div>

          {/* Primary Call to Action */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center space-x-2 cursor-pointer"
              data-testid="btn-start-first-scenario"
            >
              <Plus className="w-4 h-4" />
              <span>Create First What-If Scenario</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active 3-Column + Bottom Timeline Sandbox Layout */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* 1. Left: Scenario Builder Panel */}
            <ScenarioBuilderPanel
              scenario={activeScenario}
              baseState={baseState}
              onUpdateScenario={setActiveScenario}
              onAddAction={handleAddAction}
              onRemoveAction={handleRemoveAction}
              theme={theme}
            />

            {/* 2. Center: 2D World State & Relationship Visualization */}
            <WorldStateMap2D
              state={currentDisplayState}
              baseState={baseState}
              selectedEntityId={selectedEntityId}
              onSelectEntity={setSelectedEntityId}
              selectedRelationId={selectedRelationId}
              onSelectRelation={setSelectedRelationId}
              viewingTurn={viewingTurn}
              theme={theme}
            />

            {/* 3. Right: Simulation Results & Cause/Effect Explorer */}
            <SimulationResultsPanel
              baseState={baseState}
              simulatedState={simulatedState}
              scenario={activeScenario}
              selectedEntityId={selectedEntityId}
              theme={theme}
            />
          </div>

          {/* 4. Bottom: Simulation Turn Timeline */}
          <SimulationTurnTimeline
            simulatedState={simulatedState}
            viewingTurn={viewingTurn}
            onSelectTurn={handleSelectTurn}
            maxTurns={activeScenario.durationTurns}
            theme={theme}
          />
        </div>
      )}

      {/* Create Scenario Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div 
            className="w-full max-w-md rounded-xl border shadow-2xl p-5 text-xs font-sans space-y-4"
            style={{ 
              backgroundColor: theme.colors?.surface || '#16161a',
              borderColor: theme.colors?.border || '#27272a',
              color: theme.colors?.text || '#f4f4f5'
            }}
            data-testid="create-scenario-modal"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-serif font-bold text-sm text-zinc-100">
                New What-If Scenario
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-400 font-semibold uppercase block mb-1">
                  Scenario Name
                </label>
                <input
                  type="text"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Grain Famine in Vareth"
                  data-testid="input-new-scenario-name"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-semibold uppercase block mb-1">
                  Description
                </label>
                <textarea
                  value={newScenarioDesc}
                  onChange={(e) => setNewScenarioDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="What narrative situation are you exploring?"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-semibold uppercase block mb-1">
                  Simulation Duration
                </label>
                <select
                  value={newScenarioDuration}
                  onChange={(e) => setNewScenarioDuration(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 cursor-pointer"
                >
                  <option value={3}>3 Months (3 Turns)</option>
                  <option value={6}>6 Months (6 Turns)</option>
                  <option value={10}>10 Months (10 Turns)</option>
                  <option value={12}>1 Year (12 Turns)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-zinc-800">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateScenario}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded text-xs transition-colors cursor-pointer"
                data-testid="btn-confirm-create-scenario"
              >
                Create Sandbox Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Scenario Modal */}
      {activeScenario && simulatedState && (
        <ApplyScenarioModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          onConfirmApply={handleConfirmApply}
          scenario={activeScenario}
          baseState={baseState}
          simulatedState={simulatedState}
          theme={theme}
        />
      )}

      {/* Developer Evaluation Summary Modal */}
      {isEvalSummaryOpen && evalSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div 
            className="w-full max-w-lg rounded-xl border shadow-2xl p-5 text-xs font-sans space-y-4"
            style={{ 
              backgroundColor: theme.colors?.surface || '#16161a',
              borderColor: theme.colors?.border || '#27272a',
              color: theme.colors?.text || '#f4f4f5'
            }}
            data-testid="simulation-metrics-modal"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <h3 className="font-serif font-bold text-sm text-zinc-100">
                  Local Dogfooding Metrics Summary
                </h3>
              </div>
              <button
                onClick={() => setIsEvalSummaryOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Scenarios Created</span>
                <div className="text-lg font-bold font-mono text-zinc-100 mt-0.5">{evalSummary.scenariosCreated}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Interventions Added</span>
                <div className="text-lg font-bold font-mono text-zinc-100 mt-0.5">{evalSummary.interventionsAdded}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Simulations Run</span>
                <div className="text-lg font-bold font-mono text-zinc-100 mt-0.5">{evalSummary.simulationsRun}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Cause Chains Opened</span>
                <div className="text-lg font-bold font-mono text-zinc-100 mt-0.5">{evalSummary.causeChainsOpened}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Edges Selected</span>
                <div className="text-lg font-bold font-mono text-zinc-100 mt-0.5">{evalSummary.relationshipEdgesSelected}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Turns Scrubbed</span>
                <div className="text-lg font-bold font-mono text-zinc-100 mt-0.5">{evalSummary.turnScrubCount}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Scenarios Discarded</span>
                <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">{evalSummary.scenariosDiscarded}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Scenarios Applied</span>
                <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">{evalSummary.scenariosApplied}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  resetSimulationEvaluationMetrics();
                  setEvalSummary(getSimulationEvaluationSummary());
                }}
                className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                Reset Metrics
              </button>
              <button
                onClick={() => setIsEvalSummaryOpen(false)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
