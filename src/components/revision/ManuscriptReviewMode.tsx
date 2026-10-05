import React, { useState, useMemo } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { RevisionQueries } from '../../editorial/revision';
import {
  RevisionItem,
  RevisionRound,
  REVISION_PASS_LABELS,
  REVISION_CATEGORY_LABELS,
  REVISION_PRIORITY_LABELS,
} from '../../types/revision';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  User,
  GitFork,
  AlertTriangle,
  Flag,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ManuscriptReviewModeProps {
  onClose: () => void;
  onNavigateToScene?: (chapterId: string, sceneId?: string, anchorText?: string) => void;
}

export const ManuscriptReviewMode: React.FC<ManuscriptReviewModeProps> = ({
  onClose,
  onNavigateToScene,
}) => {
  const {
    project,
    activeRevisionRoundId,
    activeRevisionItemId,
    setActiveRevisionItemId,
    resolveRevisionItem,
    deferRevisionItem,
  } = useSwriteStore();

  const [isContextExpanded, setIsContextExpanded] = useState(false);

  // Active round or first active round
  const activeRound: RevisionRound | undefined = useMemo(() => {
    if (!project) return undefined;
    if (activeRevisionRoundId) {
      const found = project.revisionRounds?.find((r: RevisionRound) => r.id === activeRevisionRoundId);
      if (found) return found;
    }
    return RevisionQueries.getActiveRevisionRound(project);
  }, [project, activeRevisionRoundId]);

  // Review items list (open, in-progress items, ordered)
  const reviewItems: RevisionItem[] = useMemo(() => {
    if (!project) return [];
    const items = RevisionQueries.getRevisionItems(project, {
      roundId: activeRound?.id,
    });
    // Filter to actionable items (open or in-progress first, then deferred)
    return items.filter((i) => i.status === 'open' || i.status === 'in-progress' || i.status === 'deferred');
  }, [project, activeRound]);

  // Current item index
  const currentIndex = useMemo(() => {
    if (!reviewItems.length) return -1;
    if (!activeRevisionItemId) return 0;
    const idx = reviewItems.findIndex((i) => i.id === activeRevisionItemId);
    return idx >= 0 ? idx : 0;
  }, [reviewItems, activeRevisionItemId]);

  const currentItem: RevisionItem | undefined = reviewItems[currentIndex];

  // Story engine dynamic context for current item
  const storyContext = useMemo(() => {
    if (!project || !currentItem) return null;
    return RevisionQueries.getStoryAwareRevisionContext(project, currentItem.id);
  }, [project, currentItem]);

  const handleNext = () => {
    if (currentIndex < reviewItems.length - 1) {
      const nextItem = reviewItems[currentIndex + 1];
      setActiveRevisionItemId(nextItem.id);
      if (onNavigateToScene && nextItem.chapterId) {
        onNavigateToScene(nextItem.chapterId, nextItem.sceneId, nextItem.anchoredText);
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevItem = reviewItems[currentIndex - 1];
      setActiveRevisionItemId(prevItem.id);
      if (onNavigateToScene && prevItem.chapterId) {
        onNavigateToScene(prevItem.chapterId, prevItem.sceneId, prevItem.anchoredText);
      }
    }
  };

  const handleResolve = () => {
    if (!currentItem) return;
    resolveRevisionItem(currentItem.id);
    if (currentIndex < reviewItems.length - 1) {
      const nextItem = reviewItems[currentIndex + 1];
      setActiveRevisionItemId(nextItem.id);
      if (onNavigateToScene && nextItem.chapterId) {
        onNavigateToScene(nextItem.chapterId, nextItem.sceneId, nextItem.anchoredText);
      }
    }
  };

  const handleDefer = () => {
    if (!currentItem) return;
    deferRevisionItem(currentItem.id);
    if (currentIndex < reviewItems.length - 1) {
      const nextItem = reviewItems[currentIndex + 1];
      setActiveRevisionItemId(nextItem.id);
    }
  };

  const handleJumpToScene = () => {
    if (!currentItem || !currentItem.chapterId || !onNavigateToScene) return;
    onNavigateToScene(currentItem.chapterId, currentItem.sceneId, currentItem.anchoredText);
  };

  if (!activeRound && reviewItems.length === 0) {
    return (
      <div className="border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
              No open revision items found
            </p>
            <p className="text-xs text-stone-500">
              Create a revision round or add revision notes to begin reviewing your manuscript.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur-md shadow-2xl transition-all duration-200">
      {/* Top Header Bar */}
      <div className="px-6 py-2.5 border-b border-stone-200/70 dark:border-stone-800/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Sequential Review
            </span>
            {activeRound && (
              <>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
                  {activeRound.name}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                  {REVISION_PASS_LABELS[activeRound.passType]}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-stone-500 font-mono">
            Item <span className="font-semibold text-stone-800 dark:text-stone-200">{reviewItems.length ? currentIndex + 1 : 0}</span> of{' '}
            <span className="font-semibold text-stone-800 dark:text-stone-200">{reviewItems.length}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded hover:bg-stone-200/50 dark:hover:bg-stone-800"
            title="Exit Review Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Review Body */}
      {currentItem ? (
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            {/* Left: Item content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                    currentItem.priority === 'critical'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                      : currentItem.priority === 'high'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                      : currentItem.priority === 'medium'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  {REVISION_PRIORITY_LABELS[currentItem.priority]}
                </span>

                <span className="text-[11px] px-2 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                  {REVISION_CATEGORY_LABELS[currentItem.category]}
                </span>

                {storyContext?.sceneName && (
                  <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-stone-400" />
                    {storyContext.chapterName ? `${storyContext.chapterName} / ` : ''}
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {storyContext.sceneName}
                    </span>
                  </span>
                )}
              </div>

              <h4 className="text-base font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                {currentItem.title}
              </h4>

              {currentItem.description && (
                <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-3xl">
                  {currentItem.description}
                </p>
              )}

              {/* Anchored Quote snippet */}
              {currentItem.anchoredText && (
                <div className="mt-2.5 p-2.5 rounded-md bg-stone-100 dark:bg-stone-800/80 border-l-2 border-amber-500 text-xs italic text-stone-700 dark:text-stone-300 flex items-start justify-between gap-3">
                  <span className="line-clamp-2">"{currentItem.anchoredText}"</span>
                  {onNavigateToScene && (
                    <button
                      onClick={handleJumpToScene}
                      className="shrink-0 flex items-center gap-1 text-[11px] not-italic text-amber-700 dark:text-amber-400 hover:underline font-medium"
                    >
                      <span>Jump</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Story Engine dynamic context toggle */}
              {storyContext && (
                <div className="mt-3">
                  <button
                    onClick={() => setIsContextExpanded(!isContextExpanded)}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Story Engine Context</span>
                    {isContextExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isContextExpanded && (
                    <div className="mt-2 p-3 bg-stone-100/70 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-800 text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
                      {storyContext.characters.length > 0 && (
                        <div>
                          <div className="font-semibold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                            <User className="w-3 h-3 text-stone-400" />
                            Characters Present & Current State
                          </div>
                          <div className="space-y-1.5">
                            {storyContext.characters.map((c) => (
                              <div key={c.id} className="p-1.5 bg-white dark:bg-stone-900 rounded border border-stone-200/50 dark:border-stone-800">
                                <span className="font-medium text-stone-800 dark:text-stone-200">{c.name}</span>
                                {c.activeArc && (
                                  <span className="text-[10px] text-stone-500 ml-1.5">({c.activeArc})</span>
                                )}
                                {c.currentBelief && (
                                  <p className="text-[11px] text-stone-600 dark:text-stone-400 italic mt-0.5">
                                    Belief: {c.currentBelief}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {storyContext.plotThreads.length > 0 && (
                        <div>
                          <div className="font-semibold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                            <GitFork className="w-3 h-3 text-stone-400" />
                            Active Plot Threads
                          </div>
                          <div className="space-y-1">
                            {storyContext.plotThreads.map((pt) => (
                              <div key={pt.id} className="p-1.5 bg-white dark:bg-stone-900 rounded border border-stone-200/50 dark:border-stone-800">
                                <span className="font-medium text-stone-800 dark:text-stone-200">{pt.name}</span>
                                <span className="text-[10px] text-stone-500 ml-1.5 uppercase font-mono">[{pt.status}]</span>
                                {pt.resolutionPromise && (
                                  <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                                    Promise: {pt.resolutionPromise}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {storyContext.sceneGoals && (
                        <div className="md:col-span-2 text-stone-600 dark:text-stone-400">
                          <span className="font-semibold text-stone-700 dark:text-stone-300">Scene Goal / Conflict / Outcome: </span>
                          <span>{storyContext.sceneGoals}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Sequential actions */}
            <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
              <button
                onClick={handlePrevious}
                disabled={currentIndex <= 0}
                className="px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <button
                onClick={handleDefer}
                className="px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg flex items-center gap-1.5"
                title="Defer for later pass"
              >
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Defer</span>
              </button>

              <button
                onClick={handleResolve}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolve & Next</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex >= reviewItems.length - 1}
                className="px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-6 py-6 text-center text-xs text-stone-500">
          All review items in this pass are completed.
        </div>
      )}
    </div>
  );
};
