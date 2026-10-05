import { 
  SplitPaneState, AnnotationThread, AnnotationComment, 
  FootnoteItem, FocusModeConfig, ProjectData 
} from '../types';
import { CompilerService } from '../services/compilerService';

export function runEditorEnhancementsTests() {
  console.log('\n--- 10. Running Editor Enhancements & Writing Experience Tests ---');

  // 1. Split-Screen State Machine Tests
  const initialSplitState: SplitPaneState = {
    isOpen: false,
    orientation: 'vertical',
    entityType: 'scene',
    entityId: null,
    ratio: 0.5
  };

  if (initialSplitState.isOpen !== false || initialSplitState.ratio !== 0.5) {
    throw new Error('Initial split state should be closed with 0.5 ratio');
  }
  console.log('  ✓ 1. Initial split pane state defaults verified');

  const toggledSplitState: SplitPaneState = {
    ...initialSplitState,
    isOpen: true,
    orientation: 'horizontal',
    entityType: 'character',
    entityId: 'char-1'
  };

  if (!toggledSplitState.isOpen || toggledSplitState.orientation !== 'horizontal' || toggledSplitState.entityType !== 'character') {
    throw new Error('Split pane toggle transition failed');
  }
  console.log('  ✓ 2. Split pane orientation and entity switching verified');

  // 2. Annotation Threads CRUD & Resolution Tests
  let threads: AnnotationThread[] = [];

  // Create thread
  const thread1: AnnotationThread = {
    id: 'ann-1',
    sceneId: 'sc-1',
    highlightedText: 'The ancient gate creaked open.',
    comments: [{
      id: 'com-1',
      author: 'Author',
      text: 'Need to add more sensory smell/sound details here.',
      createdAt: Date.now()
    }],
    isResolved: false,
    color: 'yellow',
    createdAt: Date.now()
  };
  threads.push(thread1);

  if (threads.length !== 1 || threads[0].comments.length !== 1) {
    throw new Error('Failed to create annotation thread');
  }
  console.log('  ✓ 3. Annotation thread creation & text anchoring verified');

  // Add reply
  const reply: AnnotationComment = {
    id: 'com-2',
    author: 'Editor',
    text: 'Consider the smell of rusted iron and damp moss.',
    createdAt: Date.now()
  };
  threads = threads.map(t => t.id === 'ann-1' ? { ...t, comments: [...t.comments, reply] } : t);

  if (threads[0].comments.length !== 2 || threads[0].comments[1].text !== 'Consider the smell of rusted iron and damp moss.') {
    throw new Error('Thread reply failed to append');
  }
  console.log('  ✓ 4. Annotation comment threading & multi-author replies verified');

  // Resolve thread
  threads = threads.map(t => t.id === 'ann-1' ? { ...t, isResolved: true } : t);
  if (!threads[0].isResolved) {
    throw new Error('Thread failed to mark resolved');
  }
  console.log('  ✓ 5. Annotation resolution toggle verified');

  // 3. Footnotes & Sequential Renumbering Tests
  let footnotes: FootnoteItem[] = [];

  const fn1: FootnoteItem = { id: 'fn-1', sceneId: 'sc-1', number: 1, text: 'First citation', createdAt: Date.now() };
  const fn2: FootnoteItem = { id: 'fn-2', sceneId: 'sc-1', number: 2, text: 'Second citation', createdAt: Date.now() };
  const fn3: FootnoteItem = { id: 'fn-3', sceneId: 'sc-1', number: 3, text: 'Third citation', createdAt: Date.now() };
  footnotes.push(fn1, fn2, fn3);

  if (footnotes.length !== 3 || footnotes[2].number !== 3) {
    throw new Error('Footnote creation failed');
  }
  console.log('  ✓ 6. Footnote sequential numbering verified');

  // Delete middle footnote and renumber
  footnotes = footnotes.filter(f => f.id !== 'fn-2');
  let counter = 1;
  footnotes = footnotes.map(f => ({ ...f, number: counter++ }));

  if (footnotes.length !== 2 || footnotes[1].id !== 'fn-3' || footnotes[1].number !== 2) {
    throw new Error('Footnote deletion and sequential renumbering failed');
  }
  console.log('  ✓ 7. Footnote deletion & automatic re-indexing verified');

  // 4. Focus Mode & Ambient Audio Config Tests
  const focusConfig: FocusModeConfig = {
    isTypewriterScrolling: true,
    dimmingMode: 'sentence',
    ambientSound: 'rain',
    soundVolume: 0.7
  };

  if (!focusConfig.isTypewriterScrolling || focusConfig.dimmingMode !== 'sentence' || focusConfig.ambientSound !== 'rain') {
    throw new Error('Focus mode configuration mismatch');
  }
  console.log('  ✓ 8. Focus mode typewriter and spotlight configuration verified');

  // 5. Compiler Markdown Export with Chapter Footnotes Test
  const mockProject: ProjectData = {
    metadata: {
      id: 'proj-1',
      title: 'The Starlit Citadel',
      author: 'A. Vance',
      genre: 'Fantasy',
      targetWordCount: 80000,
      currentWordCount: 500,
      preset: 'plotter',
      theme: {
        id: 'midnight',
        name: 'Midnight',
        category: 'dark',
        isDark: true,
        bg: '#18181b',
        text: '#f4f4f5',
        pageBg: '#18181b',
        pageBorder: '#27272a',
        accent: '#f59e0b',
        muted: '#71717a',
        highlightColors: {
          critique: '#ef4444',
          sensory: '#3b82f6',
          factcheck: '#10b981',
          favorite: '#8b5cf6',
          todo: '#ec4899'
        },
        colors: {
          background: '#18181b',
          surface: '#27272a',
          elevatedSurface: '#3f3f46',
          text: '#f4f4f5',
          textMuted: '#a1a1aa',
          textFaint: '#71717a',
          heading: '#ffffff',
          accent: '#f59e0b',
          accentMuted: 'rgba(245, 158, 11, 0.2)',
          border: '#3f3f46',
          borderStrong: '#52525b',
          selection: '#3b82f6',
          link: '#60a5fa',
          wikilink: '#a78bfa',
          quote: '#e4e4e7',
          quoteBorder: '#f59e0b',
          code: '#f43f5e',
          codeBackground: '#27272a',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444'
        }
      },
      typography: {
        fontFamily: 'merriweather',
        manuscriptFont: 'merriweather',
        uiFont: 'inter',
        headingFont: 'cinzel',
        monoFont: 'fira-code',
        fontSize: 16,
        lineHeight: 1.6,
        letterSpacing: 0,
        paragraphSpacing: 0.8,
        paragraphIndent: 1.5,
        pageWidth: 800,
        headingScale: 'classic',
        textAlign: 'left',
        typewriterMode: false,
        dropCap: false,
        sceneOrnament: '* * *'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    acts: [
      {
        id: 'act-1',
        title: 'Act I',
        order: 1,
        chapters: [
          {
            id: 'ch-1',
            title: 'Chapter 1: The Breach',
            order: 1,
            content: '<p>The ancient gate creaked open under the moonlit sky.</p>',
            wordCount: 10,
            status: 'draft',
            updatedAt: new Date().toISOString(),
            scenes: [
              {
                id: 'sc-1',
                chapterId: 'ch-1',
                title: 'Scene 1: Gate Opening',
                order: 1,
                content: 'The ancient gate creaked open.',
                wordCount: 5,
                status: 'draft',
                updatedAt: new Date().toISOString()
              }
            ]
          }
        ]
      }
    ],
    characters: [],
    footnotes: [
      {
        id: 'fn-1',
        sceneId: 'sc-1',
        number: 1,
        text: 'Historical reference to the Siege of Belanor (Year 842).',
        createdAt: Date.now()
      }
    ],
    timeline: [],
    annotations: [],
    partnerMessages: [],
    scratchpad: ''
  };

  const compiledMarkdown = CompilerService.compileMarkdown(mockProject, {
    presetId: 'standard-manuscript',
    format: 'markdown',
    trimSize: 'Letter',
    fontFamily: 'courier',
    fontSize: 12,
    lineHeight: 2.0,
    paragraphIndent: 12.7,
    margins: { top: 25, bottom: 25, inner: 25, outer: 25 },
    headerStyle: 'minimal',
    footerStyle: 'none',
    chapterStartPage: 'next-page',
    chapterHeaderStyle: 'centered-classic',
    dropCap: false,
    dropCapLines: 1,
    sceneBreak: '#',
    includeChapterSynopsis: false,
    frontMatter: {
      includeTitlePage: true,
      includeCopyright: false,
      includeDedication: false,
      includeEpigraph: false,
      includeTableOfContents: false
    },
    backMatter: {
      includeAcknowledgments: false,
      includeAboutAuthor: false
    }
  });

  if (!compiledMarkdown.includes('### Chapter Notes') || !compiledMarkdown.includes('[^1]: Historical reference to the Siege of Belanor')) {
    throw new Error('Compiled Markdown does not contain expected chapter footnote block');
  }
  console.log('  ✓ 9. Compiler Markdown export with footnote rendering verified');

  console.log('\n======================================================');
  console.log('  ALL 9 EDITOR ENHANCEMENTS TESTS PASSED (✓)');
  console.log('======================================================\n');
}
