import React, { useState } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { 
  Plus, User, Clock, CheckCircle2, AlertCircle, Edit2, 
  Trash2, ArrowLeftRight, ChevronUp, ChevronDown, BookOpen, Layers
} from 'lucide-react';
import { Scene } from '../../types';

export const CorkboardGridView: React.FC = () => {
  const { 
    project, activeChapterId, activeSceneId, setActiveSceneId, setEditorViewMode,
    addScene, updateScene, deleteScene, reorderScenes
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const characters = project.characters || [];

  // Find active chapter and its scenes
  let currentChapter = (project.acts || []).flatMap(a => a.chapters || []).find(c => c.id === activeChapterId);
  if (!currentChapter && project.acts?.[0]?.chapters?.[0]) {
    currentChapter = project.acts[0].chapters[0];
  }

  const scenes = currentChapter?.scenes || [];
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [povFilter, setPovFilter] = useState<string>('all');

  const filteredScenes = scenes.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (povFilter !== 'all' && s.povCharacterId !== povFilter) return false;
    return true;
  });

  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    if (!currentChapter) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const newOrder = [...scenes];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    reorderScenes(currentChapter.id, newOrder.map(s => s.id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final': return '#10b981'; // emerald
      case 'revised': return '#3b82f6'; // blue
      case 'in-progress': return '#f59e0b'; // amber
      default: return '#6b7280'; // gray draft
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none" style={{ backgroundColor: theme.colors.background }}>
      {/* Top Filter & Toolbar Bar */}
      <div 
        className="px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4"
        style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderStrong
        }}
      >
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5" style={{ color: theme.colors.accent }} />
          <div>
            <h2 className="text-sm font-bold tracking-tight" style={{ color: theme.colors.text }}>
              Corkboard — {currentChapter?.title || 'Chapter Scenes'}
            </h2>
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>
              {scenes.length} index cards • {scenes.reduce((acc, s) => acc + (s.wordCount || 0), 0).toLocaleString()} words total
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md text-xs border font-medium focus:outline-none"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in-progress">In Progress</option>
            <option value="revised">Revised</option>
            <option value="final">Final</option>
          </select>

          {/* POV Filter */}
          <select
            value={povFilter}
            onChange={(e) => setPovFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md text-xs border font-medium focus:outline-none"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }}
          >
            <option value="all">All POVs</option>
            {characters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Add Scene Button */}
          {currentChapter && (
            <button
              onClick={() => {
                const newScene = addScene(currentChapter!.id, {
                  title: `Scene ${scenes.length + 1}`,
                  synopsis: 'Describe key story beats, conflicts, and outcomes...'
                });
                setActiveSceneId(newScene.id);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shadow transition-all hover:opacity-90"
              style={{
                backgroundColor: theme.colors.accent,
                color: '#fff'
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Card
            </button>
          )}
        </div>
      </div>

      {/* Corkboard Grid Area */}
      <div 
        className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max custom-scrollbar"
        style={{
          backgroundImage: `radial-gradient(${theme.colors.border} 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      >
        {filteredScenes.map((scene, idx) => {
          const povChar = characters.find(c => c.id === scene.povCharacterId);
          const isSelected = scene.id === activeSceneId;

          return (
            <div
              key={scene.id}
              className={`flex flex-col rounded-xl border shadow-md transition-all duration-200 hover:shadow-lg relative overflow-hidden group ${
                isSelected ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                minHeight: '260px'
              }}
            >
              {/* Status Color Ribbon */}
              <div 
                className="h-1.5 w-full"
                style={{ backgroundColor: getStatusColor(scene.status) }}
              />

              {/* Card Header */}
              <div className="p-3.5 pb-2 flex items-start justify-between gap-2 border-b" style={{ borderColor: theme.colors.border }}>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>
                    Scene #{scene.order || idx + 1}
                  </span>
                  <input
                    type="text"
                    value={scene.title}
                    onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                    className="w-full text-sm font-bold bg-transparent border-none p-0 focus:outline-none focus:ring-1 rounded truncate"
                    style={{ color: theme.colors.text }}
                  />
                </div>

                {/* Move Controls */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveScene(idx, 'up')}
                    className="p-1 rounded hover:bg-black/5 disabled:opacity-30"
                    style={{ color: theme.colors.textMuted }}
                    title="Move Earlier"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === scenes.length - 1}
                    onClick={() => handleMoveScene(idx, 'down')}
                    className="p-1 rounded hover:bg-black/5 disabled:opacity-30"
                    style={{ color: theme.colors.textMuted }}
                    title="Move Later"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Synopsis / Card Body */}
              <div className="p-3.5 flex-1 flex flex-col gap-2">
                <textarea
                  value={scene.synopsis || ''}
                  onChange={(e) => updateScene(scene.id, { synopsis: e.target.value })}
                  placeholder="Scene synopsis & goal / conflict / outcome..."
                  className="w-full flex-1 text-xs resize-none bg-transparent border-none p-0 leading-relaxed italic focus:outline-none custom-scrollbar"
                  style={{ color: theme.colors.text }}
                />
              </div>

              {/* Card Footer */}
              <div 
                className="p-3 bg-black/5 flex items-center justify-between border-t text-[11px]"
                style={{ 
                  backgroundColor: theme.colors.elevatedSurface,
                  borderColor: theme.colors.border
                }}
              >
                {/* POV Selector */}
                <select
                  value={scene.povCharacterId || ''}
                  onChange={(e) => updateScene(scene.id, { povCharacterId: e.target.value || undefined })}
                  className="text-[11px] font-medium bg-transparent border-none p-0 focus:outline-none max-w-[100px] truncate"
                  style={{ color: theme.colors.accent }}
                >
                  <option value="">No POV</option>
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Status & Word Count & Open Action */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium" style={{ color: theme.colors.textMuted }}>
                    {scene.wordCount || 0}w
                  </span>

                  {/* Open in Editor Button */}
                  <button
                    onClick={() => {
                      setActiveSceneId(scene.id);
                      setEditorViewMode('editor');
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold border transition-all hover:opacity-90"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.borderStrong,
                      color: theme.colors.text
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Create Card Tile */}
        {currentChapter && (
          <button
            onClick={() => {
              const newScene = addScene(currentChapter!.id, {
                title: `Scene ${scenes.length + 1}`,
                synopsis: 'Describe scene beats and dramatic purpose...'
              });
              setActiveSceneId(newScene.id);
            }}
            className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all hover:scale-[1.01] hover:border-amber-500 group"
            style={{
              borderColor: theme.colors.borderStrong,
              backgroundColor: 'transparent',
              minHeight: '260px'
            }}
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform"
              style={{ backgroundColor: theme.colors.elevatedSurface, color: theme.colors.accent }}
            >
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold" style={{ color: theme.colors.text }}>Add New Scene Card</span>
            <span className="text-[11px] mt-1" style={{ color: theme.colors.textMuted }}>Click to append to chapter</span>
          </button>
        )}
      </div>
    </div>
  );
};
