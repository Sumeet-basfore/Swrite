import React from 'react';
import { OutlineItem, SceneWorkflowStatus } from '../types';
import { SceneCard } from './SceneCard';

export interface SceneCardGridProps {
  items: OutlineItem[];
  selectedItemPath: string | null;
  onSelectItem: (path: string) => void;
  onOpenInEditor: (path: string) => void;
  onStatusChange: (path: string, status: SceneWorkflowStatus) => void;
}

export const SceneCardGrid: React.FC<SceneCardGridProps> = ({
  items,
  selectedItemPath,
  onSelectItem,
  onOpenInEditor,
  onStatusChange,
}) => {
  // Flatten tree to get all leaf scenes
  const extractScenes = (nodes: OutlineItem[]): OutlineItem[] => {
    const res: OutlineItem[] = [];
    for (const node of nodes) {
      if (!node.isDirectory) {
        res.push(node);
      }
      if (node.children.length > 0) {
        res.push(...extractScenes(node.children));
      }
    }
    return res;
  };

  const scenes = extractScenes(items);

  if (scenes.length === 0) {
    return (
      <div className="scene-grid-empty">
        <p>No scenes found in the manuscript outline.</p>
      </div>
    );
  }

  return (
    <div className="swrite-scene-card-grid">
      {scenes.map((scene) => (
        <SceneCard
          key={scene.id}
          item={scene}
          isSelected={selectedItemPath === scene.relativePath}
          onSelect={onSelectItem}
          onOpenInEditor={onOpenInEditor}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
};
