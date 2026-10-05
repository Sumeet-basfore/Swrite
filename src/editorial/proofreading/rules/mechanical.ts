import { Finding, ProofreadingRule, ProofreadingRuleContext } from '../types';

/**
 * Common typo and spelling error mapping
 */
export const COMMON_TYPOS: Record<string, string> = {
  'teh': 'the',
  'recieve': 'receive',
  'recieved': 'received',
  'recieving': 'receiving',
  'seperate': 'separate',
  'seperated': 'separated',
  'seperation': 'separation',
  'definately': 'definitely',
  'occured': 'occurred',
  'occurence': 'occurrence',
  'untill': 'until',
  'wierd': 'weird',
  'truely': 'truly',
  'tommorrow': 'tomorrow',
  'goverment': 'government',
  'neccessary': 'necessary',
  'accomodate': 'accommodate',
  'acheive': 'achieve',
  'acheived': 'achieved',
  'embarass': 'embarrass',
  'embarassed': 'embarrassed',
  'priviledge': 'privilege',
  'calender': 'calendar',
  'independant': 'independent',
  'mispell': 'misspell',
  'peice': 'piece',
  'foriegn': 'foreign',
  'guarentee': 'guarantee',
  'pronounciation': 'pronunciation',
  'writting': 'writing',
  'suprise': 'surprise',
  'suprised': 'surprised',
  'alot': 'a lot',
  'noone': 'no one',
  'beleive': 'believe',
  'beleived': 'believed',
  'acheivement': 'achievement',
  'enviroment': 'environment',
  'existance': 'existence',
  'foward': 'forward',
  'garantee': 'guarantee',
  'happend': 'happened',
  'knowlege': 'knowledge',
  'milennium': 'millennium',
  'noticable': 'noticeable',
  'posession': 'possession',
  'relevent': 'relevant',
  'religous': 'religious',
  'resistence': 'resistance',
  'tendancy': 'tendency',
  'threshhold': 'threshold',
  'unforseen': 'unforeseen',
  'vaccum': 'vacuum',
  'im': "I'm",
  'dont': "don't",
  'cant': "can't",
  'wont': "won't",
  'didnt': "didn't",
  'doesnt': "doesn't",
  'isnt': "isn't",
  'arent': "aren't",
  'wasnt': "wasn't",
  'werent': "weren't",
  'couldnt': "couldn't",
  'shouldnt': "shouldn't",
  'wouldnt': "wouldn't",
  'weather': 'whether', // Checked in context or homophone
};

/**
 * 1. SPELLING RULE
 */
