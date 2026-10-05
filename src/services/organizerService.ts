import { ProjectData, Act, Chapter, CodexEntry, CutScene, StructureTemplateType, Character } from '../types';

function decodeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanTitleString(raw: string): string {
  let cleaned = decodeHtml(raw);
  cleaned = cleaned.replace(/\.(md|markdown|txt|docx|json|html|htm|rtf)$/i, ''); // remove actual extension only
  cleaned = cleaned.replace(/^[0-9]+[.\-_]\s*[a-zA-Z0-9_\-\s]+\//, ''); // remove folder prefix
  cleaned = cleaned.replace(/^(chapter|ch|scene|act)[\s_\-]*[0-9]+[\s_\-:]*/i, ''); // remove existing Ch 1 prefix
  cleaned = cleaned.replace(/^[0-9]+[_\-\s:]+/, ''); // remove leading numbers
  cleaned = cleaned.replace(/[-_]/g, ' ').trim();
  if (!cleaned) return 'Untitled Scene';
  return cleaned.replace(/\b\w/g, l => l.toUpperCase());
}

export const OrganizerService = {
  /**
   * 1. Auto-Format & Clean Chapter Titles
   */
  cleanAndFormatChapterTitles(project: ProjectData): { updatedCount: number; project: ProjectData } {
    let updatedCount = 0;
    let globalIndex = 0;

    project.acts.forEach(act => {
      act.chapters.forEach(ch => {
        globalIndex++;
        const cleaned = cleanTitleString(ch.title);
        const newTitle = `Chapter ${globalIndex}: ${cleaned}`;
        
        if (ch.title !== newTitle) {
          ch.title = newTitle;
          // Update <h1> in content
          if (ch.content.includes('<h1>')) {
            ch.content = ch.content.replace(/<h1>(.*?)<\/h1>/i, `<h1>${newTitle}</h1>`);
          } else {
            ch.content = `<h1>${newTitle}</h1>\n` + ch.content;
          }
          ch.updatedAt = new Date().toISOString();
          updatedCount++;
        }
      });
    });

    return { updatedCount, project };
  },

  /**
   * 2. Sequential Global Renumbering
   */
  sequentialRenumberChapters(project: ProjectData, prefix = 'Chapter'): { totalRenumbered: number; project: ProjectData } {
    let globalIndex = 0;
    let totalRenumbered = 0;

    project.acts.forEach(act => {
      act.chapters.forEach(ch => {
        globalIndex++;
        ch.order = globalIndex;

        const subtitle = cleanTitleString(ch.title);
        const formattedTitle = subtitle && subtitle !== 'Untitled Scene'
          ? `${prefix} ${globalIndex}: ${subtitle}`
          : `${prefix} ${globalIndex}`;

        if (ch.title !== formattedTitle) {
          ch.title = formattedTitle;
          if (ch.content.includes('<h1>')) {
            ch.content = ch.content.replace(/<h1>(.*?)<\/h1>/i, `<h1>${formattedTitle}</h1>`);
          } else {
            ch.content = `<h1>${formattedTitle}</h1>\n` + ch.content;
          }
          ch.updatedAt = new Date().toISOString();
          totalRenumbered++;
        }
      });
    });

    return { totalRenumbered, project };
  },

  /**
   * 3. Entity & World Codex Auto-Extractor
   */
  extractEntitiesToCodex(project: ProjectData): { newEntriesCount: number; project: ProjectData } {
    if (!project.codex) project.codex = [];

    const existingNames = new Set([
      ...project.characters.map(c => c.name.toLowerCase()),
      ...project.codex.map(c => c.name.toLowerCase())
    ]);

    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'but', 'or', 'for', 'nor', 'with', 'at', 'by', 'from', 'into',
      'chapter', 'act', 'book', 'scene', 'part', 'draft', 'manuscript', 'notes', 'first', 'second',
      'then', 'when', 'where', 'there', 'here', 'what', 'who', 'why', 'how', 'this', 'that'
    ]);

    const candidateCounts: Record<string, { count: number; category: CodexEntry['category']; appearances: string[] }> = {};

    project.acts.forEach(act => {
      act.chapters.forEach(ch => {
        const text = ch.content.replace(/<[^>]+>/g, ' ');

        // 1. Scan [[Wikilinks]]
        const wikiRegex = /\[\[([^[\]|]+)(?:\|[^[\]]+)?\]\]/g;
        let match;
        while ((match = wikiRegex.exec(text)) !== null) {
          const rawName = match[1].trim();
          const cleanName = rawName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const lower = cleanName.toLowerCase();

          if (cleanName.length > 2 && !stopWords.has(lower)) {
            if (!candidateCounts[cleanName]) {
              candidateCounts[cleanName] = {
                count: 10,
                category: this.inferCategoryFromName(cleanName),
                appearances: [ch.title]
              };
            } else {
              candidateCounts[cleanName].count += 10;
              if (!candidateCounts[cleanName].appearances.includes(ch.title)) {
                candidateCounts[cleanName].appearances.push(ch.title);
              }
            }
          }
        }

        // 2. Scan capitalized proper nouns
        const words = text.split(/[\s,.;:!?"'()\[\]{}—–]+/);
        words.forEach(w => {
          const clean = w.replace(/[^a-zA-Z]/g, '');
          if (clean.length >= 3 && /^[A-Z][a-z]+$/.test(clean)) {
            const lower = clean.toLowerCase();
            if (!stopWords.has(lower)) {
              if (!candidateCounts[clean]) {
                candidateCounts[clean] = {
                  count: 1,
                  category: this.inferCategoryFromName(clean),
                  appearances: [ch.title]
                };
              } else {
                candidateCounts[clean].count += 1;
                if (!candidateCounts[clean].appearances.includes(ch.title)) {
                  candidateCounts[clean].appearances.push(ch.title);
                }
              }
            }
          }
        });
      });
    });

    let newEntriesCount = 0;

    Object.entries(candidateCounts).forEach(([name, data]) => {
      if (data.count >= 3 && !existingNames.has(name.toLowerCase())) {
        existingNames.add(name.toLowerCase());
        newEntriesCount++;

        const entryId = `codex-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        if (data.category === 'character') {
          const newChar: Character = {
            id: `char-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name,
            role: data.count > 10 ? 'Supporting' : 'Minor',
            bio: `Auto-extracted entity identified across ${data.appearances.length} scene(s): ${data.appearances.slice(0, 3).join(', ')}.`,
            color: '#818CF8'
          };
          project.characters.push(newChar);
        }

        project.codex!.push({
          id: entryId,
          name,
          category: data.category,
          summary: `Appears in: ${data.appearances.join(', ')}`,
          content: `<p>Auto-extracted worldbuilding entity from manuscript analysis.</p><p><strong>Identified in:</strong> ${data.appearances.join(', ')}</p>`,
          tags: [data.category, 'auto-extracted'],
          updatedAt: new Date().toISOString()
        });
      }
    });

    return { newEntriesCount, project };
  },

  inferCategoryFromName(name: string): CodexEntry['category'] {
    const lower = name.toLowerCase();
    
    // Locations
    if (
      lower.includes('castle') || lower.includes('cathedral') || lower.includes('tower') ||
      lower.includes('haven') || lower.includes('city') || lower.includes('quarter') ||
      lower.includes('street') || lower.includes('forest') || lower.includes('sea') ||
      lower.includes('loft') || lower.includes('mountain') || lower.includes('gate') ||
      lower.includes('sanctum') || lower.includes('palace') || lower.includes('island')
    ) {
      return 'location';
    }

    // Factions / Guilds
    if (
      lower.includes('guild') || lower.includes('council') || lower.includes('order') ||
      lower.includes('inquisition') || lower.includes('watch') || lower.includes('syndicate') ||
      lower.includes('clan') || lower.includes('house') || lower.includes('court') ||
      lower.includes('brotherhood') || lower.includes('empire')
    ) {
      return 'faction';
    }

    // Lore / Magic
    if (
      lower.includes('magic') || lower.includes('alchemy') || lower.includes('glyph') ||
      lower.includes('rune') || lower.includes('formula') || lower.includes('veil') ||
      lower.includes('pact') || lower.includes('conflagration') || lower.includes('curse')
    ) {
      return 'lore';
    }

    // Items / Artifacts
    if (
      lower.includes('blade') || lower.includes('sword') || lower.includes('scroll') ||
      lower.includes('reagent') || lower.includes('cipher') || lower.includes('ring') ||
      lower.includes('grimoire') || lower.includes('amulet')
    ) {
      return 'item';
    }

    return 'character';
  },

  /**
   * 4. Narrative Structure Template Switcher
   */
  applyStructurePreset(project: ProjectData, preset: StructureTemplateType): ProjectData {
    // Collect all chapters in flat sequential order
    const allChapters: Chapter[] = [];
    project.acts.forEach(act => {
      allChapters.push(...act.chapters);
    });

    if (allChapters.length === 0) return project;

    const total = allChapters.length;
    let newActs: Act[] = [];

    switch (preset) {
      case 'three-act': {
        const act1Count = Math.max(1, Math.round(total * 0.25));
        const act2Count = Math.max(1, Math.round(total * 0.50));

        const act1Chs = allChapters.slice(0, act1Count);
        const act2Chs = allChapters.slice(act1Count, act1Count + act2Count);
        const act3Chs = allChapters.slice(act1Count + act2Count);

        newActs = [
          {
            id: `act-1`,
            title: 'Act I: The Setup',
            order: 1,
            chapters: act1Chs.map((c, i) => ({ ...c, actId: 'act-1', order: i + 1 }))
          },
          {
            id: `act-2`,
            title: 'Act II: The Confrontation',
            order: 2,
            chapters: act2Chs.map((c, i) => ({ ...c, actId: 'act-2', order: i + 1 }))
          },
          {
            id: `act-3`,
            title: 'Act III: The Resolution',
            order: 3,
            chapters: (act3Chs.length > 0 ? act3Chs : [allChapters[allChapters.length - 1]]).map((c, i) => ({ ...c, actId: 'act-3', order: i + 1 }))
          }
        ];
        break;
      }

      case 'heros-journey': {
        const partSize = Math.max(1, Math.ceil(total / 4));
        const titles = [
          'Part 1: The Departure & Call to Adventure',
          'Part 2: The Initiation & Road of Trials',
          'Part 3: The Abyss & Ultimate Ordeal',
          'Part 4: The Transformation & Return'
        ];

        newActs = titles.map((title, idx) => {
          const actId = `part-${idx + 1}`;
          const chs = allChapters.slice(idx * partSize, (idx + 1) * partSize);
          return {
            id: actId,
            title,
            order: idx + 1,
            chapters: chs.map((c, i) => ({ ...c, actId, order: i + 1 }))
          };
        }).filter(a => a.chapters.length > 0);
        break;
      }

      case 'serialized-volumes': {
        const volumeSize = 10;
        const volumeCount = Math.max(1, Math.ceil(total / volumeSize));
        newActs = [];

        for (let v = 0; v < volumeCount; v++) {
          const actId = `vol-${v + 1}`;
          const chs = allChapters.slice(v * volumeSize, (v + 1) * volumeSize);
          newActs.push({
            id: actId,
            title: `Volume ${v + 1}`,
            order: v + 1,
            chapters: chs.map((c, i) => ({ ...c, actId, order: i + 1 }))
          });
        }
        break;
      }

      case 'flat-pantser':
      default: {
        newActs = [
          {
            id: 'act-main',
            title: 'Manuscript',
            order: 1,
            chapters: allChapters.map((c, i) => ({ ...c, actId: 'act-main', order: i + 1 }))
          }
        ];
        break;
      }
    }

    project.acts = newActs;
    return project;
  },

  /**
   * 5. Cut Drawer (Scene Graveyard) Operations
   */
  sendChapterToCutDrawer(project: ProjectData, chapterId: string, reason = 'Pruned from manuscript'): { cutScene: CutScene | null; project: ProjectData } {
    if (!project.cutScenes) project.cutScenes = [];

    let targetChapter: Chapter | null = null;
    let foundActTitle = 'Manuscript';

    project.acts.forEach(act => {
      const idx = act.chapters.findIndex(c => c.id === chapterId);
      if (idx !== -1) {
        targetChapter = act.chapters.splice(idx, 1)[0];
        foundActTitle = act.title;
      }
    });

    if (!targetChapter) return { cutScene: null, project };

    const cutScene: CutScene = {
      id: `cut-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      originalChapterId: (targetChapter as Chapter).id,
      originalChapterTitle: (targetChapter as Chapter).title,
      title: (targetChapter as Chapter).title,
      content: (targetChapter as Chapter).content,
      wordCount: (targetChapter as Chapter).wordCount,
      deletedAt: new Date().toISOString(),
      reason
    };

    project.cutScenes.unshift(cutScene);
    return { cutScene, project };
  },

  restoreCutScene(project: ProjectData, cutSceneId: string, targetActId?: string): { restoredChapterId: string | null; project: ProjectData } {
    if (!project.cutScenes) return { restoredChapterId: null, project };

    const idx = project.cutScenes.findIndex(c => c.id === cutSceneId);
    if (idx === -1) return { restoredChapterId: null, project };

    const cutScene = project.cutScenes.splice(idx, 1)[0];
    const targetAct = targetActId 
      ? project.acts.find(a => a.id === targetActId) || project.acts[0]
      : project.acts[0];

    const newChapterId = `ch-restored-${Date.now()}`;
    const newChapter: Chapter = {
      id: newChapterId,
      title: cutScene.title,
      order: targetAct.chapters.length + 1,
      actId: targetAct.id,
      content: cutScene.content,
      wordCount: cutScene.wordCount,
      status: 'draft',
      updatedAt: new Date().toISOString()
    };

    targetAct.chapters.push(newChapter);
    return { restoredChapterId: newChapterId, project };
  }
};
