import React, { useState } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { StoryEngineQueries } from '../../engine';
import { 
  BookOpen, Plus, User, MapPin, Shield, Scroll, Package, 
  Trash2, Edit3, Search, ExternalLink, Tag, FileText,
  Clock, Heart, Eye, Lock, HelpCircle, Check, X, ArrowRight,
  GitBranch, Compass, AlertCircle, Award, ChevronDown, ChevronRight,
  Activity, Sparkles, MessageSquare
} from 'lucide-react';
import { 
  CodexEntry, Character, KnowledgeEntry, CharacterRelationship,
  GoalItem, GoalStatus, BeliefItem, BeliefCertainty, SecretItem, SecretStatus,
  CharacterState, CharacterStateCheckpoint, RelationshipMilestone
} from '../../types';

export const WorldCodexWorkspace: React.FC = () => {
  const { 
    project, addCodexEntry, updateCodexEntry, deleteCodexEntry,
    addCharacter, updateCharacter, deleteCharacter,
    addCharacterRelationship, deleteCharacterRelationship, addRelationshipMilestone,
    addCharacterKnowledge, updateCharacterKnowledge, deleteCharacterKnowledge,
    addGoal, updateGoal, removeGoal, setGoalStatus,
    addBelief, updateBelief, removeBelief,
    addSecret, updateSecret, removeSecret,
    addStateCheckpoint, removeStateCheckpoint,
    updateCharacterState,
    setActiveChapterId, setActiveTab, setOrganizerModalOpen,
    setInspectorSelection
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const codexList = project.codex || [];
  
  const [selectedEntryId, setSelectedEntryId] = useState<string>(codexList[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [characterSubTab, setCharacterSubTab] = useState<'state' | 'dossier'>('state');

  // Quick form states
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
  const [newKnowInfo, setNewKnowInfo] = useState('');
  const [newKnowLearnedAt, setNewKnowLearnedAt] = useState('');
  const [newKnowSource, setNewKnowSource] = useState('');
  const [newKnowCertainty, setNewKnowCertainty] = useState<KnowledgeEntry['certainty']>('certain');

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState<GoalItem['priority']>('primary');
  const [newGoalConflict, setNewGoalConflict] = useState('');

  const [isAddingBelief, setIsAddingBelief] = useState(false);
  const [newBeliefStatement, setNewBeliefStatement] = useState('');
  const [newBeliefCertainty, setNewBeliefCertainty] = useState<BeliefCertainty>('strong');

  const [isAddingSecret, setIsAddingSecret] = useState(false);
  const [newSecretContent, setNewSecretContent] = useState('');
  const [newSecretStatus, setNewSecretStatus] = useState<SecretStatus>('hidden');

  const [isAddingRel, setIsAddingRel] = useState(false);
  const [newRelTargetId, setNewRelTargetId] = useState('');
  const [newRelType, setNewRelType] = useState('Ally');
  const [newRelCurrentState, setNewRelCurrentState] = useState('Allied');
  const [newRelTrustLevel, setNewRelTrustLevel] = useState<number>(3);
  const [newRelNotes, setNewRelNotes] = useState('');
  const [newRelHistory, setNewRelHistory] = useState('');

  const [isAddingMilestoneTargetId, setIsAddingMilestoneTargetId] = useState<string | null>(null);
  const [newMilestoneType, setNewMilestoneType] = useState<RelationshipMilestone>('alliance_formed');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');

  const [isAddingCheckpoint, setIsAddingCheckpoint] = useState(false);
  const [newCheckpointSceneId, setNewCheckpointSceneId] = useState('');
  const [newCheckpointEmotional, setNewCheckpointEmotional] = useState('');
  const [newCheckpointPhysical, setNewCheckpointPhysical] = useState('');
  const [newCheckpointMental, setNewCheckpointMental] = useState('');
  const [newCheckpointGoal, setNewCheckpointGoal] = useState('');
  const [newCheckpointNote, setNewCheckpointNote] = useState('');

  const filteredEntries = codexList.filter(entry => {
    if (selectedCategory !== 'all' && entry.category !== selectedCategory) return false;
    if (searchTerm && !(entry.name || '').toLowerCase().includes(searchTerm.toLowerCase()) && !(entry.summary || '').toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const selectedEntry = codexList.find(e => e.id === selectedEntryId) || filteredEntries[0];

  // Resolve matching domain Character if category is 'character'
  let matchedChar: Character | undefined = undefined;
  if (selectedEntry && selectedEntry.category === 'character') {
    matchedChar = (project.characters || []).find(c => c.id === selectedEntry.id || (c.name && selectedEntry.name && c.name.toLowerCase() === selectedEntry.name.toLowerCase()));
  }

  const handleCreateNew = () => {
    const newId = `codex-${Date.now()}`;
    const newEntry: CodexEntry = {
      id: newId,
      name: 'New Character',
      category: 'character',
      summary: 'Dossier summary and role in the story.',
      content: '<p>Add rich descriptions, motivations, and backstory here.</p>',
      tags: ['character'],
      updatedAt: new Date().toISOString()
    };
    addCodexEntry(newEntry);

    // Also register domain character
    addCharacter({
      id: newId,
      name: 'New Character',
      role: 'Supporting',
      bio: 'Dossier summary and role in the story.',
      currentGoal: 'Establish primary story objective',
      currentState: {
        emotional: 'Focused and determined',
        physical: 'Able-bodied',
        mental: 'Sharp',
        currentGoal: 'Establish primary story objective',
        currentConflict: 'Uncertain alliances'
      },
      goals: [
        { id: `goal-${Date.now()}`, description: 'Establish primary story objective', status: 'active', priority: 'primary' }
      ],
      beliefs: [
        { id: `belief-${Date.now()}`, statement: 'Everyone has a hidden motive', certainty: 'strong', status: 'held' }
      ],
      secrets: [
        { id: `secret-${Date.now()}`, content: 'Has a secret pact from the past', status: 'hidden' }
      ],
      knowledgeList: [],
      relationships: [],
      stateCheckpoints: []
    });

    setSelectedEntryId(newId);
  };

  const getCategoryIcon = (cat: CodexEntry['category']) => {
    switch (cat) {
      case 'character': return <User className="w-3.5 h-3.5 text-indigo-400" />;
      case 'location': return <MapPin className="w-3.5 h-3.5 text-emerald-400" />;
      case 'faction': return <Shield className="w-3.5 h-3.5 text-amber-400" />;
      case 'lore': return <Scroll className="w-3.5 h-3.5 text-purple-400" />;
      case 'item': return <Package className="w-3.5 h-3.5 text-rose-400" />;
      default: return <BookOpen className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const timelineData = selectedEntry ? StoryEngineQueries.getCharacterAppearanceTimeline(
    project, 
    matchedChar?.id || selectedEntry.id, 
    selectedEntry.name
  ) : null;

  const handleNavigateToChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setActiveTab('editor');
  };

  const handleSaveCharacterState = (updates: Partial<Character>) => {
    if (!matchedChar && selectedEntry) {
      // Create domain character if missing
      addCharacter({
        id: selectedEntry.id,
        name: selectedEntry.name,
        role: 'Supporting',
        bio: selectedEntry.summary,
        ...updates
      });
      return;
    }
    if (matchedChar) {
      updateCharacter(matchedChar.id, updates);
    }
  };

  const handleSaveNewGoal = () => {
    if (!newGoalDescription.trim() || !matchedChar) return;
    addGoal(matchedChar.id, {
      description: newGoalDescription.trim(),
      priority: newGoalPriority,
      conflict: newGoalConflict.trim() || undefined,
      status: 'active'
    });
    setNewGoalDescription('');
    setNewGoalConflict('');
    setIsAddingGoal(false);
  };

  const handleSaveNewBelief = () => {
    if (!newBeliefStatement.trim() || !matchedChar) return;
    addBelief(matchedChar.id, {
      statement: newBeliefStatement.trim(),
      certainty: newBeliefCertainty,
      status: 'held'
    });
    setNewBeliefStatement('');
    setIsAddingBelief(false);
  };

  const handleSaveNewSecret = () => {
    if (!newSecretContent.trim() || !matchedChar) return;
    addSecret(matchedChar.id, {
      content: newSecretContent.trim(),
      status: newSecretStatus
    });
    setNewSecretContent('');
    setIsAddingSecret(false);
  };

  const handleSaveNewKnowledge = () => {
    if (!newKnowInfo.trim() || !matchedChar) return;
    addCharacterKnowledge(matchedChar.id, {
      information: newKnowInfo.trim(),
      learnedAt: newKnowLearnedAt.trim(),
      source: newKnowSource.trim(),
      certainty: newKnowCertainty,
    });
    setNewKnowInfo('');
    setNewKnowLearnedAt('');
    setNewKnowSource('');
    setIsAddingKnowledge(false);
  };

  const handleSaveNewRelationship = () => {
    if (!newRelTargetId || !matchedChar) return;
    addCharacterRelationship(matchedChar.id, newRelTargetId, newRelType, {
      currentState: newRelCurrentState,
      notes: newRelNotes.trim(),
      history: newRelHistory.trim(),
      strength: newRelTrustLevel,
    });
    setNewRelTargetId('');
    setNewRelNotes('');
    setNewRelHistory('');
    setIsAddingRel(false);
  };

  const handleSaveNewMilestone = (targetId: string) => {
    if (!newMilestoneDesc.trim() || !matchedChar) return;
    addRelationshipMilestone(matchedChar.id, targetId, {
      milestone: newMilestoneType,
      description: newMilestoneDesc.trim()
    });
    setNewMilestoneDesc('');
    setIsAddingMilestoneTargetId(null);
  };

  const handleSaveNewCheckpoint = () => {
    if (!matchedChar) return;
    addStateCheckpoint(matchedChar.id, {
      sceneId: newCheckpointSceneId || undefined,
      emotionalState: newCheckpointEmotional.trim() || undefined,
      physicalState: newCheckpointPhysical.trim() || undefined,
      mentalState: newCheckpointMental.trim() || undefined,
      currentGoal: newCheckpointGoal.trim() || undefined,
      note: newCheckpointNote.trim() || undefined
    });
    setNewCheckpointEmotional('');
    setNewCheckpointPhysical('');
    setNewCheckpointMental('');
    setNewCheckpointGoal('');
    setNewCheckpointNote('');
    setIsAddingCheckpoint(false);
  };

  return (
    <div 
      className="flex-1 flex h-full overflow-hidden select-none font-sans"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Left Sidebar: Entity List */}
      <div 
        className="w-72 border-r flex flex-col h-full shrink-0"
        style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
      >
        {/* Top Header & Search */}
        <div className="p-3 border-b space-y-2.5" style={{ borderColor: theme.pageBorder }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-zinc-300" />
              <span className="font-semibold text-xs text-zinc-200">World Codex & Bible</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setOrganizerModalOpen(true)}
                className="p-1 hover:text-zinc-200 text-zinc-400 rounded transition-colors"
                title="Extract entities from prose"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCreateNew}
                className="p-1 hover:text-zinc-100 text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
                title="Add New Entity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[10px]">
            {['all', 'character', 'location', 'faction', 'lore', 'item'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded capitalize shrink-0 transition-colors ${
                  selectedCategory === cat ? 'bg-indigo-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter codex..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded pl-7 pr-2 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        {/* Entity List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredEntries.map(entry => {
            const isSelected = selectedEntry?.id === entry.id;

            return (
              <div
                key={entry.id}
                onClick={() => setSelectedEntryId(entry.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/80 shadow-xs' 
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate flex-1 mr-2">
                  <div className="p-1 rounded bg-zinc-900 border border-zinc-800">
                    {getCategoryIcon(entry.category)}
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-xs truncate text-zinc-200">{entry.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{entry.summary}</div>
                  </div>
                </div>

                <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                  {entry.category}
                </span>
              </div>
            );
          })}

          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No entries found.
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Active Dossier & Story State Editor */}
      {selectedEntry ? (
        <div className="flex-1 flex flex-col h-full overflow-y-auto">
          {/* Header Bar */}
          <div 
            className="p-5 border-b flex items-center justify-between shrink-0"
            style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
          >
            <div className="flex items-center space-x-3 flex-1 mr-4">
              <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700">
                {getCategoryIcon(selectedEntry.category)}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={selectedEntry.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    updateCodexEntry(selectedEntry.id, { name: newName });
                    if (matchedChar) updateCharacter(matchedChar.id, { name: newName });
                  }}
                  className="text-base font-semibold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 outline-none w-full py-0.5"
                />
                <input
                  type="text"
                  value={selectedEntry.summary}
                  placeholder="One-line summary / role in the story..."
                  onChange={(e) => updateCodexEntry(selectedEntry.id, { summary: e.target.value })}
                  className="text-xs text-zinc-400 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 outline-none w-full py-0.5"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedEntry.category}
                onChange={(e) => updateCodexEntry(selectedEntry.id, { category: e.target.value as any })}
                className="bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none"
              >
                <option value="character">Character</option>
                <option value="location">Location</option>
                <option value="faction">Faction / Guild</option>
                <option value="lore">Lore & Magic</option>
                <option value="item">Item / Artifact</option>
              </select>

              <button
                onClick={() => {
                  if (confirm(`Delete dossier for "${selectedEntry.name}"?`)) {
                    deleteCodexEntry(selectedEntry.id);
                    if (matchedChar) deleteCharacter(matchedChar.id);
                  }
                }}
                className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                title="Delete Dossier"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-Tab Navigation for Character Entries */}
          {selectedEntry.category === 'character' && (
            <div 
              className="px-6 py-2 border-b bg-zinc-950/40 flex items-center justify-between shrink-0"
              style={{ borderColor: theme.pageBorder }}
            >
              <div className="flex items-center space-x-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                <button
                  onClick={() => setCharacterSubTab('state')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    characterSubTab === 'state' 
                      ? 'bg-zinc-800 text-zinc-100 shadow-xs' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Story State & Tracking
                </button>
                <button
                  onClick={() => setCharacterSubTab('dossier')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    characterSubTab === 'dossier' 
                      ? 'bg-zinc-800 text-zinc-100 shadow-xs' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Lore & Backstory Notes
                </button>
              </div>

              {matchedChar && (
                <div className="flex items-center space-x-2 text-[11px] text-zinc-400">
                  <span>Role:</span>
                  <select
                    value={matchedChar.role}
                    onChange={(e) => updateCharacter(matchedChar!.id, { role: e.target.value as any })}
                    className="bg-[#121215] border border-zinc-700/80 rounded px-2 py-0.5 text-xs text-zinc-200 outline-none"
                  >
                    <option value="Protagonist">Protagonist</option>
                    <option value="Antagonist">Antagonist</option>
                    <option value="Supporting">Supporting</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Appearance Timeline Strip (Always available for quick navigation across all entities!) */}
          {timelineData && (
            <div 
              className="px-6 py-3 border-b bg-zinc-950/20 shrink-0 space-y-1.5"
              style={{ borderColor: theme.pageBorder }}
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2 text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-zinc-300">Appearance Timeline</span>
                  <span className="text-zinc-500 font-mono">
                    ({timelineData.totalAppearances} appearances, {timelineData.povCount} POV)
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 italic">Click node to open in editor</span>
              </div>

              {/* Horizontal Timeline Grid */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1">
                {timelineData.columns.map((col) => (
                  <div
                    key={col.chapterId}
                    onClick={() => handleNavigateToChapter(col.chapterId)}
                    className={`flex flex-col items-center p-1.5 rounded min-w-[54px] cursor-pointer transition-all border group ${
                      col.isPresent 
                        ? 'bg-zinc-800/70 border-zinc-700 hover:border-indigo-500' 
                        : 'bg-zinc-900/30 border-transparent opacity-40 hover:opacity-80'
                    }`}
                    title={`Ch ${col.chapterNumber}: ${col.chapterTitle} (${col.isPresent ? 'Present' : 'Not present'})`}
                  >
                    <span className="text-[9px] font-mono text-zinc-400 group-hover:text-indigo-300">
                      Ch {col.chapterNumber}
                    </span>

                    <div className="h-5 flex items-center justify-center">
                      {col.isPresent ? (
                        <div 
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-transform group-hover:scale-125 ${
                            col.isPov ? 'bg-indigo-500 ring-2 ring-indigo-400/40' : 'bg-emerald-500'
                          }`}
                        >
                          {col.isPov && <span className="text-[7px] text-white font-bold leading-none">P</span>}
                        </div>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAIN BODY: CHARACTER DYNAMIC STORY STATE */}
          {selectedEntry.category === 'character' && characterSubTab === 'state' ? (
            <div className="p-6 space-y-6 max-w-5xl">
              {/* Section 1: Identity & Archetype */}
              <div 
                className="rounded-lg border p-4 space-y-3"
                style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                      Identity & Role
                    </h4>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">ID: {matchedChar?.id || selectedEntry.id}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-zinc-400">Story Role</label>
                    <select
                      value={matchedChar?.role || 'Supporting'}
                      onChange={(e) => handleSaveCharacterState({ role: e.target.value as any })}
                      className="w-full bg-black/50 border border-zinc-700/80 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none"
                    >
                      <option value="Protagonist">Protagonist</option>
                      <option value="Antagonist">Antagonist</option>
                      <option value="Supporting">Supporting</option>
                      <option value="Minor">Minor</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-zinc-400">Archetype</label>
                    <input
                      type="text"
                      placeholder="e.g. Reluctant Mentor, Catalyst..."
                      value={matchedChar?.archetype || ''}
                      onChange={(e) => handleSaveCharacterState({ archetype: e.target.value })}
                      className="w-full bg-black/50 border border-zinc-700/80 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-zinc-400">Age / Era</label>
                    <input
                      type="text"
                      placeholder="e.g. 28, Mid-Thirties, Ancient..."
                      value={matchedChar?.age || ''}
                      onChange={(e) => handleSaveCharacterState({ age: e.target.value })}
                      className="w-full bg-black/50 border border-zinc-700/80 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] uppercase font-semibold text-zinc-400">Aliases & Known Monikers</label>
                  <input
                    type="text"
                    placeholder="e.g. The Silver Fox, Commander Vael, The Exile (comma-separated)..."
                    value={(matchedChar?.aliases || []).join(', ')}
                    onChange={(e) => handleSaveCharacterState({ 
                      aliases: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                    })}
                    className="w-full bg-black/50 border border-zinc-700/80 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Section 2: Current Narrative State */}
              <div 
                className="rounded-lg border p-4 space-y-3"
                style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                      Current Narrative State
                    </h4>
                  </div>
                  <span className="text-[10px] text-zinc-500">Live manuscript snapshot</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-zinc-400">Emotional State</label>
                    <input
                      type="text"
                      placeholder="e.g. Grieving, Suspicious, Resolute..."
                      value={typeof matchedChar?.currentState === 'object' ? matchedChar?.currentState?.emotional || '' : (matchedChar?.currentState || '')}
                      onChange={(e) => {
                        const emotional = e.target.value;
                        if (typeof matchedChar?.currentState === 'object') {
                          handleSaveCharacterState({ currentState: { ...matchedChar.currentState, emotional } });
                        } else {
                          handleSaveCharacterState({ currentState: emotional });
                        }
                      }}
                      className="w-full bg-black/50 border border-zinc-700/80 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-zinc-400">Physical Condition</label>
                    <input
                      type="text"
                      placeholder="e.g. Wounded shoulder, Exhausted, Peak..."
                      value={typeof matchedChar?.currentState === 'object' ? matchedChar?.currentState?.physical || '' : ''}
                      onChange={(e) => {
                        const current = typeof matchedChar?.currentState === 'object' ? matchedChar.currentState : {};
                        handleSaveCharacterState({ currentState: { ...current, physical: e.target.value } });
                      }}
                      className="w-full bg-black/50 border border-zinc-700/80 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-zinc-400">Mental / Cognitive</label>
                    <input
                      type="text"
                      placeholder="e.g. Hyper-vigilant, Conflicted, Clear..."
                      value={typeof matchedChar?.currentState === 'object' ? matchedChar?.currentState?.mental || '' : ''}
                      onChange={(e) => {
                        const current = typeof matchedChar?.currentState === 'object' ? matchedChar.currentState : {};
                        handleSaveCharacterState({ currentState: { ...current, mental: e.target.value } });
                      }}
                      className="w-full bg-black/50 border border-zinc-700/80 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-zinc-400">Immediate Conflict / Obstacle</label>
                    <input
                      type="text"
                      placeholder="e.g. Blockaded mountain pass, Distrust of Elena..."
                      value={typeof matchedChar?.currentState === 'object' ? matchedChar?.currentState?.currentConflict || '' : ''}
                      onChange={(e) => {
                        const current = typeof matchedChar?.currentState === 'object' ? matchedChar.currentState : {};
                        handleSaveCharacterState({ currentState: { ...current, currentConflict: e.target.value } });
                      }}
                      className="w-full bg-black/50 border border-zinc-700/80 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-zinc-400">Core Motivation</label>
                    <input
                      type="text"
                      placeholder="e.g. Protect family honor at all costs..."
                      value={typeof matchedChar?.currentState === 'object' ? matchedChar?.currentState?.motivation || '' : (matchedChar?.motivation || '')}
                      onChange={(e) => {
                        const motivation = e.target.value;
                        const current = typeof matchedChar?.currentState === 'object' ? matchedChar.currentState : {};
                        handleSaveCharacterState({ motivation, currentState: { ...current, motivation } });
                      }}
                      className="w-full bg-black/50 border border-zinc-700/80 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Goals & Objectives */}
              <div 
                className="rounded-lg border p-4 space-y-3"
                style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                      Goals & Motivations
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {(matchedChar?.goals || []).length || (matchedChar?.currentGoal ? 1 : 0)}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsAddingGoal(!isAddingGoal)}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Goal</span>
                  </button>
                </div>

                {/* Add Goal Form */}
                {isAddingGoal && (
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2.5 animate-in fade-in duration-100">
                    <input
                      type="text"
                      placeholder="What is the specific goal or objective?"
                      value={newGoalDescription}
                      onChange={(e) => setNewGoalDescription(e.target.value)}
                      autoFocus
                      className="w-full bg-black border border-zinc-600 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={newGoalPriority}
                        onChange={(e) => setNewGoalPriority(e.target.value as any)}
                        className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                      >
                        <option value="primary">Primary (Manuscript Arc)</option>
                        <option value="secondary">Secondary (Subplot / Scene)</option>
                        <option value="long-term">Long-Term (Life Ambition)</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Key obstacle / conflict preventing this..."
                        value={newGoalConflict}
                        onChange={(e) => setNewGoalConflict(e.target.value)}
                        className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setIsAddingGoal(false)}
                        className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNewGoal}
                        disabled={!newGoalDescription.trim()}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                      >
                        Save Goal
                      </button>
                    </div>
                  </div>
                )}

                {/* Goals List */}
                <div className="space-y-2">
                  {/* Render structured goals or fallback to legacy currentGoal */}
                  {(matchedChar?.goals && matchedChar.goals.length > 0) ? (
                    matchedChar.goals.map((g, idx) => {
                      const goalItem: GoalItem = typeof g === 'string' 
                        ? { id: `goal-legacy-${idx}`, description: g, status: 'active', priority: 'primary' }
                        : g;

                      const statusColors: Record<GoalStatus, string> = {
                        active: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30',
                        paused: 'bg-amber-950/70 text-amber-300 border-amber-500/30',
                        achieved: 'bg-sky-950/70 text-sky-300 border-sky-500/30',
                        failed: 'bg-rose-950/70 text-rose-300 border-rose-500/30',
                        abandoned: 'bg-zinc-800 text-zinc-400 border-zinc-700',
                      };

                      return (
                        <div
                          key={goalItem.id}
                          className="p-3 rounded-lg bg-black/40 border border-zinc-800/80 flex items-start justify-between group space-x-3"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${statusColors[goalItem.status || 'active']}`}>
                                {goalItem.status || 'active'}
                              </span>
                              {goalItem.priority && (
                                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                                  {goalItem.priority}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-zinc-200 font-medium leading-relaxed">
                              {goalItem.description}
                            </p>

                            {goalItem.conflict && (
                              <p className="text-[11px] text-amber-300/80 italic">
                                Obstacle: {goalItem.conflict}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0 pt-0.5">
                            <select
                              value={goalItem.status || 'active'}
                              onChange={(e) => setGoalStatus(matchedChar!.id, goalItem.id, e.target.value as GoalStatus)}
                              className="bg-black/60 border border-zinc-700/80 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 outline-none"
                            >
                              <option value="active">Active</option>
                              <option value="paused">Paused</option>
                              <option value="achieved">Achieved</option>
                              <option value="failed">Failed</option>
                              <option value="abandoned">Abandoned</option>
                            </select>

                            <button
                              onClick={() => removeGoal(matchedChar!.id, goalItem.id)}
                              className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete goal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : matchedChar?.currentGoal ? (
                    <div className="p-3 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border bg-emerald-950/70 text-emerald-300 border-emerald-500/30">
                          Active
                        </span>
                        <p className="text-xs text-zinc-200 font-medium mt-1">{matchedChar.currentGoal}</p>
                      </div>
                    </div>
                  ) : !isAddingGoal && (
                    <p className="text-xs text-zinc-500 italic py-2 text-center">
                      No goals defined yet. Click "+ Add Goal" to record their motives.
                    </p>
                  )}
                </div>
              </div>

              {/* Section 4: Beliefs & Secrets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Beliefs & Worldview */}
                <div 
                  className="rounded-lg border p-4 space-y-3"
                  style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                        Beliefs & Flaws
                      </h4>
                    </div>
                    <button
                      onClick={() => setIsAddingBelief(!isAddingBelief)}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  {isAddingBelief && (
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-700 space-y-2">
                      <input
                        type="text"
                        placeholder="Belief statement or personal lie..."
                        value={newBeliefStatement}
                        onChange={(e) => setNewBeliefStatement(e.target.value)}
                        className="w-full bg-black border border-zinc-600 rounded px-2 py-1 text-xs text-white outline-none"
                      />
                      <div className="flex items-center justify-between">
                        <select
                          value={newBeliefCertainty}
                          onChange={(e) => setNewBeliefCertainty(e.target.value as any)}
                          className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                        >
                          <option value="strong">Strong Dogma</option>
                          <option value="moderate">Moderate</option>
                          <option value="uncertain">Questioned / Shaky</option>
                        </select>
                        <button
                          onClick={handleSaveNewBelief}
                          disabled={!newBeliefStatement.trim()}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {(matchedChar?.beliefs || []).map((b, idx) => {
                      const beliefItem: BeliefItem = typeof b === 'string'
                        ? { id: `belief-legacy-${idx}`, statement: b, certainty: 'strong' }
                        : b;

                      const certaintyBadge = {
                        strong: 'text-amber-300 border-amber-500/30 bg-amber-950/40',
                        moderate: 'text-zinc-300 border-zinc-700 bg-zinc-900',
                        uncertain: 'text-rose-300 border-rose-500/30 bg-rose-950/40',
                      }[beliefItem.certainty || 'strong'];

                      return (
                        <div 
                          key={beliefItem.id} 
                          className="flex items-center justify-between p-2 rounded bg-black/40 border border-zinc-800 text-xs text-zinc-200 group"
                        >
                          <div className="space-y-0.5 flex-1 mr-2">
                            <span className="leading-relaxed block">{beliefItem.statement}</span>
                            <span className={`inline-block px-1 py-0.2 text-[8px] uppercase tracking-wider rounded border ${certaintyBadge}`}>
                              {beliefItem.certainty || 'strong'}
                            </span>
                          </div>
                          <button
                            onClick={() => removeBelief(matchedChar!.id, beliefItem.id)}
                            className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove belief"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {(!matchedChar?.beliefs || matchedChar.beliefs.length === 0) && !isAddingBelief && (
                      <p className="text-[11px] text-zinc-500 italic py-1">No core beliefs recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Secrets & Vulnerabilities */}
                <div 
                  className="rounded-lg border p-4 space-y-3"
                  style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                        Secrets & Concealments
                      </h4>
                    </div>
                    <button
                      onClick={() => setIsAddingSecret(!isAddingSecret)}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  {isAddingSecret && (
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-700 space-y-2">
                      <input
                        type="text"
                        placeholder="What do they conceal from others?"
                        value={newSecretContent}
                        onChange={(e) => setNewSecretContent(e.target.value)}
                        className="w-full bg-black border border-zinc-600 rounded px-2 py-1 text-xs text-white outline-none"
                      />
                      <div className="flex items-center justify-between">
                        <select
                          value={newSecretStatus}
                          onChange={(e) => setNewSecretStatus(e.target.value as any)}
                          className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                        >
                          <option value="hidden">Hidden</option>
                          <option value="suspected">Suspected by Others</option>
                          <option value="revealed">Revealed to Others</option>
                        </select>
                        <button
                          onClick={handleSaveNewSecret}
                          disabled={!newSecretContent.trim()}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {Array.isArray(matchedChar?.secrets) ? (
                      matchedChar.secrets.map((sec, idx) => {
                        const secObj: SecretItem = typeof sec === 'string'
                          ? { id: `sec-${idx}`, content: sec, secret: sec, status: 'hidden' }
                          : sec;

                        const statusBadge = {
                          hidden: 'bg-purple-950/70 text-purple-300 border-purple-500/30',
                          suspected: 'bg-amber-950/70 text-amber-300 border-amber-500/30',
                          revealed: 'bg-zinc-800 text-zinc-400 border-zinc-700',
                        }[secObj.status || 'hidden'];

                        return (
                          <div 
                            key={secObj.id}
                            className="flex items-center justify-between p-2 rounded bg-black/40 border border-zinc-800 text-xs text-zinc-200 group"
                          >
                            <div className="space-y-0.5 flex-1 mr-2">
                              <span className="leading-relaxed block">{secObj.content || secObj.secret}</span>
                              <span className={`inline-block px-1 py-0.2 text-[8px] uppercase tracking-wider rounded border ${statusBadge}`}>
                                {secObj.status || 'hidden'}
                              </span>
                            </div>
                            <button
                              onClick={() => removeSecret(matchedChar!.id, secObj.id)}
                              className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove secret"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })
                    ) : matchedChar?.secrets ? (
                      <div className="p-2 rounded bg-black/40 border border-zinc-800 text-xs text-zinc-200">
                        <span className="inline-block px-1 py-0.2 text-[8px] uppercase tracking-wider rounded border bg-purple-950/70 text-purple-300 border-purple-500/30 mb-1">
                          Hidden
                        </span>
                        <p>{matchedChar.secrets}</p>
                      </div>
                    ) : !isAddingSecret && (
                      <p className="text-[11px] text-zinc-500 italic py-1">No secrets recorded.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 5: Structured Knowledge Tracker */}
              <div 
                className="rounded-lg border p-4 space-y-3"
                style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                      Knowledge & Epistemic State
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {matchedChar?.knowledgeList?.length || 0} facts
                    </span>
                  </div>

                  <button
                    onClick={() => setIsAddingKnowledge(!isAddingKnowledge)}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Knowledge</span>
                  </button>
                </div>

                {/* Add Knowledge Form */}
                {isAddingKnowledge && (
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2.5 animate-in fade-in duration-100">
                    <input
                      type="text"
                      placeholder="What specific information or fact do they know?"
                      value={newKnowInfo}
                      onChange={(e) => setNewKnowInfo(e.target.value)}
                      autoFocus
                      className="w-full bg-black border border-zinc-600 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Learned in (e.g. Ch 2, Scene 3)..."
                        value={newKnowLearnedAt}
                        onChange={(e) => setNewKnowLearnedAt(e.target.value)}
                        className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Source (e.g. Elena, Grimoire)..."
                        value={newKnowSource}
                        onChange={(e) => setNewKnowSource(e.target.value)}
                        className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                      />
                      <select
                        value={newKnowCertainty}
                        onChange={(e) => setNewKnowCertainty(e.target.value as any)}
                        className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                      >
                        <option value="certain">Certain Fact</option>
                        <option value="suspected">Suspected</option>
                        <option value="rumor">Rumor</option>
                        <option value="misinformed">Misinformed / False</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setIsAddingKnowledge(false)}
                        className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNewKnowledge}
                        disabled={!newKnowInfo.trim()}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Knowledge List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(matchedChar?.knowledgeList || []).map((k) => {
                    const certaintyBadge = {
                      certain: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30',
                      suspected: 'bg-amber-950/70 text-amber-300 border-amber-500/30',
                      rumor: 'bg-purple-950/70 text-purple-300 border-purple-500/30',
                      misinformed: 'bg-rose-950/70 text-rose-300 border-rose-500/30',
                    }[k.certainty || 'certain'];

                    return (
                      <div 
                        key={k.id}
                        className="p-3 rounded-lg bg-black/40 border border-zinc-800/80 space-y-1.5 flex flex-col justify-between group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider border ${certaintyBadge}`}>
                              {k.certainty || 'certain'}
                            </span>
                            <button
                              onClick={() => deleteCharacterKnowledge(matchedChar!.id, k.id)}
                              className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                            {typeof (k.statement || k.information) === 'string' ? (k.statement || k.information) : ((k as any).fact || String(k.statement || k.information || ''))}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-900">
                          <span>{k.learnedIn || k.learnedAt ? `Learned: ${k.learnedIn || k.learnedAt}` : 'Baseline knowledge'}</span>
                          <span>{k.source ? `From: ${k.source}` : ''}</span>
                        </div>
                      </div>
                    );
                  })}

                  {(!matchedChar?.knowledgeList || matchedChar.knowledgeList.length === 0) && !isAddingKnowledge && (
                    <div className="col-span-2 text-center py-6 text-zinc-500 text-xs">
                      No tracked knowledge entries yet. Click "+ Add Knowledge" to record key facts known to this character.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 6: Interpersonal Relationships with Trust & Milestones */}
              <div 
                className="rounded-lg border p-4 space-y-3"
                style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                      Relationships & Dynamics
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {matchedChar?.relationships?.length || 0} links
                    </span>
                  </div>

                  <button
                    onClick={() => setIsAddingRel(!isAddingRel)}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Relationship</span>
                  </button>
                </div>

                {/* Add Relationship Form */}
                {isAddingRel && (
                  <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-700 space-y-3 animate-in fade-in duration-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-semibold text-zinc-400">Target Character (B)</label>
                        <select
                          value={newRelTargetId}
                          onChange={(e) => setNewRelTargetId(e.target.value)}
                          className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none"
                        >
                          <option value="">Select Character...</option>
                          {(project.characters || []).filter(c => c.id !== matchedChar?.id).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-semibold text-zinc-400">Relationship Type</label>
                        <input
                          type="text"
                          placeholder="e.g. Mentor, Rival, Sister, Sworn Enemy..."
                          value={newRelType}
                          onChange={(e) => setNewRelType(e.target.value)}
                          className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-semibold text-zinc-400">Current Status</label>
                        <input
                          type="text"
                          placeholder="e.g. Allied, Fragile Trust, Bitter Feud..."
                          value={newRelCurrentState}
                          onChange={(e) => setNewRelCurrentState(e.target.value)}
                          className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-semibold text-zinc-400">Trust Level (-5 to +5)</label>
                        <input
                          type="number"
                          min="-5"
                          max="5"
                          value={newRelTrustLevel}
                          onChange={(e) => setNewRelTrustLevel(parseInt(e.target.value) || 0)}
                          className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] uppercase font-semibold text-zinc-400">Dynamic Notes</label>
                        <input
                          type="text"
                          placeholder="Dynamic Notes (e.g. Bound by blood pact)..."
                          value={newRelNotes}
                          onChange={(e) => setNewRelNotes(e.target.value)}
                          className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setIsAddingRel(false)}
                        className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNewRelationship}
                        disabled={!newRelTargetId}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded text-xs font-semibold"
                      >
                        Save Relationship
                      </button>
                    </div>
                  </div>
                )}

                {/* Relationships List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(matchedChar?.relationships || []).map((rel) => {
                    const targetChar = project.characters.find(c => c.id === rel.targetId);

                    return (
                      <div 
                        key={rel.targetId}
                        className="p-3.5 rounded-lg bg-black/40 border border-zinc-800/80 space-y-2 flex flex-col justify-between group hover:border-zinc-700 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 font-medium text-xs text-zinc-100">
                              <span>{matchedChar?.name}</span>
                              <ArrowRight className="w-3 h-3 text-zinc-500" />
                              <span className="text-sky-300 font-semibold">{targetChar?.name || rel.targetName || 'Character'}</span>
                            </div>
                            <button
                              onClick={() => deleteCharacterRelationship(matchedChar!.id, rel.targetId)}
                              className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete relationship"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center space-x-2 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-500/30 font-medium">
                              {rel.relation}
                            </span>
                            {rel.currentState && (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {rel.currentState}
                              </span>
                            )}
                            {rel.trustLevel !== undefined && (() => {
                              const numTrust = typeof rel.trustLevel === 'number' ? rel.trustLevel : (typeof rel.strength === 'number' ? rel.strength : 0);
                              const isNum = typeof rel.trustLevel === 'number' || typeof rel.strength === 'number';
                              return (
                                <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono ${
                                  isNum && numTrust > 0 
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' 
                                    : isNum && numTrust < 0 
                                    ? 'bg-rose-950/60 text-rose-300 border-rose-500/30' 
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}>
                                  Trust: {isNum ? (numTrust > 0 ? `+${numTrust}` : numTrust) : rel.trustLevel}
                                </span>
                              );
                            })()}
                          </div>

                          {rel.notes && (
                            <p className="text-[11px] text-zinc-300 leading-relaxed">
                              {rel.notes}
                            </p>
                          )}

                          {/* Relationship Milestones */}
                          {rel.milestones && rel.milestones.length > 0 && (
                            <div className="pt-1.5 space-y-1 border-t border-zinc-900">
                              <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider block">Milestones</span>
                              {rel.milestones.map((m, mIdx) => (
                                <div key={mIdx} className="text-[10px] text-zinc-400 flex items-center space-x-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                                  <span className="font-semibold text-zinc-300 capitalize">{m.milestone.replace('_', ' ')}:</span>
                                  <span className="truncate">{m.description}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add Milestone Form Toggle */}
                        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between">
                          {isAddingMilestoneTargetId === rel.targetId ? (
                            <div className="w-full space-y-1.5 pt-1">
                              <div className="flex items-center space-x-1.5">
                                <select
                                  value={newMilestoneType}
                                  onChange={(e) => setNewMilestoneType(e.target.value as any)}
                                  className="bg-black border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-zinc-200 outline-none"
                                >
                                  <option value="first_meeting">First Meeting</option>
                                  <option value="alliance_formed">Alliance Formed</option>
                                  <option value="betrayal">Betrayal</option>
                                  <option value="reconciliation">Reconciliation</option>
                                  <option value="romance">Romance</option>
                                  <option value="rift">Rift / Falling Out</option>
                                  <option value="secret_shared">Secret Shared</option>
                                  <option value="death">Death / Separation</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Milestone description..."
                                  value={newMilestoneDesc}
                                  onChange={(e) => setNewMilestoneDesc(e.target.value)}
                                  className="flex-1 bg-black border border-zinc-700 rounded px-2 py-0.5 text-[10px] text-zinc-200 outline-none"
                                />
                              </div>
                              <div className="flex justify-end space-x-1">
                                <button
                                  onClick={() => setIsAddingMilestoneTargetId(null)}
                                  className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveNewMilestone(rel.targetId)}
                                  disabled={!newMilestoneDesc.trim()}
                                  className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-medium"
                                >
                                  Add Milestone
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setIsAddingMilestoneTargetId(rel.targetId)}
                              className="text-[10px] text-zinc-500 hover:text-sky-300 flex items-center space-x-1"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Record Milestone</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {(!matchedChar?.relationships || matchedChar.relationships.length === 0) && !isAddingRel && (
                    <div className="col-span-2 text-center py-6 text-zinc-500 text-xs">
                      No interpersonal relationships mapped yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 7: Connected Plot Threads & Story Arcs */}
              <div 
                className="rounded-lg border p-4 space-y-3"
                style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                      Connected Plot Threads & Story Arcs
                    </h4>
                  </div>
                </div>

                {/* Connected Threads Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {matchedChar && StoryEngineQueries.getCharacterPlotThreads(project, matchedChar.id).map(thread => (
                    <div 
                      key={thread.id}
                      onClick={() => setInspectorSelection({ type: 'thread', threadId: thread.id })}
                      className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/50 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-0.5 truncate flex-1 mr-2">
                        <div className="text-xs font-medium text-zinc-200 group-hover:text-purple-300 truncate">
                          {thread.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 capitalize">{thread.type} • {thread.status}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-300 shrink-0" />
                    </div>
                  ))}

                  {(!matchedChar || StoryEngineQueries.getCharacterPlotThreads(project, matchedChar.id).length === 0) && (
                    <div className="col-span-2 text-[11px] text-zinc-500 italic py-1">
                      No plot threads directly linked to this character yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 8: State Checkpoints along Manuscript */}
              <div 
                className="rounded-lg border p-4 space-y-3"
                style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                      State Checkpoints Timeline
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {(matchedChar?.stateCheckpoints || []).length} milestones
                    </span>
                  </div>

                  <button
                    onClick={() => setIsAddingCheckpoint(!isAddingCheckpoint)}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Record Checkpoint</span>
                  </button>
                </div>

                {isAddingCheckpoint && (
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2.5 animate-in fade-in duration-100">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-zinc-400">Scene / Manuscript Moment</label>
                      <select
                        value={newCheckpointSceneId}
                        onChange={(e) => setNewCheckpointSceneId(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none"
                      >
                        <option value="">Select Scene...</option>
                        {(project.acts || []).flatMap(a => (a.chapters || []).flatMap(ch => (ch.scenes || []).map(s => ({ scene: s, ch })))).map(({ scene, ch }) => (
                          <option key={scene.id} value={scene.id}>
                            {ch.title} - {scene.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Emotional state snapshot..."
                        value={newCheckpointEmotional}
                        onChange={(e) => setNewCheckpointEmotional(e.target.value)}
                        className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Physical state snapshot..."
                        value={newCheckpointPhysical}
                        onChange={(e) => setNewCheckpointPhysical(e.target.value)}
                        className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Active goal at this point..."
                        value={newCheckpointGoal}
                        onChange={(e) => setNewCheckpointGoal(e.target.value)}
                        className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Author context note (e.g. following the tavern betrayal)..."
                      value={newCheckpointNote}
                      onChange={(e) => setNewCheckpointNote(e.target.value)}
                      className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                    />

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setIsAddingCheckpoint(false)}
                        className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNewCheckpoint}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
                      >
                        Save Checkpoint
                      </button>
                    </div>
                  </div>
                )}

                {/* Checkpoint list */}
                <div className="space-y-2">
                  {(matchedChar?.stateCheckpoints || []).map((cp) => {
                    const scene = cp.sceneId ? StoryEngineQueries.getSceneById(project, cp.sceneId) : null;

                    return (
                      <div 
                        key={cp.id}
                        className="p-3 rounded bg-black/40 border border-zinc-800 space-y-1 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-200">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span>{scene?.title || 'Manuscript Checkpoint'}</span>
                          </div>
                          <button
                            onClick={() => removeStateCheckpoint(matchedChar!.id, cp.id)}
                            className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove checkpoint"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-400 pt-1">
                          {cp.emotionalState && <div><span className="text-zinc-500 font-medium">Emotional:</span> {cp.emotionalState}</div>}
                          {cp.physicalState && <div><span className="text-zinc-500 font-medium">Physical:</span> {cp.physicalState}</div>}
                          {cp.currentGoal && <div><span className="text-zinc-500 font-medium">Goal:</span> {cp.currentGoal}</div>}
                        </div>

                        {cp.note && (
                          <p className="text-[10px] text-zinc-500 italic pt-0.5">{cp.note}</p>
                        )}
                      </div>
                    );
                  })}

                  {(!matchedChar?.stateCheckpoints || matchedChar.stateCheckpoints.length === 0) && !isAddingCheckpoint && (
                    <p className="text-xs text-zinc-500 italic py-1 text-center">
                      No state checkpoints recorded yet. Record snapshots to track how character states evolve across scenes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* DOSSIER VIEW (Used for Lore/Locations/Items/Factions or Character Backstory) */
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
              {/* Left 2 Cols: Main Dossier Content */}
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Detailed Dossier & Lore</label>
                  <textarea
                    value={selectedEntry.content.replace(/<[^>]+>/g, '')}
                    onChange={(e) => updateCodexEntry(selectedEntry.id, { content: `<p>${e.target.value.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>')}</p>` })}
                    placeholder="Write detailed backstory, physical descriptions, sensory cues, history..."
                    className="w-full bg-zinc-900/50 border rounded-lg p-4 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 min-h-[360px] leading-relaxed resize-y"
                    style={{ borderColor: theme.pageBorder }}
                  />
                </div>
              </div>

              {/* Right 1 Col: Key Info & Scene Mentions */}
              <div className="space-y-4">
                <div 
                  className="rounded-lg border p-4 space-y-3"
                  style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Manuscript Chapters</span>
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {timelineData?.columns.filter(c => c.isPresent).length || 0} chapters
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                    {timelineData?.columns.filter(c => c.isPresent).map(col => (
                      <div
                        key={col.chapterId}
                        onClick={() => handleNavigateToChapter(col.chapterId)}
                        className="p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="truncate flex-1 mr-2">
                          <div className="text-xs font-medium text-zinc-200 truncate group-hover:text-indigo-300">
                            Ch {col.chapterNumber}: {col.chapterTitle}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate">{col.actTitle}</div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100" />
                      </div>
                    ))}

                    {timelineData?.columns.filter(c => c.isPresent).length === 0 && (
                      <p className="text-xs text-zinc-500 italic py-2">
                        Not mentioned in any chapters yet. Mention with <code className="text-indigo-400 font-mono">[[{selectedEntry.name}]]</code> in your draft!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
          Select or create an entity from the Codex.
        </div>
      )}
    </div>
  );
};
