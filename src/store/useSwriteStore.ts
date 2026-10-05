import { useState, useEffect } from 'react';
import { 
  ProjectData, Act, Chapter, Character, StoryBeat, Annotation, ThemeConfig, 
  TypographyConfig, WriterPreset, ViewMode, SplitMode, SyncStatus, PartnerMessage, 
  AIProviderConfig, CodexEntry, CutScene, SmartFilter, StructureTemplateType, WorkspaceTab,
  Scene, PlotThread, StoryArc, Location, Faction, Item, Event, ResearchNote, KnowledgeEntry,
  ContinuityConfig, ContinuityCheckType, IntentionalChoiceRecord, PlotThreadStatus, PlotThreadType,
  GoalItem, BeliefItem, SecretItem, CharacterState, CharacterStateCheckpoint, RelationshipMilestone,
  GoalStatus, BeliefStatus, BeliefCertainty, SecretStatus, Finding, ProofreadingConfig,
  RevisionRound, RevisionItem, RevisionSnapshot, RevisionPassType, RevisionRoundStatus,
  RevisionItemStatus, RevisionItemPriority, RevisionItemCategory, RevisionScope,
  ManuscriptSnapshot, SnapshotRestoreOptions, SnapshotRestoreResult, SnapshotDiffResult, CreateSnapshotOptions
} from '../types';
import { ContinuityWarning } from '../types/continuity';
import { StorageService, INITIAL_NOVEL_DATA, getPersistedUserTheme, getPersistedUserTypography } from '../services/storageService';
import { OrganizerService } from '../services/organizerService';
import { 
  StoryEngine, StoryEngineQueries, DEFAULT_CONTINUITY_CONFIG,
  createSnapshot, restoreSnapshot, pruneAutoSnapshots, compareProjects, verifySnapshotIntegrity
} from '../engine';
import { ProofreadingEngine, DEFAULT_PROOFREADING_CONFIG, RevisionEngine } from '../editorial';
export type InspectorSelection = 
  | { type: 'none' }
  | { type: 'character'; characterId: string }
  | { type: 'thread'; threadId: string }
  | { type: 'text'; text: string; annotationId?: string };

export interface SwriteState {
  project: ProjectData;
  activeChapterId: string;
  activeSceneId: string | null;
  inspectorSelection: InspectorSelection;
  activeTab: WorkspaceTab;
  viewMode: ViewMode;
  splitMode: SplitMode;
  secondaryChapterId: string;
  localFolderName: string | null;
  sidebarView: 'manuscript' | 'codex' | 'cutdrawer';
  smartFilter: SmartFilter | null;
  isSidebarOpen: boolean;
  isInspectorOpen: boolean;
  isFocusMode: boolean;
  isThemeModalOpen: boolean;
  isCompilerModalOpen: boolean;
  isPresetsModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isOrganizerModalOpen: boolean;
  isVersionHistoryModalOpen: boolean;
  activeCompareSnapshotId: string | null;
  
  syncStatus: SyncStatus;
  
  // Sprint Timer
  sprint: {
    isActive: boolean;
    durationMinutes: number;
    secondsLeft: number;
    wordsAtStart: number;
    targetWords: number;
  };

  // AI Config
  aiConfig: AIProviderConfig;

  // Actions
  setActiveTab: (tab: WorkspaceTab) => void;
  setActiveChapterId: (id: string) => void;
  setActiveSceneId: (id: string | null) => void;
  setInspectorSelection: (selection: InspectorSelection) => void;
  setSidebarView: (view: 'manuscript' | 'codex' | 'cutdrawer') => void;
  setSmartFilter: (filter: SmartFilter | null) => void;
  setSplitMode: (mode: SplitMode) => void;
  setSecondaryChapterId: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setPreset: (preset: WriterPreset) => void;
  setTheme: (theme: ThemeConfig) => void;
  updateTypography: (typo: Partial<TypographyConfig>) => void;
  updateChapterContent: (id: string, content: string, wordCount: number, sceneId?: string) => void;
  addNewChapter: (actId?: string, title?: string) => string;
  deleteChapter: (id: string) => void;
  deleteChapterToCutDrawer: (id: string, reason?: string) => void;
  restoreCutScene: (cutSceneId: string, targetActId?: string) => void;
  deleteCutScenePermanently: (cutSceneId: string) => void;
  addCodexEntry: (entry: CodexEntry) => void;
  updateCodexEntry: (id: string, updates: Partial<CodexEntry>) => void;
  deleteCodexEntry: (id: string) => void;
  runAutoTitleCleanup: () => number;
  runSequentialRenumbering: (prefix?: string) => number;
  runEntityExtraction: () => number;
  runApplyStructurePreset: (preset: StructureTemplateType) => void;
  updateChapterMetadata: (id: string, updates: Partial<Chapter>) => void;
  addNewAct: (title?: string) => string;
  updateActTitle: (actId: string, title: string) => void;
  deleteAct: (actId: string) => void;
  moveChapterToAct: (chapterId: string, targetActId: string) => void;
  reorderChapter: (sourceChapterId: string, targetActId: string, targetIndex?: number) => void;
  reorderActs: (sourceIndex: number, targetIndex: number) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  addCharacterRelationship: (sourceId: string, targetId: string, relation: string, options?: { currentState?: string; notes?: string; history?: string; strength?: number; trustLevel?: number | 'high' | 'moderate' | 'low' | 'none' | string }) => void;
  deleteCharacterRelationship: (sourceId: string, targetId: string) => void;
  addRelationshipMilestone: (sourceId: string, targetId: string, milestone: { sceneId?: string; chapterId?: string; milestone: RelationshipMilestone; description: string }) => void;
  updateCharacterState: (characterId: string, stateData: Partial<CharacterState> | string) => void;
  addGoal: (characterId: string, goalData: Partial<GoalItem> | string) => GoalItem;
  updateGoal: (characterId: string, goalId: string, updates: Partial<GoalItem>) => void;
  removeGoal: (characterId: string, goalId: string) => void;
  setGoalStatus: (characterId: string, goalId: string, status: GoalStatus) => void;
  addBelief: (characterId: string, beliefData: Partial<BeliefItem> | string) => BeliefItem;
  updateBelief: (characterId: string, beliefId: string, updates: Partial<BeliefItem>) => void;
  removeBelief: (characterId: string, beliefId: string) => void;
  addCharacterKnowledge: (characterId: string, entry: Partial<KnowledgeEntry> | string) => KnowledgeEntry;
  addKnowledge: (characterId: string, entry: Partial<KnowledgeEntry> | string) => KnowledgeEntry;
  updateCharacterKnowledge: (characterId: string, knowledgeId: string, updates: Partial<KnowledgeEntry>) => void;
  updateKnowledge: (characterId: string, knowledgeId: string, updates: Partial<KnowledgeEntry>) => void;
  deleteCharacterKnowledge: (characterId: string, knowledgeId: string) => void;
  removeKnowledge: (characterId: string, knowledgeId: string) => void;
  addSecret: (characterId: string, secretData: Partial<SecretItem> | string) => SecretItem;
  updateSecret: (characterId: string, secretId: string, updates: Partial<SecretItem>) => void;
  removeSecret: (characterId: string, secretId: string) => void;
  addStateCheckpoint: (characterId: string, checkpointData: Partial<CharacterStateCheckpoint>) => CharacterStateCheckpoint;
  updateStateCheckpoint: (characterId: string, checkpointId: string, updates: Partial<CharacterStateCheckpoint>) => void;
  removeStateCheckpoint: (characterId: string, checkpointId: string) => void;
  addScene: (chapterId: string, sceneData?: Partial<Scene>) => Scene;
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
  deleteScene: (sceneId: string) => void;
  duplicateScene: (sceneId: string) => Scene;
  splitScene: (sceneId: string, contentBefore: string, contentAfter: string, newTitle?: string) => { originalScene: Scene; newScene: Scene };
  mergeScenes: (firstSceneId: string, secondSceneId: string) => Scene;
  reorderScenes: (chapterId: string, orderedSceneIds: string[]) => void;
  addPlotThread: (threadData: Partial<PlotThread>) => PlotThread;
  createThread: (threadData: Partial<PlotThread>) => PlotThread;
  updatePlotThread: (threadId: string, updates: Partial<PlotThread>) => void;
  updateThread: (threadId: string, updates: Partial<PlotThread>) => void;
  deletePlotThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  attachSceneToThread: (threadId: string, sceneId: string) => void;
  detachSceneFromThread: (threadId: string, sceneId: string) => void;
  attachCharacterToThread: (threadId: string, characterId: string) => void;
  detachCharacterFromThread: (threadId: string, characterId: string) => void;
  markThreadStatus: (threadId: string, status: PlotThreadStatus) => void;
  resolveThread: (threadId: string, resolvedInSceneId?: string) => void;
  toggleThreadChapterLink: (threadId: string, chapterId: string) => void;
  toggleThreadSceneLink: (threadId: string, sceneId: string) => void;
  addStoryArc: (arcData: Partial<StoryArc>) => StoryArc;
  updateStoryArc: (arcId: string, updates: Partial<StoryArc>) => void;
  deleteStoryArc: (arcId: string) => void;
  addLocation: (locData: Partial<Location>) => Location;
  updateLocation: (locId: string, updates: Partial<Location>) => void;
  deleteLocation: (locId: string) => void;
  addFaction: (factionData: Partial<Faction>) => Faction;
  updateFaction: (factionId: string, updates: Partial<Faction>) => void;
  deleteFaction: (factionId: string) => void;
  addItem: (itemData: Partial<Item>) => Item;
  updateItem: (itemId: string, updates: Partial<Item>) => void;
  deleteItem: (itemId: string) => void;
  addEvent: (eventData: Partial<Event>) => Event;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  deleteEvent: (eventId: string) => void;
  addResearchNote: (noteData: Partial<ResearchNote>) => ResearchNote;
  updateResearchNote: (noteId: string, updates: Partial<ResearchNote>) => void;
  deleteResearchNote: (noteId: string) => void;

