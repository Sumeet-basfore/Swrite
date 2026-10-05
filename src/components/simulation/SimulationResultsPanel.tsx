import React, { useState } from 'react';
import { 
  SimulationState, SimulationScenario, SimulationDiff, CauseChainNode, 
  WorldRule 
} from '../../engine/simulation/types';
import { 
  generateSimulationDiff, getCauseChainForEntity, formatCauseChainNarrative 
} from '../../engine/simulation/explain';
import { DEFAULT_WORLD_RULES } from '../../engine/simulation/rules';
import { 
  CheckCircle2, AlertTriangle, ArrowRight, Shield, Activity, 
  Flame, HelpCircle, ChevronDown, ChevronRight, BookOpen, Layers
} from 'lucide-react';

interface SimulationResultsPanelProps {
  baseState: SimulationState;
  simulatedState: SimulationState | null;
  scenario: SimulationScenario;
  selectedEntityId: string | null;
  theme: any;
}

export const SimulationResultsPanel: React.FC<SimulationResultsPanelProps> = ({
  baseState,
  simulatedState,
  scenario,
  selectedEntityId,
  theme
}) => {
  const [selectedPropKey, setSelectedPropKey] = useState<string | null>(null);
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  if (!simulatedState || simulatedState.history.length <= 1) {
    return (
      <div 
        className="w-88 h-full flex flex-col border-l shrink-0 select-none text-xs font-sans"
        style={{ 
          backgroundColor: theme.colors?.surface || '#141416',
          borderColor: theme.colors?.border || '#27272a',
          color: theme.colors?.text || '#f4f4f5'
        }}
        data-testid="simulation-results-panel-empty"
      >
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-zinc-400" />
            <span className="font-serif font-bold text-sm tracking-tight text-zinc-100">
              Simulation Results
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">
            IDLE
          </span>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3 text-zinc-400">
          <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-200 text-sm mb-1">Ready to Simulate</h4>
            <p className="text-xs text-zinc-400 max-w-[220px]">
              Add your What-If interventions in the builder, then click <strong>"Simulate"</strong> to run deterministic turns and inspect consequences.
            </p>
          </div>
        </div>

        {/* Active Rules Inspector */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/40">
          <button
            onClick={() => setIsRulesExpanded(!isRulesExpanded)}
            className="w-full flex items-center justify-between text-zinc-300 font-semibold text-xs py-1 cursor-pointer"
          >
            <span className="flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>World Rules ({DEFAULT_WORLD_RULES.length})</span>
            </span>
            {isRulesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {isRulesExpanded && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {DEFAULT_WORLD_RULES.map(rule => (
                <div key={rule.id} className="bg-zinc-900 border border-zinc-800 rounded p-2 text-[11px]">
                  <div className="font-semibold text-zinc-200 mb-1">{rule.name}</div>
                  <div className="text-zinc-400 font-mono text-[10px] space-y-0.5">
                    <div>WHEN: {rule.condition.single ? `${rule.condition.single.property} ${rule.condition.single.operator} ${rule.condition.single.value}` : 'Compound condition'}</div>
                    <div>THEN: {rule.effects.map(e => `${e.property || 'state'} ${e.operation} ${e.value}`).join(', ')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compute Diff
  const diff = generateSimulationDiff(baseState, simulatedState);
  const totalTurns = simulatedState.history.length - 1;
  const events = simulatedState.activeEvents;
  const kingdoms = Object.values(simulatedState.kingdoms || {});

  // Selected cause chain
  const activeCauseNodes = selectedPropKey 
    ? getCauseChainForEntity(simulatedState, selectedPropKey)
    : simulatedState.history.flatMap(h => h.causeChains).slice(-4);

  return (
    <div 
      className="w-88 h-full flex flex-col border-l shrink-0 select-none text-xs font-sans"
      style={{ 
        backgroundColor: theme.colors?.surface || '#141416',
        borderColor: theme.colors?.border || '#27272a',
        color: theme.colors?.text || '#f4f4f5'
      }}
      data-testid="simulation-results-panel"
    >
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-serif font-bold text-sm tracking-tight text-zinc-100">
            Simulation Results
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono text-[10px]">
          TURN 0 → {totalTurns}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Metric Changes Table */}
        <div>
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1.5">
            Key Consequence Deltas
          </span>

          <div className="space-y-1.5" data-testid="metric-deltas-list">
            {kingdoms.map(simK => {
              const baseK = baseState.kingdoms[simK.id];
              if (!baseK) return null;

              const metrics: { label: string; key: string; base: number; sim: number }[] = [
                { label: 'Stability', key: 'stability', base: baseK.stability, sim: simK.stability },
                { label: 'Food Supply', key: 'foodSupply', base: baseK.foodSupply ?? 65, sim: simK.foodSupply ?? 65 },
                { label: 'Treasury', key: 'treasury', base: baseK.treasury, sim: simK.treasury },
                { label: 'Military', key: 'militaryPower', base: baseK.militaryPower, sim: simK.militaryPower },
                { label: 'Magic Reserve', key: 'magicReserve', base: baseK.magicReserve ?? 40, sim: simK.magicReserve ?? 40 }
              ];

              const changedMetrics = metrics.filter(m => m.base !== m.sim);

              if (changedMetrics.length === 0) return null;

              return (
                <div 
                  key={simK.id} 
                  className="bg-zinc-900 border border-zinc-800 rounded p-2.5 space-y-1.5"
                  data-testid={`delta-card-${simK.id}`}
                >
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
                    <span className="font-serif font-semibold text-zinc-200">{simK.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{changedMetrics.length} metrics changed</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    {changedMetrics.map(m => {
                      const delta = m.sim - m.base;
                      const isNegative = delta < 0;
                      const isSelected = selectedPropKey === simK.name;

                      return (
                        <div
                          key={m.key}
                          onClick={() => setSelectedPropKey(simK.name)}
                          className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-950/60 border border-indigo-700/60' : 'bg-zinc-950/50 hover:bg-zinc-800/50'
                          }`}
                          data-testid={`metric-delta-${simK.id}-${m.key}`}
                        >
                          <span className="text-zinc-400 text-[11px]">{m.label}</span>
                          <div className="flex items-center space-x-2 font-mono text-[11px]">
                            <span className="text-zinc-500">{m.base}</span>
                            <span className="text-zinc-600">→</span>
                            <span className="font-bold text-zinc-200">{m.sim}</span>
                            <span className={`font-semibold ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                              ({delta > 0 ? `+${delta}` : delta})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cause / Effect Explorer */}
        <div className="border-t border-zinc-800 pt-3" data-testid="cause-effect-explorer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider flex items-center space-x-1">
              <HelpCircle className="w-3 h-3 text-indigo-400 mr-1" />
              <span>Cause & Effect Tree (Why?)</span>
            </span>
          </div>

          {activeCauseNodes.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded p-3 text-center text-zinc-500 text-xs">
              Select a modified kingdom delta above to inspect its causal progression.
            </div>
          ) : (
            <div className="space-y-1.5" data-testid="cause-nodes-list">
              {activeCauseNodes.map((node, idx) => (
                <div 
                  key={idx}
                  className="bg-zinc-900 border border-zinc-800 rounded p-2 text-xs relative pl-6"
                >
                  {/* Step indicator */}
                  <div className="absolute left-2 top-2.5 w-2 h-2 rounded-full bg-indigo-500" />
                  
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-0.5">
                    <span>Turn {node.turn} • {node.sourceEntityName}</span>
                    <span className="text-indigo-400 font-semibold">{node.trigger}</span>
                  </div>

                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {node.rationale}
                  </p>

                  {typeof node.beforeValue === 'number' && typeof node.afterValue === 'number' && (
                    <div className="mt-1 font-mono text-[10px] text-zinc-400">
                      Value shifted: {node.beforeValue} → {node.afterValue}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergent Historical Events */}
        {events.length > 0 && (
          <div className="border-t border-zinc-800 pt-3" data-testid="emergent-events-list">
            <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block mb-1.5 flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 mr-1" />
              <span>Emergent World Events ({events.length})</span>
            </span>

            <div className="space-y-1.5">
              {events.map(ev => (
                <div key={ev.id} className="bg-zinc-900/80 border border-zinc-800 rounded p-2">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                    <span className="text-amber-300 font-semibold">Turn {ev.turn} • {ev.type.toUpperCase()}</span>
                    <span className="text-zinc-500">{ev.severity}</span>
                  </div>
                  <h5 className="font-semibold text-zinc-200 text-xs">{ev.title}</h5>
                  <p className="text-zinc-400 text-[11px] mt-0.5">{ev.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Rules Inspector */}
        <div className="border-t border-zinc-800 pt-3">
          <button
            onClick={() => setIsRulesExpanded(!isRulesExpanded)}
            className="w-full flex items-center justify-between text-zinc-300 font-semibold text-xs py-1 cursor-pointer"
          >
            <span className="flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Deterministic World Rules ({DEFAULT_WORLD_RULES.length})</span>
            </span>
            {isRulesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {isRulesExpanded && (
            <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
              {DEFAULT_WORLD_RULES.map(rule => (
                <div key={rule.id} className="bg-zinc-900 border border-zinc-800 rounded p-2 text-[11px]">
                  <div className="font-semibold text-zinc-200 mb-1">{rule.name}</div>
                  <div className="text-zinc-400 font-mono text-[10px] space-y-0.5">
                    <div>WHEN: {rule.condition.single ? `${rule.condition.single.property} ${rule.condition.single.operator} ${rule.condition.single.value}` : 'Compound condition'}</div>
                    <div>THEN: {rule.effects.map(e => `${e.property || 'state'} ${e.operation} ${e.value}`).join(', ')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
