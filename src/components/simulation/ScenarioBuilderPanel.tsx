import React, { useState } from 'react';
import { 
  SimulationScenario, ScheduledScenarioAction, SimulationState, 
  Kingdom, WorldRelation 
} from '../../engine/simulation/types';
import { 
  Plus, Trash2, Sliders, Shield, Wheat, Coins, Swords, 
  AlertCircle, ArrowRightLeft, Sparkles, X 
} from 'lucide-react';

interface ScenarioBuilderPanelProps {
  scenario: SimulationScenario;
  baseState: SimulationState;
  onUpdateScenario: (updated: SimulationScenario) => void;
  onAddAction: (action: Omit<ScheduledScenarioAction, 'id'>) => void;
  onRemoveAction: (actionId: string) => void;
  theme: any;
}

export const ScenarioBuilderPanel: React.FC<ScenarioBuilderPanelProps> = ({
  scenario,
  baseState,
  onUpdateScenario,
  onAddAction,
  onRemoveAction,
  theme
}) => {
  const kingdoms = Object.values(baseState.kingdoms || {});
  
  const [isAddingChange, setIsAddingChange] = useState(false);
  const [actionCategory, setActionCategory] = useState<'resource' | 'metric' | 'war' | 'embargo'>('metric');
  const [targetKingdomId, setTargetKingdomId] = useState(kingdoms[0]?.id || '');
  const [targetProperty, setTargetProperty] = useState('foodSupply');
  const [deltaValue, setDeltaValue] = useState(-30);
  const [turn, setTurn] = useState(1);

  // Diplomatic relation targets
  const [sourceKingdomId, setSourceKingdomId] = useState(kingdoms[0]?.id || '');
  const [destKingdomId, setDestKingdomId] = useState(kingdoms[1]?.id || kingdoms[0]?.id || '');

  const handleAddIntervention = () => {
    if (actionCategory === 'metric' || actionCategory === 'resource') {
      const kingdom = baseState.kingdoms[targetKingdomId];
      const currentVal = (kingdom as any)?.[targetProperty] ?? 50;
      onAddAction({
        turn,
        actionType: 'adjust_resource',
        sourceEntityId: targetKingdomId,
        parameters: {
          property: targetProperty,
          delta: Number(deltaValue)
        },
        explanation: `Author scheduled ${kingdom?.name || targetKingdomId} ${targetProperty} delta (${deltaValue > 0 ? `+${deltaValue}` : deltaValue}) at Turn ${turn}`
      });
    } else if (actionCategory === 'war') {
      const srcK = baseState.kingdoms[sourceKingdomId];
      const destK = baseState.kingdoms[destKingdomId];
      onAddAction({
        turn,
        actionType: 'declare_war',
        sourceEntityId: sourceKingdomId,
        targetEntityId: destKingdomId,
        parameters: { tension: 90 },
        explanation: `Hostilities and war declared between ${srcK?.name || sourceKingdomId} and ${destK?.name || destKingdomId}`
      });
    } else if (actionCategory === 'embargo') {
      const srcK = baseState.kingdoms[sourceKingdomId];
      const destK = baseState.kingdoms[destKingdomId];
      onAddAction({
        turn,
        actionType: 'block_trade',
        sourceEntityId: sourceKingdomId,
        targetEntityId: destKingdomId,
        parameters: { tradeValue: 0 },
        explanation: `Trade embargo imposed by ${srcK?.name || sourceKingdomId} against ${destK?.name || destKingdomId}`
      });
    }

    setIsAddingChange(false);
  };

  return (
    <div 
      className="w-80 h-full flex flex-col border-r shrink-0 select-none text-xs font-sans"
      style={{ 
        backgroundColor: theme.colors?.surface || '#141416',
        borderColor: theme.colors?.border || '#27272a',
        color: theme.colors?.text || '#f4f4f5'
      }}
      data-testid="scenario-builder-panel"
    >
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="font-serif font-bold text-sm tracking-tight text-zinc-100">
            Scenario Builder
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 font-mono text-[10px]">
          SANDBOX
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Scenario Details Form */}
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
              Scenario Name
            </label>
            <input
              type="text"
              value={scenario.name}
              onChange={(e) => onUpdateScenario({ ...scenario, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 font-medium"
              placeholder="e.g. Drought in the Southern Reaches"
              data-testid="input-scenario-name"
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
              Description
            </label>
            <textarea
              value={scenario.description}
              onChange={(e) => onUpdateScenario({ ...scenario, description: e.target.value })}
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="What narrative scenario are you testing?"
              data-testid="input-scenario-desc"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase block mb-1">
                Duration
              </label>
              <select
                value={scenario.durationTurns}
                onChange={(e) => onUpdateScenario({ ...scenario, durationTurns: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                data-testid="select-scenario-duration"
              >
                <option value={3}>3 Months (3 Turns)</option>
                <option value={6}>6 Months (6 Turns)</option>
                <option value={10}>10 Months (10 Turns)</option>
                <option value={12}>1 Year (12 Turns)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase block mb-1">
                Time Step
              </label>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400 font-mono">
                1 Month / Turn
              </div>
            </div>
          </div>
        </div>

        {/* List of Scheduled Changes / Interventions */}
        <div className="border-t border-zinc-800 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
              Scenario Interventions ({scenario.scheduledActions.length})
            </span>
            <button
              onClick={() => setIsAddingChange(true)}
              className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium cursor-pointer"
              data-testid="btn-add-change"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Change</span>
            </button>
          </div>

          {scenario.scheduledActions.length === 0 ? (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-lg p-3 text-center text-zinc-500 text-xs">
              No modifications added yet. Click "+ Add Change" to alter kingdom metrics, resources, or declare hostilities.
            </div>
          ) : (
            <div className="space-y-1.5" data-testid="scenario-changes-list">
              {scenario.scheduledActions.map(action => (
                <div 
                  key={action.id}
                  className="bg-zinc-900 border border-zinc-800 rounded p-2 flex items-start justify-between group hover:border-zinc-700 transition-colors"
                  data-testid={`action-item-${action.id}`}
                >
                  <div className="flex flex-col space-y-0.5 flex-1 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono text-[9px] font-semibold">
                        Turn {action.turn}
                      </span>
                      <span className="text-[11px] font-medium text-zinc-200">
                        {action.explanation || action.actionType}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveAction(action.id)}
                    className="text-zinc-600 hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                    title="Remove Change"
                    data-testid={`btn-remove-action-${action.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Intervention Modal / Form Drawer */}
        {isAddingChange && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 space-y-3 shadow-xl animate-in fade-in duration-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <span className="font-semibold text-xs text-zinc-200">New World Intervention</span>
              <button
                onClick={() => setIsAddingChange(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Category Switcher */}
            <div className="flex rounded bg-zinc-950 p-0.5 border border-zinc-800 text-[11px]">
              <button
                onClick={() => { setActionCategory('metric'); setTargetProperty('foodSupply'); }}
                className={`flex-1 py-1 rounded transition-colors ${actionCategory === 'metric' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400'}`}
              >
                Resource / Metric
              </button>
              <button
                onClick={() => setActionCategory('war')}
                className={`flex-1 py-1 rounded transition-colors ${actionCategory === 'war' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400'}`}
              >
                Declare War
              </button>
              <button
                onClick={() => setActionCategory('embargo')}
                className={`flex-1 py-1 rounded transition-colors ${actionCategory === 'embargo' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400'}`}
              >
                Block Trade
              </button>
            </div>

            {/* Form Fields for Metric / Resource */}
            {(actionCategory === 'metric' || actionCategory === 'resource') && (
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">Target Realm</label>
                  <select
                    value={targetKingdomId}
                    onChange={(e) => setTargetKingdomId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 cursor-pointer"
                    data-testid="select-kingdom-target"
                  >
                    {kingdoms.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">Attribute</label>
                    <select
                      value={targetProperty}
                      onChange={(e) => setTargetProperty(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 cursor-pointer"
                      data-testid="select-metric-field"
                    >
                      <option value="foodSupply">Food Supply</option>
                      <option value="stability">Stability</option>
                      <option value="treasury">Treasury</option>
                      <option value="militaryPower">Military Power</option>
                      <option value="magicReserve">Mana / Magic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">Delta Shift</label>
                    <input
                      type="number"
                      value={deltaValue}
                      onChange={(e) => setDeltaValue(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100"
                      placeholder="-30"
                      data-testid="input-metric-value"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">Intervention Turn</label>
                  <select
                    value={turn}
                    onChange={(e) => setTurn(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 cursor-pointer"
                  >
                    <option value={1}>Turn 1 (Immediate)</option>
                    <option value={2}>Turn 2</option>
                    <option value={3}>Turn 3</option>
                  </select>
                </div>
              </div>
            )}

            {/* Form Fields for Declare War */}
            {actionCategory === 'war' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">Aggressor</label>
                    <select
                      value={sourceKingdomId}
                      onChange={(e) => setSourceKingdomId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-zinc-200 cursor-pointer"
                      data-testid="select-war-src"
                    >
                      {kingdoms.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">Target Realm</label>
                    <select
                      value={destKingdomId}
                      onChange={(e) => setDestKingdomId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-zinc-200 cursor-pointer"
                      data-testid="select-war-dest"
                    >
                      {kingdoms.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields for Block Trade */}
            {actionCategory === 'embargo' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">Enacting Realm</label>
                    <select
                      value={sourceKingdomId}
                      onChange={(e) => setSourceKingdomId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-zinc-200 cursor-pointer"
                    >
                      {kingdoms.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">Target Realm</label>
                    <select
                      value={destKingdomId}
                      onChange={(e) => setDestKingdomId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-zinc-200 cursor-pointer"
                    >
                      {kingdoms.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsAddingChange(false)}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIntervention}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded text-xs transition-colors cursor-pointer"
                data-testid="btn-confirm-add-change"
              >
                Add to Scenario
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
