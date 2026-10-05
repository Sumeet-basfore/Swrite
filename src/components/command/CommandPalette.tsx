import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { 
  Search, BookOpen, PenLine, LayoutGrid, CheckCircle2, 
  Users, GitBranch, Clock, Network, Download, Sliders, 
  Palette, Maximize2, FileText, Plus, Compass, Sparkles,
  ArrowRight, ShieldCheck, Layers, X, History, Camera, Scissors
} from 'lucide-react';
import { WorkspaceTab } from '../../types';

interface CommandItem {
  id: string;
  title: string;
  category: 'Workspace' | 'Manuscript' | 'Story' | 'Action' | 'Settings';
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const {
    project, activeTab, setActiveTab, activeChapterId, setActiveChapterId, 
    activeSceneId, setActiveSceneId,
    setInspectorSelection, toggleFocusMode, isFocusMode, setThemeModalOpen,
    setCompilerModalOpen, setOrganizerModalOpen, setPresetsModalOpen,
    setIsVersionHistoryModalOpen, createManualSnapshot,
    addNewChapter, addScene, startSprint
  } = useSwriteStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const theme = project.metadata.theme;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable command list
  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Primary Workspaces
      {
        id: 'ws-write',
        title: 'Switch to Write Workspace',
        category: 'Workspace',
        subtitle: 'Manuscript writing with live scene context & inspector',
        icon: PenLine,
        keywords: 'editor manuscript write prose drafting typing',
        action: () => {
          setActiveTab('editor');
          onClose();
        }
      },
      {
        id: 'ws-plan',
        title: 'Switch to Plan Workspace',
        category: 'Workspace',
        subtitle: 'Outliner matrix, scene cards & corkboard structure',
        icon: LayoutGrid,
        keywords: 'plan outliner corkboard structure beats cards matrix',
        action: () => {
          setActiveTab('outliner');
          onClose();
        }
      },
      {
        id: 'ws-review',
        title: 'Switch to Review Workspace',
        category: 'Workspace',
        subtitle: 'Unified editorial queue: proofreading, continuity & revision',
        icon: CheckCircle2,
        keywords: 'review revision proofreading continuity editorial edit audit polish',
        action: () => {
          setActiveTab('revision');
          onClose();
        }
      },
      {
        id: 'ws-story',
        title: 'Open Story Environment',
        category: 'Workspace',
        subtitle: 'Characters, plot threads, story arcs & world codex',
        icon: Users,
        keywords: 'story characters plot threads arcs codex world bible lore',
        action: () => {
          setActiveTab('codex');
          onClose();
        }
      },
      {
        id: 'ws-timeline',
        title: 'Open Story Timeline',
        category: 'Workspace',
        subtitle: 'Dual timeline: narrative order vs story world chronology',
        icon: Clock,
        keywords: 'timeline chronology flashback narrative time date events',
        action: () => {
          setActiveTab('timeline');
          onClose();
        }
      },
      {
        id: 'ws-graph',
        title: 'Open Universe Graph View',
        category: 'Workspace',
        subtitle: 'Interactive visual graph of all story connections',
        icon: Network,
        keywords: 'graph nodes connections obsidian wikilinks map',
        action: () => {
          setActiveTab('graph');
          onClose();
        }
      },
      {
        id: 'ws-publication',
        title: 'Open Publication & Export Studio',
        category: 'Workspace',
        subtitle: 'Format and compile manuscript for EPUB, PDF, Word, Print',
        icon: Download,
        keywords: 'export compile publication print pdf epub docx book',
        action: () => {
          setCompilerModalOpen(true);
          onClose();
        }
      },
      {
        id: 'ws-versions',
        title: 'Open Version History & Snapshots',
        category: 'Workspace',
        subtitle: 'Browse past versions, diff changes and restore safely',
        icon: History,
        keywords: 'version history snapshot recovery rollback compare diff restore backup',
        action: () => {
          setIsVersionHistoryModalOpen(true);
          onClose();
        }
      },

