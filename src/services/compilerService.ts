import { 
  ProjectData, 
  PublicationOptions, 
  PublicationPreset, 
  PreflightReport, 
  PreflightIssue,
  TrimSize,
  ExportFontFamily,
  SceneBreakStyle
} from '../types';
import jsPDF from 'jspdf';
import { EpubZipBuilder } from './epubZip';

export const PUBLICATION_PRESETS: PublicationPreset[] = [
  {
    id: 'trade-paperback',
    name: 'Trade Paperback (6" × 9")',
    description: 'Industry-standard 6×9 trade paperback with elegant serif typography, running headers, and drop caps.',
    badge: 'Standard Print',
    options: {
      presetId: 'trade-paperback',
      format: 'pdf',
      trimSize: '6x9',
      fontFamily: 'garamond',
      fontSize: 11,
      lineHeight: 1.35,
      paragraphIndent: 5,
      margins: { top: 18, bottom: 18, inner: 20, outer: 16 },
      headerStyle: 'recto-verso',
      footerStyle: 'centered-page-num',
      chapterStartPage: 'next-page',
      chapterHeaderStyle: 'centered-classic',
      dropCap: true,
      dropCapLines: 3,
      sceneBreak: '* * *',
      includeChapterSynopsis: false,
      frontMatter: {
        includeTitlePage: true,
        includeCopyright: true,
        copyrightYear: new Date().getFullYear().toString(),
        publisherName: 'Independent Edition',
        includeDedication: true,
        dedicationText: 'For those who read between the lines.',
        includeEpigraph: false,
        includeTableOfContents: true,
      },
      backMatter: {
        includeAcknowledgments: true,
        acknowledgmentsText: 'Special thanks to all early readers, editors, and supporters who helped shape this manuscript.',
        includeAboutAuthor: true,
        aboutAuthorBio: 'The author is a passionate storyteller exploring deep worlds and complex characters.',
      },
    },
  },
  {
    id: 'standard-manuscript',
    name: 'Standard Manuscript (Shunn)',
    description: 'Traditional submission format for agents, editors, and publishers. Monospaced, double-spaced, 1" margins.',
    badge: 'Agent / Editor Submission',
    options: {
      presetId: 'standard-manuscript',
      format: 'docx',
      trimSize: 'Letter',
      fontFamily: 'courier',
      fontSize: 12,
      lineHeight: 2.0,
      paragraphIndent: 12.7,
      margins: { top: 25.4, bottom: 25.4, inner: 25.4, outer: 25.4 },
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
        includeTableOfContents: false,
      },
      backMatter: {
        includeAcknowledgments: false,
        includeAboutAuthor: false,
      },
    },
  },
  {
    id: 'digest-paperback',
    name: 'Digest Paperback (5.5" × 8.5")',
    description: 'Compact format popular for literary fiction, poetry, and memoirs with intimate spacing and clean numerals.',
    badge: 'Compact Print',
    options: {
      presetId: 'digest-paperback',
      format: 'pdf',
      trimSize: '5.5x8.5',
      fontFamily: 'times',
      fontSize: 10.5,
      lineHeight: 1.3,
      paragraphIndent: 4.5,
      margins: { top: 16, bottom: 16, inner: 18, outer: 14 },
      headerStyle: 'centered-title',
      footerStyle: 'centered-page-num',
      chapterStartPage: 'next-page',
      chapterHeaderStyle: 'centered-classic',
      dropCap: true,
      dropCapLines: 2,
      sceneBreak: '✦ ✦ ✦',
      includeChapterSynopsis: false,
      frontMatter: {
        includeTitlePage: true,
        includeCopyright: true,
        copyrightYear: new Date().getFullYear().toString(),
        includeDedication: true,
        includeEpigraph: true,
        epigraphQuote: 'In the middle of the journey of our life I found myself astray within a dark wood...',
        epigraphSource: 'Dante Alighieri',
        includeTableOfContents: true,
      },
      backMatter: {
        includeAcknowledgments: true,
        includeAboutAuthor: true,
      },
    },
  },
  {
    id: 'classic-hardcover',
    name: 'Classic Hardcover (A5)',
    description: 'European royal proportions with generous gutters, section glyphs, and ceremonial chapter openings.',
    badge: 'Deluxe Hardcover',
    options: {
      presetId: 'classic-hardcover',
      format: 'pdf',
      trimSize: 'A5',
      fontFamily: 'garamond',
      fontSize: 11,
      lineHeight: 1.4,
      paragraphIndent: 5,
      margins: { top: 20, bottom: 20, inner: 22, outer: 18 },
      headerStyle: 'recto-verso',
      footerStyle: 'centered-page-num',
      chapterStartPage: 'recto',
      chapterHeaderStyle: 'ornate-bordered',
      dropCap: true,
      dropCapLines: 3,
      sceneBreak: '§ § §',
      includeChapterSynopsis: false,
      frontMatter: {
        includeTitlePage: true,
        includeCopyright: true,
        copyrightYear: new Date().getFullYear().toString(),
        includeDedication: true,
        includeEpigraph: true,
        includeTableOfContents: true,
      },
      backMatter: {
        includeAcknowledgments: true,
        includeAboutAuthor: true,
      },
    },
  },
  {
    id: 'digital-epub',
    name: 'Clean Digital Novel (EPUB 3)',
    description: 'Validated EPUB 3 package with semantic HTML, embedded table of contents, and clean reader styling.',
    badge: 'E-Book / Kindle',
    options: {
      presetId: 'digital-epub',
      format: 'epub',
      trimSize: '6x9',
      fontFamily: 'garamond',
      fontSize: 11,
      lineHeight: 1.4,
      paragraphIndent: 5,
      margins: { top: 15, bottom: 15, inner: 15, outer: 15 },
      headerStyle: 'none',
      footerStyle: 'none',
      chapterStartPage: 'next-page',
      chapterHeaderStyle: 'centered-classic',
      dropCap: true,
      dropCapLines: 2,
      sceneBreak: '* * *',
      includeChapterSynopsis: false,
      frontMatter: {
        includeTitlePage: true,
        includeCopyright: true,
        copyrightYear: new Date().getFullYear().toString(),
        includeDedication: true,
        includeEpigraph: false,
        includeTableOfContents: true,
      },
      backMatter: {
        includeAcknowledgments: true,
        includeAboutAuthor: true,
      },
    },
  },
  {
    id: 'clean-markdown',
    name: 'CommonMark Markdown (.md)',
    description: 'Pure, clean Markdown with YAML front matter for backup, archiving, or headless typesetting toolchains.',
    badge: 'Universal Text',
    options: {
      presetId: 'clean-markdown',
      format: 'markdown',
      trimSize: 'Letter',
      fontFamily: 'courier',
      fontSize: 12,
      lineHeight: 1.5,
      paragraphIndent: 0,
      margins: { top: 20, bottom: 20, inner: 20, outer: 20 },
      headerStyle: 'none',
      footerStyle: 'none',
      chapterStartPage: 'next-page',
      chapterHeaderStyle: 'left-modern',
      dropCap: false,
      dropCapLines: 1,
      sceneBreak: '* * *',
      includeChapterSynopsis: false,
      frontMatter: {
        includeTitlePage: true,
        includeCopyright: true,
        copyrightYear: new Date().getFullYear().toString(),
        includeDedication: false,
        includeEpigraph: false,
        includeTableOfContents: false,
      },
      backMatter: {
        includeAcknowledgments: false,
        includeAboutAuthor: false,
      },
    },
  },
];

