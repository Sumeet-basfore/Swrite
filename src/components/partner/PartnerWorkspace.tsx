import React, { useState, useEffect } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { WritingPartnerService } from '../../services/aiPartnerService';
import { 
  Character, StoryBeat, PartnerMessage, WritingPartnerMode, 
  AIAssistanceMode, StructuredPartnerContext 
} from '../../types';
import { 
  Users, GitBranch, Lightbulb, Send, Plus, Trash2, 
  Key, MessageSquare, Copy, Check, RefreshCw, Cpu,
  Sliders, ChevronDown, Compass, ShieldAlert,
  Search, BookOpen, Layers, Info, CheckCircle2, Cloud, PowerOff,
  Flame, HelpCircle, FileText, ArrowRight, ShieldCheck, Edit3
} from 'lucide-react';

export const PartnerWorkspace: React.FC = () => {
  const { 
    project, activeChapterId, activeSceneId, addPartnerMessage, addCharacter, updateCharacter, deleteCharacter,
    addStoryBeat, updateStoryBeat, deleteStoryBeat, updateScratchpad, aiConfig, setAiConfig
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const activeChapter = project.acts
    .flatMap(a => a.chapters)
    .find(c => c.id === activeChapterId) || project.acts[0]?.chapters[0];

  const [activePartnerTab, setActivePartnerTab] = useState<'chat' | 'context' | 'characters' | 'timeline' | 'scratchpad'>('chat');
  const [partnerMode, setPartnerMode] = useState<WritingPartnerMode>('discussion');
  
  // Chat state
  const [userInput, setUserInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isDetectingOllama, setIsDetectingOllama] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // New character modal
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [newChar, setNewChar] = useState<Partial<Character>>({
    name: '',
    role: 'Supporting',
    archetype: '',
    bio: '',
    motivations: '',
    flaws: '',
    secrets: '',
    voiceNotes: '',
    color: '#71717A'
  });

  // New Beat modal
  const [isBeatModalOpen, setIsBeatModalOpen] = useState(false);
  const [newBeat, setNewBeat] = useState<Partial<StoryBeat>>({
    title: '',
    act: 'Act I',
    beatType: 'Hook',
    description: '',
    tensionLevel: 5,
    status: 'todo'
  });

  // Live Structured Context calculation
  const structuredContext: StructuredPartnerContext = WritingPartnerService.buildStructuredContext(
    project, 
    activeChapterId, 
    activeSceneId
  );

  // Auto-detect Ollama models when in local mode
  const handleDetectOllama = async () => {
    setIsDetectingOllama(true);
    const endpoint = aiConfig.baseUrl || 'http://localhost:11434';
    const models = await WritingPartnerService.fetchOllamaModels(endpoint);
    setOllamaModels(models);
    setIsDetectingOllama(false);
    if (models.length > 0 && !models.includes(aiConfig.model)) {
      setAiConfig({ ...aiConfig, model: models[0] });
    }
  };

  useEffect(() => {
    if (aiConfig.mode === 'local' && aiConfig.localProvider === 'ollama' && ollamaModels.length === 0) {
      handleDetectOllama();
    }
  }, [aiConfig.mode, aiConfig.localProvider]);

  const handleModeSwitch = (mode: AIAssistanceMode) => {
    setAiConfig({
      ...aiConfig,
      mode,
    });
  };

  const handleSendMessage = async (promptOverride?: string, selectedModeOverride?: WritingPartnerMode) => {
    const textToSend = promptOverride || userInput;
    if (!textToSend.trim() || isAiThinking) return;

    const currentActiveMode = selectedModeOverride || partnerMode;

    const userMsg: PartnerMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
      mode: currentActiveMode,
      contextAttached: {
        chapterId: activeChapter?.id,
        sceneId: activeSceneId || undefined,
        characterIds: structuredContext.involvedCharacters.map(c => c.id),
        plotThreadIds: structuredContext.activePlotThreads.map(t => t.id),
      }
    };

    addPartnerMessage(userMsg);
    if (!promptOverride) setUserInput('');
    setIsAiThinking(true);

    try {
      const messagesForService = [...project.partnerMessages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await WritingPartnerService.queryPartner(
        aiConfig,
        messagesForService,
        project,
        activeChapter?.id,
        activeSceneId,
        currentActiveMode
      );

      const assistantMsg: PartnerMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        mode: currentActiveMode,
      };

      addPartnerMessage(assistantMsg);
    } catch (err) {
      console.error('Failed to get writing partner response:', err);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 1500);
  };

  const handleSaveToScratchpad = (text: string) => {
    const updated = (project.scratchpad || '') + `\n\n### Partner Note (${new Date().toLocaleDateString()})\n${text}`;
    updateScratchpad(updated);
    setActionFeedback('Saved to Writer’s Scratchpad');
    setTimeout(() => setActionFeedback(null), 2000);
  };

  const handleSaveCharacter = () => {
    if (!newChar.name?.trim()) return;
    addCharacter({
      id: `char-${Date.now()}`,
      name: newChar.name,
      role: newChar.role as any || 'Supporting',
      archetype: newChar.archetype || '',
      bio: newChar.bio || '',
      motivations: newChar.motivations || '',
      flaws: newChar.flaws || '',
      secrets: newChar.secrets || '',
      voiceNotes: newChar.voiceNotes || '',
      color: newChar.color || '#71717A'
    });
    setNewChar({ name: '', role: 'Supporting', archetype: '', bio: '', motivations: '', flaws: '', secrets: '', voiceNotes: '', color: '#71717A' });
    setIsCharModalOpen(false);
  };

  const handleSaveBeat = () => {
    if (!newBeat.title?.trim()) return;
    addStoryBeat({
      id: `beat-${Date.now()}`,
      title: newBeat.title,
      act: newBeat.act as any || 'Act I',
      beatType: newBeat.beatType as any || 'Hook',
      description: newBeat.description || '',
      tensionLevel: Number(newBeat.tensionLevel) || 5,
      status: 'todo',
      targetChapterId: activeChapter?.id
    });
    setNewBeat({ title: '', act: 'Act I', beatType: 'Hook', description: '', tensionLevel: 5, status: 'todo' });
    setIsBeatModalOpen(false);
  };

  const partnerModesList: Array<{ id: WritingPartnerMode; label: string; icon: any; desc: string }> = [
    { id: 'discussion', label: 'Story Discussion', icon: MessageSquare, desc: 'Craft sounding board, psychology & theme' },
    { id: 'brainstorm', label: 'Brainstorming', icon: Lightbulb, desc: 'Explore "what if" & scene alternatives' },
    { id: 'critique', label: 'Craft Critique', icon: Search, desc: 'Constructive literary critique & tension analysis' },
    { id: 'continuity', label: 'Continuity', icon: ShieldCheck, desc: 'Investigate timeline & knowledge consistency' },
    { id: 'structure', label: 'Structure & Pacing', icon: Layers, desc: 'Scene beats, Goal-Conflict-Disaster arc' },
    { id: 'research', label: 'World & Lore', icon: BookOpen, desc: 'Worldbuilding consistency & codex synthesis' },
  ];

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden select-none text-xs"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Calm Header Tabs & AI Assistance Mode Switcher */}
      <div 
        className="flex items-center justify-between px-6 py-2.5 border-b shrink-0 flex-wrap gap-2"
        style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
      >
        <div className="flex items-center space-x-1 overflow-x-auto">
          <button
            onClick={() => setActivePartnerTab('chat')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1.5 ${
              activePartnerTab === 'chat' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Consultation</span>
          </button>

          <button
            onClick={() => setActivePartnerTab('context')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1.5 ${
              activePartnerTab === 'context' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Inspect structured Story Engine context prepared for Writing Partner"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Story Context</span>
          </button>

          <button
            onClick={() => setActivePartnerTab('characters')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activePartnerTab === 'characters' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Characters ({project.characters.length})
          </button>

          <button
            onClick={() => setActivePartnerTab('timeline')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activePartnerTab === 'timeline' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Plot Outline ({project.timeline.length})
          </button>

          <button
            onClick={() => setActivePartnerTab('scratchpad')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activePartnerTab === 'scratchpad' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Scratchpad
          </button>
        </div>

        {/* AI Assistance Mode Switcher */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5">
            <button
              onClick={() => handleModeSwitch('off')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                aiConfig.mode === 'off'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              OFF
            </button>

            <button
              onClick={() => handleModeSwitch('local')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                aiConfig.mode === 'local'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              LOCAL
            </button>

            <button
              onClick={() => handleModeSwitch('cloud')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                aiConfig.mode === 'cloud'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              CLOUD
            </button>
          </div>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="p-1 rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
            title="Configure Partner Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Model Configuration Drawer */}
      {showConfigDrawer && (
        <div className="p-4 bg-[#18181b] border-b border-zinc-800 text-xs text-zinc-200 animate-in fade-in duration-100 shrink-0">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-zinc-200">Writing Partner Settings</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                Assistance Mode: <strong className="uppercase text-zinc-200">{aiConfig.mode}</strong>
              </span>
            </div>

            {aiConfig.mode === 'off' && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between text-zinc-400 text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AI Assistance is completely disabled. Swrite operates 100% offline with zero external network requests.</span>
                </div>
                <button
                  onClick={() => handleModeSwitch('local')}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors shrink-0"
                >
                  Enable Local AI
                </button>
              </div>
            )}

            {aiConfig.mode === 'local' && (
              <div className="space-y-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-zinc-400 font-medium">Local Engine:</label>
                    <select
                      value={aiConfig.localProvider || 'ollama'}
                      onChange={(e) => setAiConfig({ 
                        ...aiConfig, 
                        localProvider: e.target.value as any,
                        baseUrl: e.target.value === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1',
                        model: e.target.value === 'ollama' ? (ollamaModels[0] || 'llama3') : 'local-model'
                      })}
                      className="bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs"
                    >
                      <option value="ollama">Ollama (Default)</option>
                      <option value="lmstudio">LM Studio / LocalAI</option>
                      <option value="custom-local">Custom Local Endpoint</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
                    <label className="text-zinc-400 font-medium">Endpoint:</label>
                    <input
                      type="text"
                      placeholder="http://localhost:11434"
                      value={aiConfig.baseUrl || ''}
                      onChange={(e) => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                      className="bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-zinc-200 flex-1 font-mono text-[11px]"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-zinc-400 font-medium">Model:</label>
                    {aiConfig.localProvider === 'ollama' && ollamaModels.length > 0 ? (
                      <select
                        value={aiConfig.model || ollamaModels[0]}
                        onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                        className="bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs font-mono"
                      >
                        {ollamaModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="llama3, mistral, deepseek-r1"
                        value={aiConfig.model || ''}
                        onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                        className="bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-zinc-200 w-36 font-mono text-[11px]"
                      />
                    )}

                    {aiConfig.localProvider === 'ollama' && (
                      <button
                        onClick={handleDetectOllama}
                        disabled={isDetectingOllama}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-300 hover:text-white flex items-center space-x-1"
                        title="Scan for installed Ollama models"
                      >
                        <RefreshCw className={`w-3 h-3 ${isDetectingOllama ? 'animate-spin' : ''}`} />
                        <span>Scan</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Local AI processes your story strictly on your machine. No telemetry or story data leaves your computer.
                </p>
              </div>
            )}

            {aiConfig.mode === 'cloud' && (
              <div className="space-y-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-zinc-400 font-medium">Cloud Provider:</label>
                    <select
                      value={aiConfig.cloudProvider || 'gemini'}
                      onChange={(e) => {
                        const prov = e.target.value as any;
                        const defaultModels: Record<string, string> = {
                          gemini: 'gemini-1.5-pro',
                          openai: 'gpt-4o',
                          anthropic: 'claude-3-5-sonnet-20241022',
                          openrouter: 'anthropic/claude-3.5-sonnet',
                        };
                        setAiConfig({ 
                          ...aiConfig, 
                          cloudProvider: prov,
                          provider: prov,
                          model: defaultModels[prov] || 'default'
                        });
                      }}
                      className="bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="anthropic">Anthropic Claude</option>
                      <option value="openai">OpenAI (GPT-4o)</option>
                      <option value="openrouter">OpenRouter (Multi-Model)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 flex-1 min-w-[220px]">
                    <label className="text-zinc-400 font-medium">API Key:</label>
                    <input
                      type="password"
                      placeholder="Paste API key..."
                      value={aiConfig.apiKey || ''}
                      onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                      className="bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-zinc-200 flex-1 text-xs"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-zinc-400 font-medium">Model:</label>
                    <input
                      type="text"
                      placeholder="Model identifier"
                      value={aiConfig.model || ''}
                      onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                      className="bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-zinc-200 w-44 font-mono text-[11px]"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Cloud requests only transmit bounded, structured context and the current scene excerpt. The entire manuscript is never sent automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action feedback banner */}
      {actionFeedback && (
        <div className="px-4 py-1.5 bg-emerald-950/80 border-b border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-center space-x-2 animate-in fade-in">
          <Check className="w-3.5 h-3.5" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* TAB 1: Writing Partner Consultation & Discussion */}
      {activePartnerTab === 'chat' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Workflow Intent Mode Selector */}
          <div 
            className="px-6 py-2 border-b flex items-center space-x-1.5 overflow-x-auto text-xs shrink-0" 
            style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
          >
            <span className="text-zinc-500 font-medium text-[11px] shrink-0 uppercase font-mono">Focus:</span>
            {partnerModesList.map((m) => {
              const Icon = m.icon;
              const isSelected = partnerMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setPartnerMode(m.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 flex items-center space-x-1.5 ${
                    isSelected 
                      ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                  title={m.desc}
                >
                  <Icon className="w-3 h-3 opacity-70" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Discussion Craft Prompts */}
          <div className="px-6 py-1.5 border-b flex items-center space-x-1.5 overflow-x-auto text-[11px] shrink-0" style={{ borderColor: theme.pageBorder }}>
            <span className="text-zinc-500 text-[10px] uppercase font-mono shrink-0">Prompts:</span>
            {[
              { 
                label: 'Scene Alternatives', 
                mode: 'brainstorm' as const, 
                prompt: `Propose 3 divergent alternatives for how "${structuredContext.currentScene?.title || activeChapter?.title}" could develop while preserving the POV goal.` 
              },
              { 
                label: 'Dialogue & Subtext', 
                mode: 'critique' as const, 
                prompt: `Critique the dialogue and subtext in "${activeChapter?.title}". Flag lines that feel too explicit and suggest oblique alternatives.` 
              },
              { 
                label: 'Continuity Check', 
                mode: 'continuity' as const, 
                prompt: `Investigate continuity for "${activeChapter?.title}". Are character knowledge states and timelines consistent with our Story Engine?` 
              },
              { 
                label: 'Structure & Beats', 
                mode: 'structure' as const, 
                prompt: `Analyze the scene structure of "${structuredContext.currentScene?.title || activeChapter?.title}". Does it follow a clear Goal -> Conflict -> Disaster / Dilemma arc?` 
              },
              { 
                label: 'World Consistency', 
                mode: 'research' as const, 
                prompt: `Check "${activeChapter?.title}" against our World Codex. Does this scene respect established faction rules and setting limitations?` 
              },
            ].map((qa, i) => (
              <button
                key={i}
                onClick={() => {
                  setPartnerMode(qa.mode);
                  handleSendMessage(qa.prompt, qa.mode);
                }}
                className="px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800 transition-colors shrink-0 text-[11px]"
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
            {project.partnerMessages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[88%] rounded-lg p-4 relative group text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' 
                      : 'border text-zinc-200'
                  }`}
                  style={{
                    backgroundColor: msg.role === 'user' ? undefined : theme.pageBg,
                    borderColor: msg.role === 'user' ? undefined : theme.pageBorder,
                  }}
                >
                  {/* Message Header Badge */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-zinc-300 font-sans">Writing Partner</span>
                        {msg.mode && (
                          <span className="text-zinc-500 uppercase text-[9px]">
                            · {msg.mode}
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-500">Advisory</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/60 opacity-80 text-[10px]">
                    <span className="text-zinc-500 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="hover:text-white text-zinc-400 flex items-center space-x-1 transition-colors cursor-pointer"
                        title="Copy to Clipboard"
                      >
                        {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedMsgId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleSaveToScratchpad(msg.content)}
                          className="hover:text-white text-zinc-400 flex items-center space-x-1 transition-colors cursor-pointer"
                          title="Save this response into your Writer's Scratchpad"
                        >
                          <FileText className="w-3 h-3 opacity-70" />
                          <span>Scratchpad</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isAiThinking && (
              <div className="flex items-center space-x-2 text-zinc-500 text-xs py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                <span>Reviewing structured story context...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t shrink-0" style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="max-w-4xl mx-auto flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder={`Ask Writing Partner for craft feedback, brainstorming, or analysis on "${activeChapter?.title || 'your novel'}"...`}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-md px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isAiThinking || !userInput.trim() || aiConfig.mode === 'off'}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-100 border border-zinc-700 rounded-md transition-colors shadow-xs flex items-center space-x-1 cursor-pointer font-medium"
                title="Send to Writing Partner"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="max-w-4xl mx-auto mt-1.5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>FOCUS: <strong className="capitalize text-zinc-400 font-sans">{partnerMode}</strong> ({aiConfig.mode.toUpperCase()})</span>
              <span>Advisory consultation · Never modifies manuscript text automatically</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Live Story Engine Context Inspector */}
      {activePartnerTab === 'context' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-zinc-100 flex items-center space-x-2">
                <Compass className="w-4 h-4 opacity-70" />
                <span>Story Engine Context Inspector</span>
              </h3>
              <p className="text-zinc-500 text-[11px]">
                Transparent view of bounded data delivered to the Writing Partner. Full manuscripts are never transmitted.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              {structuredContext.boundedDraftExcerpt?.length || 0} / 1,500 chars excerpt
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Working Scene & POV */}
            <div className="rounded-lg border p-4 space-y-3" style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-semibold text-zinc-200">Active Location & POV</span>
                <span className="text-[10px] text-zinc-500">{structuredContext.currentAct?.title}</span>
              </div>
              <div className="space-y-1.5 text-zinc-300">
                <div><strong className="text-zinc-400">Chapter:</strong> {structuredContext.currentChapter?.title || 'None'}</div>
                {structuredContext.currentScene && (
                  <div><strong className="text-zinc-400">Scene:</strong> {structuredContext.currentScene.title}</div>
                )}
                <div>
                  <strong className="text-zinc-400">POV Character:</strong> {structuredContext.povCharacter ? `${structuredContext.povCharacter.name} (${structuredContext.povCharacter.role})` : 'Unassigned'}
                </div>
                {structuredContext.currentScene?.goal && (
                  <div><strong className="text-zinc-400">Scene Goal:</strong> {structuredContext.currentScene.goal}</div>
                )}
                {structuredContext.currentScene?.conflict && (
                  <div><strong className="text-zinc-400">Scene Conflict:</strong> {structuredContext.currentScene.conflict}</div>
                )}
              </div>
            </div>

            {/* Active Plot Threads */}
            <div className="rounded-lg border p-4 space-y-3" style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-semibold text-zinc-200">Linked Plot Threads</span>
                <span className="text-[10px] text-zinc-500">{structuredContext.activePlotThreads.length} active</span>
              </div>
              <div className="space-y-2">
                {structuredContext.activePlotThreads.length > 0 ? (
                  structuredContext.activePlotThreads.map(t => (
                    <div key={t.id} className="p-2 bg-zinc-900 border border-zinc-800 rounded text-[11px]">
                      <div className="font-medium text-zinc-200">{t.title}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">Type: {t.type} · Status: {t.status}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-500 italic text-[11px]">No plot threads linked to this scene yet.</div>
                )}
              </div>
            </div>

            {/* Involved Characters */}
            <div className="rounded-lg border p-4 space-y-3" style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-semibold text-zinc-200">Involved Characters</span>
                <span className="text-[10px] text-zinc-500">{structuredContext.involvedCharacters.length} cast members</span>
              </div>
              <div className="space-y-2">
                {structuredContext.involvedCharacters.map(c => (
                  <div key={c.id} className="p-2 bg-zinc-900 border border-zinc-800 rounded text-[11px]">
                    <div className="font-medium text-zinc-200">{c.name} <span className="text-zinc-500 font-normal">({c.role})</span></div>
                    {c.currentGoal && <div className="text-[10px] text-zinc-400">Goal: {c.currentGoal}</div>}
                    {c.relationships && c.relationships.length > 0 && (
                      <div className="text-[10px] text-indigo-300">Rels: {c.relationships.join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* World Codex Lore */}
            <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-semibold text-zinc-200">Relevant Codex Lore</span>
                <span className="text-[10px] text-zinc-500">{structuredContext.relevantCodex.length} entries</span>
              </div>
              <div className="space-y-2">
                {structuredContext.relevantCodex.map((e, idx) => (
                  <div key={idx} className="p-2 bg-zinc-900 border border-zinc-800 rounded text-[11px]">
                    <div className="font-medium text-zinc-200">{e.name} <span className="text-zinc-500 font-mono text-[9px] uppercase">[{e.category}]</span></div>
                    <div className="text-[10px] text-zinc-400 line-clamp-1">{e.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bounded Draft Excerpt Preview */}
          <div className="rounded-xl border p-4 space-y-2" style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-zinc-200">Bounded Draft Text Excerpt</span>
              <span className="text-[10px] text-zinc-500">Strictly Bounded for Craft Review</span>
            </div>
            <div className="p-3 bg-zinc-900/80 rounded border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {structuredContext.boundedDraftExcerpt || 'No draft text recorded in this scene yet.'}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Character Bible */}
      {activePartnerTab === 'characters' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">Character Bible</h3>
              <p className="text-zinc-500 text-[11px]">Track motives, flaws, secrets, and voice notes for every cast member.</p>
            </div>
            <button
              onClick={() => setIsCharModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Character</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.characters.map(c => (
              <div 
                key={c.id}
                className="rounded-xl border p-4 shadow-sm flex flex-col justify-between"
                style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || '#71717A' }} />
                      <h4 className="font-semibold text-sm text-zinc-100">{c.name}</h4>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {c.role}
                    </span>
                  </div>

                  {c.archetype && (
                    <div className="text-[11px] text-amber-400 font-medium mb-2">{c.archetype}</div>
                  )}

                  <p className="text-zinc-300 text-[11px] leading-relaxed mb-3 line-clamp-3">{c.bio}</p>

                  {c.motivations && (
                    <div className="text-[11px] text-zinc-400 mb-1">
                      <span className="text-zinc-500 font-medium">Goal:</span> {c.motivations}
                    </div>
                  )}

                  {c.flaws && (
                    <div className="text-[11px] text-zinc-400 mb-1">
                      <span className="text-zinc-500 font-medium">Flaw:</span> {c.flaws}
                    </div>
                  )}

                  {/* Character Relationships */}
                  {c.relationships && c.relationships.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-800">
                      <span className="text-[10px] text-zinc-500 block mb-1">Relationships:</span>
                      <div className="flex flex-wrap gap-1">
                        {c.relationships.map((rel, rIdx) => {
                          const target = project.characters.find(tc => tc.id === rel.targetId);
                          return (
                            <span key={rIdx} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-indigo-300 border border-zinc-700">
                              {rel.relation} ➔ {target?.name || 'Unknown'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-zinc-800 mt-3">
                  <button
                    onClick={() => deleteCharacter(c.id)}
                    className="p-1 hover:text-red-400 text-zinc-500 transition-colors"
                    title="Delete Character"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Plot Timeline */}
      {activePartnerTab === 'timeline' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">Story Beats & Narrative Arc</h3>
              <p className="text-zinc-500 text-[11px]">Track major milestones, dramatic hooks, midpoint reversals, and climax.</p>
            </div>
            <button
              onClick={() => setIsBeatModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Story Beat</span>
            </button>
          </div>

          <div className="space-y-3">
            {project.timeline.map((beat) => (
              <div 
                key={beat.id}
                className="rounded-xl border p-4 shadow-sm flex items-start justify-between"
                style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                      {beat.act}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {beat.beatType}
                    </span>
                    <h4 className="font-semibold text-sm text-zinc-100">{beat.title}</h4>
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed pt-1">{beat.description}</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0 ml-4">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">Tension</span>
                    <span className="font-mono text-xs text-amber-400 font-semibold">{beat.tensionLevel}/10</span>
                  </div>
                  <button
                    onClick={() => deleteStoryBeat(beat.id)}
                    className="p-1 hover:text-red-400 text-zinc-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Scratchpad */}
      {activePartnerTab === 'scratchpad' && (
        <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full h-full">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">Writer's Scratchpad & Brainstorming</h3>
              <p className="text-zinc-500 text-[11px]">Freeform notes, worldbuilding ideas, cut dialogue, and inspirations.</p>
            </div>
          </div>
          <textarea
            value={project.scratchpad || ''}
            onChange={(e) => updateScratchpad(e.target.value)}
            placeholder="Type freeform notes, worldbuilding lore, brainstorms..."
            className="flex-1 w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-5 text-xs text-zinc-200 leading-relaxed outline-none focus:border-indigo-500 resize-none font-mono"
          />
        </div>
      )}

      {/* New Character Modal */}
      {isCharModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a1a1e] border border-zinc-700 rounded-2xl w-full max-w-md p-6 text-xs text-zinc-200 shadow-2xl space-y-4">
            <h3 className="font-semibold text-sm text-zinc-100">Create Character Profile</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Character Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Elena Vance"
                  value={newChar.name}
                  onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
                  className="w-full bg-[#121215] border border-zinc-700 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Role:</label>
                  <select
                    value={newChar.role}
                    onChange={(e) => setNewChar({ ...newChar, role: e.target.value as any })}
                    className="w-full bg-[#121215] border border-zinc-700 rounded-lg p-2 text-zinc-200"
                  >
                    <option value="Protagonist">Protagonist</option>
                    <option value="Antagonist">Antagonist</option>
                    <option value="Supporting">Supporting</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Archetype:</label>
                  <input
                    type="text"
                    placeholder="e.g. Reluctant Scholar"
                    value={newChar.archetype}
                    onChange={(e) => setNewChar({ ...newChar, archetype: e.target.value })}
                    className="w-full bg-[#121215] border border-zinc-700 rounded-lg p-2 text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Core Motivation / Goal:</label>
                <input
                  type="text"
                  placeholder="What do they desperately want?"
                  value={newChar.motivations}
                  onChange={(e) => setNewChar({ ...newChar, motivations: e.target.value })}
                  className="w-full bg-[#121215] border border-zinc-700 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Bio & Backstory:</label>
                <textarea
                  rows={3}
                  placeholder="Short backstory and narrative role..."
                  value={newChar.bio}
                  onChange={(e) => setNewChar({ ...newChar, bio: e.target.value })}
                  className="w-full bg-[#121215] border border-zinc-700 rounded-lg p-2 text-zinc-200 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setIsCharModalOpen(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCharacter}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
              >
                Save Character
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Story Beat Modal */}
      {isBeatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a1a1e] border border-zinc-700 rounded-2xl w-full max-w-md p-6 text-xs text-zinc-200 shadow-2xl space-y-4">
            <h3 className="font-semibold text-sm text-zinc-100">Add Story Beat</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Beat Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Discovery of the Forbidden Cipher"
                  value={newBeat.title}
                  onChange={(e) => setNewBeat({ ...newBeat, title: e.target.value })}
                  className="w-full bg-[#121215] border border-zinc-700 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Act Placement:</label>
                  <select
                    value={newBeat.act}
                    onChange={(e) => setNewBeat({ ...newBeat, act: e.target.value as any })}
                    className="w-full bg-[#121215] border border-zinc-700 rounded-lg p-2 text-zinc-200"
                  >
                    <option value="Act I">Act I</option>
                    <option value="Act II-A">Act II-A</option>
                    <option value="Act II-B">Act II-B</option>
                    <option value="Act III">Act III</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Beat Type:</label>
                  <select
                    value={newBeat.beatType}
                    onChange={(e) => setNewBeat({ ...newBeat, beatType: e.target.value as any })}
                    className="w-full bg-[#121215] border border-zinc-700 rounded-lg p-2 text-zinc-200"
                  >
                    <option value="Hook">Hook</option>
                    <option value="Inciting Incident">Inciting Incident</option>
                    <option value="Plot Point 1">Plot Point 1</option>
                    <option value="Midpoint">Midpoint Reversal</option>
                    <option value="All Hope Lost">All Hope Lost</option>
                    <option value="Climax">Climax</option>
                    <option value="Resolution">Resolution</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Tension Level (1–10): {newBeat.tensionLevel}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={newBeat.tensionLevel}
                  onChange={(e) => setNewBeat({ ...newBeat, tensionLevel: Number(e.target.value) })}
                  className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Beat Description:</label>
                <textarea
                  rows={3}
                  placeholder="What narrative shift happens here?"
                  value={newBeat.description}
                  onChange={(e) => setNewBeat({ ...newBeat, description: e.target.value })}
                  className="w-full bg-[#121215] border border-zinc-700 rounded-lg p-2 text-zinc-200 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setIsBeatModalOpen(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBeat}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
              >
                Save Beat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