  addStoryBeat: (beat: StoryBeat) => void;
  updateStoryBeat: (id: string, updates: Partial<StoryBeat>) => void;
  deleteStoryBeat: (id: string) => void;
  addAnnotation: (ann: Annotation) => void;
  resolveAnnotation: (id: string) => void;
  deleteAnnotation: (id: string) => void;
  addPartnerMessage: (msg: PartnerMessage) => void;
  updateScratchpad: (content: string) => void;
  setLocalFolderName: (name: string | null) => void;
  loadImportedProject: (project: ProjectData, folderName: string) => void;
  saveActiveChapterToLocalDisk: () => Promise<boolean>;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  toggleFocusMode: () => void;
  setFocusMode: (open: boolean) => void;
  setThemeModalOpen: (open: boolean) => void;
  setCompilerModalOpen: (open: boolean) => void;
  setPresetsModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setOrganizerModalOpen: (open: boolean) => void;
  setAiConfig: (config: AIProviderConfig) => void;
  startSprint: (minutes: number, targetWords?: number) => void;
  stopSprint: () => void;
  resetProjectToDefault: () => void;

  // Continuity Engine Store Actions
  dismissContinuityWarning: (warningId: string) => void;
  markWarningIntentional: (warningId: string, warningTitle: string, type: ContinuityCheckType, reason?: string) => void;
  restoreContinuityWarning: (warningId: string) => void;
  removeIntentionalWarning: (warningId: string) => void;
  updateContinuityConfig: (config: Partial<ContinuityConfig>) => void;

  // Proofreading & Editorial Review Store Actions
  acceptProofreadingFinding: (finding: Finding) => void;
  ignoreProofreadingFinding: (findingId: string) => void;
  markProofreadingFindingIntentional: (findingId: string) => void;
  restoreProofreadingFinding: (findingId: string) => void;
  updateProofreadingConfig: (config: Partial<ProofreadingConfig>) => void;
  addCustomWordToDictionary: (word: string) => void;
  removeCustomWordFromDictionary: (word: string) => void;

  // Revision & Manuscript Review Store Actions
  activeRevisionRoundId: string | null;
  activeRevisionItemId: string | null;
  isRevisionReviewModeOpen: boolean;

  setActiveRevisionRoundId: (id: string | null) => void;
  setActiveRevisionItemId: (id: string | null) => void;
  setIsRevisionReviewModeOpen: (open: boolean) => void;

  addRevisionRound: (data: {
    name: string;
    description?: string;
    passType: RevisionPassType;
    scope?: RevisionScope;
    targetActId?: string;
    targetChapterId?: string;
    targetSceneId?: string;
    notes?: string;
    status?: RevisionRoundStatus;
  }) => RevisionRound;
  updateRevisionRound: (roundId: string, updates: Partial<Omit<RevisionRound, 'id' | 'createdAt'>>) => void;
  deleteRevisionRound: (roundId: string) => void;
  completeRevisionRound: (roundId: string, snapshotLabel?: string) => RevisionSnapshot | undefined;

  addRevisionItem: (data: {
    revisionRoundId?: string;
    title: string;
    description?: string;
    category: RevisionItemCategory;
    priority?: RevisionItemPriority;
    status?: RevisionItemStatus;
    notes?: string;
    actId?: string;
    chapterId?: string;
    sceneId?: string;
    anchoredText?: string;
    anchorOffset?: { from: number; to: number };
    relatedCharacterIds?: string[];
    relatedPlotThreadIds?: string[];
    relatedStoryArcIds?: string[];
    relatedEventIds?: string[];
    sourceContinuityId?: string;
  }) => RevisionItem;
  updateRevisionItem: (itemId: string, updates: Partial<Omit<RevisionItem, 'id' | 'createdAt'>>) => void;
  deleteRevisionItem: (itemId: string) => void;
  resolveRevisionItem: (itemId: string, notes?: string) => void;
  deferRevisionItem: (itemId: string) => void;
  createInlineRevisionNote: (params: {
    chapterId: string;
    sceneId?: string;
    anchoredText: string;
    anchorOffset?: { from: number; to: number };
    title?: string;
    category?: RevisionItemCategory;
    priority?: RevisionItemPriority;
    notes?: string;
    revisionRoundId?: string;
  }) => RevisionItem;
  convertContinuityToRevisionItem: (
    warning: ContinuityWarning,
    overrides?: {
      revisionRoundId?: string;
      priority?: RevisionItemPriority;
      notes?: string;
    }
  ) => RevisionItem;

