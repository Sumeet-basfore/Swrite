import React from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { VersionHistoryView } from './VersionHistoryView';

export const VersionHistoryModal: React.FC = () => {
  const { isVersionHistoryModalOpen, setIsVersionHistoryModalOpen } = useSwriteStore();

  if (!isVersionHistoryModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div 
        className="w-full max-w-6xl rounded-xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden text-xs"
        style={{ 
          backgroundColor: '#121214', 
          maxHeight: '92vh',
          height: '840px',
        }}
      >
        <VersionHistoryView 
          onClose={() => setIsVersionHistoryModalOpen(false)} 
          isModal={true} 
        />
      </div>
    </div>
  );
};
