import React from 'react';
import { SimulationState } from '../../engine/simulation/types';
import { Clock, Play, SkipBack, SkipForward, AlertCircle } from 'lucide-react';

interface SimulationTurnTimelineProps {
  simulatedState: SimulationState | null;
  viewingTurn: number;
  onSelectTurn: (turn: number) => void;
  maxTurns: number;
  theme: any;
}

export const SimulationTurnTimeline: React.FC<SimulationTurnTimelineProps> = ({
  simulatedState,
  viewingTurn,
  onSelectTurn,
  maxTurns,
  theme
}) => {
  const history = simulatedState?.history || [];
  const turnsCount = Math.max(maxTurns, history.length - 1, 1);
  const turnsArray = Array.from({ length: turnsCount + 1 }, (_, i) => i);

  return (
    <div 
      className="h-16 border-t flex items-center justify-between px-6 select-none shrink-0 font-sans z-10"
      style={{ 
        backgroundColor: theme.colors?.surface || '#141416',
        borderColor: theme.colors?.border || '#27272a',
        color: theme.colors?.text || '#f4f4f5'
      }}
      data-testid="simulation-turn-timeline"
    >
      {/* Left info label */}
      <div className="flex items-center space-x-2 shrink-0">
        <Clock className="w-4 h-4 text-indigo-400" />
        <span className="font-serif font-semibold text-xs text-zinc-200">
          Chronological Turns
        </span>
      </div>

      {/* Center Scrubbable Turn Steps */}
      <div className="flex-1 max-w-2xl mx-8 flex items-center justify-between relative">
        {/* Connecting track line */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />

        {turnsArray.map(t => {
          const isSelected = viewingTurn === t;
          const historyEntry = history.find(h => h.turn === t);
          const hasEvents = (historyEntry?.eventsGenerated?.length || 0) > 0;
          const isSimulated = history.some(h => h.turn === t);

          return (
            <button
              key={t}
              onClick={() => onSelectTurn(t)}
              disabled={!isSimulated && t > 0}
              className={`relative z-10 flex flex-col items-center group cursor-pointer transition-transform ${
                !isSimulated && t > 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'
              }`}
              data-testid={`turn-btn-${t}`}
            >
              {/* Event indicator dot */}
              {hasEvents && (
                <span className="absolute -top-3 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-zinc-950 animate-pulse" />
              )}

              {/* Turn Circle Node */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-950'
                    : isSimulated
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                    : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                }`}
              >
                {t}
              </div>

              {/* Label */}
              <span className={`text-[10px] font-mono mt-1 ${isSelected ? 'text-indigo-400 font-bold' : 'text-zinc-500'}`}>
                {t === 0 ? 'Base' : `T+${t}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step controls */}
      <div className="flex items-center space-x-1 shrink-0">
        <button
          onClick={() => onSelectTurn(Math.max(0, viewingTurn - 1))}
          disabled={viewingTurn === 0}
          className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Previous Turn"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onSelectTurn(Math.min(turnsCount, viewingTurn + 1))}
          disabled={viewingTurn >= (history.length - 1)}
          className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Next Turn"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
