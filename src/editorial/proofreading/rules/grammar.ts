import { Finding, ProofreadingRule, ProofreadingRuleContext } from '../types';

/**
 * 1. SUBJECT-VERB AGREEMENT & TENSE INCONSISTENCY PATTERNS
 */
interface PatternRule {
  id: string;
  regex: RegExp;
  title: string;
  message: string;
  suggest: (match: RegExpExecArray) => string;
}

const GRAMMAR_PATTERNS: PatternRule[] = [
  // Subject-Verb Agreement: they was / we was / you was
  {
    id: 'gram-they-was',
    regex: /\b(they|we|you)\s+was\b/gi,
    title: 'Subject-Verb Agreement',
    message: 'Possible agreement issue: plural subject with singular past verb "was".',
    suggest: (m) => `${m[1]} were`,
  },
  // he were / she were (not subjunctive like "if he were" / "as though he were")
  {
    id: 'gram-he-were',
    regex: /(?<!\bif\s+|\bas\s+though\s+|\bas\s+if\s+|\bwish\s+|\bwished\s+)\b(he|she|it)\s+were\b/gi,
    title: 'Subject-Verb Agreement',
    message: 'Possible agreement issue: singular subject with "were".',
    suggest: (m) => `${m[1]} was`,
  },
  // they is / we is
  {
    id: 'gram-they-is',
    regex: /\b(they|we)\s+is\b/gi,
    title: 'Subject-Verb Agreement',
    message: 'Possible agreement issue: plural subject with singular "is".',
    suggest: (m) => `${m[1]} are`,
  },
  // Modal verb + "of" (could of, should of, would of, must of, might of)
  {
    id: 'gram-modal-of',
    regex: /\b(could|should|would|must|might)\s+of\b/gi,
    title: 'Incorrect Modal Construction',
    message: 'Informal or phonetic mistake: replace "of" with "have".',
    suggest: (m) => `${m[1]} have`,
  },
  // Confused Words: "their is / their are" -> "there is / there are"
  {
    id: 'gram-their-is',
    regex: /\btheir\s+(is|are|was|were|will\s+be|has\s+been|have\s+been)\b/gi,
    title: 'Confused Word (their / there)',
    message: 'Possessive "their" used where existential "there" is likely intended.',
    suggest: (m) => `there ${m[1]}`,
  },
  // Confused Words: "their going to / planning to" -> "they're going to / planning to"
  {
    id: 'gram-their-going',
    regex: /\btheir\s+(going\s+to|planning\s+to|about\s+to|not\s+going)\b/gi,
    title: 'Confused Word (their / they\'re)',
    message: 'Possessive "their" used where contraction "they\'re" (they are) is likely intended.',
    suggest: (m) => `they're ${m[1]}`,
  },
  // Confused Words: "they're" + noun (they're house / they're eyes)
  {
    id: 'gram-theyre-noun',
    regex: /\bthey['’]re\s+(house|car|eyes|hands|room|sword|voice|faces|clothes|weapons|home|way|father|mother|brother|sister|leader)\b/gi,
    title: 'Confused Word (they\'re / their)',
    message: 'Contraction "they\'re" (they are) used before a noun. Did you mean "their"?',
    suggest: (m) => `their ${m[1]}`,
  },
  // Confused Words: "it's" + possessive noun (it's color / it's weight / it's gates)
  {
    id: 'gram-its-possessive',
    regex: /\bit['’]s\s+(color|weight|size|surface|gates|walls|eyes|blade|hilt|door|name|purpose|origin|source)\b/gi,
    title: 'Confused Word (it\'s / its)',
    message: 'Contraction "it\'s" (it is) used where possessive "its" is likely intended.',
    suggest: (m) => `its ${m[1]}`,
  },
  // Confused Words: "its a" / "its not" / "its time"
  {
    id: 'gram-its-contraction',
    regex: /\bits\s+(a|an|the|not|been|already|clear|evident|obvious|time|too\s+late|hard|difficult)\b/gi,
    title: 'Confused Word (its / it\'s)',
    message: 'Possessive "its" used where contraction "it\'s" (it is / it has) is likely intended.',
    suggest: (m) => `it's ${m[1]}`,
  },
  // Confused Words: "your welcome" / "your right"
  {
    id: 'gram-your-welcome',
    regex: /\byour\s+(welcome|going\s+to|planning\s+to|supposed\s+to)\b/gi,
    title: 'Confused Word (your / you\'re)',
    message: 'Possessive "your" used where contraction "you\'re" (you are) is likely intended.',
    suggest: (m) => `you're ${m[1]}`,
  },
  // Confused Words: "more then" / "better then" / "less then" / "rather then"
  {
    id: 'gram-then-comparison',
    regex: /\b(more|less|better|worse|greater|faster|slower|taller|shorter|darker|brighter|rather|other)\s+then\b/gi,
    title: 'Comparative Particle (then / than)',
    message: 'Adverb "then" used in a comparison where "than" is expected.',
    suggest: (m) => `${m[1]} than`,
  },
  // Confused Words: "loose" vs "lose"
  {
    id: 'gram-loose-lose',
    regex: /\bloose\s+(the\s+battle|the\s+war|his\s+mind|her\s+mind|their\s+way|control|consciousness|hope|patience)\b/gi,
    title: 'Confused Word (loose / lose)',
    message: 'Adjective "loose" used where verb "lose" is likely intended.',
    suggest: (m) => `lose ${m[1]}`,
  },
  // Confused Words: "had no affect" / "take affect"
  {
    id: 'gram-affect-effect',
    regex: /\b(had\s+no|little|take|in)\s+affect\b/gi,
    title: 'Confused Word (affect / effect)',
    message: 'Verb "affect" used where noun "effect" is expected.',
    suggest: (m) => `${m[1]} effect`,
  }
];

export const GrammarRule: ProofreadingRule = {
  id: 'gram-patterns',
  name: 'Grammar & Usage Patterns',
  category: 'grammar',
  passId: 'grammar',
  severity: 'error',
  check: (context: ProofreadingRuleContext): Finding[] => {
    const findings: Finding[] = [];
    const text = context.plainText;

    // 1. Run pattern checks
    GRAMMAR_PATTERNS.forEach(rule => {
      const regex = new RegExp(rule.regex.source, rule.regex.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const fullMatch = match[0];
        const suggested = rule.suggest(match);

        findings.push({
          id: `find-gram-${rule.id}-${context.chapter.id}-${match.index}`,
          ruleId: rule.id,
          category: 'grammar',
          passId: 'grammar',
          severity: 'error',
          title: rule.title,
          message: rule.message,
          originalText: fullMatch,
          suggestedText: suggested,
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
    });

    // 2. Article errors: "a" before vowels & "an" before consonants
    const aBeforeVowelRegex = /\b(a)\s+(apple|hour|eagle|enemy|incident|island|uncle|omen|obstacle|artifact|amulet|order|elder|assassin|emperor|empress)\b/gi;
    let aMatch: RegExpExecArray | null;
    while ((aMatch = aBeforeVowelRegex.exec(text)) !== null) {
      const fullMatch = aMatch[0];
      const isCapital = aMatch[1][0] === aMatch[1][0].toUpperCase();
      const article = isCapital ? 'An' : 'an';
      const suggested = `${article} ${aMatch[2]}`;

      findings.push({
        id: `find-gram-article-a-${context.chapter.id}-${aMatch.index}`,
        ruleId: 'gram-article-vowel',
        category: 'grammar',
        passId: 'grammar',
        severity: 'warning',
        title: 'Article Agreement (a / an)',
        message: `Use "an" before vowel sounds ("${fullMatch}").`,
        originalText: fullMatch,
        suggestedText: suggested,
        position: {
          start: aMatch.index,
          end: aMatch.index + fullMatch.length,
        },
        chapterId: context.chapter.id,
        chapterTitle: context.chapter.title,
        sceneId: context.scene?.id,
        sceneTitle: context.scene?.title,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    const anBeforeConsonantRegex = /\b(an)\s+(car|sword|man|woman|book|great|castle|king|queen|knight|person|warrior|soldier|guard|tower|city|fortress)\b/gi;
    let anMatch: RegExpExecArray | null;
    while ((anMatch = anBeforeConsonantRegex.exec(text)) !== null) {
      const fullMatch = anMatch[0];
      const isCapital = anMatch[1][0] === anMatch[1][0].toUpperCase();
      const article = isCapital ? 'A' : 'a';
      const suggested = `${article} ${anMatch[2]}`;

      findings.push({
        id: `find-gram-article-an-${context.chapter.id}-${anMatch.index}`,
        ruleId: 'gram-article-consonant',
        category: 'grammar',
        passId: 'grammar',
        severity: 'warning',
        title: 'Article Agreement (a / an)',
        message: `Use "a" before consonant sounds ("${fullMatch}").`,
        originalText: fullMatch,
        suggestedText: suggested,
        position: {
          start: anMatch.index,
          end: anMatch.index + fullMatch.length,
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
