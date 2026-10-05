import React, { useState } from 'react';
import { OutlinerMatrixView } from '../outliner/OutlinerMatrixView';
import { CorkboardGridView } from '../editor/CorkboardGridView';
import { useSwriteStore } from '../../store/useSwriteStore';
import { Table, LayoutGrid } from 'lucide-react';

export const PlanWorkspace: React.FC = () => {
  const { project } = useSwriteStore();
  const theme = project.metadata.theme;
  const [activeView, setActiveView] = useState<'matrix' | 'corkboard'>('corkboard');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
      {/* Top Switcher */}
      <div 
        className="px-6 py-2 border-b flex items-center justify-between"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('corkboard')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeView === 'corkboard' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeView === 'corkboard' ? theme.colors.accent : 'transparent',
              color: activeView === 'corkboard' ? '#fff' : theme.colors.text
            }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Corkboard Grid
          </button>
          <button
            onClick={() => setActiveView('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeView === 'matrix' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeView === 'matrix' ? theme.colors.accent : 'transparent',
              color: activeView === 'matrix' ? '#fff' : theme.colors.text
            }}
          >
            <Table className="w-3.5 h-3.5" />
            Outliner Matrix
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeView === 'corkboard' ? <CorkboardGridView /> : <OutlinerMatrixView />}
      </div>
    </div>
  );
};