      // Quick Actions
      {
        id: 'act-snapshot',
        title: 'Take Manuscript Snapshot',
        category: 'Action',
        subtitle: 'Save a named recovery point of current manuscript state',
        icon: Camera,
        keywords: 'snapshot checkpoint save point backup safe recovery bookmark',
        action: () => {
          createManualSnapshot({
            label: `Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            type: 'manual',
            source: 'user'
          });
          onClose();
        }
      },
      {
        id: 'act-focus',
        title: isFocusMode ? 'Exit Focus Mode' : 'Toggle Focus Mode',
        category: 'Action',
        subtitle: 'Distraction-free manuscript writing environment',
        icon: Maximize2,
        keywords: 'focus fullscreen distraction free zen type',
        action: () => {
          toggleFocusMode();
          onClose();
        }
      },
      {
        id: 'act-new-scene',
        title: 'Create New Scene',
        category: 'Action',
        subtitle: 'Add an Untitled Scene to active chapter and focus editor',
        icon: Plus,
        keywords: 'add new scene beat untitled frictionless prose',
        action: () => {
          const allChapters = project.acts.flatMap(a => a.chapters);
          const currentCh = allChapters.find(c => c.id === activeChapterId) || allChapters[0];
          if (currentCh) {
            const newSc = addScene(currentCh.id, { title: 'Untitled Scene' });
            setActiveChapterId(currentCh.id);
            setActiveSceneId(newSc.id);
            setActiveTab('editor');
          }
          onClose();
        }
      },
      {
        id: 'act-split-scene',
        title: 'Split Scene Here',
        category: 'Action',
        subtitle: 'Split active scene into two beats at cursor position',
        icon: Scissors,
        keywords: 'split scene beat cut divide prose',
        action: () => {
          window.dispatchEvent(new CustomEvent('swrite:split-scene-here'));
          onClose();
        }
      },
      {
        id: 'act-new-chapter',
        title: 'Create New Chapter',
        category: 'Action',
        subtitle: 'Add a new chapter to the current manuscript',
        icon: Plus,
        keywords: 'add new chapter section',
        action: () => {
          const chId = addNewChapter();
          setActiveChapterId(chId);
          setActiveTab('editor');
          onClose();
        }
      },
      {
        id: 'act-sprint-15',
        title: 'Start 15-Minute Word Sprint',
        category: 'Action',
        subtitle: 'Timed focused writing sprint with word tracker',
        icon: Clock,
        keywords: 'sprint timer pomodoro speed write 15 min',
        action: () => {
          startSprint(15);
          onClose();
        }
      },
      {
        id: 'act-organizer',
        title: 'Curate & Structure Organizer',
        category: 'Action',
        subtitle: 'Auto-renumber chapters, clean titles, extract entities',
        icon: Layers,
        keywords: 'organize structure curate renumber clean extract',
        action: () => {
          setOrganizerModalOpen(true);
          onClose();
        }
      },
      {
        id: 'act-theme',
        title: 'Theme & Typography Settings',
        category: 'Settings',
        subtitle: 'Customize theme colors, manuscript font, line height',
        icon: Palette,
        keywords: 'theme colors dark light fonts typography appearance',
        action: () => {
          setThemeModalOpen(true);
          onClose();
        }
      },
      {
        id: 'act-preset',
        title: 'Writer Preset (Pantser / Plotter / Plantser)',
        category: 'Settings',
        subtitle: 'Switch application layout density and sidebars',
        icon: Sliders,
        keywords: 'preset pantser plotter plantser layout configuration',
        action: () => {
          setPresetsModalOpen(true);
          onClose();
        }
      },
    ];

    // Add Chapters
    project.acts.forEach(act => {
      act.chapters.forEach((ch, cIdx) => {
        list.push({
          id: `ch-${ch.id}`,
          title: ch.title,
          category: 'Manuscript',
          subtitle: `${act.title} · ${ch.wordCount.toLocaleString()} words`,
          icon: BookOpen,
          keywords: `chapter ${cIdx + 1} ${ch.title} ${act.title} ${ch.synopsis || ''}`,
          action: () => {
            setActiveChapterId(ch.id);
            setActiveTab('editor');
            onClose();
          }
        });

        // Add Scenes inside Chapter
        (ch.scenes || []).forEach((sc, sIdx) => {
          list.push({
            id: `sc-${sc.id}`,
            title: sc.title || `Scene ${sIdx + 1}`,
            category: 'Manuscript',
            subtitle: `${ch.title} · Scene ${sIdx + 1} (${sc.wordCount || 0}w)`,
            icon: FileText,
            keywords: `scene ${sIdx + 1} ${sc.title || ''} ${ch.title} ${sc.goal || ''} ${sc.synopsis || ''}`,
            action: () => {
              setActiveChapterId(ch.id);
              setActiveSceneId(sc.id);
              setActiveTab('editor');
              onClose();
            }
          });
        });
      });
    });

    // Add Characters
    (project.characters || []).forEach(char => {
      list.push({
        id: `char-${char.id}`,
        title: char.name,
        category: 'Story',
        subtitle: `Character · ${char.role || 'Cast Member'}${char.archetype ? ` (${char.archetype})` : ''}`,
        icon: Users,
        keywords: `character cast ${char.name} ${char.role || ''} ${char.archetype || ''} ${(char.aliases || []).join(' ')}`,
        action: () => {
          setInspectorSelection({ type: 'character', characterId: char.id });
          setActiveTab('codex');
          onClose();
        }
      });
    });

    // Add Plot Threads
    (project.plotThreads || []).forEach(thread => {
      list.push({
        id: `thread-${thread.id}`,
        title: thread.title,
        category: 'Story',
        subtitle: `Plot Thread · ${thread.type} (${thread.status})`,
        icon: GitBranch,
        keywords: `plot thread storyline ${thread.title} ${thread.type} ${thread.status} ${thread.description || ''}`,
        action: () => {
          setInspectorSelection({ type: 'thread', threadId: thread.id });
          setActiveTab('threads');
          onClose();
        }
      });
    });

    return list.filter(command => command.id !== 'act-split-scene' || (activeTab === 'editor' && Boolean(activeChapterId && activeSceneId)));
  }, [project, isFocusMode, activeTab, activeChapterId, activeSceneId]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase().trim();
    return commands.filter(cmd => {
      if (cmd.title.toLowerCase().includes(q)) return true;
      if (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) return true;
      if (cmd.keywords && cmd.keywords.toLowerCase().includes(q)) return true;
      if (cmd.category.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [commands, query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        style={{ 
          backgroundColor: theme.colors?.elevatedSurface || theme.pageBg || '#18181b', 
          borderColor: theme.colors?.borderStrong || theme.pageBorder || '#3f3f46' 
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="p-3.5 border-b flex items-center space-x-3 shrink-0" style={{ borderColor: theme.pageBorder }}>
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, chapter, character, or workspace..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
              ESC
            </span>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCommands.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            const Icon = cmd.icon;

            return (
              <div
                key={cmd.id}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs ${
                  isSelected 
                    ? 'bg-zinc-800 text-zinc-100' 
                    : 'text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center space-x-3 truncate flex-1 mr-3">
                  <div className={`p-1.5 rounded ${isSelected ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-900 text-zinc-400'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-xs text-zinc-200 truncate">{cmd.title}</div>
                    {cmd.subtitle && (
                      <div className="text-[11px] text-zinc-500 truncate">{cmd.subtitle}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-900/80 text-zinc-500 border border-zinc-800">
                    {cmd.category}
                  </span>
                  {isSelected && (
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </div>
              </div>
            );
          })}

          {filteredCommands.length === 0 && (
            <div className="py-12 text-center text-xs text-zinc-500">
              No matching commands or story elements found for "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t flex items-center justify-between text-[10px] text-zinc-500 font-mono shrink-0" style={{ borderColor: theme.pageBorder }}>
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Swrite Command Palette</span>
        </div>
      </div>
    </div>
  );
};
