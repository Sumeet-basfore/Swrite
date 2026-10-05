import { 
  ProjectData, Scene, Chapter, Act 
} from '../../types';
import { 
  Finding, ProofreadingConfig, ProofreadingPassId, ProofreadingRule, 
  ProofreadingRuleContext, ProofreadingScope, ProofreadingSummary 
} from './types';
import { SpellingRule, PunctuationRule, RepetitionRule, CapitalizationRule } from './rules/mechanical';
import { GrammarRule } from './rules/grammar';
import { FillerWordsRule, PassiveVoiceRule, AdverbsRule, SentenceLengthRule } from './rules/style';
import { EntityConsistencyRule, FormattingConsistencyRule } from './rules/consistency';

/**
 * Default Proofreading Configuration
 */
export const DEFAULT_PROOFREADING_CONFIG: ProofreadingConfig = {
  preserveVoice: true, // Default ON
  scope: 'scene',      // Default Scene
  activePasses: {
    'spelling': true,
    'grammar': true,
    'punctuation': true,
    'repetition': true,
    'passive-voice': false,
    'adverbs': false,
    'sentence-length': false,
    'filler-words': false,
    'consistency-names': true,
    'consistency-formatting': true,
  },
  ignoredFindingIds: [],
  intentionalFindingIds: [],
  acceptedFindingIds: [],
  customDictionary: [],
};

/**
 * Registered Proofreading Rules
 */
export const ALL_PROOFREADING_RULES: ProofreadingRule[] = [
  SpellingRule,
  CapitalizationRule,
  PunctuationRule,
  RepetitionRule,
  GrammarRule,
  FillerWordsRule,
  PassiveVoiceRule,
  AdverbsRule,
  SentenceLengthRule,
  EntityConsistencyRule,
  FormattingConsistencyRule,
];

/**
 * Extract clean plain text from HTML prose for accurate index calculation
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Deterministic Proofreading & Editorial Engine
 */
export class ProofreadingEngine {
  static readonly DEFAULT_PROOFREADING_CONFIG = DEFAULT_PROOFREADING_CONFIG;

  /**
   * Run proofreading scan based on project data and configuration
   */
  static runAudit(
    project: ProjectData,
    options?: {
      scope?: ProofreadingScope;
      activeChapterId?: string;
      activeSceneId?: string;
      customConfig?: Partial<ProofreadingConfig>;
    }
  ): Finding[] {
    const config: ProofreadingConfig = {
      ...DEFAULT_PROOFREADING_CONFIG,
      ...(project.metadata?.proofreadingConfig || {}),
      ...(options?.customConfig || {}),
      activePasses: {
        ...DEFAULT_PROOFREADING_CONFIG.activePasses,
        ...(project.metadata?.proofreadingConfig?.activePasses || {}),
        ...(options?.customConfig?.activePasses || {}),
      },
      ignoredFindingIds: options?.customConfig?.ignoredFindingIds || project.metadata?.proofreadingConfig?.ignoredFindingIds || [],
      intentionalFindingIds: options?.customConfig?.intentionalFindingIds || project.metadata?.proofreadingConfig?.intentionalFindingIds || [],
      acceptedFindingIds: options?.customConfig?.acceptedFindingIds || project.metadata?.proofreadingConfig?.acceptedFindingIds || [],
      customDictionary: options?.customConfig?.customDictionary || project.metadata?.proofreadingConfig?.customDictionary || [],
    };

    const scope = options?.scope || config.scope || 'scene';
    const targetChapterId = options?.activeChapterId;
    const targetSceneId = options?.activeSceneId;

    const ignoredSet = new Set(config.ignoredFindingIds);
    const intentionalSet = new Set(config.intentionalFindingIds);
    const acceptedSet = new Set(config.acceptedFindingIds);

    const findings: Finding[] = [];

    // Filter rules by active passes and voice preservation
    const activeRules = ALL_PROOFREADING_RULES.filter(rule => {
      // Check if the pass is enabled in config
      if (!config.activePasses[rule.passId]) return false;

      // If preserveVoice is ON, style rules are advisory and only enabled if explicitly toggled
      if (config.preserveVoice && rule.isStyleRule && !config.activePasses[rule.passId]) {
        return false;
      }

      return true;
    });

    (project.acts || []).forEach(act => {
      (act.chapters || []).forEach(ch => {
        // Scope filter
        if (scope === 'chapter' && targetChapterId && ch.id !== targetChapterId) {
          return;
        }

        const scenes = ch.scenes && ch.scenes.length > 0 ? ch.scenes : [];

        if (scope === 'scene' && targetChapterId && ch.id === targetChapterId) {
          // Check specific scene
          const activeScene = scenes.find(s => s.id === targetSceneId) || scenes[0];
          if (activeScene) {
            const rawContent = activeScene.content || ch.content || '';
            const plainText = htmlToPlainText(rawContent);
            
            const context: ProofreadingRuleContext = {
              project,
              act,
              chapter: ch,
              scene: activeScene,
              rawText: rawContent,
              plainText,
              config,
            };

            activeRules.forEach(rule => {
              findings.push(...rule.check(context));
            });
            return;
          }
        }

        if (scope === 'scene' && targetChapterId && ch.id !== targetChapterId) {
          return;
        }

        // Chapter scope or Manuscript scope
        if (scenes.length > 0) {
          scenes.forEach(sc => {
            const rawContent = sc.content || '';
            const plainText = htmlToPlainText(rawContent);

            const context: ProofreadingRuleContext = {
              project,
              act,
              chapter: ch,
              scene: sc,
              rawText: rawContent,
              plainText,
              config,
            };

            activeRules.forEach(rule => {
              findings.push(...rule.check(context));
            });
          });
        } else {
          const rawContent = ch.content || '';
          const plainText = htmlToPlainText(rawContent);

          const context: ProofreadingRuleContext = {
            project,
            act,
            chapter: ch,
            rawText: rawContent,
            plainText,
            config,
          };

          activeRules.forEach(rule => {
            findings.push(...rule.check(context));
          });
        }
      });
    });

    // Annotate findings with user status (ignored, intentional, accepted)
    return findings.map(f => {
      if (ignoredSet.has(f.id)) return { ...f, status: 'ignored' };
      if (intentionalSet.has(f.id)) return { ...f, status: 'intentional' };
      if (acceptedSet.has(f.id)) return { ...f, status: 'accepted' };
      return f;
    });
  }

