import React, { useState } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { WorldCodexWorkspace } from '../codex/WorldCodexWorkspace';
import { PlotThreadsWorkspace } from '../threads/PlotThreadsWorkspace';
import { Users, GitBranch, MapPin, Scroll, Plus, Compass, Sparkles, Globe2 } from 'lucide-react';

export const StoryWorkspace: React.FC = () => {
  const { project, setActiveTab } = useSwriteStore();
  const theme = project.metadata.theme;
  const [subView, setSubView] = useState<'codex' | 'threads'>('codex');

  const charCount = project.characters?.length || 0;
  const threadCount = project.plotThreads?.length || 0;
  const locCount = project.locations?.length || 0;
  const loreCount = (project.codex?.length || 0) + (project.factions?.length || 0) + (project.items?.length || 0);

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden select-none font-sans"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Top Story Environment Sub-Nav */}
      <div 
        className="h-12 px-6 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span className="font-serif font-bold text-sm tracking-tight text-zinc-100">
              Story Bible & World
            </span>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* Sub Navigation Switcher */}
          <div className="flex items-center space-x-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-xs">
            <button
              onClick={() => setSubView('codex')}
              className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                subView === 'codex' 
                  ? 'bg-zinc-800 text-zinc-100 font-semibold' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Characters & World ({charCount + locCount + loreCount})</span>
            </button>

            <button
              onClick={() => setSubView('threads')}
              className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                subView === 'threads' 
                  ? 'bg-zinc-800 text-zinc-100 font-semibold' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Plot Threads ({threadCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('simulation')}
              className="px-3 py-1 rounded transition-colors flex items-center space-x-1.5 text-amber-400 hover:text-amber-300 hover:bg-zinc-800 cursor-pointer"
              title="Open World Simulation Workspace"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Simulation</span>
            </button>
          </div>
        </div>

        {/* Quick summary metrics */}
        <div className="flex items-center space-x-3 text-xs text-zinc-400 font-mono">
          <span>{charCount} Characters</span>
          <span>•</span>
          <span>{threadCount} Threads</span>
          <span>•</span>
          <span>{locCount} Locations</span>
        </div>
      </div>

      {/* Embedded Subview */}
      <div className="flex-1 overflow-hidden">
        {subView === 'codex' && <WorldCodexWorkspace />}
        {subView === 'threads' && <PlotThreadsWorkspace />}
      </div>
    </div>
  );
};
