import React from 'react';
import { OutlinerMatrixView } from '../outliner/OutlinerMatrixView';

export const PlanWorkspace: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <OutlinerMatrixView />
    </div>
  );
};
