import React, { useState } from 'react';
import { 
  SimulationScenario, SimulationState, SimulationDiff, Kingdom 
} from '../../engine/simulation/types';
import { generateSimulationDiff } from '../../engine/simulation/explain';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight, 
  X, Calendar, Layers, Check 
} from 'lucide-react';

interface ApplyScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmApply: (options: { ingestMajorEventsToTimeline: boolean }) => void;
  scenario: SimulationScenario;
  baseState: SimulationState;
  simulatedState: SimulationState;
  theme: any;
}

export const ApplyScenarioModal: React.FC<ApplyScenarioModalProps> = ({
  isOpen,
  onClose,
  onConfirmApply,
  scenario,
  baseState,
  simulatedState,
  theme
}) => {
  const [ingestEvents, setIngestEvents] = useState(true);

  if (!isOpen) return null;

  const diff = generateSimulationDiff(baseState, simulatedState);
  const events = simulatedState.activeEvents;
  const simKingdoms = Object.values(simulatedState.kingdoms || {});

  // List of modified kingdoms
  const modifiedKingdoms = simKingdoms.filter((simK: Kingdom) => {
    const baseK = baseState.kingdoms[simK.id];
    if (!baseK) return false;
    return (
      baseK.stability !== simK.stability ||
      baseK.foodSupply !== simK.foodSupply ||
      baseK.treasury !== simK.treasury ||
      baseK.militaryPower !== simK.militaryPower ||
      baseK.magicReserve !== simK.magicReserve
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div 
        className="w-full max-w-xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs font-sans"
        style={{ 
          backgroundColor: theme.colors?.surface || '#16161a',
          borderColor: theme.colors?.border || '#27272a',
          color: theme.colors?.text || '#f4f4f5'
        }}
        data-testid="apply-scenario-modal"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/60">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-serif font-bold text-sm text-zinc-100">
                Apply Simulation to Canonical World
              </h3>
              <p className="text-[11px] text-zinc-400">
                Scenario: <span className="font-medium text-zinc-200">{scenario.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Automated Safety Snapshot Notice */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-200 text-xs">Automated Pre-Apply Safety Snapshot</h4>
              <p className="text-[11px] text-emerald-300/80 leading-relaxed mt-0.5">
                Before mutating any canonical world state, Swrite will create an instant manuscript snapshot. You can revert this simulation apply at any time in Version History.
              </p>
            </div>
          </div>

          {/* Canonical Diff Preview */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
              Canonical Changes Preview ({modifiedKingdoms.length} Factions / Kingdoms)
            </span>

            <div className="space-y-2 max-h-44 overflow-y-auto" data-testid="apply-diff-list">
              {modifiedKingdoms.map((simK: Kingdom) => {
                const baseK = baseState.kingdoms[simK.id];
                if (!baseK) return null;

                return (
                  <div key={simK.id} className="bg-zinc-900 border border-zinc-800 rounded p-2.5 text-xs">
                    <div className="font-serif font-semibold text-zinc-200 mb-1">{simK.name}</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono text-zinc-400">
                      {baseK.stability !== simK.stability && (
                        <div>Stability: <span className="text-zinc-500">{baseK.stability}</span> → <span className="font-bold text-zinc-200">{simK.stability}</span></div>
                      )}
                      {baseK.foodSupply !== simK.foodSupply && (
                        <div>Food Supply: <span className="text-zinc-500">{baseK.foodSupply}</span> → <span className="font-bold text-zinc-200">{simK.foodSupply}</span></div>
                      )}
                      {baseK.treasury !== simK.treasury && (
                        <div>Treasury: <span className="text-zinc-500">{baseK.treasury}</span> → <span className="font-bold text-zinc-200">{simK.treasury}</span></div>
                      )}
                      {baseK.militaryPower !== simK.militaryPower && (
                        <div>Military: <span className="text-zinc-500">{baseK.militaryPower}</span> → <span className="font-bold text-zinc-200">{simK.militaryPower}</span></div>
                      )}
                      {baseK.magicReserve !== simK.magicReserve && (
                        <div>Magic: <span className="text-zinc-500">{baseK.magicReserve}</span> → <span className="font-bold text-zinc-200">{simK.magicReserve}</span></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Event Ingestion Option */}
          {events.length > 0 && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ingestEvents}
                  onChange={(e) => setIngestEvents(e.target.checked)}
                  className="mt-0.5 rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  data-testid="chk-ingest-events"
                />
                <div className="text-xs">
                  <span className="font-medium text-zinc-200">
                    Ingest {events.length} Simulation Events into In-Universe Story Timeline
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Adds historical event records to the Story Engine timeline for chapter chronological context.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            data-testid="btn-cancel-apply"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirmApply({ ingestMajorEventsToTimeline: ingestEvents })}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-xs transition-colors flex items-center space-x-1.5 shadow-md cursor-pointer"
            data-testid="btn-confirm-apply"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm & Apply to World</span>
          </button>
        </div>
      </div>
    </div>
  );
};
