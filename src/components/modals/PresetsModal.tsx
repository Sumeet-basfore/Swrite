import React from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { WriterPreset } from '../../types';
import { Check, X } from 'lucide-react';

export const PresetsModal: React.FC = () => {
  const { project, setPreset, isPresetsModalOpen, setPresetsModalOpen } = useSwriteStore();
  const currentPreset = project.metadata.preset;

  if (!isPresetsModalOpen) return null;

  const presets: { id: WriterPreset; name: string; tag: string; description: string }[] = [
    {
      id: 'pantser',
      name: 'Pantser (Discovery Writer)',
      tag: 'Minimal Distraction',
      description: 'Auto-hides outliners and margin notes for a pure, distraction-free drafting stream.',
    },
    {
      id: 'plotter',
      name: 'Plotter (Architect / Outliner)',
      tag: 'Full Structure',
      description: 'Keeps the chapter outliner, character sheets, and margin notes visible while drafting.',
    },
    {
      id: 'plantser',
      name: 'Plantser (Hybrid)',
      tag: 'Balanced',
      description: 'Flexible balance between outline visibility and clean writing canvas.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none text-xs">
      <div className="bg-[#18181c] border border-zinc-700 rounded-lg w-full max-w-lg overflow-hidden shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/80">
          <span className="font-semibold text-zinc-100">Writer Workflow Presets</span>
          <button
            onClick={() => setPresetsModalOpen(false)}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {presets.map(p => {
            const isSelected = currentPreset === p.id;

            return (
              <div
                key={p.id}
                onClick={() => {
                  setPreset(p.id);
                  setPresetsModalOpen(false);
                }}
                className={`p-3.5 rounded border cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-zinc-400 bg-zinc-800/40 ring-1 ring-zinc-400' 
                    : 'border-zinc-800 bg-[#121215] hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-100">{p.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-zinc-300" />}
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
