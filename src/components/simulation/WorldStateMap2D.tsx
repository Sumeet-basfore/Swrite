import React, { useMemo } from 'react';
import { Kingdom, WorldRelation, SimulationState } from '../../engine/simulation/types';
import { Shield, Wheat, Coins, Swords, Flame, Sparkles, ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface WorldStateMap2DProps {
  state: SimulationState;
  baseState: SimulationState;
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string | null) => void;
  viewingTurn: number;
  theme: any;
}

export const WorldStateMap2D: React.FC<WorldStateMap2DProps> = ({
  state,
  baseState,
  selectedEntityId,
  onSelectEntity,
  viewingTurn,
  theme
}) => {
  const kingdoms = Object.values(state.kingdoms || {});
  const relations = Object.values(state.relations || {});

  // Compute 2D node coordinates in a visually appealing circular/radial layout
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const count = kingdoms.length;
    if (count === 0) return map;

    const width = 700;
    const height = 480;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = Math.min(width, height) * 0.38;
    const radiusY = Math.min(width, height) * 0.32;

    kingdoms.forEach((k, index) => {
      if (count === 1) {
        map.set(k.id, { x: centerX, y: centerY });
      } else {
        const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radiusX * Math.cos(angle);
        const y = centerY + radiusY * Math.sin(angle);
        map.set(k.id, { x, y });
      }
    });

    return map;
  }, [kingdoms]);

  const selectedKingdom = state.kingdoms[selectedEntityId || ''];
  const baseKingdom = baseState.kingdoms[selectedEntityId || ''];

  // Helper to format relation color & state
  const getRelationColor = (rel: WorldRelation) => {
    if (rel.type === 'hostility' || rel.hostilityValue >= 70) {
      return '#ef4444'; // Red
    }
    if (rel.type === 'alliance' || rel.trustValue >= 60) {
      return '#10b981'; // Green
    }
    if (rel.militaryTension >= 60) {
      return '#f97316'; // Orange
    }
    return rel.tradeValue > 0 ? '#38bdf8' : '#71717a'; // Sky or Zinc
  };

  const getRelationLabel = (rel: WorldRelation) => {
    if (rel.type === 'hostility' || rel.hostilityValue >= 70) return 'WAR';
    if (rel.type === 'alliance') return 'ALLIANCE';
    if (rel.militaryTension >= 60) return 'TENSION';
    return rel.tradeValue > 0 ? 'TRADE' : 'NEUTRAL';
  };

  return (
    <div 
      className="relative flex-1 h-full w-full overflow-hidden flex flex-col select-none"
      style={{ backgroundColor: theme.colors?.surface || '#121214' }}
      data-testid="world-state-map-2d"
    >
      {/* View Mode & Turn Indicator Banner */}
      <div className="absolute top-3 left-4 z-10 flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800 backdrop-blur-xs px-3 py-1.5 rounded-md text-xs shadow-md">
        <span className="text-zinc-400">Viewing State:</span>
        <span className="font-semibold font-mono text-zinc-100">
          {viewingTurn === 0 ? 'Turn 0 (Canonical Baseline)' : `Turn ${viewingTurn} (Simulated)`}
        </span>
        {viewingTurn > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-semibold">
            SIMULATED
          </span>
        )}
      </div>

      {/* SVG Canvas for 2D Node-Edge Graph */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-4">
        <svg 
          viewBox="0 0 700 480" 
          className="w-full h-full max-h-[580px] object-contain"
          onClick={() => onSelectEntity(null)}
        >
          {/* Background Grid Pattern */}
          <defs>
            <pattern id="sim-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sim-grid)" />

          {/* Relation Edges */}
          <g className="edges">
            {relations.map(rel => {
              const posA = nodePositions.get(rel.sourceEntityId);
              const posB = nodePositions.get(rel.targetEntityId);
              if (!posA || !posB) return null;

              const midX = (posA.x + posB.x) / 2;
              const midY = (posA.y + posB.y) / 2;
              const strokeColor = getRelationColor(rel);
              const isWar = rel.type === 'hostility' || rel.hostilityValue >= 70;
              const isTension = rel.militaryTension >= 60;
              const label = getRelationLabel(rel);

              return (
                <g key={rel.id} className="relation-edge">
                  {/* Line */}
                  <line
                    x1={posA.x}
                    y1={posA.y}
                    x2={posB.x}
                    y2={posB.y}
                    stroke={strokeColor}
                    strokeWidth={isWar ? 3 : 2}
                    strokeDasharray={isWar ? '6,4' : isTension ? '4,4' : undefined}
                    strokeOpacity={0.75}
                  />

                  {/* Midpoint Label Badge */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-45"
                      y="-11"
                      width="90"
                      height="22"
                      rx="4"
                      fill="#18181b"
                      stroke={strokeColor}
                      strokeWidth="1"
                      strokeOpacity="0.8"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#e4e4e7"
                      fontSize="9.5"
                      fontFamily="sans-serif"
                      fontWeight="600"
                    >
                      {label} {rel.tradeValue > 0 ? `• ${rel.tradeValue}G` : ''}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Kingdom / Faction Nodes */}
          <g className="nodes">
            {kingdoms.map(k => {
              const pos = nodePositions.get(k.id);
              if (!pos) return null;

              const isSelected = selectedEntityId === k.id;
              const isUnstable = k.stability < 40;
              const isFamine = (k.foodSupply ?? 65) < 30;

              return (
                <g
                  key={k.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEntity(k.id);
                  }}
                  data-testid={`sim-node-${k.id}`}
                >
                  {/* Outer selection ring */}
                  {isSelected && (
                    <circle
                      r="46"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2.5"
                      strokeDasharray="4,3"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r="40"
                    fill="#1f1f23"
                    stroke={isSelected ? '#a5b4fc' : isUnstable ? '#ef4444' : '#3f3f46'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="drop-shadow-md"
                  />

                  {/* Faction Emblem placeholder */}
                  <circle
                    r="18"
                    fill="#27272a"
                    stroke="#52525b"
                    strokeWidth="1"
                    cy="-10"
                  />

                  {/* Title / Name */}
                  <text
                    x="0"
                    y="16"
                    textAnchor="middle"
                    fill="#f4f4f5"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="serif"
                  >
                    {k.name.length > 14 ? `${k.name.slice(0, 13)}…` : k.name}
                  </text>

                  {/* Stability & Power Pill */}
                  <g transform="translate(0, 27)">
                    <rect
                      x="-28"
                      y="-6"
                      width="56"
                      height="13"
                      rx="3"
                      fill={isUnstable ? '#450a0a' : '#18181b'}
                      stroke={isUnstable ? '#dc2626' : '#52525b'}
                      strokeWidth="0.8"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isUnstable ? '#fca5a5' : '#a1a1aa'}
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      STB: {k.stability} | MIL: {k.militaryPower}
                    </text>
                  </g>

                  {/* Warning Badges */}
                  {(isUnstable || isFamine) && (
                    <g transform="translate(24, -24)">
                      <circle r="9" fill="#dc2626" stroke="#f87171" strokeWidth="1" />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        !
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Selected Entity Contextual Inspector Card */}
      {selectedKingdom && (
        <div 
          className="absolute bottom-4 right-4 z-20 w-80 bg-zinc-900/95 border border-zinc-700/80 backdrop-blur-md rounded-lg p-4 shadow-2xl text-xs text-zinc-200 animate-in fade-in duration-150"
          data-testid="sim-selected-entity-card"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="font-serif font-bold text-sm text-zinc-100">
                {selectedKingdom.name}
              </span>
            </div>
            <button
              onClick={() => onSelectEntity(null)}
              className="text-zinc-500 hover:text-zinc-300 text-xs px-1.5 py-0.5 rounded hover:bg-zinc-800 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Stability */}
            <div className="bg-zinc-800/60 p-2 rounded border border-zinc-800 flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Stability</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="font-mono text-sm font-bold text-zinc-100">{selectedKingdom.stability}</span>
                {baseKingdom && baseKingdom.stability !== selectedKingdom.stability && (
                  <span className={`text-[10px] font-mono font-semibold ${selectedKingdom.stability < baseKingdom.stability ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ({selectedKingdom.stability < baseKingdom.stability ? '' : '+'}{selectedKingdom.stability - baseKingdom.stability})
                  </span>
                )}
              </div>
            </div>

            {/* Food Supply */}
            <div className="bg-zinc-800/60 p-2 rounded border border-zinc-800 flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center space-x-1">
                <Wheat className="w-2.5 h-2.5 text-amber-400 mr-1" /> Food Supply
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="font-mono text-sm font-bold text-zinc-100">{selectedKingdom.foodSupply}</span>
                {baseKingdom && baseKingdom.foodSupply !== selectedKingdom.foodSupply && (
                  <span className={`text-[10px] font-mono font-semibold ${selectedKingdom.foodSupply < baseKingdom.foodSupply ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ({selectedKingdom.foodSupply < baseKingdom.foodSupply ? '' : '+'}{selectedKingdom.foodSupply - baseKingdom.foodSupply})
                  </span>
                )}
              </div>
            </div>

            {/* Treasury */}
            <div className="bg-zinc-800/60 p-2 rounded border border-zinc-800 flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center space-x-1">
                <Coins className="w-2.5 h-2.5 text-yellow-400 mr-1" /> Treasury
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="font-mono text-sm font-bold text-zinc-100">{selectedKingdom.treasury}</span>
                {baseKingdom && baseKingdom.treasury !== selectedKingdom.treasury && (
                  <span className={`text-[10px] font-mono font-semibold ${selectedKingdom.treasury < baseKingdom.treasury ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ({selectedKingdom.treasury < baseKingdom.treasury ? '' : '+'}{selectedKingdom.treasury - baseKingdom.treasury})
                  </span>
                )}
              </div>
            </div>

            {/* Military Power */}
            <div className="bg-zinc-800/60 p-2 rounded border border-zinc-800 flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center space-x-1">
                <Swords className="w-2.5 h-2.5 text-red-400 mr-1" /> Military
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="font-mono text-sm font-bold text-zinc-100">{selectedKingdom.militaryPower}</span>
                {baseKingdom && baseKingdom.militaryPower !== selectedKingdom.militaryPower && (
                  <span className={`text-[10px] font-mono font-semibold ${selectedKingdom.militaryPower < baseKingdom.militaryPower ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ({selectedKingdom.militaryPower < baseKingdom.militaryPower ? '' : '+'}{selectedKingdom.militaryPower - baseKingdom.militaryPower})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Resources Summary */}
          {selectedKingdom.customResources && Object.keys(selectedKingdom.customResources).length > 0 && (
            <div className="mb-3">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Active Resources</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(selectedKingdom.customResources).map(([resName, abundance]) => (
                  <span 
                    key={resName}
                    className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 font-mono"
                  >
                    {resName}: {abundance}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Connected Relations */}
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Diplomatic Channels</span>
            <div className="space-y-1 mt-1 max-h-24 overflow-y-auto">
              {relations
                .filter(r => r.sourceEntityId === selectedKingdom.id || r.targetEntityId === selectedKingdom.id)
                .map(r => {
                  const otherId = r.sourceEntityId === selectedKingdom.id ? r.targetEntityId : r.sourceEntityId;
                  const other = state.kingdoms[otherId];
                  return (
                    <div key={r.id} className="flex items-center justify-between text-[11px] bg-zinc-800/40 px-2 py-1 rounded">
                      <span className="text-zinc-300 truncate max-w-[120px]">{other?.name || otherId}</span>
                      <span className="font-mono font-semibold text-[10px]" style={{ color: getRelationColor(r) }}>
                        {getRelationLabel(r)} (Tension: {r.militaryTension})
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
