import { ProjectData, Act, Chapter, Character, StoryBeat } from '../types';
import { CURATED_THEMES, DEFAULT_TYPOGRAPHY } from '../styles/themes';
import { ObsidianParserService } from './obsidianParserService';
import { migrateProjectToStoryEngine } from '../engine/migration';
import { marked } from 'marked';
import mammoth from 'mammoth';

const STORAGE_KEY = 'swrite_active_project_data';
const STORAGE_THEME_KEY = 'swrite_user_theme_pref';
const STORAGE_TYPO_KEY = 'swrite_user_typo_pref';
let activeDirectoryHandle: any = null;

export function getPersistedUserTheme(): any {
  if (typeof window !== 'undefined') {
    try {
      const savedId = localStorage.getItem(STORAGE_THEME_KEY);
      if (savedId) {
        const found = CURATED_THEMES.find(t => t.id === savedId);
        if (found) return found;
      }
    } catch (e) {}
  }
  return CURATED_THEMES[0];
}

export function getPersistedUserTypography(): any {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_TYPO_KEY);
      if (saved) {
        return { ...DEFAULT_TYPOGRAPHY, ...JSON.parse(saved) };
      }
    } catch (e) {}
  }
  return DEFAULT_TYPOGRAPHY;
}

export const INITIAL_NOVEL_DATA: ProjectData = migrateProjectToStoryEngine({
  metadata: {
    id: 'project-default-demo',
    title: 'The Gray Threshold & The Amber Mist',
    author: 'Author',
    genre: 'Dark Fantasy / Mystery',
    targetWordCount: 80000,
    currentWordCount: 4220,
    preset: 'plotter',
    theme: CURATED_THEMES[0],
    typography: DEFAULT_TYPOGRAPHY,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  acts: [
    {
      id: 'act-01-core',
      title: '01.Core',
      order: 1,
      chapters: [
        {
          id: 'ch-style-guide',
          title: 'Style Guide',
          order: 1,
          actId: 'act-01-core',
          status: 'final',
          wordCount: 180,
          updatedAt: new Date().toISOString(),
          synopsis: 'Tone, voice principles, and dialogue rhythm rules for the manuscript.',
          content: `<h1>Style Guide</h1><blockquote>"Magic is not mana to be gathered; it is spatial topology calculated under terror, catalyzed by borrowed blood, and borne by flesh."</blockquote><h3>Voice & Prose Guidelines</h3><ul><li><strong>Sensory Texture:</strong> Ground every scene in damp stone, copper tang, gaslight hiss, or ozone.</li><li><strong>Dialogue Em-Dashes:</strong> Use em-dashes (—) for speech interruptions and sharp observations.</li><li><strong>Wikilinks:</strong> Connect characters and factions using <span class="wikilink-chip" data-target="Lucan" data-alias="Lucan"><span class="wikilink-icon">✦</span><span class="wikilink-label">Lucan</span></span> and <span class="wikilink-chip" data-target="Elena Vance" data-alias="Elena Vance"><span class="wikilink-icon">✦</span><span class="wikilink-label">Elena Vance</span></span>.</li></ul>`,
          wikilinks: ['Lucan', 'Elena Vance'],
        }
      ]
    },
    {
      id: 'act-02-characters',
      title: '02.Characters',
      order: 2,
      chapters: [
        {
          id: 'ch-char-lucan',
          title: 'Lucan',
          order: 1,
          actId: 'act-02-characters',
          status: 'revised',
          wordCount: 220,
          updatedAt: new Date().toISOString(),
          synopsis: 'Protagonist. Former cathedral guard carrying forbidden spatial topology ciphers.',
          content: `<h1>Lucan</h1><p><strong>Role:</strong> Protagonist • Blood-Bearer</p><p>Lucan climbed the slick masonry steps behind Vance, his boots squelching with each rise. The purse of thirty silver pieces felt heavy in his wool pocket, tapping against his bruised hip with a dull, metallic weight.</p><p><strong>Motivations:</strong> Uncover the conspiracy behind the Parchment & The Purge, protect <span class="wikilink-chip" data-target="Freya" data-alias="Freya"><span class="wikilink-icon">✦</span><span class="wikilink-label">Freya</span></span>, and master the second-gate vessel tolerance before his neural burning consumes him.</p>`,
          wikilinks: ['Freya', 'Elena Vance'],
        },
        {
          id: 'ch-char-elena',
          title: 'Elena Vance',
          order: 2,
          actId: 'act-02-characters',
          status: 'revised',
          wordCount: 240,
          updatedAt: new Date().toISOString(),
          synopsis: 'Master alchemist in Oakhaven investigating corrupted transmutation glyphs.',
          content: `<h1>Elena Vance</h1><p><strong>Role:</strong> Alchemical Scholar & Ally</p><p>Presided over her private loft in the lower quarter of Oakhaven. Elena works with midnight-blue reagents and knows the forbidden runes from the Great Conflagration.</p>`,
          wikilinks: ['Lucan', 'High Inquisitor Corvus'],
        },
        {
          id: 'ch-char-corvus',
          title: 'High Inquisitor Corvus',
          order: 3,
          actId: 'act-02-characters',
          status: 'draft',
          wordCount: 160,
          updatedAt: new Date().toISOString(),
          synopsis: 'Regent of the City Watch and Master of the Alchemical Guild.',
          content: `<h1>High Inquisitor Corvus</h1><p><strong>Role:</strong> Antagonist • Zealot Guardian of Order</p><p>Controls the city curfew and suppresses spatial blood-communion glyphs.</p>`,
          wikilinks: ['Elena Vance', 'Lucan'],
        }
      ]
    },
    {
      id: 'act-03-world',
      title: '03.World',
      order: 3,
      chapters: [
        {
          id: 'ch-world-econ',
          title: 'Economy and Currency',
          order: 1,
          actId: 'act-03-world',
          status: 'revised',
          wordCount: 210,
          updatedAt: new Date().toISOString(),
          synopsis: 'Silver thalers, Guild promissory seals, and blood-tithes in Slovaria.',
          content: `<h1>Economy and Currency</h1><p>In Slovaria, high commerce is conducted in lead-stamped silver florins and Guild promissories. For underground transactions in the lower quarter, raw reagent vials and unrefined spatial slag serve as common tender.</p>`,
          wikilinks: ['Slovaria'],
        },
        {
          id: 'ch-world-slovaria',
          title: 'Slovaria',
          order: 2,
          actId: 'act-03-world',
          status: 'draft',
          wordCount: 190,
          updatedAt: new Date().toISOString(),
          synopsis: 'The rain-drenched northern realm of iron citadels and cathedral canals.',
          content: `<h1>Slovaria</h1><p>A kingdom built on black granite and fog. Saint Jude Cathedral towers over the lower canals, casting shadows over the alchemy quarter.</p>`,
          wikilinks: [],
        }
      ]
    },
    {
      id: 'act-04-magic',
      title: '04.Power & Magic',
      order: 4,
      chapters: [
        {
          id: 'ch-blood-resonance',
          title: 'Blood Resonance Rules',
          order: 1,
          actId: 'act-04-magic',
          status: 'final',
          wordCount: 410,
          updatedAt: new Date().toISOString(),
          synopsis: 'Core metaphysical mechanics of spatial topology, vessel tolerance, and backlash.',
          content: `<blockquote>"Magic is not mana to be gathered; it is spatial topology calculated under terror, catalyzed by borrowed blood, and borne by flesh."</blockquote><hr><h2>1. Core Principles</h2><ol><li><strong>Blood is an Identity Key, Not Just Fuel:</strong> Ingested/communed blood carries the metaphysical frequency, lineage authority, and memory-strain of the progenitor. It acts as a biological antenna for spatial manipulation.</li><li><strong>The Dual-Gate Bottleneck:</strong><ul><li><strong>Cognitive Bandwidth:</strong> Higher-tier spells require holding complex geometric/topological matrices in the mind under life-or-death pressure.</li><li><strong>Vessel Tolerance:</strong> The vascular and nervous systems must physically withstand the back-pressure of energetic throughput. Weak conditioning results in burst capillaries, organ failure, or neural burning.</li></ul></li><li><strong>Resonance Recognition:</strong> Communion strains retain an innate hierarchy. When proximity occurs between an inherited strain and the progenitor/root vessel, the blood responds biologically before the mind can comprehend.</li></ol><hr><h2>2. The Human Ladder (Tiers 1–4)</h2><table class="w-full border text-xs"><thead><tr class="border-b bg-zinc-800/50"><th class="p-2 text-left font-semibold">Tier</th><th class="p-2 text-left font-semibold">Mathematical / Cognitive Demand</th><th class="p-2 text-left font-semibold">Biological Vessel Demand</th><th class="p-2 text-left font-semibold">Operational Scope</th><th class="p-2 text-left font-semibold">Backlash / Failure State</th></tr></thead><tbody><tr class="border-b border-zinc-800"><td class="p-2 font-bold text-indigo-400">Tier 1: Initiate</td><td class="p-2"><strong>Linear Vectors:</strong> Single-point coordinates (line, point, circle).</td><td class="p-2">Standard mortal conditioning; minor nerve strain.</td><td class="p-2"><strong>Touch / Self:</strong> Weapon coating, short physical surge, minor kinetic spark.</td><td class="p-2">Hand tremors, epistaxis (nosebleeds), minor migraines.</td></tr><tr class="border-b border-zinc-800"><td class="p-2 font-bold text-indigo-400">Tier 2: Practitioner</td><td class="p-2"><strong>Planar Geometry (2D Matrices):</strong> Chaining 2–3 formulas.</td><td class="p-2">Reinforced vascular pathways; controlled heart rate.</td><td class="p-2"><strong>Line-of-Sight (~20–30m):</strong> Directional kinetic bursts, localized heat.</td><td class="p-2">Muscle tearing, temporary loss of motor control in casting arm.</td></tr></tbody></table>`,
          wikilinks: ['Lucan', 'Elena Vance'],
        }
      ]
    },
    {
      id: 'act-05-factions',
      title: '05.Factions',
      order: 5,
      chapters: [
        {
          id: 'ch-faction-guild',
          title: 'Alchemical Guild of Saint Jude',
          order: 1,
          actId: 'act-05-factions',
          status: 'draft',
          wordCount: 180,
          updatedAt: new Date().toISOString(),
          synopsis: 'The governing regulatory body in Slovaria controlling forbidden reagents.',
          content: `<h1>Alchemical Guild of Saint Jude</h1><p>Presided over by <span class="wikilink-chip" data-target="High Inquisitor Corvus" data-alias="High Inquisitor Corvus"><span class="wikilink-icon">✦</span><span class="wikilink-label">High Inquisitor Corvus</span></span> with strict doctrine on forbidden transmutation glyphs and curfew enforcement.</p>`,
          wikilinks: ['High Inquisitor Corvus'],
        }
      ]
    },
    {
      id: 'act-06-story',
      title: '06.Story',
      order: 6,
      chapters: [
        {
          id: 'ch-arc-1',
          title: 'Arc 1 - "The Forgotten Name"',
          order: 1,
          actId: 'act-06-story',
          status: 'revised',
          wordCount: 190,
          updatedAt: new Date().toISOString(),
          synopsis: 'Overview of Arc 1: From the Amber Mist to the Breach at the Blackiron Bastion.',
          content: `<h1>Arc 1 - "The Forgotten Name"</h1><p>Covers chapters 1 through 9. Tracks <span class="wikilink-chip" data-target="Lucan" data-alias="Lucan"><span class="wikilink-icon">✦</span><span class="wikilink-label">Lucan</span></span> and <span class="wikilink-chip" data-target="Elena Vance" data-alias="Elena Vance"><span class="wikilink-icon">✦</span><span class="wikilink-label">Elena Vance</span></span> discovering the forbidden cipher and escaping the city watch.</p>`,
          wikilinks: ['Lucan', 'Elena Vance'],
        }
      ]
    },
    {
      id: 'act-07-mysteries',
      title: '07.Mysteries',
      order: 7,
      chapters: [
        {
          id: 'ch-mystery-parchment',
          title: 'The Parchment & The Purge',
          order: 1,
          actId: 'act-07-mysteries',
          status: 'draft',
          wordCount: 150,
          updatedAt: new Date().toISOString(),
          synopsis: 'What occurred during the Great Conflagration four centuries ago.',
          content: `<h1>The Parchment & The Purge</h1><p>A suppressed history of the purge that outlawed spatial topology magic.</p>`,
          wikilinks: [],
        }
      ]
    },
    {
      id: 'act-draft-chapters',
      title: 'draft chapters',
      order: 8,
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1: Whispers in the Amber Mist',
          order: 1,
          actId: 'act-draft-chapters',
          status: 'draft',
          wordCount: 780,
          updatedAt: new Date().toISOString(),
          synopsis: 'Elena Vance discovers the first corrupted transmutation glyph in the royal clocktower.',
          content: `<h1>Chapter 1: Whispers in the Amber Mist</h1><p>The copper bell of Saint Jude tolled three times before <span class="wikilink-chip" data-target="Elena Vance" data-alias="Elena Vance"><span class="wikilink-icon">✦</span><span class="wikilink-label">Elena Vance</span></span> noticed the silence that followed. In the lower quarter of Oakhaven, the fog didn't drift; it coiled around the gaslamps like cold breath against stained glass.</p><p>She dipped her quill into the midnight-blue reagent, listening to the steady hiss of the alembic on the iron stove. The formula was wrong. She knew it the moment the vapor smelled of burnt ozone instead of wild lavender.</p><p>"If <span class="wikilink-chip" data-target="High Inquisitor Corvus" data-alias="High Inquisitor Corvus"><span class="wikilink-icon">✦</span><span class="wikilink-label">High Inquisitor Corvus</span></span> finds you working past curfew," a quiet voice murmured from the archway, "he won't just confiscate your glasswork. He'll bar you from the Guild archives for a season."</p><p>Elena didn't turn around. She adjusted the brass dial on the distillation apparatus with practiced precision. "Corvus is asleep in his velvet armchair with half a bottle of spiced port in his belly. The only thing waking him tonight is the sound of his own snoring."</p><hr><p>Across the cobblestone alley, <span class="wikilink-chip" data-target="Lucan" data-alias="Lucan"><span class="wikilink-icon">✦</span><span class="wikilink-label">Lucan</span></span> pulled his wet wool collar tight against his throat. The lantern in Elena's loft cast a flickering silhouette against the drawn blinds. He tapped three times on the drainpipe—their old signal from childhood.</p><p>When the window latch clicked open, he caught the faint, metallic tang of sulfur on the air. Something in her calculations had changed, and not for the better.</p>`,
          wikilinks: ['Elena Vance', 'High Inquisitor Corvus', 'Lucan'],
        },
        {
          id: 'ch-9',
          title: 'Chapter 9: The Gray Threshold',
          order: 2,
          actId: 'act-draft-chapters',
          status: 'draft',
          wordCount: 940,
          updatedAt: new Date().toISOString(),
          synopsis: 'Lucan and Vance cross the Blackiron Bastion courtyard under cold pre-dawn air.',
          content: `<h1>Chapter 9: The Gray Threshold</h1><p><span class="wikilink-chip" data-target="Lucan" data-alias="Lucan"><span class="wikilink-icon">✦</span><span class="wikilink-label">Lucan</span></span> climbed the slick masonry steps behind Vance, his boots squelching with each rise. The purse of thirty silver pieces felt heavy in his wool pocket, tapping against his bruised hip with a dull, metallic weight.</p><p>At the top of the stairwell, the guards shoved back a rusted iron trapdoor.</p><p>Cold pre-dawn air rushed down into the warmth of the cellar, cutting through the reek of sewer mud and spilled blood. Lucan pulled himself up into an enclosed stone service courtyard tucked deep inside the inner works of the Blackiron Bastion. Above, the massive granite curtain wall rose sixty feet into the gloom, blocking out the morning sky.</p><p>In the corner of the yard sat a moss-covered iron rainwater trough.</p><p>Lucan went straight to it. He sank both forearms into the freezing water. The cold bit into the raw cuts across his knuckles like needles, dragging the haze from his skull. He scooped water with his cupped palms, scrubbing his cheeks, his neck, and the swollen gash behind his left ear where the iron pipe had clipped him. The dark water in the trough turned murky with gray lime-sludge and crimson streaks. He rinsed his mouth, spitting a dark knot of phlegm onto the flagstones.</p><p>Behind him, Marek and two gate guards hauled the lead-bolted chest out of the trapdoor.</p>`,
          wikilinks: ['Lucan', 'Elena Vance', 'Marek'],
        }
      ]
    }
  ],
  characters: [
    {
      id: 'char-lucan',
      name: 'Lucan',
      role: 'Protagonist',
      archetype: 'The Blood-Bearer Infiltrator',
      bio: 'A former cathedral guard carrying forbidden spatial topology ciphers in Slovaria.',
      motivations: 'Protect Freya and survive vessel tolerance degradation.',
      color: '#818CF8'
    },
    {
      id: 'char-elena',
      name: 'Elena Vance',
      role: 'Protagonist',
      archetype: 'The Reluctant Scholar',
      bio: 'A prodigal alchemist in the Oakhaven Guild who questions the High Council\'s censorship.',
      motivations: 'Decode the Great Conflagration runes.',
      color: '#34D399'
    },
    {
      id: 'char-corvus',
      name: 'High Inquisitor Corvus',
      role: 'Antagonist',
      archetype: 'The Zealot Guardian of Order',
      bio: 'Master of the Alchemical Guild and Regent of the City Watch.',
      color: '#EF4444'
    }
  ],
  codex: [
    {
      id: 'codex-blood-rules',
      category: 'lore',
      name: 'Blood Resonance Rules',
      summary: 'Metaphysical spatial topology rules and the 4-tier human ladder.',
      content: '<p>Magic is spatial topology calculated under terror and catalyzed by borrowed blood.</p>',
      tags: ['magic-rules', 'spatial-magic', 'lore'],
      color: '#EC4899'
    },
    {
      id: 'codex-slovaria',
      category: 'location',
      name: 'Slovaria',
      summary: 'The rain-drenched realm of stone cathedrals and canal locks.',
      content: '<p>A northern realm governed by the High Inquisition and Saint Jude Cathedral.</p>',
      tags: ['location', 'slovaria'],
      color: '#10B981'
    }
  ],
  cutScenes: [],
  timeline: [],
  annotations: [],
  partnerMessages: [
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'Welcome to Swrite. Your Obsidian-compatible writing workspace is ready.',
      timestamp: new Date().toISOString()
    }
  ],
  scratchpad: `# Brainstorming & Notes\n- Scene ideas for Arc 1\n- Vessel tolerance escalation`
});

