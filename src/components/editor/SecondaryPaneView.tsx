import React from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { 
  X, Columns, Rows, User, MapPin, Shield, Package, 
  FileText, BookOpen, Layers, Edit3, Sparkles 
} from 'lucide-react';
import { SplitEntityType } from '../../types/editorEnhancements';

export const SecondaryPaneView: React.FC = () => {
  const { 
    project, splitPaneState, setSplitPaneState, closeSplitPane,
    updateScene, updateCharacter, updateLocation, updateFaction, updateItem,
    activeSceneId, activeChapterId
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const { orientation, entityType, entityId } = splitPaneState;

  // Aggregate all possible entities
  const allScenes = (project.acts || []).flatMap(a => (a.chapters || []).flatMap(c => (c.scenes || []).map(s => ({ ...s, chapterTitle: c.title }))));
  const characters = project.characters || [];
  const locations = project.locations || [];
  const factions = project.factions || [];
  const items = project.items || [];
  const researchNotes = project.researchNotes || [];

  // Current entity resolution
  const selectedScene = allScenes.find(s => s.id === entityId) || allScenes.find(s => s.id !== activeSceneId) || allScenes[0];
  const selectedChar = characters.find(c => c.id === entityId) || characters[0];
  const selectedLoc = locations.find(l => l.id === entityId) || locations[0];
  const selectedFaction = factions.find(f => f.id === entityId) || factions[0];
  const selectedItem = items.find(i => i.id === entityId) || items[0];
  const selectedNote = researchNotes.find(n => n.id === entityId) || researchNotes[0];

  const handleTypeChange = (newType: SplitEntityType) => {
    let defaultId: string | null = null;
    if (newType === 'scene') defaultId = allScenes.find(s => s.id !== activeSceneId)?.id || allScenes[0]?.id || null;
    else if (newType === 'character') defaultId = characters[0]?.id || null;
    else if (newType === 'location') defaultId = locations[0]?.id || null;
    else if (newType === 'faction') defaultId = factions[0]?.id || null;
    else if (newType === 'item') defaultId = items[0]?.id || null;
    else if (newType === 'research') defaultId = researchNotes[0]?.id || null;

    setSplitPaneState({ entityType: newType, entityId: defaultId });
  };

  return (
    <div 
      className="h-full flex flex-col border-l border-t md:border-t-0 shadow-inner overflow-hidden"
      style={{ 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      {/* Secondary Pane Header */}
      <div 
        className="px-4 py-2 flex items-center justify-between border-b text-xs select-none"
        style={{ 
          backgroundColor: theme.colors.elevatedSurface,
          borderColor: theme.colors.borderStrong
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: theme.colors.accent }}>
            Reference Pane
          </span>

          {/* Type Selector */}
          <select
            value={entityType}
            onChange={(e) => handleTypeChange(e.target.value as SplitEntityType)}
            className="px-2 py-1 rounded text-xs border font-medium focus:outline-none"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }}
          >
            <option value="scene">Scene Manuscript</option>
            <option value="character">Character Dossier</option>
            <option value="location">Location Lore</option>
            <option value="faction">Faction</option>
            <option value="item">Item / Artifact</option>
            <option value="research">Research Note</option>
          </select>

          {/* Specific Item Selector */}
          {entityType === 'scene' && (
            <select
              value={selectedScene?.id || ''}
              onChange={(e) => setSplitPaneState({ entityId: e.target.value })}
              className="px-2 py-1 rounded text-xs border font-medium max-w-[160px] truncate focus:outline-none"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }}
            >
              {allScenes.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.chapterTitle})
                </option>
              ))}
            </select>
          )}

          {entityType === 'character' && (
            <select
              value={selectedChar?.id || ''}
              onChange={(e) => setSplitPaneState({ entityId: e.target.value })}
              className="px-2 py-1 rounded text-xs border font-medium max-w-[160px] truncate focus:outline-none"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }}
            >
              {characters.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
              ))}
            </select>
          )}

          {entityType === 'location' && (
            <select
              value={selectedLoc?.id || ''}
              onChange={(e) => setSplitPaneState({ entityId: e.target.value })}
              className="px-2 py-1 rounded text-xs border font-medium max-w-[160px] truncate focus:outline-none"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }}
            >
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}

          {entityType === 'faction' && (
            <select
              value={selectedFaction?.id || ''}
              onChange={(e) => setSplitPaneState({ entityId: e.target.value })}
              className="px-2 py-1 rounded text-xs border font-medium max-w-[160px] truncate focus:outline-none"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }}
            >
              {factions.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}

          {entityType === 'item' && (
            <select
              value={selectedItem?.id || ''}
              onChange={(e) => setSplitPaneState({ entityId: e.target.value })}
              className="px-2 py-1 rounded text-xs border font-medium max-w-[160px] truncate focus:outline-none"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }}
            >
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          )}

          {entityType === 'research' && (
            <select
              value={selectedNote?.id || ''}
              onChange={(e) => setSplitPaneState({ entityId: e.target.value })}
              className="px-2 py-1 rounded text-xs border font-medium max-w-[160px] truncate focus:outline-none"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }}
            >
              {researchNotes.map(n => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSplitPaneState({ orientation: orientation === 'vertical' ? 'horizontal' : 'vertical' })}
            title={orientation === 'vertical' ? 'Switch to Horizontal Split' : 'Switch to Vertical Split'}
            className="p-1 rounded hover:opacity-80 transition-opacity"
            style={{ color: theme.colors.textMuted }}
          >
            {orientation === 'vertical' ? <Rows className="w-3.5 h-3.5" /> : <Columns className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={closeSplitPane}
            title="Close Split Screen"
            className="p-1 rounded hover:opacity-80 transition-opacity"
            style={{ color: theme.colors.textMuted }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* 1. SCENE SECONDARY VIEW */}
        {entityType === 'scene' && selectedScene && (
          <div className="h-full flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.colors.border }}>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: theme.colors.text }}>{selectedScene.title}</h3>
                <span className="text-xs" style={{ color: theme.colors.textMuted }}>{selectedScene.chapterTitle} • {selectedScene.wordCount || 0} words</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold" style={{ backgroundColor: theme.colors.elevatedSurface, color: theme.colors.accent }}>
                {selectedScene.status}
              </span>
            </div>

            {selectedScene.synopsis && (
              <div className="p-2.5 rounded text-xs italic" style={{ backgroundColor: theme.colors.elevatedSurface, color: theme.colors.textMuted }}>
                "{selectedScene.synopsis}"
              </div>
            )}

            <textarea
              value={selectedScene.content}
              onChange={(e) => updateScene(selectedScene.id, { content: e.target.value })}
              placeholder="Write or edit secondary scene content here..."
              className="w-full flex-1 min-h-[300px] p-3 rounded-lg text-sm font-serif leading-relaxed border resize-none focus:outline-none"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }}
            />
          </div>
        )}

        {/* 2. CHARACTER DOSSIER VIEW */}
        {entityType === 'character' && selectedChar && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: theme.colors.border }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow" style={{ backgroundColor: theme.colors.accent, color: '#fff' }}>
                {selectedChar.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: theme.colors.text }}>{selectedChar.name}</h3>
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>{selectedChar.role} {selectedChar.aliases?.length ? `• Aliases: ${selectedChar.aliases.join(', ')}` : ''}</p>
              </div>
            </div>

            {/* Current State / Psychology */}
            {selectedChar.currentState && (
              <div className="p-3 rounded-lg border space-y-1.5" style={{ backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }}>
                <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: theme.colors.accent }}>Current Psychological State</span>
                <p className="text-xs font-medium" style={{ color: theme.colors.text }}>
                  {typeof selectedChar.currentState === 'object' ? selectedChar.currentState.emotionalState || 'Calm / Focused' : selectedChar.currentState}
                </p>
                {typeof selectedChar.currentState === 'object' && selectedChar.currentState.mentalState && (
                  <p className="text-[11px]" style={{ color: theme.colors.textMuted }}>{selectedChar.currentState.mentalState}</p>
                )}
              </div>
            )}

            {/* Goals & Beliefs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border space-y-1" style={{ backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }}>
                <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: theme.colors.accent }}>Primary Goals</span>
                <ul className="list-disc pl-4 space-y-1">
                  {(selectedChar.goals || []).map((g: any, idx: number) => (
                    <li key={idx} style={{ color: theme.colors.text }}>
                      <span className="font-medium">{typeof g === 'string' ? g : g.description}</span>
                    </li>
                  ))}
                  {(!selectedChar.goals || selectedChar.goals.length === 0) && (
                    <li className="italic list-none text-muted" style={{ color: theme.colors.textMuted }}>No explicit goals recorded</li>
                  )}
                </ul>
              </div>

              <div className="p-3 rounded-lg border space-y-1" style={{ backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }}>
                <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: theme.colors.accent }}>Beliefs & Worldview</span>
                <ul className="list-disc pl-4 space-y-1">
                  {(selectedChar.beliefs || []).map((b: any, idx: number) => (
                    <li key={idx} style={{ color: theme.colors.text }}>
                      <span>{typeof b === 'string' ? b : b.statement}</span>
                    </li>
                  ))}
                  {(!selectedChar.beliefs || selectedChar.beliefs.length === 0) && (
                    <li className="italic list-none text-muted" style={{ color: theme.colors.textMuted }}>No explicit beliefs recorded</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Secrets & Appearance */}
            <div className="p-3 rounded-lg border space-y-1.5" style={{ backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }}>
              <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: theme.colors.warning || theme.colors.accent }}>Secrets & Hidden Knowledge</span>
              <ul className="list-disc pl-4 space-y-1">
                {(Array.isArray(selectedChar.secrets) ? selectedChar.secrets : selectedChar.secrets ? [selectedChar.secrets] : []).map((s: any, idx: number) => (
                  <li key={idx} style={{ color: theme.colors.text }}>
                    <span>{typeof s === 'string' ? s : s.content}</span>
                  </li>
                ))}
                {(!selectedChar.secrets || (Array.isArray(selectedChar.secrets) && selectedChar.secrets.length === 0)) && (
                  <li className="italic list-none text-muted" style={{ color: theme.colors.textMuted }}>No active secrets recorded</li>
                )}
              </ul>
            </div>

            {selectedChar.physicalAppearance && (
              <div className="p-3 rounded-lg border space-y-1" style={{ backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }}>
                <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: theme.colors.accent }}>Physical Appearance</span>
                <p style={{ color: theme.colors.text }}>{selectedChar.physicalAppearance}</p>
              </div>
            )}
          </div>
        )}

        {/* 3. LOCATION VIEW */}
        {entityType === 'location' && selectedLoc && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: theme.colors.border }}>
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: theme.colors.elevatedSurface, color: theme.colors.accent }}>
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: theme.colors.text }}>{selectedLoc.name}</h3>
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>{selectedLoc.type || 'Setting Location'}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg border space-y-1.5" style={{ backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }}>
              <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: theme.colors.accent }}>Description</span>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>{selectedLoc.description || 'No description recorded.'}</p>
            </div>
          </div>
        )}

        {/* 4. FACTION VIEW */}
        {entityType === 'faction' && selectedFaction && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: theme.colors.border }}>
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: theme.colors.elevatedSurface, color: theme.colors.accent }}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: theme.colors.text }}>{selectedFaction.name}</h3>
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>{selectedFaction.doctrine || 'Organization / Alliance'}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg border space-y-1.5" style={{ backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }}>
              <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: theme.colors.accent }}>Motives & Lore</span>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>{selectedFaction.description || 'No lore description recorded.'}</p>
            </div>
          </div>
        )}

        {/* 5. ITEM VIEW */}
        {entityType === 'item' && selectedItem && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: theme.colors.border }}>
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: theme.colors.elevatedSurface, color: theme.colors.accent }}>
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: theme.colors.text }}>{selectedItem.name}</h3>
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>{selectedItem.type || 'Key Artifact'}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg border space-y-1.5" style={{ backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }}>
              <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: theme.colors.accent }}>Properties & History</span>
              <p className="leading-relaxed" style={{ color: theme.colors.text }}>{selectedItem.description || 'No item details recorded.'}</p>
            </div>
          </div>
        )}

        {/* 6. RESEARCH NOTE VIEW */}
        {entityType === 'research' && selectedNote && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: theme.colors.border }}>
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: theme.colors.elevatedSurface, color: theme.colors.accent }}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: theme.colors.text }}>{selectedNote.title}</h3>
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>Research & Background Notes</p>
              </div>
            </div>
            <div className="p-3 rounded-lg border space-y-1.5" style={{ backgroundColor: theme.colors.elevatedSurface, borderColor: theme.colors.border }}>
              <p className="leading-relaxed whitespace-pre-wrap font-sans" style={{ color: theme.colors.text }}>{selectedNote.content || 'Empty note.'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