  /**
   * Run standalone text audit on arbitrary string
   */
  static auditText(
    text: string,
    optionsOrProject?: {
      project?: ProjectData;
      chapter?: Chapter;
      scene?: Scene;
      scope?: ProofreadingScope;
      config?: Partial<ProofreadingConfig>;
    } | ProjectData,
    chapterArg?: Chapter,
    sceneArg?: Scene,
    customConfigArg?: Partial<ProofreadingConfig>
  ): Finding[] {
    let project: ProjectData;
    let chapter: Chapter | undefined;
    let scene: Scene | undefined;
    let customConfig: Partial<ProofreadingConfig> | undefined;

    if (optionsOrProject && 'acts' in optionsOrProject) {
      project = optionsOrProject;
      chapter = chapterArg;
      scene = sceneArg;
      customConfig = customConfigArg;
    } else if (optionsOrProject && typeof optionsOrProject === 'object') {
      const opts = optionsOrProject as {
        project?: ProjectData;
        chapter?: Chapter;
        scene?: Scene;
        config?: Partial<ProofreadingConfig>;
      };
      project = opts.project || ({ acts: [], codex: [], characters: [], locations: [], factions: [], items: [], events: [], storyArcs: [], plotThreads: [], researchNotes: [], metadata: { proofreadingConfig: DEFAULT_PROOFREADING_CONFIG } } as any);
      chapter = opts.chapter;
      scene = opts.scene;
      customConfig = opts.config;
    } else {
      project = { acts: [], codex: [], characters: [], locations: [], factions: [], items: [], events: [], storyArcs: [], plotThreads: [], researchNotes: [], metadata: { proofreadingConfig: DEFAULT_PROOFREADING_CONFIG } } as any;
    }

    if (!chapter) {
      chapter = project.acts?.[0]?.chapters?.[0] || {
        id: 'ch-standalone',
        title: 'Standalone Text',
        content: text,
        wordCount: 0,
        status: 'draft',
        sceneOrder: [],
        scenes: []
      };
    }

    const config: ProofreadingConfig = {
      ...DEFAULT_PROOFREADING_CONFIG,
      ...(customConfig || {}),
      activePasses: {
        ...DEFAULT_PROOFREADING_CONFIG.activePasses,
        ...(customConfig?.activePasses || {}),
      },
    };

    const plainText = htmlToPlainText(text);
    const context: ProofreadingRuleContext = {
      project,
      chapter,
      scene,
      rawText: text,
      plainText,
      config,
    };

    const activeRules = ALL_PROOFREADING_RULES.filter(r => config.activePasses[r.passId]);
    const findings: Finding[] = [];

    activeRules.forEach(r => {
      findings.push(...r.check(context));
    });

    return findings;
  }

