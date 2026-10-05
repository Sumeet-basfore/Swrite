import React, { useState } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { StructureTemplateType } from '../../types';
import { 
  Wand2, Hash, BookOpen, Layers, X, Check, AlertCircle, 
  ArrowRight, ShieldCheck, RefreshCw, FolderTree, Compass, Search
} from 'lucide-react';

export const OrganizerModal: React.FC = () => {
  const { 
    project, isOrganizerModalOpen, setOrganizerModalOpen, 
    runAutoTitleCleanup, runSequentialRenumbering, runEntityExtraction, 
    runApplyStructurePreset 
  } = useSwriteStore();

  const theme = project.metadata.theme;
  const [activeTab, setActiveTab] = useState<'titles' | 'renumber' | 'entities' | 'structure'>('titles');
  const [renumberPrefix, setRenumberPrefix] = useState('Chapter');
  const [selectedStructure, setSelectedStructure] = useState<StructureTemplateType>('three-act');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOrganizerModalOpen) return null;

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleCleanTitles = () => {
    const count = runAutoTitleCleanup();
    showSuccess(`Cleaned and normalized ${count} chapter title(s) across manuscript.`);
  };

  const handleRenumber = () => {
    const count = runSequentialRenumbering(renumberPrefix.trim() || 'Chapter');
    showSuccess(`Sequentially renumbered ${count} chapter(s) with prefix "${renumberPrefix}".`);
  };

  const handleExtractEntities = () => {
    const count = runEntityExtraction();
    showSuccess(`Extracted ${count} new entity dossier(s) into your World Codex.`);
  };

  const handleApplyStructure = () => {
    runApplyStructurePreset(selectedStructure);
    showSuccess(`Manuscript restructured according to ${selectedStructure.replace('-', ' ').toUpperCase()} template.`);
  };

  const totalChapters = project.acts.reduce((acc, a) => acc + a.chapters.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div 
        className="w-full max-w-2xl rounded-lg border shadow-xl flex flex-col overflow-hidden max-h-[85vh]"
        style={{ 
          backgroundColor: theme.bg, 
          borderColor: theme.pageBorder,
          color: theme.text 
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: theme.pageBorder }}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded bg-zinc-800/60 text-zinc-300 border border-zinc-700/60">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center space-x-2">
                <span>Organizer & Manuscript Architect</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded border border-zinc-700 text-zinc-400 font-mono">
                  {totalChapters} chapters
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Deterministic curation, entity extraction, and structural templates</p>
            </div>
          </div>
          <button 
            onClick={() => setOrganizerModalOpen(false)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Toast */}
        {successMessage && (
          <div className="mx-5 mt-4 p-2.5 rounded bg-zinc-900 border border-emerald-600/40 text-emerald-300 text-xs flex items-center space-x-2 animate-slide-down">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b px-5 pt-2" style={{ borderColor: theme.pageBorder }}>
          <button
            onClick={() => setActiveTab('titles')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'titles' 
                ? 'border-zinc-200 text-zinc-100' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Clean Titles</span>
          </button>

          <button
            onClick={() => setActiveTab('renumber')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'renumber' 
                ? 'border-zinc-200 text-zinc-100' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Renumber Sequence</span>
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'entities' 
                ? 'border-zinc-200 text-zinc-100' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Extract World Codex</span>
          </button>

          <button
            onClick={() => setActiveTab('structure')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'structure' 
                ? 'border-zinc-200 text-zinc-100' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Narrative Structures</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: Clean Titles */}
          {activeTab === 'titles' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border bg-zinc-900/40 space-y-2" style={{ borderColor: theme.pageBorder }}>
                <h3 className="text-xs font-semibold text-zinc-200 flex items-center space-x-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Batch Title Normalization</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Automatically converts messy imported filenames (<code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded text-[11px]">01_the-amber-mist_v2.md</code>) into clean chapter titles (<code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded text-[11px]">Chapter 1: The Amber Mist</code>).
                </p>
                <ul className="text-[11px] text-zinc-400 list-disc list-inside space-y-1 pt-1">
                  <li>Removes file extensions (.md, .docx, .txt)</li>
                  <li>Normalizes snake_case, kebab-case, and underscores to capitalized words</li>
                  <li>Synchronizes the title with the internal <code className="text-zinc-300">&lt;h1&gt;</code> in each chapter</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCleanTitles}
                  className="px-3.5 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs flex items-center space-x-2 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Run Auto-Title Normalization</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Renumber Sequence */}
          {activeTab === 'renumber' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border bg-zinc-900/40 space-y-3" style={{ borderColor: theme.pageBorder }}>
                <h3 className="text-xs font-semibold text-zinc-200 flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Global Sequential Renumbering</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Re-orders and standardizes chapter numbering from 1 to {totalChapters} across all folders in natural reading sequence.
                </p>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-medium text-zinc-300">Chapter Prefix Style:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={renumberPrefix}
                      onChange={(e) => setRenumberPrefix(e.target.value)}
                      placeholder="Chapter"
                      className="bg-zinc-900 border rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-zinc-500 w-48"
                      style={{ borderColor: theme.pageBorder }}
                    />
                    <span className="text-xs text-zinc-500">➔ Example: "{renumberPrefix} 1: Whispers in the Amber Mist"</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleRenumber}
                  className="px-3.5 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs flex items-center space-x-2 transition-colors"
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>Renumber All {totalChapters} Chapters</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Extract Entities */}
          {activeTab === 'entities' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border bg-zinc-900/40 space-y-2" style={{ borderColor: theme.pageBorder }}>
                <h3 className="text-xs font-semibold text-zinc-200 flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Prose Entity & Codex Scanner</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Scans all {totalChapters} chapters for proper nouns, recurring entities, and <code className="text-zinc-300">[[wikilinks]]</code> to build your World Codex deterministically.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                  <div className="p-2 rounded bg-zinc-800/40 border border-zinc-800">
                    <span className="font-semibold text-zinc-200">Characters:</span> Detects recurring names (3+ mentions) and assigns character dossiers.
                  </div>
                  <div className="p-2 rounded bg-zinc-800/40 border border-zinc-800">
                    <span className="font-semibold text-zinc-200">Locations:</span> Identifies towers, cathedrals, quarters, cities, and landmarks.
                  </div>
                  <div className="p-2 rounded bg-zinc-800/40 border border-zinc-800">
                    <span className="font-semibold text-zinc-200">Factions:</span> Identifies guilds, councils, orders, and syndicates.
                  </div>
                  <div className="p-2 rounded bg-zinc-800/40 border border-zinc-800">
                    <span className="font-semibold text-zinc-200">Lore & Magic:</span> Identifies glyphs, runes, formulas, and historical events.
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleExtractEntities}
                  className="px-3.5 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs flex items-center space-x-2 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Extract Entities into World Codex</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Narrative Structure Templates */}
          {activeTab === 'structure' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-200">Select Narrative Framework:</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div 
                    onClick={() => setSelectedStructure('three-act')}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      selectedStructure === 'three-act'
                        ? 'border-zinc-400 bg-zinc-800/60'
                        : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-zinc-200">Three-Act Dramatic Structure</div>
                    <div className="text-[11px] text-zinc-400 mt-1">Act I Setup (25%) • Act II Confrontation (50%) • Act III Resolution (25%)</div>
                  </div>

                  <div 
                    onClick={() => setSelectedStructure('heros-journey')}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      selectedStructure === 'heros-journey'
                        ? 'border-zinc-400 bg-zinc-800/60'
                        : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-zinc-200">Four-Part Hero's Journey</div>
                    <div className="text-[11px] text-zinc-400 mt-1">Departure • Initiation • Ordeal • Return</div>
                  </div>

                  <div 
                    onClick={() => setSelectedStructure('serialized-volumes')}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      selectedStructure === 'serialized-volumes'
                        ? 'border-zinc-400 bg-zinc-800/60'
                        : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-zinc-200">Serialized Volumes Stack</div>
                    <div className="text-[11px] text-zinc-400 mt-1">Volume 1, Volume 2 (10 chapters per release volume)</div>
                  </div>

                  <div 
                    onClick={() => setSelectedStructure('flat-pantser')}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      selectedStructure === 'flat-pantser'
                        ? 'border-zinc-400 bg-zinc-800/60'
                        : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-zinc-200">Flat Pantser Manuscript</div>
                    <div className="text-[11px] text-zinc-400 mt-1">Unified flat sequence without artificial act boundaries</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleApplyStructure}
                  className="px-3.5 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs flex items-center space-x-2 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Apply Selected Structure</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-zinc-950/30 flex items-center justify-between text-[11px] text-zinc-500" style={{ borderColor: theme.pageBorder }}>
          <span>Changes update your active project and auto-sync to local disk</span>
          <button
            onClick={() => setOrganizerModalOpen(false)}
            className="px-3 py-1.5 rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