  // Version History, Snapshots & Recovery Store Actions
  setIsVersionHistoryModalOpen: (open: boolean) => void;
  setActiveCompareSnapshotId: (id: string | null) => void;
  createManualSnapshot: (options?: CreateSnapshotOptions) => ManuscriptSnapshot;
  restoreSnapshotById: (snapshotId: string, options?: SnapshotRestoreOptions) => SnapshotRestoreResult;
  deleteSnapshotById: (snapshotId: string) => void;
  toggleSnapshotPinned: (snapshotId: string) => void;
  compareWithSnapshot: (snapshotId: string) => SnapshotDiffResult | null;
  pruneOldSnapshots: (maxAutoCount?: number) => void;
}

let globalState: ProjectData = StorageService.loadProject();
if (globalState.metadata) {
  globalState.metadata.theme = getPersistedUserTheme();
  globalState.metadata.typography = getPersistedUserTypography();
}
let listeners: Array<() => void> = [];

function emitChange() {
  StorageService.saveProject(globalState);
  listeners.forEach(l => l());
}

let activeChapterId = globalState.acts[0]?.chapters[0]?.id || 'ch-1';
let activeSceneId: string | null = null;
let activeRevisionRoundId: string | null = null;
let activeRevisionItemId: string | null = null;
let isRevisionReviewModeOpen = false;
let inspectorSelectionState: InspectorSelection = { type: 'none' };
let secondaryChapterId = globalState.acts[0]?.chapters[1]?.id || globalState.acts[0]?.chapters[0]?.id || 'ch-2';
let activeTab: WorkspaceTab = 'editor';
let viewMode: ViewMode = 'continuous';
let splitMode: SplitMode = 'none';
let localFolderName: string | null = null;
let sidebarView: 'manuscript' | 'codex' | 'cutdrawer' = 'manuscript';
let smartFilterState: SmartFilter | null = null;
let isSidebarOpen = true;
let isInspectorOpen = true;
let isFocusMode = false;
let isThemeModalOpen = false;
let isCompilerModalOpen = false;
let isPresetsModalOpen = false;
let isSettingsModalOpen = false;
let isOrganizerModalOpen = false;
let isVersionHistoryModalOpen = false;
let activeCompareSnapshotId: string | null = null;

let syncStatusState: SyncStatus = StorageService.hasLocalDirectoryHandle() ? 'synced' : 'offline';
let autoSaveTimeout: any = null;

let sprintState = {
  isActive: false,
  durationMinutes: 15,
  secondsLeft: 15 * 60,
  wordsAtStart: 0,
  targetWords: 500,
};

const STORAGE_AI_CONFIG_KEY = 'swrite_ai_config_pref';

function getInitialAiConfig(): AIProviderConfig {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_AI_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          mode: parsed.mode || 'off',
          provider: parsed.provider || 'gemini',
          localProvider: parsed.localProvider || 'ollama',
          cloudProvider: parsed.cloudProvider || 'gemini',
          apiKey: parsed.apiKey || '',
          model: parsed.model || (parsed.mode === 'local' ? 'llama3' : 'gemini-1.5-pro'),
          baseUrl: parsed.baseUrl || '',
          temperature: parsed.temperature ?? 0.7,
        };
      }
    } catch (e) {}
  }
  return {
    mode: 'off',
    provider: 'gemini',
    localProvider: 'ollama',
    cloudProvider: 'gemini',
    apiKey: '',
    model: 'gemini-1.5-pro',
    baseUrl: '',
    temperature: 0.7,
  };
}

let aiConfigState: AIProviderConfig = getInitialAiConfig();

// Sprint timer ticker
setInterval(() => {
  if (sprintState.isActive && sprintState.secondsLeft > 0) {
    sprintState.secondsLeft -= 1;
    if (sprintState.secondsLeft <= 0) {
      sprintState.isActive = false;
    }
    emitChange();
  }
}, 1000);