export const DEFAULT_PUBLICATION_OPTIONS: PublicationOptions = {
  presetId: 'trade-paperback',
  format: 'pdf',
  trimSize: '6x9',
  fontFamily: 'garamond',
  fontSize: 11,
  lineHeight: 1.35,
  paragraphIndent: 5,
  margins: { top: 18, bottom: 18, inner: 20, outer: 16 },
  headerStyle: 'recto-verso',
  footerStyle: 'centered-page-num',
  chapterStartPage: 'next-page',
  chapterHeaderStyle: 'centered-classic',
  dropCap: true,
  dropCapLines: 3,
  sceneBreak: '* * *',
  includeChapterSynopsis: false,
  frontMatter: {
    includeTitlePage: true,
    includeCopyright: true,
    copyrightYear: new Date().getFullYear().toString(),
    publisherName: 'Independent Edition',
    includeDedication: true,
    dedicationText: 'For those who read between the lines.',
    includeEpigraph: false,
    includeTableOfContents: true,
  },
  backMatter: {
    includeAcknowledgments: true,
    acknowledgmentsText: 'Special thanks to all early readers, editors, and supporters who helped shape this manuscript.',
    includeAboutAuthor: true,
    aboutAuthorBio: 'The author is a passionate storyteller exploring deep worlds and complex characters.',
  },
};

const CUSTOM_PUB_PROFILES_KEY = 'swrite_custom_pub_profiles';
let inMemoryCustomProfiles: PublicationPreset[] = [];

export interface ParsedProseItem {
  type: 'paragraph' | 'scene-break';
  text: string;
}

// ==========================================
// COMPILER & PUBLICATION SERVICE
// ==========================================