export const SpellingRule: ProofreadingRule = {
  id: 'mech-spelling',
  name: 'Spelling & Typographical Errors',
  category: 'mechanical',
  passId: 'spelling',
  severity: 'error',
  check: (context: ProofreadingRuleContext): Finding[] => {
    const findings: Finding[] = [];
    const text = context.plainText;
    const customDict = new Set((context.config.customDictionary || []).map(w => w.toLowerCase()));

    // Match words
    const wordRegex = /\b([a-zA-Z]{2,})\b/g;
    let match: RegExpExecArray | null;

    while ((match = wordRegex.exec(text)) !== null) {
      const originalWord = match[1];
      const lower = originalWord.toLowerCase();

      if (customDict.has(lower)) continue;

      if (COMMON_TYPOS[lower]) {
        const replacement = COMMON_TYPOS[lower];
        // Match casing of original
        const suggested = originalWord[0] === originalWord[0].toUpperCase() && originalWord[1] !== originalWord[1]?.toUpperCase()
          ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
          : replacement;

        findings.push({
          id: `find-spelling-${context.chapter.id}-${match.index}`,
          ruleId: 'mech-spelling',
          category: 'mechanical',
          passId: 'spelling',
          severity: 'error',
          title: 'Possible Spelling Issue',
          message: `"${originalWord}" may be misspelled. Did you mean "${suggested}"?`,
          originalText: originalWord,
          suggestedText: suggested,
          position: {
            start: match.index,
            end: match.index + originalWord.length,
          },
          chapterId: context.chapter.id,
          chapterTitle: context.chapter.title,
          sceneId: context.scene?.id,
          sceneTitle: context.scene?.title,
          actId: context.act?.id,
          actTitle: context.act?.title,
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }
    }

    return findings;
  }
};

/**
 * 2. PUNCTUATION & SPACING RULES
 */
export const PunctuationRule: ProofreadingRule = {
  id: 'mech-punctuation',
  name: 'Punctuation & Spacing Checks',
  category: 'mechanical',
  passId: 'punctuation',
  severity: 'warning',
  check: (context: ProofreadingRuleContext): Finding[] => {
    const findings: Finding[] = [];
    const text = context.plainText;

    // 1. Duplicate spaces (excluding newlines/indentation)
    const doubleSpaceRegex = /([^\n\r\t ])  +([^\n\r\t ])/g;
    let dsMatch: RegExpExecArray | null;
    while ((dsMatch = doubleSpaceRegex.exec(text)) !== null) {
      const fullMatch = dsMatch[0];
      const startIdx = dsMatch.index + dsMatch[1].length;
      const spaceCount = fullMatch.length - dsMatch[1].length - dsMatch[2].length;
      
      findings.push({
        id: `find-punct-spaces-${context.chapter.id}-${startIdx}`,
        ruleId: 'mech-punctuation-spaces',
        category: 'mechanical',
        passId: 'punctuation',
        severity: 'warning',
        title: 'Duplicate Spaces',
        message: `Found ${spaceCount} consecutive spaces between words.`,
        originalText: ' '.repeat(spaceCount),
        suggestedText: ' ',
        position: {
          start: startIdx,
          end: startIdx + spaceCount,
        },
        chapterId: context.chapter.id,
        chapterTitle: context.chapter.title,
        sceneId: context.scene?.id,
        sceneTitle: context.scene?.title,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Space before punctuation (e.g. "word , " or "word . ")
    const spaceBeforePunctRegex = /\b(\w+)\s+([,.;:!?])/g;
    let sbpMatch: RegExpExecArray | null;
    while ((sbpMatch = spaceBeforePunctRegex.exec(text)) !== null) {
      const orig = sbpMatch[0];
      const word = sbpMatch[1];
      const punct = sbpMatch[2];
      const suggested = `${word}${punct}`;

      findings.push({
        id: `find-punct-space-before-${context.chapter.id}-${sbpMatch.index}`,
        ruleId: 'mech-punctuation-spacing',
        category: 'mechanical',
        passId: 'punctuation',
        severity: 'warning',
        title: 'Space Before Punctuation',
        message: `Unexpected space before punctuation "${punct}".`,
        originalText: orig,
        suggestedText: suggested,
        position: {
          start: sbpMatch.index,
          end: sbpMatch.index + orig.length,
        },
        chapterId: context.chapter.id,
        chapterTitle: context.chapter.title,
        sceneId: context.scene?.id,
        sceneTitle: context.scene?.title,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Repeated commas or semicolons (,, or ;;)
    const repeatPunctRegex = /([,;])\1+/g;
    let rpMatch: RegExpExecArray | null;
    while ((rpMatch = repeatPunctRegex.exec(text)) !== null) {
      const orig = rpMatch[0];
      findings.push({
        id: `find-punct-repeat-${context.chapter.id}-${rpMatch.index}`,
        ruleId: 'mech-punctuation-repeated',
        category: 'mechanical',
        passId: 'punctuation',
        severity: 'warning',
        title: 'Repeated Punctuation',
        message: `Consecutive punctuation marks "${orig}".`,
        originalText: orig,
        suggestedText: rpMatch[1],
        position: {
          start: rpMatch.index,
          end: rpMatch.index + orig.length,
        },
        chapterId: context.chapter.id,
        chapterTitle: context.chapter.title,
        sceneId: context.scene?.id,
        sceneTitle: context.scene?.title,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    // Double period (..)
    const doubleDotRegex = /(?<!\.)\.\.(?!\.)/g;
    let ddMatch: RegExpExecArray | null;
    while ((ddMatch = doubleDotRegex.exec(text)) !== null) {
      const orig = ddMatch[0];
      findings.push({
        id: `find-punct-doubledot-${context.chapter.id}-${ddMatch.index}`,
        ruleId: 'mech-punctuation-repeated',
        category: 'mechanical',
        passId: 'punctuation',
        severity: 'warning',
        title: 'Accidental Double Period',
        message: 'Found two consecutive periods ".." instead of a single period or ellipsis "...".',
        originalText: orig,
        suggestedText: '.',
        position: {
          start: ddMatch.index,
          end: ddMatch.index + orig.length,
        },
        chapterId: context.chapter.id,
        chapterTitle: context.chapter.title,
        sceneId: context.scene?.id,
        sceneTitle: context.scene?.title,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    // 4. Inconsistent dashes: double hyphens "--" instead of em-dash "—"
    const doubleHyphenRegex = /([a-zA-Z0-9])--([a-zA-Z0-9])/g;
    let dhMatch: RegExpExecArray | null;
    while ((dhMatch = doubleHyphenRegex.exec(text)) !== null) {
      const orig = dhMatch[0];
      const suggested = `${dhMatch[1]}—${dhMatch[2]}`;
      findings.push({
        id: `find-punct-dash-${context.chapter.id}-${dhMatch.index}`,
        ruleId: 'mech-punctuation-dash',
        category: 'mechanical',
        passId: 'punctuation',
        severity: 'info',
        title: 'Inconsistent Dash',
        message: 'Double hyphen "--" used instead of em-dash "—".',
        originalText: '--',
        suggestedText: '—',
        position: {
          start: dhMatch.index + dhMatch[1].length,
          end: dhMatch.index + dhMatch[1].length + 2,
        },
        chapterId: context.chapter.id,
        chapterTitle: context.chapter.title,
        sceneId: context.scene?.id,
        sceneTitle: context.scene?.title,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    // 5. Inconsistent ellipses: four or more dots "...."
    const excessiveDotsRegex = /\.{4,}/g;
    let edMatch: RegExpExecArray | null;
    while ((edMatch = excessiveDotsRegex.exec(text)) !== null) {
      const orig = edMatch[0];
      findings.push({
        id: `find-punct-ellipsis-${context.chapter.id}-${edMatch.index}`,
        ruleId: 'mech-punctuation-ellipsis',
        category: 'mechanical',
        passId: 'punctuation',
        severity: 'info',
        title: 'Excessive Ellipsis Dots',
        message: `Found ${orig.length} consecutive dots instead of standard ellipsis "...".`,
        originalText: orig,
        suggestedText: '...',
        position: {
          start: edMatch.index,
          end: edMatch.index + orig.length,
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
 * 3. REPETITION & DUPLICATE WORDS RULE
 */
export const RepetitionRule: ProofreadingRule = {
  id: 'mech-repetition',
  name: 'Repeated Words & Duplicate Tokens',
  category: 'mechanical',
  passId: 'repetition',
  severity: 'warning',
  check: (context: ProofreadingRuleContext): Finding[] => {
    const findings: Finding[] = [];
    const text = context.plainText;

    // Matches consecutive identical words (case-insensitive)
    const dupWordRegex = /\b([a-zA-Z]{2,})\s+\1\b/gi;
    let match: RegExpExecArray | null;

    while ((match = dupWordRegex.exec(text)) !== null) {
      const fullMatch = match[0];
      const word = match[1];

      // Exception: "had had" and "that that" can occasionally be grammatically intentional
      if (/^(had|that)$/i.test(word)) {
        continue;
      }

      findings.push({
        id: `find-repetition-dup-${context.chapter.id}-${match.index}`,
        ruleId: 'mech-repetition',
        category: 'mechanical',
        passId: 'repetition',
        severity: 'warning',
        title: 'Repeated Word',
        message: `Word "${word}" is duplicated consecutively.`,
        originalText: fullMatch,
        suggestedText: word,
        position: {
          start: match.index,
          end: match.index + fullMatch.length,
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
 * 4. CAPITALIZATION RULE
 */
export const CapitalizationRule: ProofreadingRule = {
  id: 'mech-capitalization',
  name: 'Capitalization Checks',
  category: 'mechanical',
  passId: 'spelling',
  severity: 'warning',
  check: (context: ProofreadingRuleContext): Finding[] => {
    const findings: Finding[] = [];
    const text = context.plainText;

    // 1. Lowercase standalone "i"
    const standaloneIRegex = /(^|[\s"'(])i([\s"',.!?;:)])/g;
    let iMatch: RegExpExecArray | null;
    while ((iMatch = standaloneIRegex.exec(text)) !== null) {
      const startIdx = iMatch.index + iMatch[1].length;
      findings.push({
        id: `find-cap-i-${context.chapter.id}-${startIdx}`,
        ruleId: 'mech-capitalization-i',
        category: 'mechanical',
        passId: 'spelling',
        severity: 'warning',
        title: 'Capitalization: Pronoun "I"',
        message: 'The pronoun "I" should be capitalized.',
        originalText: 'i',
        suggestedText: 'I',
        position: {
          start: startIdx,
          end: startIdx + 1,
        },
        chapterId: context.chapter.id,
        chapterTitle: context.chapter.title,
        sceneId: context.scene?.id,
        sceneTitle: context.scene?.title,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Common contractions with lowercase i (i'm, i've, i'll, i'd)
    const iContractions = /\b(i)(['’](?:m|ve|ll|d))\b/g;
    let icMatch: RegExpExecArray | null;
    while ((icMatch = iContractions.exec(text)) !== null) {
      const orig = icMatch[0];
      const suggested = `I${icMatch[2]}`;
      findings.push({
        id: `find-cap-icontract-${context.chapter.id}-${icMatch.index}`,
        ruleId: 'mech-capitalization-contract',
        category: 'mechanical',
        passId: 'spelling',
        severity: 'warning',
        title: 'Capitalization: Contraction',
        message: `"${orig}" should be capitalized as "${suggested}".`,
        originalText: orig,
        suggestedText: suggested,
        position: {
          start: icMatch.index,
          end: icMatch.index + orig.length,
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