  /**
   * Calculate summary metrics from findings array
   */
  static getSummary(findings: Finding[]): ProofreadingSummary {
    const openFindings = findings.filter(f => f.status === 'open');

    const byCategory: Record<string, number> = {
      mechanical: 0,
      grammar: 0,
      style: 0,
      consistency: 0,
    };

    const byPass: Record<string, number> = {
      'spelling': 0,
      'grammar': 0,
      'punctuation': 0,
      'repetition': 0,
      'passive-voice': 0,
      'adverbs': 0,
      'sentence-length': 0,
      'filler-words': 0,
      'consistency-names': 0,
      'consistency-formatting': 0,
    };

    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    openFindings.forEach(f => {
      byCategory[f.category] = (byCategory[f.category] || 0) + 1;
      byPass[f.passId] = (byPass[f.passId] || 0) + 1;

      if (f.severity === 'error') errorCount++;
      else if (f.severity === 'warning') warningCount++;
      else infoCount++;
    });

    return {
      total: openFindings.length,
      mechanicalCount: byCategory.mechanical || 0,
      grammarCount: byCategory.grammar || 0,
      punctuationCount: byPass.punctuation || 0,
      styleCount: byCategory.style || 0,
      consistencyCount: byCategory.consistency || 0,
      errorCount,
      warningCount,
      infoCount,
      byCategory: byCategory as any,
      byPass: byPass as any,
      findings,
    };
  }

  /**
   * Apply suggestion: replaces original text with suggested text in chapter or scene HTML
   */
  static acceptFinding(project: ProjectData, finding: Finding): ProjectData {
    if (!finding.suggestedText) return project;

    const p = JSON.parse(JSON.stringify(project)) as ProjectData;
    let modified = false;

    // Find target chapter & scene
    for (const act of p.acts || []) {
      for (const ch of act.chapters || []) {
        if (ch.id === finding.chapterId) {
          if (finding.sceneId && ch.scenes) {
            const sc = ch.scenes.find(s => s.id === finding.sceneId);
            if (sc && sc.content) {
              sc.content = sc.content.replace(finding.originalText, finding.suggestedText);
              sc.updatedAt = new Date().toISOString();
              modified = true;
              break;
            }
          }

          if (!modified && ch.content) {
            ch.content = ch.content.replace(finding.originalText, finding.suggestedText);
            ch.updatedAt = new Date().toISOString();
            modified = true;
            break;
          }
        }
      }
      if (modified) break;
    }

    // Record finding as accepted in config
    p.metadata = p.metadata || {};
    p.metadata.proofreadingConfig = p.metadata.proofreadingConfig || { ...DEFAULT_PROOFREADING_CONFIG };
    p.metadata.proofreadingConfig.acceptedFindingIds = p.metadata.proofreadingConfig.acceptedFindingIds || [];
    if (!p.metadata.proofreadingConfig.acceptedFindingIds.includes(finding.id)) {
      p.metadata.proofreadingConfig.acceptedFindingIds.push(finding.id);
    }

    return p;
  }

  /**
   * Ignore finding (dismiss for this session / project)
   */
  static ignoreFinding(project: ProjectData, findingId: string): ProjectData {
    const p = JSON.parse(JSON.stringify(project)) as ProjectData;
    p.metadata = p.metadata || {};
    p.metadata.proofreadingConfig = p.metadata.proofreadingConfig || { ...DEFAULT_PROOFREADING_CONFIG };
    p.metadata.proofreadingConfig.ignoredFindingIds = p.metadata.proofreadingConfig.ignoredFindingIds || [];
    if (!p.metadata.proofreadingConfig.ignoredFindingIds.includes(findingId)) {
      p.metadata.proofreadingConfig.ignoredFindingIds.push(findingId);
    }
    return p;
  }

  /**
   * Mark finding as intentional authorial choice
   */
  static markFindingIntentional(project: ProjectData, findingId: string): ProjectData {
    const p = JSON.parse(JSON.stringify(project)) as ProjectData;
    p.metadata = p.metadata || {};
    p.metadata.proofreadingConfig = p.metadata.proofreadingConfig || { ...DEFAULT_PROOFREADING_CONFIG };
    p.metadata.proofreadingConfig.intentionalFindingIds = p.metadata.proofreadingConfig.intentionalFindingIds || [];
    if (!p.metadata.proofreadingConfig.intentionalFindingIds.includes(findingId)) {
      p.metadata.proofreadingConfig.intentionalFindingIds.push(findingId);
    }
    return p;
  }
}