export interface ScannedFile {
  name: string;
  path: string;
  content: string; // HTML or Markdown or raw text
  folderName: string;
  isDocx?: boolean;
}

export const StorageService = {
  loadProject(): ProjectData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ProjectData = JSON.parse(stored);
        // Auto-upgrade any chapters with raw wikilinks
        if (parsed.acts) {
          parsed.acts.forEach(act => {
            if (act.chapters) {
              act.chapters.forEach(ch => {
                if (ch.content && (ch.content.includes('[[') || ch.content.includes(']]'))) {
                  ch.content = ch.content
                    .replace(/\[\[([^[\]|\n]+)\|([^[\]\n]+)\]\]/g, (m, target, alias) => {
                      const t = target.trim();
                      const a = alias.trim();
                      return `<span class="wikilink-chip" data-target="${t}" data-alias="${a}"><span class="wikilink-icon">✦</span><span class="wikilink-label">${a}</span></span>`;
                    })
                    .replace(/\[\[([^[\]\n]+)\]\]/g, (m, target) => {
                      const t = target.trim();
                      const display = t.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '').replace(/^[0-9]+[.\-_]\s*/, '') || t;
                      return `<span class="wikilink-chip" data-target="${t}" data-alias="${display}"><span class="wikilink-icon">✦</span><span class="wikilink-label">${display}</span></span>`;
                    });
                }
              });
            }
          });
        }
        return migrateProjectToStoryEngine(parsed);
      }
    } catch (e) {
      console.error('Failed to load project from localStorage:', e);
    }
    return INITIAL_NOVEL_DATA;
  },

  saveProject(project: ProjectData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.error('Failed to save project to localStorage:', e);
    }
  },

  /**
   * Convert Markdown or Docx HTML to clean, standardized Novel Manuscript HTML
   */
  markdownToNovelHtml(rawText: string, title: string, isAlreadyHtml = false): { html: string; wordCount: number } {
    let cleanText = (rawText || '').trim();
    
    // Decode HTML entities
    cleanText = cleanText
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–');

    let parsedHtml = '';

    if (isAlreadyHtml) {
      parsedHtml = cleanText;
    } else {
      // 1. Strip YAML frontmatter
      if (cleanText.startsWith('---')) {
        const endYaml = cleanText.indexOf('---', 3);
        if (endYaml !== -1) {
          cleanText = cleanText.substring(endYaml + 3).trim();
        }
      }

      // 2. Normalize Scene Breaks (***, * * *, ---, ❦, ◆ ◆ ◆)
      cleanText = cleanText.replace(/^[ \t]*(\*\s*\*\s*\*|---|_{3,}|❦|◆\s*◆\s*◆)[ \t]*$/gm, '\n\n<hr/>\n\n');

      // 3. Normalize dialogue em-dashes
      cleanText = cleanText.replace(/--/g, '—');

      // 4. Preprocess Obsidian Wikilinks: [[path|alias]] and [[path]]
      // Case A: [[Target|Alias]]
      cleanText = cleanText.replace(/\[\[([^[\]|\n]+)\|([^[\]\n]+)\]\]/g, (match, target, alias) => {
        const cleanTarget = target.trim();
        const cleanAlias = alias.trim();
        return `<span class="wikilink-chip" data-target="${cleanTarget}" data-alias="${cleanAlias}"><span class="wikilink-icon">✦</span><span class="wikilink-label">${cleanAlias}</span></span>`;
      });

      // Case B: [[Target]]
      cleanText = cleanText.replace(/\[\[([^[\]\n]+)\]\]/g, (match, target) => {
        const cleanTarget = target.trim();
        // Remove folder prefix for readable label: e.g. 02.Characters/Lucan -> Lucan
        const displayLabel = cleanTarget.replace(/^.*[/\\]/, '').replace(/\.(md|markdown|txt|docx|json)$/i, '').replace(/^[0-9]+[.\-_]\s*/, '') || cleanTarget;
        return `<span class="wikilink-chip" data-target="${cleanTarget}" data-alias="${displayLabel}"><span class="wikilink-icon">✦</span><span class="wikilink-label">${displayLabel}</span></span>`;
      });

      // 5. Enhance Metadata/Continuity section lines (e.g. "Characters:", "Factions:", "Continuity & Lore Links:")
      cleanText = cleanText.replace(/^(Continuity\s*&\s*Lore\s*Links|Characters|Factions|Economy|World|Locations|Previous|Next|Notes|Timeline|Tags)\s*:/gim, '**$1:**');

      // 6. Use marked parser with breaks: true
      try {
        parsedHtml = marked.parse(cleanText, { gfm: true, breaks: true }) as string;
      } catch (e) {
        // Fallback simple paragraph parsing
        const rawParagraphs = cleanText.split(/\n\s*\n+/);
        parsedHtml = rawParagraphs.map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
      }
    }

    // Unescape any leftover entities in parsedHtml
    parsedHtml = parsedHtml
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"');

    // 7. Ensure clean Title Heading at top
    const h1Match = parsedHtml.match(/^\s*<h1>(.*?)<\/h1>/i);
    let finalHtml = '';

    if (h1Match) {
      finalHtml = parsedHtml.trim();
    } else {
      finalHtml = `<h1>${title}</h1>\n` + parsedHtml.trim();
    }

    // 8. Clean up empty tags and invalid wrappers
    finalHtml = finalHtml
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/<p><hr\s*\/?><\/p>/g, '<hr/>')
      .replace(/<p>\s*<hr\s*\/?>\s*<\/p>/g, '<hr/>');

    // Calculate word count
    const plainText = finalHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainText ? plainText.split(' ').length : 0;

    return { html: finalHtml, wordCount };
  },

  async parseSingleFile(file: File): Promise<{ title: string; html: string; wordCount: number; isDocx?: boolean }> {
    const lower = file.name.toLowerCase();
    let content = '';
    let isDocx = false;

    if (lower.endsWith('.docx')) {
      isDocx = true;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      content = result.value;
    } else {
      content = await file.text();
    }

    const cleanTitle = file.name.replace(/\.(md|markdown|txt|docx|json|html|htm|rtf)$/i, '').trim() || 'Imported Chapter';
    const { html, wordCount } = this.markdownToNovelHtml(content, cleanTitle, isDocx);
    return { title: cleanTitle, html, wordCount, isDocx };
  },

  naturalSort(a: string, b: string): number {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  },

  async scanDirectoryHandle(dirHandle: any, currentPath = ''): Promise<ScannedFile[]> {
    const files: ScannedFile[] = [];

    for await (const [name, handle] of (dirHandle as any).entries()) {
      if (name.startsWith('.') || name === 'node_modules' || name === 'dist' || name === 'build') {
        continue;
      }

      if (handle.kind === 'file') {
        const lower = name.toLowerCase();
        if (
          lower.endsWith('.md') ||
          lower.endsWith('.markdown') ||
          lower.endsWith('.txt') ||
          lower.endsWith('.docx') ||
          lower.endsWith('.json')
        ) {
          try {
            const file = await handle.getFile();
            let content = '';
            let isDocx = false;

            if (lower.endsWith('.docx')) {
              isDocx = true;
              const arrayBuffer = await file.arrayBuffer();
              const result = await mammoth.convertToHtml({ arrayBuffer });
              content = result.value;
            } else {
              content = await file.text();
            }

            files.push({
              name,
              path: currentPath ? `${currentPath}/${name}` : name,
              folderName: currentPath || 'Root',
              content,
              isDocx,
            });
          } catch (e) {
            console.warn(`Could not read file ${name}:`, e);
          }
        }
      } else if (handle.kind === 'directory') {
        const subPath = currentPath ? `${currentPath}/${name}` : name;
        const subFiles = await this.scanDirectoryHandle(handle, subPath);
        files.push(...subFiles);
      }
    }

    return files;
  },

  /**
   * Build structured ProjectData from Obsidian vault / markdown / docx files
   */
  buildProjectFromFiles(folderName: string, files: ScannedFile[]): ProjectData {
    files.sort((a, b) => this.naturalSort(a.path, b.path));

    const folderGroups: Record<string, { file: ScannedFile; parsed: any }[]> = {};
    const charactersMap: Record<string, Character> = {};
    let scratchpadText = '';

    files.forEach(f => {
      const lowerName = f.name.toLowerCase();

      // Check for JSON character configs
      if (lowerName.endsWith('.json') && (f.folderName.toLowerCase().includes('character') || lowerName.startsWith('char_'))) {
        try {
          const charObj = JSON.parse(f.content);
          const name = charObj.name || f.name.replace('.json', '');
          charactersMap[name.toLowerCase()] = {
            id: `char-${Date.now()}-${Math.random()}`,
            name,
            role: charObj.role || 'Supporting',
            bio: charObj.bio || '',
            motivations: charObj.motivations || '',
            flaws: charObj.flaws || '',
            voiceNotes: charObj.voiceNotes || '',
            color: '#818CF8'
          };
          return;
        } catch (e) {}
      }

      // If docx, extract title and plain structure
      if (f.isDocx) {
        const title = f.name.replace(/\.docx$/i, '').replace(/^[0-9]+[_\-\s]*/, '').replace(/[-_]/g, ' ').trim() || 'Untitled Chapter';
        const parsed = {
          title,
          rawContent: f.content,
          frontmatter: {},
          tags: ['docx'],
          wikilinks: [],
          detectedCharacters: ObsidianParserService.detectCharactersInText(f.content.replace(/<[^>]+>/g, ' ')),
          inferredType: 'chapter' as const,
          inferredAct: undefined,
          inferredOrder: undefined,
          isDocx: true,
        };

        const actRaw = f.folderName === 'Root' ? folderName : f.folderName;
        const actFormatted = ObsidianParserService.formatActTitle(actRaw, folderName);
        if (!folderGroups[actFormatted]) folderGroups[actFormatted] = [];
        folderGroups[actFormatted].push({ file: f, parsed });
        return;
      }

      // Parse with Obsidian parser
      const parsed = ObsidianParserService.parseObsidianMarkdown(f.content, f.name);

      if (parsed.inferredType === 'character' || f.folderName.toLowerCase().includes('character')) {
        charactersMap[parsed.title.toLowerCase()] = {
          id: `char-${parsed.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: parsed.title,
          role: (parsed.frontmatter['role'] as any) || 'Supporting',
          bio: parsed.rawContent,
          motivations: parsed.frontmatter['motivation'] || parsed.frontmatter['goal'] || '',
          flaws: parsed.frontmatter['flaw'] || '',
          voiceNotes: parsed.frontmatter['voice'] || '',
          tags: parsed.tags,
          color: '#818CF8'
        };
      }

      if (parsed.inferredType === 'notes' || f.folderName.toLowerCase().includes('scratch')) {
        scratchpadText += `\n\n# ${parsed.title}\n${parsed.rawContent}`;
      }

      // Collect detected characters from the text
      parsed.detectedCharacters.forEach(name => {
        if (!charactersMap[name.toLowerCase()]) {
          charactersMap[name.toLowerCase()] = {
            id: `char-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name,
            role: 'Supporting',
            bio: `Character identified in chapter "${parsed.title}".`,
            color: '#818CF8'
          };
        }
      });

      // Preserve real folder structure in folderGroups
      let folderTitle = f.folderName;
      if (folderTitle === 'Root' || !folderTitle) {
        folderTitle = 'Manuscript';
      }

      if (!folderGroups[folderTitle]) {
        folderGroups[folderTitle] = [];
      }
      folderGroups[folderTitle].push({ file: f, parsed });
    });

    if (Object.keys(folderGroups).length === 0) {
      folderGroups['Manuscript'] = [];
    }

    const acts: Act[] = [];
    let actOrder = 1;
    let globalChapterCount = 0;
    let totalWordCount = 0;

    Object.entries(folderGroups).forEach(([actTitle, groupItems]) => {
      const actId = `act-${actOrder}`;
      const chapters: Chapter[] = [];

      groupItems.forEach((item, cIdx) => {
        globalChapterCount++;
        const { html, wordCount } = this.markdownToNovelHtml(
          item.parsed.rawContent, 
          item.parsed.title, 
          Boolean(item.file.isDocx)
        );
        totalWordCount += wordCount;

        // Associate primary character as POV if found
        let povCharId: string | undefined;
        if (item.parsed.detectedCharacters.length > 0) {
          const firstChar = charactersMap[item.parsed.detectedCharacters[0].toLowerCase()];
          if (firstChar) povCharId = firstChar.id;
        }

        chapters.push({
          id: `ch-imported-${globalChapterCount}`,
          title: item.parsed.title,
          order: item.parsed.inferredOrder || cIdx + 1,
          actId,
          content: html,
          wordCount,
          status: (item.parsed.frontmatter['status'] as any) || 'draft',
          tags: item.parsed.tags,
          wikilinks: item.parsed.detectedCharacters,
          povCharacterId: povCharId,
          synopsis: item.parsed.frontmatter['synopsis'] || item.parsed.frontmatter['summary'] || '',
          updatedAt: new Date().toISOString(),
        });
      });

      if (chapters.length === 0) {
        chapters.push({
          id: `ch-imported-1`,
          title: 'Chapter 1',
          order: 1,
          actId,
          content: '<h1>Chapter 1</h1><p></p>',
          wordCount: 0,
          status: 'draft',
          updatedAt: new Date().toISOString(),
        });
      }

      chapters.sort((a, b) => a.order - b.order);

      acts.push({
        id: actId,
        title: actTitle,
        order: actOrder,
        chapters,
      });

      actOrder++;
    });

    const characters = Object.values(charactersMap);

    return migrateProjectToStoryEngine({
      metadata: {
        id: `project-${Date.now()}`,
        title: folderName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        author: 'Author',
        genre: 'Novel',
        targetWordCount: Math.max(50000, totalWordCount * 2),
        currentWordCount: totalWordCount,
        preset: 'plotter',
        theme: getPersistedUserTheme(),
        typography: getPersistedUserTypography(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      acts,
      characters: characters.length > 0 ? characters : INITIAL_NOVEL_DATA.characters,
      codex: INITIAL_NOVEL_DATA.codex,
      timeline: INITIAL_NOVEL_DATA.timeline,
      annotations: [],
      partnerMessages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Loaded "${folderName}". Detected ${acts.length} folder(s), ${globalChapterCount} note(s)/chapter(s), and ${characters.length} character(s).`,
          timestamp: new Date().toISOString(),
        }
      ],
      scratchpad: scratchpadText || INITIAL_NOVEL_DATA.scratchpad,
    });
  },

  hasLocalDirectoryHandle(): boolean {
    return activeDirectoryHandle !== null;
  },

  async pickAndLoadLocalFolder(): Promise<{ project: ProjectData; folderName: string } | null> {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        });
        
        activeDirectoryHandle = dirHandle;
        const folderName = dirHandle.name;
        const scannedFiles = await this.scanDirectoryHandle(dirHandle);
        const project = this.buildProjectFromFiles(folderName, scannedFiles);
        
        return { project, folderName };
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error opening directory picker:', err);
        }
      }
    }
    return null;
  },

  /**
   * Convert Editor HTML to clean Markdown with frontmatter
   */
  htmlToMarkdown(html: string, chapter: Chapter): string {
    let md = html
      // 1. Convert wikilink chips back to Obsidian wikilinks
      .replace(/<span class="wikilink-chip"[^>]*data-target="([^"]+)"[^>]*data-alias="([^"]+)"[^>]*>.*?<\/span>/gi, (match, target, alias) => {
        return target === alias ? `[[${target}]]` : `[[${target}|${alias}]]`;
      })
      .replace(/<span class="wikilink-chip"[^>]*data-target="([^"]+)"[^>]*>.*?<span class="wikilink-label">([^<]+)<\/span><\/span>/gi, (match, target, label) => {
        return target === label ? `[[${target}]]` : `[[${target}|${label}]]`;
      })
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<hr\s*\/?>/gi, '\n* * *\n\n')
      .replace(/<p class="scene-break">(.*?)<\/p>/gi, '\n* * *\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const tagsStr = (chapter.tags && chapter.tags.length > 0) ? `\ntags: [${chapter.tags.join(', ')}]` : '';
    const povStr = chapter.povCharacterId ? `\npov: "${chapter.povCharacterId}"` : '';
    const statusStr = chapter.status ? `\nstatus: "${chapter.status}"` : '';
    const synopStr = chapter.synopsis ? `\nsynopsis: "${chapter.synopsis.replace(/"/g, '\\"')}"` : '';

    const frontmatter = `---
title: "${chapter.title.replace(/"/g, '\\"')}"${statusStr}${tagsStr}${povStr}${synopStr}
---

`;

    return frontmatter + md + '\n';
  },

  /**
   * Save chapter back directly to local file system
   */
  async saveChapterToDisk(chapter: Chapter, actTitle = 'Manuscript'): Promise<boolean> {
    if (!activeDirectoryHandle) return false;
    try {
      const mdContent = this.htmlToMarkdown(chapter.content, chapter);
      const cleanFileName = `${chapter.order.toString().padStart(2, '0')} - ${chapter.title.replace(/[/\\?%*:|"<>]/g, '_')}.md`;
      
      // Determine folder
      let targetDir = activeDirectoryHandle;
      if (actTitle && actTitle !== 'Root' && actTitle !== 'Manuscript') {
        const cleanActFolder = actTitle.replace(/[/\\?%*:|"<>]/g, '_');
        try {
          targetDir = await activeDirectoryHandle.getDirectoryHandle(cleanActFolder, { create: true });
        } catch {
          targetDir = activeDirectoryHandle;
        }
      }

      const fileHandle = await targetDir.getFileHandle(cleanFileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(mdContent);
      await writable.close();
      return true;
    } catch (e) {
      console.warn('Could not auto-save chapter to disk:', e);
      return false;
    }
  },

  async loadFromFileInputList(fileList: FileList): Promise<{ project: ProjectData; folderName: string }> {
    const scannedFiles: ScannedFile[] = [];
    let rootFolderName = 'Obsidian Vault';

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = (file as any).webkitRelativePath || file.name;
      const pathParts = relPath.split('/');

      if (pathParts.length > 1) {
        rootFolderName = pathParts[0];
      }

      const folderName = pathParts.length > 2 ? pathParts.slice(1, -1).join('/') : (pathParts.length > 1 ? pathParts[0] : 'Root');
      const lower = file.name.toLowerCase();

      if (
        lower.endsWith('.md') ||
        lower.endsWith('.markdown') ||
        lower.endsWith('.txt') ||
        lower.endsWith('.docx') ||
        lower.endsWith('.json')
      ) {
        try {
          let content = '';
          let isDocx = false;

          if (lower.endsWith('.docx')) {
            isDocx = true;
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            content = result.value;
          } else {
            content = await file.text();
          }

          scannedFiles.push({
            name: file.name,
            path: relPath,
            folderName,
            content,
            isDocx,
          });
        } catch (e) {
          console.warn(`Could not read ${file.name}:`, e);
        }
      }
    }

    const project = this.buildProjectFromFiles(rootFolderName, scannedFiles);
    return { project, folderName: rootFolderName };
  }
};