export function useSwriteStore(): SwriteState {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const saveActiveChapterToLocalDisk = async (): Promise<boolean> => {
    if (!StorageService.hasLocalDirectoryHandle()) {
      syncStatusState = 'offline';
      emitChange();
      return false;
    }

    let foundCh: Chapter | null = null;
    let foundActTitle = 'Manuscript';

    for (const act of globalState.acts) {
      const ch = act.chapters.find(c => c.id === activeChapterId);
      if (ch) {
        foundCh = ch;
        foundActTitle = act.title;
        break;
      }
    }

    if (!foundCh) return false;

    syncStatusState = 'saving';
    emitChange();

    const success = await StorageService.saveChapterToDisk(foundCh, foundActTitle);
    syncStatusState = success ? 'saved-locally' : 'synced';
    emitChange();
    return success;
  };

  return {
    project: globalState,
    activeChapterId,
    activeSceneId,
    inspectorSelection: inspectorSelectionState,
    activeTab,
    viewMode,
    splitMode,
    secondaryChapterId,
    localFolderName,
    sidebarView,
    smartFilter: smartFilterState,
    syncStatus: syncStatusState,
    isSidebarOpen,
    isInspectorOpen,
    isFocusMode,
    isThemeModalOpen,
    isCompilerModalOpen,
    isPresetsModalOpen,
    isSettingsModalOpen,
    isOrganizerModalOpen,
    isVersionHistoryModalOpen,
    activeCompareSnapshotId,
    activeRevisionRoundId,
    activeRevisionItemId,
    isRevisionReviewModeOpen,
    sprint: sprintState,
    aiConfig: aiConfigState,

    setActiveRevisionRoundId: (id) => {
      activeRevisionRoundId = id;
      emitChange();
    },

    setActiveRevisionItemId: (id) => {
      activeRevisionItemId = id;
      emitChange();
    },

    setIsRevisionReviewModeOpen: (open) => {
      isRevisionReviewModeOpen = open;
      emitChange();
    },

    setInspectorSelection: (selection) => {
      inspectorSelectionState = selection;
      emitChange();
    },

    setActiveSceneId: (id) => {
      activeSceneId = id;
      emitChange();
    },

    setSidebarView: (view) => {
      sidebarView = view;
      emitChange();
    },

    setSmartFilter: (filter) => {
      smartFilterState = filter;
      emitChange();
    },

    setOrganizerModalOpen: (open) => {
      isOrganizerModalOpen = open;
      emitChange();
    },

    deleteChapterToCutDrawer: (id, reason) => {
      const result = OrganizerService.sendChapterToCutDrawer(globalState, id, reason);
      globalState = result.project;
      const firstRemaining = globalState.acts[0]?.chapters[0]?.id;
      if (firstRemaining) {
        activeChapterId = firstRemaining;
      }
      emitChange();
    },

    restoreCutScene: (cutSceneId, targetActId) => {
      const result = OrganizerService.restoreCutScene(globalState, cutSceneId, targetActId);
      globalState = result.project;
      if (result.restoredChapterId) {
        activeChapterId = result.restoredChapterId;
      }
      emitChange();
    },

    deleteCutScenePermanently: (cutSceneId) => {
      if (globalState.cutScenes) {
        globalState.cutScenes = globalState.cutScenes.filter(c => c.id !== cutSceneId);
        emitChange();
      }
    },

    addCodexEntry: (entry) => {
      if (!globalState.codex) globalState.codex = [];
      globalState.codex.push(entry);
      emitChange();
    },

    updateCodexEntry: (id, updates) => {
      if (globalState.codex) {
        globalState.codex = globalState.codex.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e);
        emitChange();
      }
    },

    deleteCodexEntry: (id) => {
      if (globalState.codex) {
        globalState.codex = globalState.codex.filter(e => e.id !== id);
        emitChange();
      }
    },

    runAutoTitleCleanup: () => {
      const { updatedCount, project } = OrganizerService.cleanAndFormatChapterTitles(globalState);
      globalState = project;
      emitChange();
      return updatedCount;
    },

    runSequentialRenumbering: (prefix) => {
      const { totalRenumbered, project } = OrganizerService.sequentialRenumberChapters(globalState, prefix);
      globalState = project;
      emitChange();
      return totalRenumbered;
    },

    runEntityExtraction: () => {
      const { newEntriesCount, project } = OrganizerService.extractEntitiesToCodex(globalState);
      globalState = project;
      emitChange();
      return newEntriesCount;
    },

    runApplyStructurePreset: (preset) => {
      globalState = OrganizerService.applyStructurePreset(globalState, preset);
      if (globalState.acts[0]?.chapters[0]?.id) {
        activeChapterId = globalState.acts[0].chapters[0].id;
      }
      emitChange();
    },

    setActiveTab: (tab) => {
      activeTab = tab;
      emitChange();
    },

    setActiveChapterId: (id) => {
      activeChapterId = id;
      emitChange();
    },

    setSplitMode: (mode) => {
      splitMode = mode;
      emitChange();
    },

    setSecondaryChapterId: (id) => {
      secondaryChapterId = id;
      emitChange();
    },

    setViewMode: (mode) => {
      viewMode = mode;
      emitChange();
    },

    setPreset: (preset) => {
      globalState.metadata.preset = preset;
      if (preset === 'pantser') {
        isSidebarOpen = false;
        isInspectorOpen = false;
      } else if (preset === 'plotter') {
        isSidebarOpen = true;
        isInspectorOpen = true;
      }
      emitChange();
    },

    setTheme: (theme) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('swrite_user_theme_pref', theme.id);
        } catch (e) {}
      }
      globalState.metadata.theme = theme;
      emitChange();
    },

    updateTypography: (typo) => {
      const updated = {
        ...globalState.metadata.typography,
        ...typo,
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('swrite_user_typo_pref', JSON.stringify(updated));
        } catch (e) {}
      }
      globalState.metadata.typography = updated;
      emitChange();
    },

    updateChapterContent: (id, content, wordCount, sceneId) => {
      let targetChapter: Chapter | null = null;
      let actTitle = 'Manuscript';

      for (const act of globalState.acts) {
        const chapter = act.chapters.find(ch => ch.id === id);
        if (!chapter) continue;
        actTitle = act.title;
        const targetScene = sceneId
          ? chapter.scenes?.find(scene => scene.id === sceneId)
          : chapter.scenes?.find(scene => scene.id === activeSceneId);
        if (targetScene) {
          globalState = StoryEngine.updateScene(globalState, targetScene.id, { content, wordCount });
          targetChapter = globalState.acts.flatMap(a => a.chapters).find(ch => ch.id === id) || null;
        } else {
          chapter.content = content;
          chapter.wordCount = wordCount;
          chapter.updatedAt = new Date().toISOString();
          targetChapter = chapter;
        }
        break;
      }

      globalState.metadata.currentWordCount = globalState.acts
        .flatMap(act => act.chapters)
        .reduce((total, chapter) => total + chapter.wordCount, 0);
      globalState.metadata.updatedAt = new Date().toISOString();
      emitChange();

      // Debounced Auto-Save to Local Disk if local directory handle is active
      if (StorageService.hasLocalDirectoryHandle() && targetChapter) {
        syncStatusState = 'saving';
        if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(async () => {
          if (targetChapter) {
            const success = await StorageService.saveChapterToDisk(targetChapter, actTitle);
            syncStatusState = success ? 'saved-locally' : 'synced';
            emitChange();
          }
        }, 1200);
      }
    },

    saveActiveChapterToLocalDisk,

    addCharacterRelationship: (sourceId, targetId, relation, options) => {
      globalState = StoryEngine.setCharacterRelationship(globalState, sourceId, targetId, relation, options);
      emitChange();
    },

    deleteCharacterRelationship: (sourceId, targetId) => {
      globalState = StoryEngine.removeRelationship(globalState, sourceId, targetId);
      emitChange();
    },

    addRelationshipMilestone: (sourceId, targetId, milestone) => {
      globalState = StoryEngine.addRelationshipMilestone(globalState, sourceId, targetId, milestone);
      emitChange();
    },

    updateCharacterState: (characterId, stateData) => {
      globalState = StoryEngine.updateCharacterState(globalState, characterId, stateData);
      emitChange();
    },

    addGoal: (characterId, goalData) => {
      const result = StoryEngine.addGoal(globalState, characterId, goalData);
      globalState = result.project;
      emitChange();
      return result.goal;
    },

    updateGoal: (characterId, goalId, updates) => {
      globalState = StoryEngine.updateGoal(globalState, characterId, goalId, updates);
      emitChange();
    },

    removeGoal: (characterId, goalId) => {
      globalState = StoryEngine.removeGoal(globalState, characterId, goalId);
      emitChange();
    },

    setGoalStatus: (characterId, goalId, status) => {
      globalState = StoryEngine.setGoalStatus(globalState, characterId, goalId, status);
      emitChange();
    },

    addBelief: (characterId, beliefData) => {
      const result = StoryEngine.addBelief(globalState, characterId, beliefData);
      globalState = result.project;
      emitChange();
      return result.belief;
    },

    updateBelief: (characterId, beliefId, updates) => {
      globalState = StoryEngine.updateBelief(globalState, characterId, beliefId, updates);
      emitChange();
    },

    removeBelief: (characterId, beliefId) => {
      globalState = StoryEngine.removeBelief(globalState, characterId, beliefId);
      emitChange();
    },

    addCharacterKnowledge: (characterId, entry) => {
      const result = StoryEngine.addCharacterKnowledge(globalState, characterId, entry);
      globalState = result.project;
      emitChange();
      return result.knowledge;
    },

    addKnowledge: (characterId, entry) => {
      const result = StoryEngine.addCharacterKnowledge(globalState, characterId, entry);
      globalState = result.project;
      emitChange();
      return result.knowledge;
    },

    updateCharacterKnowledge: (characterId, knowledgeId, updates) => {
      globalState = StoryEngine.updateCharacterKnowledge(globalState, characterId, knowledgeId, updates);
      emitChange();
    },

    updateKnowledge: (characterId, knowledgeId, updates) => {
      globalState = StoryEngine.updateCharacterKnowledge(globalState, characterId, knowledgeId, updates);
      emitChange();
    },

    deleteCharacterKnowledge: (characterId, knowledgeId) => {
      globalState = StoryEngine.deleteCharacterKnowledge(globalState, characterId, knowledgeId);
      emitChange();
    },

    removeKnowledge: (characterId, knowledgeId) => {
      globalState = StoryEngine.deleteCharacterKnowledge(globalState, characterId, knowledgeId);
      emitChange();
    },

    addSecret: (characterId, secretData) => {
      const result = StoryEngine.addSecret(globalState, characterId, secretData);
      globalState = result.project;
      emitChange();
      return result.secret;
    },

    updateSecret: (characterId, secretId, updates) => {
      globalState = StoryEngine.updateSecret(globalState, characterId, secretId, updates);
      emitChange();
    },

    removeSecret: (characterId, secretId) => {
      globalState = StoryEngine.removeSecret(globalState, characterId, secretId);
      emitChange();
    },

    addStateCheckpoint: (characterId, checkpointData) => {
      const result = StoryEngine.addStateCheckpoint(globalState, characterId, checkpointData);
      globalState = result.project;
      emitChange();
      return result.checkpoint;
    },

    updateStateCheckpoint: (characterId, checkpointId, updates) => {
      globalState = StoryEngine.updateStateCheckpoint(globalState, characterId, checkpointId, updates);
      emitChange();
    },

    removeStateCheckpoint: (characterId, checkpointId) => {
      globalState = StoryEngine.removeStateCheckpoint(globalState, characterId, checkpointId);
      emitChange();
    },

    addNewChapter: (actId, title) => {
      const targetAct = actId 
        ? globalState.acts.find(a => a.id === actId) || globalState.acts[0]
        : globalState.acts[0];

      const chapterCount = globalState.acts.reduce((acc, a) => acc + a.chapters.length, 0);
      const newChId = `ch-${Date.now()}`;
      const newChapter: Chapter = {
        id: newChId,
        title: title || `Chapter ${chapterCount + 1}`,
        order: (targetAct?.chapters.length || 0) + 1,
        actId: targetAct?.id,
        content: `<h1>${title || `Chapter ${chapterCount + 1}`}</h1><p></p>`,
        wordCount: 0,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      };

      if (targetAct) {
        targetAct.chapters.push(newChapter);
      } else {
        globalState.acts.push({
          id: `act-${Date.now()}`,
          title: 'Act I',
          order: 1,
          chapters: [newChapter]
        });
      }

      activeChapterId = newChId;
      emitChange();
      return newChId;
    },

    deleteChapter: (id) => {
      globalState.acts.forEach(act => {
        act.chapters = act.chapters.filter(ch => ch.id !== id);
      });
      const firstRemaining = globalState.acts[0]?.chapters[0]?.id;
      if (firstRemaining) {
        activeChapterId = firstRemaining;
      }
      emitChange();
    },

    updateChapterMetadata: (id, updates) => {
      globalState.acts.forEach(act => {
        act.chapters.forEach(ch => {
          if (ch.id === id) {
            Object.assign(ch, updates);
          }
        });
      });
      emitChange();
    },

    addNewAct: (title) => {
      const actCount = globalState.acts.length;
      const newActId = `act-${Date.now()}`;
      const newAct: Act = {
        id: newActId,
        title: title || `Folder / Section ${actCount + 1}`,
        order: actCount + 1,
        chapters: []
      };
      globalState.acts.push(newAct);
      emitChange();
      return newActId;
    },

    updateActTitle: (actId, title) => {
      const act = globalState.acts.find(a => a.id === actId);
      if (act && title.trim()) {
        act.title = title.trim();
        emitChange();
      }
    },

    deleteAct: (actId) => {
      // Move any chapters in this act to the first act before deleting
      const actToDelete = globalState.acts.find(a => a.id === actId);
      if (actToDelete) {
        const remainingActs = globalState.acts.filter(a => a.id !== actId);
        if (remainingActs.length > 0 && actToDelete.chapters.length > 0) {
          actToDelete.chapters.forEach(ch => {
            ch.actId = remainingActs[0].id;
            remainingActs[0].chapters.push(ch);
          });
        }
        globalState.acts = remainingActs.length > 0 ? remainingActs : [{
          id: `act-${Date.now()}`,
          title: 'Manuscript',
          order: 1,
          chapters: []
        }];
        emitChange();
      }
    },

    moveChapterToAct: (chapterId, targetActId) => {
      let targetChapter: Chapter | null = null;
      globalState.acts.forEach(act => {
        const idx = act.chapters.findIndex(c => c.id === chapterId);
        if (idx !== -1) {
          targetChapter = act.chapters.splice(idx, 1)[0];
        }
      });

      if (targetChapter) {
        const targetAct = globalState.acts.find(a => a.id === targetActId) || globalState.acts[0];
        if (targetAct) {
          (targetChapter as Chapter).actId = targetAct.id;
          targetAct.chapters.push(targetChapter);
          targetAct.chapters.forEach((ch, i) => { ch.order = i + 1; });
          emitChange();
        }
      }
    },

    reorderChapter: (sourceChapterId, targetActId, targetIndex) => {
      let targetChapter: Chapter | null = null;
      globalState.acts.forEach(act => {
        const idx = act.chapters.findIndex(c => c.id === sourceChapterId);
        if (idx !== -1) {
          targetChapter = act.chapters.splice(idx, 1)[0];
        }
      });

      if (targetChapter) {
        const targetAct = globalState.acts.find(a => a.id === targetActId) || globalState.acts[0];
        if (targetAct) {
          (targetChapter as Chapter).actId = targetAct.id;
          if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= targetAct.chapters.length) {
            targetAct.chapters.splice(targetIndex, 0, targetChapter);
          } else {
            targetAct.chapters.push(targetChapter);
          }
          targetAct.chapters.forEach((ch, i) => { ch.order = i + 1; });
          emitChange();
        }
      }
    },

    reorderActs: (sourceIndex, targetIndex) => {
      if (
        sourceIndex < 0 || 
        sourceIndex >= globalState.acts.length || 
        targetIndex < 0 || 
        targetIndex >= globalState.acts.length ||
        sourceIndex === targetIndex
      ) {
        return;
      }
      const [movedAct] = globalState.acts.splice(sourceIndex, 1);
      globalState.acts.splice(targetIndex, 0, movedAct);
      globalState.acts.forEach((act, i) => {
        act.order = i + 1;
      });
      emitChange();
    },

    // Story Engine Domain Actions
    addScene: (chapterId, sceneData) => {
      const result = StoryEngine.addScene(globalState, chapterId, sceneData);
      globalState = result.project;
      emitChange();
      return result.scene;
    },

    updateScene: (sceneId, updates) => {
      globalState = StoryEngine.updateScene(globalState, sceneId, updates);
      emitChange();
    },

    deleteScene: (sceneId) => {
      globalState = StoryEngine.deleteScene(globalState, sceneId);
      emitChange();
    },

    duplicateScene: (sceneId) => {
      const result = StoryEngine.duplicateScene(globalState, sceneId);
      globalState = result.project;
      emitChange();
      return result.scene;
    },

    splitScene: (sceneId, contentBefore, contentAfter, newTitle) => {
      const result = StoryEngine.splitScene(globalState, sceneId, contentBefore, contentAfter, newTitle);
      globalState = result.project;
      emitChange();
      return { originalScene: result.originalScene, newScene: result.newScene };
    },

    mergeScenes: (firstSceneId, secondSceneId) => {
      const result = StoryEngine.mergeScenes(globalState, firstSceneId, secondSceneId);
      globalState = result.project;
      emitChange();
      return result.mergedScene;
    },

    reorderScenes: (chapterId, orderedSceneIds) => {
      globalState = StoryEngine.reorderScenes(globalState, chapterId, orderedSceneIds);
      emitChange();
    },

    addPlotThread: (threadData) => {
      const result = StoryEngine.addPlotThread(globalState, threadData);
      globalState = result.project;
      emitChange();
      return result.thread;
    },

    createThread: (threadData) => {
      const result = StoryEngine.addPlotThread(globalState, threadData);
      globalState = result.project;
      emitChange();
      return result.thread;
    },

    updatePlotThread: (threadId, updates) => {
      globalState = StoryEngine.updatePlotThread(globalState, threadId, updates);
      emitChange();
    },

    updateThread: (threadId, updates) => {
      globalState = StoryEngine.updatePlotThread(globalState, threadId, updates);
      emitChange();
    },

    deletePlotThread: (threadId) => {
      globalState = StoryEngine.deletePlotThread(globalState, threadId);
      emitChange();
    },

    deleteThread: (threadId) => {
      globalState = StoryEngine.deletePlotThread(globalState, threadId);
      emitChange();
    },

    attachSceneToThread: (threadId, sceneId) => {
      globalState = StoryEngine.attachSceneToThread(globalState, threadId, sceneId);
      emitChange();
    },

    detachSceneFromThread: (threadId, sceneId) => {
      globalState = StoryEngine.detachSceneFromThread(globalState, threadId, sceneId);
      emitChange();
    },

    attachCharacterToThread: (threadId, characterId) => {
      globalState = StoryEngine.attachCharacterToThread(globalState, threadId, characterId);
      emitChange();
    },

    detachCharacterFromThread: (threadId, characterId) => {
      globalState = StoryEngine.detachCharacterFromThread(globalState, threadId, characterId);
      emitChange();
    },

    markThreadStatus: (threadId, status) => {
      globalState = StoryEngine.markThreadStatus(globalState, threadId, status);
      emitChange();
    },

    resolveThread: (threadId, resolvedInSceneId) => {
      globalState = StoryEngine.resolveThread(globalState, threadId, resolvedInSceneId);
      emitChange();
    },

    toggleThreadChapterLink: (threadId, chapterId) => {
      globalState = StoryEngine.toggleThreadChapterLink(globalState, threadId, chapterId);
      emitChange();
    },

    toggleThreadSceneLink: (threadId, sceneId) => {
      globalState = StoryEngine.toggleThreadSceneLink(globalState, threadId, sceneId);
      emitChange();
    },

    addStoryArc: (arcData) => {
      const result = StoryEngine.addStoryArc(globalState, arcData);
      globalState = result.project;
      emitChange();
      return result.arc;
    },

    updateStoryArc: (arcId, updates) => {
      globalState = StoryEngine.updateStoryArc(globalState, arcId, updates);
      emitChange();
    },

    deleteStoryArc: (arcId) => {
      globalState = StoryEngine.deleteStoryArc(globalState, arcId);
      emitChange();
    },

    addLocation: (locData) => {
      const result = StoryEngine.addLocation(globalState, locData);
      globalState = result.project;
      emitChange();
      return result.location;
    },

    updateLocation: (locId, updates) => {
      globalState = StoryEngine.updateLocation(globalState, locId, updates);
      emitChange();
    },

    deleteLocation: (locId) => {
      globalState = StoryEngine.deleteLocation(globalState, locId);
      emitChange();
    },

    addFaction: (factionData) => {
      const result = StoryEngine.addFaction(globalState, factionData);
      globalState = result.project;
      emitChange();
      return result.faction;
    },

    updateFaction: (factionId, updates) => {
      globalState = StoryEngine.updateFaction(globalState, factionId, updates);
      emitChange();
    },

    deleteFaction: (factionId) => {
      globalState = StoryEngine.deleteFaction(globalState, factionId);
      emitChange();
    },

    addItem: (itemData) => {
      const result = StoryEngine.addItem(globalState, itemData);
      globalState = result.project;
      emitChange();
      return result.item;
    },

    updateItem: (itemId, updates) => {
      globalState = StoryEngine.updateItem(globalState, itemId, updates);
      emitChange();
    },

    deleteItem: (itemId) => {
      globalState = StoryEngine.deleteItem(globalState, itemId);
      emitChange();
    },

    addEvent: (eventData) => {
      const result = StoryEngine.addEvent(globalState, eventData);
      globalState = result.project;
      emitChange();
      return result.event;
    },

    updateEvent: (eventId, updates) => {
      globalState = StoryEngine.updateEvent(globalState, eventId, updates);
      emitChange();
    },

    deleteEvent: (eventId) => {
      globalState = StoryEngine.deleteEvent(globalState, eventId);
      emitChange();
    },

    addResearchNote: (noteData) => {
      const result = StoryEngine.addResearchNote(globalState, noteData);
      globalState = result.project;
      emitChange();
      return result.note;
    },

    updateResearchNote: (noteId, updates) => {
      globalState = StoryEngine.updateResearchNote(globalState, noteId, updates);
      emitChange();
    },

    deleteResearchNote: (noteId) => {
      globalState = StoryEngine.deleteResearchNote(globalState, noteId);
      emitChange();
    },

    addCharacter: (character) => {
      globalState = StoryEngine.addCharacter(globalState, character).project;
      emitChange();
    },

    updateCharacter: (id, updates) => {
      globalState = StoryEngine.updateCharacter(globalState, id, updates);
      emitChange();
    },

    deleteCharacter: (id) => {
      globalState = StoryEngine.deleteCharacter(globalState, id);
      emitChange();
    },

    addStoryBeat: (beat) => {
      globalState.timeline.push(beat);
      emitChange();
    },

    updateStoryBeat: (id, updates) => {
      globalState.timeline = globalState.timeline.map(b => 
        b.id === id ? { ...b, ...updates } : b
      );
      emitChange();
    },

    deleteStoryBeat: (id) => {
      globalState.timeline = globalState.timeline.filter(b => b.id !== id);
      emitChange();
    },

    addAnnotation: (ann) => {
      globalState.annotations.push(ann);
      emitChange();
    },

    resolveAnnotation: (id) => {
      globalState.annotations = globalState.annotations.map(a => 
        a.id === id ? { ...a, resolved: !a.resolved } : a
      );
      emitChange();
    },

    deleteAnnotation: (id) => {
      globalState.annotations = globalState.annotations.filter(a => a.id !== id);
      emitChange();
    },

    addPartnerMessage: (msg) => {
      globalState.partnerMessages.push(msg);
      emitChange();
    },

    updateScratchpad: (content) => {
      globalState.scratchpad = content;
      emitChange();
    },

    setLocalFolderName: (name) => {
      localFolderName = name;
      emitChange();
    },

    loadImportedProject: (newProj, folderName) => {
      newProj.metadata.theme = getPersistedUserTheme();
      newProj.metadata.typography = getPersistedUserTypography();
      globalState = newProj;
      localFolderName = folderName;
      activeChapterId = newProj.acts[0]?.chapters[0]?.id || '';
      activeTab = 'editor';
      emitChange();
    },

    toggleSidebar: () => {
      isSidebarOpen = !isSidebarOpen;
      emitChange();
    },

    toggleInspector: () => {
      isInspectorOpen = !isInspectorOpen;
      emitChange();
    },

    toggleFocusMode: () => {
      isFocusMode = !isFocusMode;
      emitChange();
    },

    setFocusMode: (open: boolean) => {
      isFocusMode = open;
      emitChange();
    },

    setThemeModalOpen: (open) => {
      isThemeModalOpen = open;
      emitChange();
    },

    setCompilerModalOpen: (open) => {
      isCompilerModalOpen = open;
      emitChange();
    },

    setPresetsModalOpen: (open) => {
      isPresetsModalOpen = open;
      emitChange();
    },

    setSettingsModalOpen: (open) => {
      isSettingsModalOpen = open;
      emitChange();
    },

    setAiConfig: (config) => {
      aiConfigState = config;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_AI_CONFIG_KEY, JSON.stringify(config));
        } catch (e) {}
      }
      emitChange();
    },

    startSprint: (minutes, targetWords = 500) => {
      let currentTotalWords = 0;
      globalState.acts.forEach(a => a.chapters.forEach(c => { currentTotalWords += c.wordCount; }));
      sprintState = {
        isActive: true,
        durationMinutes: minutes,
        secondsLeft: minutes * 60,
        wordsAtStart: currentTotalWords,
        targetWords,
      };
      emitChange();
    },

    stopSprint: () => {
      sprintState.isActive = false;
      emitChange();
    },

    resetProjectToDefault: () => {
      globalState = JSON.parse(JSON.stringify(INITIAL_NOVEL_DATA));
      globalState.metadata.theme = getPersistedUserTheme();
      globalState.metadata.typography = getPersistedUserTypography();
      activeChapterId = globalState.acts[0]?.chapters[0]?.id || 'ch-style-guide';
      emitChange();
    },

    // Continuity Actions
    dismissContinuityWarning: (warningId: string) => {
      const cfg = globalState.metadata.continuityConfig || JSON.parse(JSON.stringify(DEFAULT_CONTINUITY_CONFIG));
      const ignored = new Set(cfg.ignoredWarningIds || []);
      ignored.add(warningId);
      cfg.ignoredWarningIds = Array.from(ignored);
      globalState.metadata.continuityConfig = cfg;
      emitChange();
    },

    markWarningIntentional: (warningId: string, warningTitle: string, type: ContinuityCheckType, reason?: string) => {
      const cfg = globalState.metadata.continuityConfig || JSON.parse(JSON.stringify(DEFAULT_CONTINUITY_CONFIG));
      const existing: IntentionalChoiceRecord[] = cfg.intentionalWarnings || [];
      const filtered = existing.filter((w: IntentionalChoiceRecord) => w.warningId !== warningId);
      filtered.push({
        id: `intent-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        warningId,
        warningTitle,
        type,
        reason: reason?.trim(),
        markedAt: new Date().toISOString(),
      });
      cfg.intentionalWarnings = filtered;
      globalState.metadata.continuityConfig = cfg;
      emitChange();
    },

    restoreContinuityWarning: (warningId: string) => {
      if (!globalState.metadata.continuityConfig) return;
      globalState.metadata.continuityConfig.ignoredWarningIds = (
        globalState.metadata.continuityConfig.ignoredWarningIds || []
      ).filter(id => id !== warningId);
      emitChange();
    },

    removeIntentionalWarning: (warningId: string) => {
      if (!globalState.metadata.continuityConfig) return;
      globalState.metadata.continuityConfig.intentionalWarnings = (
        globalState.metadata.continuityConfig.intentionalWarnings || []
      ).filter(w => w.warningId !== warningId && w.id !== warningId);
      emitChange();
    },

    updateContinuityConfig: (configUpdates: Partial<ContinuityConfig>) => {
      const current = globalState.metadata.continuityConfig || DEFAULT_CONTINUITY_CONFIG;
      globalState.metadata.continuityConfig = {
        threadDormancyChapterThreshold: configUpdates.threadDormancyChapterThreshold ?? current.threadDormancyChapterThreshold,
        ignoredWarningIds: configUpdates.ignoredWarningIds ?? current.ignoredWarningIds,
        intentionalWarnings: configUpdates.intentionalWarnings ?? current.intentionalWarnings,
        enabledChecks: {
          ...current.enabledChecks,
          ...(configUpdates.enabledChecks || {}),
        }
      };
      emitChange();
    },

    // Proofreading & Editorial Review Implementations
    acceptProofreadingFinding: (finding: Finding) => {
      globalState = ProofreadingEngine.acceptFinding(globalState, finding);
      emitChange();
    },

    ignoreProofreadingFinding: (findingId: string) => {
      globalState = ProofreadingEngine.ignoreFinding(globalState, findingId);
      emitChange();
    },

    markProofreadingFindingIntentional: (findingId: string) => {
      globalState = ProofreadingEngine.markFindingIntentional(globalState, findingId);
      emitChange();
    },

    restoreProofreadingFinding: (findingId: string) => {
      if (!globalState.metadata.proofreadingConfig) return;
      const cfg = globalState.metadata.proofreadingConfig;
      cfg.ignoredFindingIds = (cfg.ignoredFindingIds || []).filter((id: string) => id !== findingId);
      cfg.intentionalFindingIds = (cfg.intentionalFindingIds || []).filter((id: string) => id !== findingId);
      globalState.metadata.proofreadingConfig = cfg;
      emitChange();
    },

    updateProofreadingConfig: (configUpdates: Partial<ProofreadingConfig>) => {
      const current = globalState.metadata.proofreadingConfig || DEFAULT_PROOFREADING_CONFIG;
      globalState.metadata.proofreadingConfig = {
        preserveVoice: configUpdates.preserveVoice ?? current.preserveVoice ?? true,
        scope: configUpdates.scope ?? current.scope ?? 'scene',
        activePasses: {
          ...current.activePasses,
          ...(configUpdates.activePasses || {}),
        },
        ignoredFindingIds: configUpdates.ignoredFindingIds ?? current.ignoredFindingIds ?? [],
        intentionalFindingIds: configUpdates.intentionalFindingIds ?? current.intentionalFindingIds ?? [],
        acceptedFindingIds: configUpdates.acceptedFindingIds ?? current.acceptedFindingIds ?? [],
        customDictionary: configUpdates.customDictionary ?? current.customDictionary ?? [],
      };
      emitChange();
    },

    addCustomWordToDictionary: (word: string) => {
      if (!word.trim()) return;
      const current = globalState.metadata.proofreadingConfig || DEFAULT_PROOFREADING_CONFIG;
      const dict = new Set(current.customDictionary || []);
      dict.add(word.trim().toLowerCase());
      globalState.metadata.proofreadingConfig = {
        ...current,
        customDictionary: Array.from(dict),
      };
      emitChange();
    },

    removeCustomWordFromDictionary: (word: string) => {
      if (!globalState.metadata.proofreadingConfig) return;
      const current = globalState.metadata.proofreadingConfig;
      const lower = word.trim().toLowerCase();
      globalState.metadata.proofreadingConfig = {
        ...current,
        customDictionary: (current.customDictionary || []).filter((w: string) => w.toLowerCase() !== lower),
      };
      emitChange();
    },

    // Revision & Manuscript Review Implementations
    addRevisionRound: (data) => {
      const { project, round } = RevisionEngine.addRevisionRound(globalState, data);
      globalState = project;
      activeRevisionRoundId = round.id;
      emitChange();
      return round;
    },

    updateRevisionRound: (roundId, updates) => {
      globalState = RevisionEngine.updateRevisionRound(globalState, roundId, updates);
      emitChange();
    },

    deleteRevisionRound: (roundId) => {
      globalState = RevisionEngine.deleteRevisionRound(globalState, roundId);
      if (activeRevisionRoundId === roundId) {
        activeRevisionRoundId = null;
      }
      emitChange();
    },

    completeRevisionRound: (roundId, snapshotLabel) => {
      const { project, snapshot } = RevisionEngine.completeRevisionRound(globalState, roundId, snapshotLabel);
      globalState = project;
      emitChange();
      return snapshot;
    },

    addRevisionItem: (data) => {
      const { project, item } = RevisionEngine.addRevisionItem(globalState, data);
      globalState = project;
      emitChange();
      return item;
    },

    updateRevisionItem: (itemId, updates) => {
      globalState = RevisionEngine.updateRevisionItem(globalState, itemId, updates);
      emitChange();
    },

    deleteRevisionItem: (itemId) => {
      globalState = RevisionEngine.deleteRevisionItem(globalState, itemId);
      if (activeRevisionItemId === itemId) {
        activeRevisionItemId = null;
      }
      emitChange();
    },

    resolveRevisionItem: (itemId, notes) => {
      globalState = RevisionEngine.resolveRevisionItem(globalState, itemId, notes);
      emitChange();
    },

    deferRevisionItem: (itemId) => {
      globalState = RevisionEngine.deferRevisionItem(globalState, itemId);
      emitChange();
    },

    createInlineRevisionNote: (params) => {
      const { project, item } = RevisionEngine.createInlineRevisionNote(globalState, params);
      globalState = project;
      emitChange();
      return item;
    },

    convertContinuityToRevisionItem: (warning, overrides) => {
      const { project, item } = RevisionEngine.convertContinuityWarningToRevisionItem(globalState, warning, overrides);
      globalState = project;
      emitChange();
      return item;
    },

    // Version History, Snapshots & Recovery Actions
    setIsVersionHistoryModalOpen: (open: boolean) => {
      isVersionHistoryModalOpen = open;
      emitChange();
    },

    setActiveCompareSnapshotId: (id: string | null) => {
      activeCompareSnapshotId = id;
      emitChange();
    },

    createManualSnapshot: (options?: CreateSnapshotOptions) => {
      const snap = createSnapshot(globalState, {
        label: options?.label || `Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        description: options?.description,
        type: options?.type || 'manual',
        source: options?.source || 'user',
        scope: options?.scope || 'manuscript',
        targetChapterId: options?.targetChapterId,
        targetSceneId: options?.targetSceneId,
        pinned: options?.pinned
      });

      const currentSnaps = globalState.snapshots || [];
      const updatedSnaps = pruneAutoSnapshots([snap, ...currentSnaps]);

      globalState = {
        ...globalState,
        snapshots: updatedSnaps
      };
      emitChange();
      return snap;
    },

    restoreSnapshotById: (snapshotId: string, options?: SnapshotRestoreOptions) => {
      const snap = (globalState.snapshots || []).find(s => s.id === snapshotId);
      if (!snap) {
        throw new Error(`Snapshot with id "${snapshotId}" was not found.`);
      }

      const result = restoreSnapshot(globalState, snap, options);
      globalState = result.restoredProject;
      emitChange();
      return result;
    },

    deleteSnapshotById: (snapshotId: string) => {
      globalState = {
        ...globalState,
        snapshots: (globalState.snapshots || []).filter(s => s.id !== snapshotId)
      };
      if (activeCompareSnapshotId === snapshotId) {
        activeCompareSnapshotId = null;
      }
      emitChange();
    },

    toggleSnapshotPinned: (snapshotId: string) => {
      globalState = {
        ...globalState,
        snapshots: (globalState.snapshots || []).map(s => {
          if (s.id === snapshotId) {
            return { ...s, pinned: !s.pinned };
          }
          return s;
        })
      };
      emitChange();
    },

    compareWithSnapshot: (snapshotId: string) => {
      const snap = (globalState.snapshots || []).find(s => s.id === snapshotId);
      if (!snap) return null;
      return compareProjects(
        snap.projectData,
        globalState,
        `Snapshot: ${snap.label}`,
        'Current Manuscript',
        snap.id,
        'current'
      );
    },

    pruneOldSnapshots: (maxAutoCount: number = 20) => {
      if (!globalState.snapshots || globalState.snapshots.length === 0) return;
      const pruned = pruneAutoSnapshots(globalState.snapshots, maxAutoCount);
      globalState = {
        ...globalState,
        snapshots: pruned
      };
      emitChange();
    }
  };
}