export const CompilerService = {
  // ─── Custom Profile Persistence & Management ────────────────────────────

  getCustomPublicationProfiles(): PublicationPreset[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return inMemoryCustomProfiles;
    }
    try {
      const raw = localStorage.getItem(CUSTOM_PUB_PROFILES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveCustomPublicationProfile(profile: PublicationPreset): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      const idx = inMemoryCustomProfiles.findIndex(p => p.id === profile.id);
      if (idx >= 0) {
        inMemoryCustomProfiles[idx] = { ...profile, isCustom: true };
      } else {
        inMemoryCustomProfiles.push({ ...profile, isCustom: true });
      }
      return;
    }
    try {
      const existing = this.getCustomPublicationProfiles();
      const idx = existing.findIndex(p => p.id === profile.id);
      if (idx >= 0) {
        existing[idx] = { ...profile, isCustom: true };
      } else {
        existing.push({ ...profile, isCustom: true });
      }
      localStorage.setItem(CUSTOM_PUB_PROFILES_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save custom publication profile:', e);
    }
  },

  deleteCustomPublicationProfile(profileId: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      inMemoryCustomProfiles = inMemoryCustomProfiles.filter(p => p.id !== profileId);
      return;
    }
    try {
      const existing = this.getCustomPublicationProfiles();
      const filtered = existing.filter(p => p.id !== profileId);
      localStorage.setItem(CUSTOM_PUB_PROFILES_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete custom publication profile:', e);
    }
  },

  duplicatePublicationProfile(sourceProfileId: string, newName?: string): PublicationPreset {
    const allPresets = this.getAllPublicationPresets();
    const source = allPresets.find(p => p.id === sourceProfileId) || PUBLICATION_PRESETS[0];
    const name = newName || `${source.name} (Copy)`;
    const newId = `custom-profile-${Date.now()}`;
    const duplicated: PublicationPreset = {
      id: newId,
      name,
      description: `Customized profile based on ${source.name}`,
      badge: 'Custom Profile',
      isCustom: true,
      options: {
        ...source.options,
        presetId: newId,
        customProfileName: name,
        isCustom: true,
      },
    };
    this.saveCustomPublicationProfile(duplicated);
    return duplicated;
  },

  resetToPresetDefaults(presetId: string): PublicationOptions {
    const preset = PUBLICATION_PRESETS.find(p => p.id === presetId) || PUBLICATION_PRESETS[0];
    return {
      ...DEFAULT_PUBLICATION_OPTIONS,
      ...preset.options,
      presetId: preset.id,
      frontMatter: { ...DEFAULT_PUBLICATION_OPTIONS.frontMatter, ...preset.options.frontMatter },
      backMatter: { ...DEFAULT_PUBLICATION_OPTIONS.backMatter, ...preset.options.backMatter },
    };
  },

  getAllPublicationPresets(): PublicationPreset[] {
    const custom = this.getCustomPublicationProfiles();
    return [...PUBLICATION_PRESETS, ...custom];
  },

  // ─── Semantic Prose & Scene Break Parsing ───────────────────────────────

  parseProseItems(rawContent: string, sceneBreakOrnament: string): ParsedProseItem[] {
    if (!rawContent || !rawContent.trim()) return [];

    // Replace <h1> titles if already present in chapter body
    let cleaned = rawContent.replace(/<h1[^>]*>.*?<\/h1>/gi, '');

    const SPLIT_TOKEN = '___SCENE_BREAK_SPLIT_TOKEN___';

    // Normalize semantic scene break tags and markers
    cleaned = cleaned.replace(/<hr[^>]*>/gi, `\n\n${SPLIT_TOKEN}\n\n`);
    cleaned = cleaned.replace(/<(p|div)\s+class=["'][^"']*scene-break[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, `\n\n${SPLIT_TOKEN}\n\n`);

    // Split on paragraph boundaries, hr, or double newlines
    const rawBlocks = cleaned.split(/<\/p>|<br\s*\/?>|\n\n+/i);
    const items: ParsedProseItem[] = [];

    for (const block of rawBlocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      if (trimmed.includes(SPLIT_TOKEN)) {
        const parts = trimmed.split(SPLIT_TOKEN);
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i].trim();
          if (p) {
            const cleanP = p.replace(/<[^>]+>/g, '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$2$1').trim();
            if (cleanP) items.push({ type: 'paragraph', text: cleanP });
          }
          if (i < parts.length - 1) {
            items.push({ type: 'scene-break', text: sceneBreakOrnament === 'blank-line' ? '' : sceneBreakOrnament });
          }
        }
      } else {
        const cleanP = trimmed
          .replace(/<[^>]+>/g, '')
          .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$2$1')
          .trim();
        if (cleanP) {
          // Check if this single paragraph was a text ornament
          if (cleanP === '* * *' || cleanP === '***' || cleanP === '---' || cleanP === '###' || cleanP === '#' || cleanP === '✦ ✦ ✦' || cleanP === '§ § §' || cleanP === '— — —' || cleanP === '• • •' || cleanP === '❦' || cleanP === '◇') {
            items.push({ type: 'scene-break', text: sceneBreakOrnament === 'blank-line' ? '' : sceneBreakOrnament });
          } else {
            items.push({ type: 'paragraph', text: cleanP });
          }
        }
      }
    }

    return items;
  },

  // ─── Preflight & Validation ─────────────────────────────────────────────

  validateManuscript(project: ProjectData, options: PublicationOptions): PreflightReport {
    const issues: PreflightIssue[] = [];
    const allChapters = project.acts.flatMap(a => a.chapters);
    const selectedChapters = options.selectedChapterIds
      ? allChapters.filter(c => options.selectedChapterIds?.includes(c.id))
      : allChapters;

    const totalWordCount = selectedChapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
    const estimatedReadingTimeMinutes = Math.max(1, Math.round(totalWordCount / 250));

    // 1. Title / Author metadata validation
    const rawTitle = project.metadata?.title?.trim() || '';
    if (!rawTitle || rawTitle === 'Untitled Project') {
      issues.push({
        type: 'error',
        title: 'Default or Empty Book Title',
        description: 'The manuscript has a generic or empty title ("Untitled Project").',
        impact: 'Published files will display placeholder titles on cover pages and headers.',
        suggestion: 'Update the project title in Settings before generating print distribution files.',
      });
    }

    const rawAuthor = project.metadata?.author?.trim() || '';
    if (!rawAuthor || rawAuthor === 'Author') {
      issues.push({
        type: 'warning',
        title: 'Unassigned Author Byline',
        description: 'The author byline is set to default ("Author").',
        impact: 'Running headers and copyright lines will lack a finalized author attribution.',
        suggestion: 'Specify the author pen name or full name in Project Settings.',
      });
    }

    // 2. Chapters validation
    if (selectedChapters.length === 0) {
      issues.push({
        type: 'error',
        title: 'No Chapters Selected',
        description: 'No chapters are selected for publication export.',
        impact: 'The compiler cannot generate an output document without body content.',
        suggestion: 'Check the Chapters tab and select at least one chapter.',
      });
    }

    selectedChapters.forEach((ch, index) => {
      if (!ch.content || ch.content.trim().length === 0 || ch.wordCount === 0) {
        issues.push({
          type: 'error',
          title: `Empty Chapter: ${ch.title || `Chapter ${index + 1}`}`,
          description: 'This chapter contains no text content and will render as a blank section.',
          impact: 'Produces unseemly empty pages and broken reading flow.',
          suggestion: 'Add text to the chapter or deselect it in the Chapters tab.',
          chapterId: ch.id,
        });
      } else if (ch.wordCount < 100) {
        issues.push({
          type: 'warning',
          title: `Short Chapter: ${ch.title}`,
          description: `Chapter is very short (${ch.wordCount} words).`,
          impact: 'May cause unexpected whitespace or premature chapter breaks.',
          suggestion: 'Verify if this is an intentional brief interlude, prologue, or placeholder draft.',
          chapterId: ch.id,
        });
      }
    });

    // 3. Front / Back Matter Validation
    if (options.frontMatter.includeDedication && (!options.frontMatter.dedicationText || !options.frontMatter.dedicationText.trim())) {
      issues.push({
        type: 'warning',
        title: 'Empty Dedication Text',
        description: 'The Dedication page is enabled but contains no dedication text.',
        impact: 'May render a blank page in front matter.',
        suggestion: 'Enter your dedication note or disable the Dedication page in Front Matter settings.',
      });
    }

    if (options.frontMatter.includeEpigraph && (!options.frontMatter.epigraphQuote || !options.frontMatter.epigraphQuote.trim())) {
      issues.push({
        type: 'warning',
        title: 'Empty Epigraph Quote',
        description: 'The Epigraph page is enabled but quote text is empty.',
        impact: 'An empty quotation block will appear before Chapter 1.',
        suggestion: 'Add a quote or uncheck the Epigraph toggle in Front Matter.',
      });
    }

    if (options.backMatter.includeAboutAuthor && (!options.backMatter.aboutAuthorBio || !options.backMatter.aboutAuthorBio.trim())) {
      issues.push({
        type: 'warning',
        title: 'Empty Author Biography',
        description: 'The About the Author section is enabled but the bio text is empty.',
        impact: 'Back matter will lack biographical context.',
        suggestion: 'Add an author biography in Back Matter settings or disable the section.',
      });
    }

    // 4. ISBN check for physical print presets
    const isPrintProfile = options.presetId === 'trade-paperback' || options.presetId === 'classic-hardcover' || options.presetId === 'digest-paperback';
    if (isPrintProfile && options.frontMatter.includeCopyright && !options.frontMatter.isbn?.trim()) {
      issues.push({
        type: 'info',
        title: 'No ISBN Assigned (Print Edition)',
        description: 'No ISBN-13 is specified on the copyright page.',
        impact: 'Retail distributors (IngramSpark, KDP Print) require an assigned ISBN.',
        suggestion: 'Enter your 13-digit ISBN in the Front Matter tab if publishing for retail distribution.',
      });
    }

    // 5. Accurate Page Count Estimation
    // Factors: trim printable area, font family density, line height multiplier, chapter sink
    let baseWordsPerPage = 280;
    if (options.trimSize === '5.5x8.5') baseWordsPerPage = 240;
    if (options.trimSize === 'A5') baseWordsPerPage = 260;
    if (options.trimSize === 'Letter') {
      baseWordsPerPage = options.lineHeight >= 1.8 ? 220 : 420;
    } else if (options.trimSize === 'A4') {
      baseWordsPerPage = options.lineHeight >= 1.8 ? 250 : 480;
    }

    // Adjust for font family density
    if (options.fontFamily === 'courier') baseWordsPerPage *= 0.82;
    if (options.fontFamily === 'times') baseWordsPerPage *= 1.05;

    // Adjust for line height
    if (options.lineHeight > 1.4 && options.trimSize !== 'Letter' && options.trimSize !== 'A4') {
      baseWordsPerPage *= (1.4 / options.lineHeight);
    }

    // Body pages with chapter start overhead (each chapter consumes ~0.3 extra page for title sink & partial end page)
    const bodyPages = selectedChapters.reduce((acc, ch) => {
      const chWords = ch.wordCount || 0;
      const chPages = Math.ceil(chWords / baseWordsPerPage);
      return acc + Math.max(1, chPages);
    }, 0);

    let estimatedPageCount = bodyPages;

    // Add front matter pages
    if (options.frontMatter.includeTitlePage) estimatedPageCount += 1;
    if (options.frontMatter.includeCopyright) estimatedPageCount += 1;
    if (options.frontMatter.includeDedication) estimatedPageCount += 1;
    if (options.frontMatter.includeEpigraph) estimatedPageCount += 1;
    if (options.frontMatter.includeTableOfContents) {
      estimatedPageCount += Math.max(1, Math.ceil(selectedChapters.length / 24));
    }

    // Add back matter pages
    if (options.backMatter.includeAcknowledgments) estimatedPageCount += 1;
    if (options.backMatter.includeAboutAuthor) estimatedPageCount += 1;

    // If recto starts enabled, add average padding for right-hand page alignment
    if (options.chapterStartPage === 'recto' && isPrintProfile) {
      estimatedPageCount += Math.round(selectedChapters.length * 0.45);
    }

    const hasErrors = issues.some(i => i.type === 'error');

    return {
      totalWordCount,
      chapterCount: selectedChapters.length,
      estimatedPageCount: Math.max(1, estimatedPageCount),
      estimatedReadingTimeMinutes,
      issues,
      readyForPrint: !hasErrors,
      formatNotes: [
        `Geometry: ${options.trimSize} (${options.margins.top}mm top, ${options.margins.inner}mm inner, ${options.margins.outer}mm outer, ${options.margins.bottom}mm bottom)`,
        `Typography: ${options.fontFamily} @ ${options.fontSize}pt / ${options.lineHeight}× leading`,
        `Estimated Density: ~${Math.round(baseWordsPerPage)} words/page`,
      ],
    };
  },

  // ─── Markdown Compilation ──────────────────────────────────────────────

  compileMarkdown(project: ProjectData, options: PublicationOptions): string {
    const selectedChapters = options.selectedChapterIds
      ? project.acts.flatMap(a => a.chapters).filter(c => options.selectedChapterIds?.includes(c.id))
      : project.acts.flatMap(a => a.chapters);

    const totalWords = selectedChapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);

    let md = `---\n`;
    md += `title: "${project.metadata.title}"\n`;
    md += `author: "${project.metadata.author}"\n`;
    if (project.metadata.genre) md += `genre: "${project.metadata.genre}"\n`;
    if (options.frontMatter.copyrightYear) md += `copyright: "${options.frontMatter.copyrightYear}"\n`;
    md += `word_count: ${totalWords}\n`;
    md += `exported_at: "${new Date().toISOString()}"\n`;
    md += `generator: "Swrite Editorial Publication Studio"\n`;
    md += `---\n\n`;

    // Title Page
    if (options.frontMatter.includeTitlePage) {
      md += `# ${project.metadata.title}\n\n`;
      md += `*by ${project.metadata.author}*\n\n`;
      if (project.metadata.genre) md += `*A Novel of ${project.metadata.genre}*\n\n`;
      md += `---\n\n`;
    }

    // Copyright
    if (options.frontMatter.includeCopyright) {
      const year = options.frontMatter.copyrightYear || new Date().getFullYear().toString();
      const pub = options.frontMatter.publisherName || 'Independent Edition';
      md += `Copyright © ${year} by ${project.metadata.author}\n\n`;
      md += `Published by ${pub}\n\n`;
      md += `All rights reserved.\n\n`;
      if (options.frontMatter.isbn) md += `ISBN: ${options.frontMatter.isbn}\n\n`;
      md += `---\n\n`;
    }

    // Dedication
    if (options.frontMatter.includeDedication && options.frontMatter.dedicationText) {
      md += `*${options.frontMatter.dedicationText}*\n\n---\n\n`;
    }

    // Epigraph
    if (options.frontMatter.includeEpigraph && options.frontMatter.epigraphQuote) {
      md += `> "${options.frontMatter.epigraphQuote}"\n>\n> — ${options.frontMatter.epigraphSource || 'Unknown'}\n\n---\n\n`;
    }

    // Table of Contents
    if (options.frontMatter.includeTableOfContents) {
      md += `## Table of Contents\n\n`;
      selectedChapters.forEach(ch => {
        md += `- [${ch.title}](#${ch.title.toLowerCase().replace(/[^\w]+/g, '-')})\n`;
      });
      md += `\n---\n\n`;
    }

    // Body Chapters
    project.acts.forEach(act => {
      const actChapters = act.chapters.filter(ch => selectedChapters.some(sc => sc.id === ch.id));
      if (actChapters.length > 0) {
        if (project.acts.length > 1) {
          md += `# ${act.title}\n\n`;
        }

        actChapters.forEach(ch => {
          md += `## ${ch.title}\n\n`;
          if (options.includeChapterSynopsis && ch.synopsis) {
            md += `*${ch.synopsis}*\n\n`;
          }

          const parsedItems = this.parseProseItems(ch.content, options.sceneBreak);
          parsedItems.forEach(item => {
            if (item.type === 'scene-break') {
              md += `${item.text || '* * *'}\n\n`;
            } else {
              md += `${item.text}\n\n`;
            }
          });
        });
      }
    });

    // Back Matter
    if (options.backMatter.includeAcknowledgments && options.backMatter.acknowledgmentsText) {
      md += `# Acknowledgments\n\n${options.backMatter.acknowledgmentsText}\n\n`;
    }

    if (options.backMatter.includeAboutAuthor && options.backMatter.aboutAuthorBio) {
      md += `# About the Author\n\n${options.backMatter.aboutAuthorBio}\n\n`;
    }

    return md;
  },

  downloadMarkdown(project: ProjectData, options: PublicationOptions) {
    const md = this.compileMarkdown(project, options);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.title.toLowerCase().replace(/\s+/g, '_')}_manuscript.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // ─── Word / DOCX Export ─────────────────────────────────────────────────

  exportDocx(project: ProjectData, options: PublicationOptions) {
    const selectedChapters = options.selectedChapterIds
      ? project.acts.flatMap(a => a.chapters).filter(c => options.selectedChapterIds?.includes(c.id))
      : project.acts.flatMap(a => a.chapters);

    const isShunn = options.presetId === 'standard-manuscript';
    const font = isShunn ? '"Courier New", Courier, monospace' : 
      options.fontFamily === 'garamond' ? '"Garamond", "Georgia", serif' :
      options.fontFamily === 'times' ? '"Times New Roman", Times, serif' :
      options.fontFamily === 'helvetica' ? '"Helvetica Neue", Arial, sans-serif' :
      '"Courier New", Courier, monospace';

    const fontSize = `${options.fontSize}pt`;
    const lineHeight = isShunn ? '2.0' : options.lineHeight.toString();
    const indent = isShunn ? '0.5in' : `${options.paragraphIndent}mm`;

    let html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${project.metadata.title}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: ${options.trimSize === 'Letter' ? '8.5in 11in' : options.trimSize === '5.5x8.5' ? '5.5in 8.5in' : options.trimSize === 'A5' ? '148mm 210mm' : '6in 9in'};
    margin: ${options.margins.top}mm ${options.margins.outer}mm ${options.margins.bottom}mm ${options.margins.inner}mm;
    mso-header-margin: 12.7mm;
    mso-footer-margin: 12.7mm;
  }
  body {
    font-family: ${font};
    font-size: ${fontSize};
    line-height: ${lineHeight};
    color: #000000;
  }
  h1.book-title {
    text-align: center;
    font-size: 24pt;
    font-weight: bold;
    margin-top: 100pt;
    margin-bottom: 24pt;
    page-break-after: always;
  }
  h1.act-title {
    text-align: center;
    font-size: 18pt;
    font-weight: bold;
    margin-top: 80pt;
    page-break-before: always;
    page-break-after: always;
  }
  h2.chapter-title {
    text-align: ${isShunn ? 'center' : options.chapterHeaderStyle === 'left-modern' ? 'left' : 'center'};
    font-size: 14pt;
    font-weight: bold;
    margin-top: 48pt;
    margin-bottom: 24pt;
    page-break-before: always;
  }
  p {
    text-indent: ${indent};
    margin: 0 0 0 0;
    text-align: ${isShunn ? 'left' : 'justify'};
  }
  p.no-indent {
    text-indent: 0;
  }
  p.scene-break {
    text-indent: 0;
    text-align: center;
    margin: 18pt 0;
  }
  .front-matter {
    page-break-after: always;
    text-align: center;
    margin-top: 90pt;
  }
  .shunn-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 40pt;
    font-size: 10pt;
  }
