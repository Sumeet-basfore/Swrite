import React, { useMemo } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { ContinuityEngine } from '../../engine';
import { 
  PenLine, ArrowRight, ShieldCheck, CheckCircle2, Clock, GitBranch, BookOpen
} from 'lucide-react';

export const ProjectOverviewWorkspace: React.FC = () => {
  const { 
    project, activeChapterId, activeSceneId, setActiveChapterId, 
    setActiveSceneId, setActiveTab 
  } = useSwriteStore();

  const theme = project.metadata.theme;

  const currentWords = project.metadata.currentWordCount || 0;
  const targetWords = project.metadata.targetWordCount || 50000;

  // Working Chapter & Scene
  const currentChapter = useMemo(() => {
    for (const act of project.acts) {
      const ch = act.chapters.find(c => c.id === activeChapterId);
      if (ch) return { chapter: ch, act };
    }
    return project.acts[0]?.chapters[0] 
      ? { chapter: project.acts[0].chapters[0], act: project.acts[0] } 
      : null;
  }, [project.acts, activeChapterId]);

  const currentScene = useMemo(() => {
    if (!currentChapter?.chapter?.scenes || currentChapter.chapter.scenes.length === 0) return null;
    if (activeSceneId) {
      return currentChapter.chapter.scenes.find(s => s.id === activeSceneId) || currentChapter.chapter.scenes[0];
    }
    return currentChapter.chapter.scenes[0];
  }, [currentChapter, activeSceneId]);

  // Next Planned Scene
  const nextPlannedScene = useMemo(() => {
    if (!currentChapter?.chapter?.scenes) return null;
    const allScenes = currentChapter.chapter.scenes;
    if (!currentScene) return allScenes[0] || null;
    const currentIndex = allScenes.findIndex(s => s.id === currentScene.id);
    if (currentIndex !== -1 && currentIndex + 1 < allScenes.length) {
      return allScenes[currentIndex + 1];
    }
    return null;
  }, [currentChapter, currentScene]);

  // Active Plot Threads
  const activeThreads = useMemo(() => {
    return (project.plotThreads || [])
      .filter(t => t.status === 'active' || t.status === 'payoff-pending' || t.status === 'in-progress')
      .slice(0, 3);
  }, [project.plotThreads]);

  // Continuity Status
  const continuityWarnings = useMemo(() => {
    const all = ContinuityEngine.runAudit(project);
    return all.filter(w => !w.isIgnored && !w.isIntentional);
  }, [project]);

  // Recent Chapters
  const recentChapters = useMemo(() => {
    const list: { chapter: any; act: any }[] = [];
    project.acts.forEach(act => {
      act.chapters.forEach(ch => {
        list.push({ chapter: ch, act });
      });
    });
    return list.slice(0, 4);
  }, [project.acts]);

  const handleContinueWriting = () => {
    if (currentChapter?.chapter?.id) {
      setActiveChapterId(currentChapter.chapter.id);
    }
    if (currentScene?.id) {
      setActiveSceneId(currentScene.id);
    }
    setActiveTab('editor');
  };

  const handleOpenChapter = (chId: string) => {
    setActiveChapterId(chId);
    setActiveTab('editor');
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-y-auto select-none font-sans"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <div className="max-w-3xl mx-auto w-full px-6 py-10 space-y-8">
        {/* Editorial Manuscript Heading */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            {project.metadata.author || 'Author'} · {project.metadata.genre || 'Manuscript'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-100">
            {project.metadata.title || 'Untitled Manuscript'}
          </h1>
          <div className="text-xs text-zinc-400 font-mono pt-1">
            {currentWords.toLocaleString()} / {targetWords.toLocaleString()} words
          </div>
        </div>

        {/* PRIMARY ACTION CARD: "What should I work on?" */}
        <div 
          className="rounded-lg border p-6"
          style={{ 
            backgroundColor: theme.pageBg,
            borderColor: theme.pageBorder,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <div className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">
                {currentChapter?.act?.title || 'Act I'} · Chapter {currentChapter?.chapter?.order || 1}
              </div>

              <h2 className="text-lg font-serif font-bold text-zinc-100">
                {currentChapter?.chapter?.title || 'Current Chapter'}
              </h2>

              {currentScene ? (
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Current Scene: <span className="font-medium text-zinc-100">"{currentScene.title}"</span>
                  {currentScene.goal ? ` — Goal: ${currentScene.goal}` : ''}
                </p>
              ) : currentChapter?.chapter?.synopsis ? (
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {currentChapter.chapter.synopsis}
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  Ready to continue writing.
                </p>
              )}

              {nextPlannedScene && (
                <div className="pt-1 text-[11px] text-zinc-400">
                  <span className="text-zinc-500">Next planned: </span>
                  <span className="text-zinc-300">"{nextPlannedScene.title}"</span>
                </div>
              )}
            </div>

            {/* Prominent Action Button */}
            <button
              onClick={handleContinueWriting}
              className="px-5 py-2.5 rounded bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs transition-colors flex items-center justify-center space-x-2 shrink-0 cursor-pointer shadow-xs"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>CONTINUE WRITING</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>

        {/* Narrative Status Overview: Threads & Continuity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Threads Summary */}
          <div 
            onClick={() => setActiveTab('threads')}
            className="rounded-lg border p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors space-y-3"
            style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
          >
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium text-zinc-200">Active Story Threads</span>
              <span className="text-[10px] text-zinc-500 font-mono">View All →</span>
            </div>

            {activeThreads.length === 0 ? (
              <p className="text-xs text-zinc-500">No active subplots in flight.</p>
            ) : (
              <div className="space-y-1.5">
                {activeThreads.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 truncate max-w-[200px]">{t.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono capitalize">{t.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Continuity Summary */}
          <div 
            onClick={() => setActiveTab('continuity')}
            className="rounded-lg border p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors space-y-3"
            style={{ backgroundColor: theme.pageBg, borderColor: theme.pageBorder }}
          >
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium text-zinc-200">Continuity Diagnostic</span>
              <span className="text-[10px] text-zinc-500 font-mono">Audit →</span>
            </div>

            {continuityWarnings.length === 0 ? (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Story records consistent</span>
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                <div className="text-xs text-amber-300 font-medium">
                  {continuityWarnings.length} unresolved warning{continuityWarnings.length === 1 ? '' : 's'}
                </div>
                <p className="text-[11px] text-zinc-400 truncate">
                  {continuityWarnings[0]?.title}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-400 text-[10px] uppercase tracking-wider font-mono">
              Recent Documents
            </span>
            <button
              onClick={() => setActiveTab('outliner')}
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
            >
              Outliner →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {recentChapters.map(({ chapter, act }) => (
              <div
                key={chapter.id}
                onClick={() => handleOpenChapter(chapter.id)}
                className="rounded border p-3 hover:bg-zinc-800/40 cursor-pointer transition-colors space-y-1 group"
                style={{ 
                  backgroundColor: theme.pageBg,
                  borderColor: theme.pageBorder 
                }}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>{act.title}</span>
                  <span>{chapter.wordCount}w</span>
                </div>
                <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                  {chapter.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
