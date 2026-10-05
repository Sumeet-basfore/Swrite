import { Finding, ProofreadingRule, ProofreadingRuleContext } from '../types';

/**
 * Common filler phrases and concise suggestions
 */
export const FILLER_PHRASES: Record<string, string> = {
  'in order to': 'to',
  'due to the fact that': 'because',
  'at this point in time': 'now',
  'for the purpose of': 'to',
  'the reason why is because': 'the reason is that',
  'all of a sudden': 'suddenly',
  'each and every': 'each',
  'end result': 'result',
  'completely filled': 'filled',
  'basic fundamentals': 'fundamentals',
  'close proximity': 'proximity',
  'past history': 'history',
  'unexpected surprise': 'surprise',
  'final outcome': 'outcome',
};

/**
 * 1. FILLER PHRASES RULE
 */
export const FillerWordsRule: ProofreadingRule = {
  id: 'style-filler-words',
  name: 'Conciseness & Filler Phrases',
  category: 'style',
  passId: 'filler-words',
  severity: 'info',
  isStyleRule: true,
  check: (context: ProofreadingRuleContext): Finding[] => {
    // If voice preservation is on, we only check high-confidence redundant fillers
    const findings: Finding[] = [];
    const text = context.plainText;

    Object.entries(FILLER_PHRASES).forEach(([phrase, suggestion]) => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        findings.push({
          id: `find-style-filler-${context.chapter.id}-${match.index}`,
          ruleId: 'style-filler-words',
          category: 'style',
          passId: 'filler-words',
          severity: 'info',
          title: 'Possible Wordiness / Filler Phrase',
          message: `Consider simplifying "${match[0]}" to "${suggestion}".`,
          originalText: match[0],
          suggestedText: suggestion,
          position: {
            start: match.index,
            end: match.index + match[0].length,
          },
          chapterId: context.chapter.id,
          chapterTitle: context.chapter.title,
          sceneId: context.scene?.id,
          sceneTitle: context.scene?.title,
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }
    });

    return findings;
  }
};

/**
 * 2. PASSIVE VOICE RULE
 */
export const PassiveVoiceRule: ProofreadingRule = {
  id: 'style-passive-voice',
  name: 'Passive Voice Constructions',
  category: 'style',
  passId: 'passive-voice',
  severity: 'info',
  isStyleRule: true,
  check: (context: ProofreadingRuleContext): Finding[] => {
    const findings: Finding[] = [];
    const text = context.plainText;

    // Pattern: was/were/is/are/been + [verb]ed + by
    const passiveRegex = /\b(was|were|is|are|been|being)\s+([a-zA-Z]{3,}ed)\s+by\b/gi;
    let match: RegExpExecArray | null;

    while ((match = passiveRegex.exec(text)) !== null) {
      findings.push({
        id: `find-style-passive-${context.chapter.id}-${match.index}`,
        ruleId: 'style-passive-voice',
        category: 'style',
        passId: 'passive-voice',
        severity: 'info',
        title: 'Possible Passive Voice',
        message: `Passive construction "${match[0]}". Consider active phrasing if direct agency is desired.`,
        originalText: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length,
        },
        chapterId: context.chapter.id,
        chapterTitle: context.chapter.title,
        sceneId: context.scene?.id,
        sceneTitle: context.scene?.title,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    return findings;
  }
};

/**
 * 3. EXCESSIVE ADVERBS RULE
 */
export const AdverbsRule: ProofreadingRule = {
  id: 'style-adverbs',
  name: 'Adverb Frequency',
  category: 'style',
  passId: 'adverbs',
  severity: 'info',
  isStyleRule: true,
  check: (context: ProofreadingRuleContext): Finding[] => {
    const findings: Finding[] = [];
    const text = context.plainText;

    // Common -ly adverbs that often indicate telling over showing
    const adverbRegex = /\b(suddenly|quickly|slowly|angrily|softly|carefully|quietly|nervously|sadly|happily|loudly|violently|desperately|heavily)\b/gi;
    let match: RegExpExecArray | null;

    while ((match = adverbRegex.exec(text)) !== null) {
      findings.push({
        id: `find-style-adverb-${context.chapter.id}-${match.index}`,
        ruleId: 'style-adverbs',
        category: 'style',
        passId: 'adverbs',
        severity: 'info',
        title: 'Adverb Usage',
        message: `Adverb "${match[0]}" used. Consider if a stronger verb could show the action more vividly.`,
        originalText: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length,
        },
        chapterId: context.chapter.id,
        chapterTitle: context.chapter.title,
        sceneId: context.scene?.id,
        sceneTitle: context.scene?.title,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    return findings;
  }
};

/**
 * 4. SENTENCE LENGTH RULE
 */
export const SentenceLengthRule: ProofreadingRule = {
  id: 'style-sentence-length',
  name: 'Sentence Length Check',
  category: 'style',
  passId: 'sentence-length',
  severity: 'info',
  isStyleRule: true,
  check: (context: ProofreadingRuleContext): Finding[] => {
    const findings: Finding[] = [];
    const text = context.plainText;

    // Split text into sentences by period, question mark, or exclamation mark followed by space or newline
    const sentenceRegex = /([A-Z0-9"“'‘][^.!?]*[.!?])/g;
    let match: RegExpExecArray | null;

    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentenceText = match[0].trim();
      const words = sentenceText.split(/\s+/).filter(Boolean);

      if (words.length >= 45) {
        findings.push({
          id: `find-style-sentlen-${context.chapter.id}-${match.index}`,
          ruleId: 'style-sentence-length',
          category: 'style',
          passId: 'sentence-length',
          severity: 'info',
          title: 'Very Long Sentence',
          message: `Sentence contains ${words.length} words. Consider whether splitting it enhances pacing or readability.`,
          originalText: sentenceText.length > 80 ? `${sentenceText.slice(0, 77)}...` : sentenceText,
          position: {
            start: match.index,
            end: match.index + sentenceText.length,
          },
          chapterId: context.chapter.id,
          chapterTitle: context.chapter.title,
          sceneId: context.scene?.id,
          sceneTitle: context.scene?.title,
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }
    }

    return findings;
  }
};