</style>
</head>
<body>
`;

    // Shunn Manuscript Title / Header Layout
    if (isShunn) {
      const totalWords = selectedChapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
      const roundedWords = Math.round(totalWords / 100) * 100;

      html += `
  <div style="margin-bottom: 80pt; line-height: 1.2;">
    <table style="width: 100%; border: none;">
      <tr>
        <td style="vertical-align: top; text-align: left; font-size: 11pt;">
          ${project.metadata.author}<br>
          Author Contact Address<br>
          contact@swrite-manuscript.org
        </td>
        <td style="vertical-align: top; text-align: right; font-size: 11pt;">
          About ${roundedWords.toLocaleString()} words
        </td>
      </tr>
    </table>
  </div>
  <div style="text-align: center; margin-top: 100pt; margin-bottom: 60pt; page-break-after: always;">
    <h1 style="font-size: 18pt; text-transform: uppercase; margin-bottom: 12pt;">${project.metadata.title}</h1>
    <p class="no-indent" style="font-size: 12pt;">by ${project.metadata.author}</p>
  </div>
`;
    } else {
      // Book Front Matter
      if (options.frontMatter.includeTitlePage) {
        html += `
  <div class="front-matter">
    <h1 style="font-size: 26pt; margin-bottom: 12pt;">${project.metadata.title}</h1>
    <h3 style="font-size: 14pt; font-weight: normal; margin-bottom: 36pt;">by ${project.metadata.author}</h3>
    ${project.metadata.genre ? `<p class="no-indent" style="font-style: italic;">A Novel of ${project.metadata.genre}</p>` : ''}
  </div>`;
      }

      if (options.frontMatter.includeCopyright) {
        const year = options.frontMatter.copyrightYear || new Date().getFullYear().toString();
        const pub = options.frontMatter.publisherName || 'Independent Edition';
        html += `
  <div class="front-matter" style="text-align: left; margin-top: 140pt; font-size: 9pt;">
    <p class="no-indent"><strong>${project.metadata.title}</strong></p>
    <p class="no-indent">Copyright © ${year} by ${project.metadata.author}</p>
    <p class="no-indent">Published by ${pub}</p>
    <p class="no-indent">All rights reserved.</p>
    ${options.frontMatter.isbn ? `<p class="no-indent" style="margin-top: 12pt;">ISBN: ${options.frontMatter.isbn}</p>` : ''}
  </div>`;
      }

      if (options.frontMatter.includeDedication && options.frontMatter.dedicationText) {
        html += `
  <div class="front-matter">
    <p class="no-indent" style="font-style: italic; max-width: 400pt; margin: 0 auto;">${options.frontMatter.dedicationText}</p>
  </div>`;
      }

      if (options.frontMatter.includeEpigraph && options.frontMatter.epigraphQuote) {
        html += `
  <div class="front-matter">
    <blockquote style="font-style: italic; max-width: 380pt; margin: 0 auto; text-align: left;">
      "${options.frontMatter.epigraphQuote}"
      <br><br>
      <span style="display: block; text-align: right; font-style: normal;">— ${options.frontMatter.epigraphSource || 'Unknown'}</span>
    </blockquote>
  </div>`;
      }

      if (options.frontMatter.includeTableOfContents) {
        html += `
  <div class="front-matter" style="text-align: left;">
    <h2 style="text-align: center; margin-bottom: 24pt;">Table of Contents</h2>
    <ul style="list-style: none; padding-left: 0; line-height: 2.0;">
      ${selectedChapters.map(ch => `<li>${ch.title}</li>`).join('\n      ')}
    </ul>
  </div>`;
      }
    }

    // Chapters
    project.acts.forEach(act => {
      const actChapters = act.chapters.filter(ch => selectedChapters.some(sc => sc.id === ch.id));
      if (actChapters.length > 0) {
        if (project.acts.length > 1 && !isShunn) {
          html += `<h1 class="act-title">${act.title}</h1>`;
        }

        actChapters.forEach(ch => {
          html += `<h2 class="chapter-title">${ch.title}</h2>`;

          const parsedItems = this.parseProseItems(ch.content, options.sceneBreak);
          let isAfterBreakOrFirst = true;

          parsedItems.forEach(item => {
            if (item.type === 'scene-break') {
              html += `<p class="scene-break">${item.text || '# '}</p>`;
              isAfterBreakOrFirst = true;
            } else {
              const noIndentClass = (isAfterBreakOrFirst && !isShunn) ? ' class="no-indent"' : '';
              html += `<p${noIndentClass}>${item.text}</p>`;
              isAfterBreakOrFirst = false;
            }
          });
        });
      }
    });

    // Back Matter
    if (!isShunn) {
      if (options.backMatter.includeAcknowledgments && options.backMatter.acknowledgmentsText) {
        html += `
  <h2 class="chapter-title">Acknowledgments</h2>
  <p class="no-indent">${options.backMatter.acknowledgmentsText}</p>`;
      }

      if (options.backMatter.includeAboutAuthor && options.backMatter.aboutAuthorBio) {
        html += `
  <h2 class="chapter-title">About the Author</h2>
  <p class="no-indent">${options.backMatter.aboutAuthorBio}</p>`;
      }
    }

    html += `
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.title.toLowerCase().replace(/\s+/g, '_')}_manuscript.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // ─── Standards-Compliant EPUB 3 Export ─────────────────────────────────

  exportEpub(project: ProjectData, options: PublicationOptions) {
    const selectedChapters = options.selectedChapterIds
      ? project.acts.flatMap(a => a.chapters).filter(c => options.selectedChapterIds?.includes(c.id))
      : project.acts.flatMap(a => a.chapters);

    const zip = new EpubZipBuilder();

    // 1. mimetype (Must be first, stored uncompressed)
    zip.addFile('mimetype', 'application/epub+zip');

    // 2. META-INF/container.xml
    zip.addFile('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

    // 3. Stylesheet CSS
    const css = `
body {
  font-family: ${options.fontFamily === 'garamond' ? '"EB Garamond", Garamond, Georgia, serif' : options.fontFamily === 'times' ? '"Times New Roman", Times, serif' : options.fontFamily === 'courier' ? 'Courier, monospace' : 'sans-serif'};
  font-size: ${options.fontSize}pt;
  line-height: ${options.lineHeight};
  margin: 5% 5%;
  color: #111111;
}
h1.book-title {
  text-align: center;
  font-size: 2em;
  margin-top: 20%;
  margin-bottom: 0.5em;
}
h2.author {
  text-align: center;
  font-size: 1.2em;
  font-weight: normal;
  margin-bottom: 2em;
}
h1.chapter-title {
  text-align: ${options.chapterHeaderStyle === 'left-modern' ? 'left' : 'center'};
  font-size: 1.5em;
  margin-top: 15%;
  margin-bottom: 1.5em;
  page-break-before: always;
}
p {
  text-indent: ${options.paragraphIndent}mm;
  margin-top: 0;
  margin-bottom: 0;
  text-align: justify;
}
p.no-indent {
  text-indent: 0;
}
p.scene-break {
  text-indent: 0;
  text-align: center;
  margin: 1.5em 0;
  font-size: 0.9em;
  letter-spacing: 0.2em;
}
.drop-cap {
  float: left;
  font-size: 3.2em;
  line-height: 0.8;
  padding-top: 4px;
  padding-right: 6px;
  padding-bottom: 2px;
  font-family: serif;
}
blockquote {
  font-style: italic;
  margin: 2em 1.5em;
}
`;
    zip.addFile('OEBPS/stylesheet.css', css);

    // 4. Chapter files & manifest items
    const manifestItems: string[] = [
      '<item id="css" href="stylesheet.css" media-type="text/css"/>',
      '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
      '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    ];
    const spineItems: string[] = [];

    // Title Page XHTML
    if (options.frontMatter.includeTitlePage) {
      const titleXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${project.metadata.title}</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
  <div style="text-align: center; margin-top: 25%;">
    <h1 class="book-title">${project.metadata.title}</h1>
    <h2 class="author">by ${project.metadata.author}</h2>
    ${project.metadata.genre ? `<p class="no-indent" style="font-style: italic;">A Novel of ${project.metadata.genre}</p>` : ''}
  </div>
</body>
</html>`;
      zip.addFile('OEBPS/titlepage.xhtml', titleXhtml);
      manifestItems.push('<item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>');
      spineItems.push('<itemref idref="titlepage"/>');
    }

    // Dedication XHTML
    if (options.frontMatter.includeDedication && options.frontMatter.dedicationText) {
      const dedXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Dedication</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
  <div style="text-align: center; margin-top: 30%;">
    <p class="no-indent" style="font-style: italic;">${options.frontMatter.dedicationText}</p>
  </div>
</body>
</html>`;
      zip.addFile('OEBPS/dedication.xhtml', dedXhtml);
      manifestItems.push('<item id="dedication" href="dedication.xhtml" media-type="application/xhtml+xml"/>');
      spineItems.push('<itemref idref="dedication"/>');
    }

    // Chapters XHTML
    selectedChapters.forEach((ch, idx) => {
      const chFile = `chapter_${idx + 1}.xhtml`;
      const chId = `chapter_${idx + 1}`;
      manifestItems.push(`<item id="${chId}" href="${chFile}" media-type="application/xhtml+xml"/>`);
      spineItems.push(`<itemref idref="${chId}"/>`);

      const parsedItems = this.parseProseItems(ch.content, options.sceneBreak);
      let paragraphsHtml = '';
      let isFirstParagraph = true;

      parsedItems.forEach(item => {
        if (item.type === 'scene-break') {
          paragraphsHtml += `<p class="scene-break">${item.text || '* * *'}</p>\n`;
          isFirstParagraph = true;
        } else {
          if (isFirstParagraph && options.dropCap && item.text.length > 1) {
            const firstLetter = item.text.charAt(0);
            const rest = item.text.slice(1);
            paragraphsHtml += `<p class="no-indent"><span class="drop-cap">${firstLetter}</span>${rest}</p>\n`;
          } else {
            const noIndent = isFirstParagraph ? ' class="no-indent"' : '';
            paragraphsHtml += `<p${noIndent}>${item.text}</p>\n`;
          }
          isFirstParagraph = false;
        }
      });

      const chXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${ch.title}</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
  <h1 class="chapter-title">${ch.title}</h1>
  ${paragraphsHtml}
</body>
</html>`;
      zip.addFile(`OEBPS/${chFile}`, chXhtml);
    });

    // Back Matter XHTML
    if (options.backMatter.includeAboutAuthor && options.backMatter.aboutAuthorBio) {
      const bioXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>About the Author</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
  <h1 class="chapter-title">About the Author</h1>
  <p class="no-indent">${options.backMatter.aboutAuthorBio}</p>
</body>
</html>`;
      zip.addFile('OEBPS/about_author.xhtml', bioXhtml);
      manifestItems.push('<item id="about_author" href="about_author.xhtml" media-type="application/xhtml+xml"/>');
      spineItems.push('<itemref idref="about_author"/>');
    }

    // 5. OEBPS/nav.xhtml (EPUB 3 navigation document)
    const navXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${selectedChapters.map((ch, idx) => `<li><a href="chapter_${idx + 1}.xhtml">${ch.title}</a></li>`).join('\n      ')}
    </ol>
  </nav>
</body>
</html>`;
    zip.addFile('OEBPS/nav.xhtml', navXhtml);

    // 6. OEBPS/toc.ncx (EPUB 2 NCX compatibility)
    const ncx = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:swrite-${project.metadata.title.toLowerCase().replace(/\s+/g, '-')}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${project.metadata.title}</text></docTitle>
  <navMap>
    ${selectedChapters.map((ch, idx) => `
    <navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel><text>${ch.title}</text></navLabel>
      <content src="chapter_${idx + 1}.xhtml"/>
    </navPoint>`).join('')}
  </navMap>
</ncx>`;
    zip.addFile('OEBPS/toc.ncx', ncx);

    // 7. OEBPS/content.opf (OPF Package Document)
    const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${project.metadata.title}</dc:title>
    <dc:creator>${project.metadata.author}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId">urn:uuid:swrite-${project.metadata.title.toLowerCase().replace(/\s+/g, '-')}</dc:identifier>
    <dc:date>${new Date().toISOString().slice(0, 10)}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
    zip.addFile('OEBPS/content.opf', opf);

    const blob = zip.buildBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.title.toLowerCase().replace(/\s+/g, '_')}.epub`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // ─── Professional PDF Export (jsPDF) ────────────────────────────────────

  exportPdf(project: ProjectData, options: PublicationOptions) {
    // Dimensions in mm
    let width = 152.4; // 6"
    let height = 228.6; // 9"

    if (options.trimSize === '5.5x8.5') {
      width = 139.7;
      height = 215.9;
    } else if (options.trimSize === 'A5') {
      width = 148;
      height = 210;
    } else if (options.trimSize === 'Letter') {
      width = 215.9;
      height = 279.4;
    } else if (options.trimSize === 'A4') {
      width = 210;
      height = 297;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [width, height],
    });

    const fontMap: Record<string, string> = {
      garamond: 'times',
      times: 'times',
      courier: 'courier',
      helvetica: 'helvetica',
    };
    const pdfFont = fontMap[options.fontFamily] || 'times';

    const { top: marginTop, bottom: marginBottom, inner: marginInner, outer: marginOuter } = options.margins;
    const contentWidth = width - marginInner - marginOuter;
    const isShunn = options.presetId === 'standard-manuscript';

    let pageNum = 0;

    const addBlankPage = () => {
      pageNum++;
      if (pageNum > 1) doc.addPage();
    };

    // Helper: Header & Footer
    const renderHeadersAndFooters = (chapterTitle: string, isChapterStart: boolean) => {
      const isEven = pageNum % 2 === 0;
      const currentMarginLeft = isEven ? marginOuter : marginInner;
      const currentMarginRight = isEven ? marginInner : marginOuter;

      // Shunn Submission Header (Starts from Page 2)
      if (isShunn) {
        if (pageNum >= 2) {
          doc.setFont(pdfFont, 'normal');
          doc.setFontSize(10);
          doc.setTextColor(30);
          const authorSurname = project.metadata.author.split(' ').pop() || 'Author';
          const titleKeyword = project.metadata.title.split(' ')[0] || 'Manuscript';
          doc.text(`${authorSurname.toUpperCase()} / ${titleKeyword.toUpperCase()} / ${pageNum}`, width - currentMarginRight, marginTop - 8, { align: 'right' });
        }
        return;
      }

      // Book Running Header (Suppressed on chapter start page)
      if (!isChapterStart && options.headerStyle !== 'none') {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(110);

        if (options.headerStyle === 'recto-verso') {
          if (isEven) {
            // Verso: Book Title
            doc.text(project.metadata.title.toUpperCase(), currentMarginLeft, marginTop - 6);
          } else {
            // Recto: Chapter Title
            doc.text(chapterTitle.toUpperCase(), width - currentMarginRight, marginTop - 6, { align: 'right' });
          }
        } else if (options.headerStyle === 'centered-title') {
          doc.text(project.metadata.title.toUpperCase(), width / 2, marginTop - 6, { align: 'center' });
        } else if (options.headerStyle === 'minimal') {
          doc.text(`${project.metadata.author.toUpperCase()} / ${project.metadata.title.toUpperCase()}`, width - currentMarginRight, marginTop - 6, { align: 'right' });
        }
      }

      // Book Footer with page number
      if (options.footerStyle === 'centered-page-num') {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`${pageNum}`, width / 2, height - marginBottom + 8, { align: 'center' });
      } else if (options.footerStyle === 'outer-page-num') {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        const xPos = isEven ? currentMarginLeft : width - currentMarginRight;
        doc.text(`${pageNum}`, xPos, height - marginBottom + 8, { align: isEven ? 'left' : 'right' });
      }
    };

    // ─── 1. Title Page ──────────────────────────────────────────────────
    if (options.frontMatter.includeTitlePage && !isShunn) {
      addBlankPage();
      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(22);
      doc.setTextColor(20);
      doc.text(project.metadata.title, width / 2, height / 3, { align: 'center' });

      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(13);
      doc.setTextColor(60);
      doc.text(`by ${project.metadata.author}`, width / 2, height / 3 + 12, { align: 'center' });

      if (project.metadata.genre) {
        doc.setFontSize(9.5);
        doc.setTextColor(120);
        doc.text(`A Novel of ${project.metadata.genre}`, width / 2, height / 3 + 24, { align: 'center' });
      }
    }

    // ─── 2. Copyright Page ──────────────────────────────────────────────
    if (options.frontMatter.includeCopyright && !isShunn) {
      addBlankPage();
      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100);

      const year = options.frontMatter.copyrightYear || new Date().getFullYear().toString();
      const pub = options.frontMatter.publisherName || 'Independent Edition';

      let cY = height - marginBottom - 40;
      doc.text(`${project.metadata.title}`, marginOuter, cY);
      cY += 4;
      doc.text(`Copyright © ${year} by ${project.metadata.author}`, marginOuter, cY);
      cY += 4;
      doc.text(`Published by ${pub}`, marginOuter, cY);
      cY += 4;
      doc.text('All rights reserved. No part of this publication may be reproduced', marginOuter, cY);
      cY += 4;
      doc.text('without prior written permission from the author.', marginOuter, cY);

      if (options.frontMatter.isbn) {
        cY += 6;
        doc.text(`ISBN: ${options.frontMatter.isbn}`, marginOuter, cY);
      }
    }

    // ─── 3. Dedication Page ─────────────────────────────────────────────
    if (options.frontMatter.includeDedication && options.frontMatter.dedicationText && !isShunn) {
      addBlankPage();
      doc.setFont(pdfFont, 'italic');
      doc.setFontSize(11);
      doc.setTextColor(40);
      const splitDed = doc.splitTextToSize(options.frontMatter.dedicationText, contentWidth - 20);
      doc.text(splitDed, width / 2, height / 3, { align: 'center' });
    }

    // ─── 4. Epigraph Page ───────────────────────────────────────────────
    if (options.frontMatter.includeEpigraph && options.frontMatter.epigraphQuote && !isShunn) {
      addBlankPage();
      doc.setFont(pdfFont, 'italic');
      doc.setFontSize(10.5);
      doc.setTextColor(40);
      const splitEpi = doc.splitTextToSize(`"${options.frontMatter.epigraphQuote}"`, contentWidth - 30);
      doc.text(splitEpi, width / 2, height / 3, { align: 'center' });

      if (options.frontMatter.epigraphSource) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(`— ${options.frontMatter.epigraphSource}`, width / 2 + 20, height / 3 + splitEpi.length * 5 + 6, { align: 'right' });
      }
    }

    // ─── 5. Chapters ────────────────────────────────────────────────────
    const selectedChapters = options.selectedChapterIds
      ? project.acts.flatMap(a => a.chapters).filter(c => options.selectedChapterIds?.includes(c.id))
      : project.acts.flatMap(a => a.chapters);

    selectedChapters.forEach((ch, chIdx) => {
      // Start chapter on next page (or recto page if configured)
      addBlankPage();
      if (options.chapterStartPage === 'recto' && pageNum % 2 === 0 && !isShunn) {
        // Even page = Verso. Add blank to push chapter to Recto (Odd)
        addBlankPage();
      }

      let cursorY = marginTop + (isShunn ? 10 : 22); // Chapter opening vertical drop
      renderHeadersAndFooters(ch.title, true);

      // Chapter Title
      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(isShunn ? 13 : 15);
      doc.setTextColor(15);

      if (options.chapterHeaderStyle === 'ornate-bordered' && !isShunn) {
        doc.setDrawColor(180);
        doc.setLineWidth(0.3);
        doc.line(width / 2 - 25, cursorY - 6, width / 2 + 25, cursorY - 6);
        doc.text(ch.title.toUpperCase(), width / 2, cursorY, { align: 'center' });
        doc.line(width / 2 - 25, cursorY + 4, width / 2 + 25, cursorY + 4);
        cursorY += 16;
      } else if (options.chapterHeaderStyle === 'left-modern' && !isShunn) {
        doc.text(ch.title, marginInner, cursorY);
        cursorY += 14;
      } else {
        // Centered Classic
        doc.text(ch.title, width / 2, cursorY, { align: 'center' });
        cursorY += 14;
      }

      // Paragraphs & Scene Breaks
      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(options.fontSize);
      doc.setTextColor(20);

      const parsedItems = this.parseProseItems(ch.content, options.sceneBreak);
      const lineStep = options.fontSize * 0.3528 * options.lineHeight;

      let isFirstParagraph = true;

      parsedItems.forEach(item => {
        const isEven = pageNum % 2 === 0;
        const currentMarginLeft = isEven ? marginOuter : marginInner;

        if (item.type === 'scene-break') {
          cursorY += lineStep;
          if (cursorY > height - marginBottom - 10) {
            addBlankPage();
            cursorY = marginTop + 5;
            renderHeadersAndFooters(ch.title, false);
          }
          doc.setFont(pdfFont, 'normal');
          doc.setFontSize(options.fontSize * 0.95);
          doc.setTextColor(90);
          doc.text(item.text || '* * *', width / 2, cursorY, { align: 'center' });
          cursorY += lineStep * 1.5;
          doc.setFontSize(options.fontSize);
          doc.setTextColor(20);
          isFirstParagraph = true;
        } else {
          const indentStr = isFirstParagraph || options.paragraphIndent === 0 ? '' : '     ';
          const formattedText = indentStr + item.text;
          const splitLines = doc.splitTextToSize(formattedText, contentWidth);

          // Check page break
          if (cursorY + splitLines.length * lineStep > height - marginBottom) {
            addBlankPage();
            cursorY = marginTop + 5;
            renderHeadersAndFooters(ch.title, false);
            doc.setFont(pdfFont, 'normal');
            doc.setFontSize(options.fontSize);
            doc.setTextColor(20);
          }

          doc.text(splitLines, currentMarginLeft, cursorY);
          cursorY += splitLines.length * lineStep + (isShunn ? lineStep * 0.5 : 2.5);
          isFirstParagraph = false;
        }
      });
    });

    // ─── 6. Back Matter ─────────────────────────────────────────────────
    if (options.backMatter.includeAcknowledgments && options.backMatter.acknowledgmentsText && !isShunn) {
      addBlankPage();
      let cursorY = marginTop + 20;
      renderHeadersAndFooters('Acknowledgments', true);

      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15);
      doc.text('Acknowledgments', width / 2, cursorY, { align: 'center' });
      cursorY += 14;

      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(options.fontSize);
      doc.setTextColor(30);

      const splitAck = doc.splitTextToSize(options.backMatter.acknowledgmentsText, contentWidth);
      doc.text(splitAck, marginInner, cursorY);
    }

    if (options.backMatter.includeAboutAuthor && options.backMatter.aboutAuthorBio && !isShunn) {
      addBlankPage();
      let cursorY = marginTop + 20;
      renderHeadersAndFooters('About the Author', true);

      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15);
      doc.text('About the Author', width / 2, cursorY, { align: 'center' });
      cursorY += 14;

      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(options.fontSize);
      doc.setTextColor(30);

      const splitBio = doc.splitTextToSize(options.backMatter.aboutAuthorBio, contentWidth);
      doc.text(splitBio, marginInner, cursorY);
    }

    doc.save(`${project.metadata.title.toLowerCase().replace(/\s+/g, '_')}_book.pdf`);
  },
};
