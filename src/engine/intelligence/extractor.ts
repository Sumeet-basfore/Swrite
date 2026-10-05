/**
 * SWRITE — Project Intelligence Engine: Pass 1 (Contextual Extraction)
 * Analyzes full project context (Acts, Chapters, Scenes, Notes, Codex, Cut Scenes)
 * and extracts candidate entities, timeline markers, plot threads, and structural boundaries
 * with strict provenance tracking, contextual disambiguation, and false-positive resistance.
 */

import { ProjectData, Chapter, Scene } from '../../types';
import { 
  OrganizationDomain, SourceReference 
} from '../../types/intelligence';

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractParagraphs(content: string): string[] {
  if (!content) return [];
  if (content.includes('<p>') || content.includes('<p ')) {
    const matches = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (matches && matches.length > 0) {
      return matches.map(m => stripHtml(m)).filter(p => p.length > 0);
    }
  }
  return content
    .split(/\n\s*\n/)
    .map(p => stripHtml(p))
    .filter(p => p.length > 0);
}

// Common title/honorific prefixes
const HONORIFICS = [
  'Lord', 'Lady', 'Sir', 'Dame', 'King', 'Queen', 'Prince', 'Princess', 
  'Emperor', 'Empress', 'Captain', 'Commander', 'High Inquisitor', 'Inquisitor', 'Master', 
  'Doctor', 'Dr.', 'Archmage', 'Father', 'Mother', 'Elder', 'Brother', 'Sister',
  'High Marshal', 'General', 'Duke', 'High Priestess', 'Priestess', 
  'Shadow Weaver', 'Ranger', 'Nomad Leader', 'Emissary', 'Master Alchemist'
];

// Common faction markers
const FACTION_MARKERS = [
  'Guard', 'Order', 'Guild', 'Brotherhood', 'Sisterhood', 'Covenant', 
  'Legion', 'Cult', 'Syndicate', 'Council', 'Watch', 'Alliance', 
  'Dynasty', 'Clan', 'Houses', 'Kingdom', 'Empire', 'Concordat', 'Coven'
];

// Common location markers
const LOCATION_MARKERS = [
  'City', 'Town', 'Village', 'Fortress', 'Castle', 'Tower', 'Citadel', 
  'Keep', 'Gate', 'Gates', 'Quarter', 'Street', 'River', 'Forest', 'Mountain', 
  'Pass', 'Valley', 'Isle', 'Island', 'Sea', 'Bay', 'Haven', 'Reach', 
  'Threshold', 'Vale', 'Hold', 'Garde', 'Port', 'Spire', 'Oasis', 'Catacombs',
  'Ridge', 'Sanctuary', 'Chamber', 'Laboratory', 'Feast Hall'
];

// Common item markers
const ITEM_MARKERS = [
  'Sword', 'Blade', 'Dagger', 'Staff', 'Wand', 'Crown', 'Amulet', 
  'Ring', 'Tome', 'Grimoire', 'Scroll', 'Shield', 'Armor', 'Relic', 
  'Chalice', 'Cipher', 'Vessel', 'Stone', 'Orb', 'Galleon', 'Ship', 'Scepter',
  'Elixir', 'Throne', 'Arrows', 'Treaty'
];

// False-positive stop words (frequently capitalized words that are NOT entities)
const COMMON_NON_ENTITIES = new Set([
  'Chapter', 'Scene', 'Act', 'Part', 'The', 'And', 'Then', 'Suddenly', 'Meanwhile', 
  'After', 'Before', 'When', 'While', 'Every', 'Some', 'Many', 'Nothing', 'Everything',
  'However', 'Although', 'Perhaps', 'Tonight', 'Tomorrow', 'Yesterday', 'Today',
  'Style Guide', 'Untitled Scene', 'Draft', 'Notes', 'Prologue', 'Epilogue', 'Interlude',
  'Summary', 'Outline', 'Character', 'Location', 'Faction', 'Item', 'Event', 'Research'
]);

export interface RawExtractedCandidate {
  domain: OrganizationDomain;
  name: string;
  confidence: number;
  reasoning: string;
  sourceReferences: SourceReference[];
  attributes: Record<string, any>;
  timelineOffset?: string;
  isPotentialDuplicateOf?: string;
  coOccurringEntities?: string[];
  entityNature?: 'active' | 'incidental' | 'historical' | 'research-reference';
  temporalCertainty?: 'known' | 'inferred' | 'unknown';
  isStaleDraft?: boolean;
}

export const ProjectIntelligenceExtractor = {
  /**
   * Pass 1: Extract all entity candidates across manuscript, notes, and project context.
   */
  extractProjectCandidates(project: ProjectData): RawExtractedCandidate[] {
    const candidatesMap = new Map<string, RawExtractedCandidate>();

    const addOrUpdateCandidate = (
      domain: OrganizationDomain,
      name: string,
      confidence: number,
      reasoning: string,
      ref: SourceReference,
      attributes: Record<string, any> = {},
      coOccurring: string[] = []
    ) => {
      const cleanName = name.trim();
      if (!cleanName || cleanName.length < 2) return;
      if (COMMON_NON_ENTITIES.has(cleanName)) return;

      const key = `${domain}:${cleanName.toLowerCase()}`;
      const existing = candidatesMap.get(key);

      if (existing) {
        existing.confidence = Math.min(0.98, Math.max(existing.confidence, confidence) + 0.05);
        if (!existing.sourceReferences.some(r => r.documentId === ref.documentId && r.paragraphIndex === ref.paragraphIndex)) {
          existing.sourceReferences.push(ref);
        }
        existing.attributes = { ...existing.attributes, ...attributes };
        if (attributes.isStaleDraft || ref.sourceCategory === 'cut-drawer') {
          existing.isStaleDraft = true;
        }
        if (coOccurring.length > 0) {
          existing.coOccurringEntities = Array.from(new Set([...(existing.coOccurringEntities || []), ...coOccurring]));
        }
      } else {

        candidatesMap.set(key, {
          domain,
          name: cleanName,
          confidence,
          reasoning,
          sourceReferences: [ref],
          attributes,
          coOccurringEntities: coOccurring,
          entityNature: attributes.entityNature || (ref.documentType === 'research' ? 'research-reference' : 'active'),
          temporalCertainty: attributes.temporalCertainty,
          isStaleDraft: ref.sourceCategory === 'cut-drawer'
        });
      }
    };

    // 0. Scan Declared Canon Entities (Existing Project Structure)
    project.characters?.forEach(char => {
      const ref: SourceReference = {
        documentId: char.id,
        documentTitle: `Character: ${char.name}`,
        documentType: 'character',
        sourceCategory: 'primary-manuscript',
        snippet: char.bio || char.motivations || '',
        reason: 'Existing declared project character.'
      };
      addOrUpdateCandidate('character', char.name, 0.95, 'Declared character in project cast.', ref, {
        bio: char.bio,
        role: char.role,
        aliases: char.aliases || []
      });
      char.aliases?.forEach(alias => {
        addOrUpdateCandidate('character', alias, 0.90, `Declared alias for ${char.name}.`, ref, {
          isAliasOf: char.name
        });
      });
    });

    project.locations?.forEach(loc => {
      const ref: SourceReference = {
        documentId: loc.id,
        documentTitle: `Location: ${loc.name}`,
        documentType: 'location',
        sourceCategory: 'primary-manuscript',
        snippet: loc.summary || loc.description || '',
        reason: 'Existing declared project location.'
      };
      addOrUpdateCandidate('location', loc.name, 0.95, 'Declared location in project world.', ref, {
        summary: loc.summary,
        tags: loc.tags || []
      });
    });

    project.factions?.forEach(fac => {
      const ref: SourceReference = {
        documentId: fac.id,
        documentTitle: `Faction: ${fac.name}`,
        documentType: 'faction',
        sourceCategory: 'primary-manuscript',
        snippet: fac.summary || fac.description || '',
        reason: 'Existing declared project faction.'
      };
      addOrUpdateCandidate('faction', fac.name, 0.95, 'Declared faction in project world.', ref, {
        summary: fac.summary,
        tags: fac.tags || []
      });
    });

    project.items?.forEach(item => {
      const ref: SourceReference = {
        documentId: item.id,
        documentTitle: `Item: ${item.name}`,
        documentType: 'item',
        sourceCategory: 'primary-manuscript',
        snippet: item.summary || item.description || '',
        reason: 'Existing declared project item.'
      };
      addOrUpdateCandidate('item', item.name, 0.95, 'Declared item in project inventory.', ref, {
        summary: item.summary,
        itemType: item.type,
        tags: item.tags || []
      });
    });

    // 1. Scan Active Manuscript Chapters & Scenes (Primary Canon Source)
    project.acts.forEach(act => {
      act.chapters.forEach(chapter => {
        const docTitle = `${act.title} · ${chapter.title}`;
        const paragraphs = extractParagraphs(chapter.content || '');

        paragraphs.forEach((para, pIndex) => {
          this.scanParagraphForEntities(para, chapter.id, docTitle, 'chapter', 'primary-manuscript', pIndex, addOrUpdateCandidate);
          this.scanParagraphForTimeline(para, chapter.id, docTitle, 'chapter', 'primary-manuscript', pIndex, addOrUpdateCandidate);
          this.scanParagraphForPlotThreads(para, chapter.id, docTitle, 'chapter', 'primary-manuscript', pIndex, addOrUpdateCandidate);
        });

        chapter.scenes?.forEach(scene => {
          const sceneTitle = `${docTitle} · ${scene.title || 'Scene'}`;
          const sceneParas = extractParagraphs(scene.content || '');
          sceneParas.forEach((para, pIndex) => {
            this.scanParagraphForEntities(para, scene.id, sceneTitle, 'scene', 'primary-manuscript', pIndex, addOrUpdateCandidate);
            this.scanParagraphForTimeline(para, scene.id, sceneTitle, 'scene', 'primary-manuscript', pIndex, addOrUpdateCandidate);
          });
        });
      });
    });

    // 2. Scan Codex Entries (Authoritative Worldbuilding Lore)
    project.codex?.forEach(entry => {
      const domain: OrganizationDomain = entry.category === 'character' 
        ? 'character' 
        : entry.category === 'location' 
        ? 'location' 
        : entry.category === 'faction' 
        ? 'faction' 
        : entry.category === 'item' 
        ? 'item' 
        : 'research';

      const ref: SourceReference = {
        documentId: entry.id,
        documentTitle: `Codex: ${entry.name}`,
        documentType: 'research',
        sourceCategory: 'codex',
        snippet: (entry.content || entry.summary || '').substring(0, 150),
        reason: `Explicitly recorded in project codex as ${entry.category}.`
      };

      addOrUpdateCandidate(domain, entry.name, 0.95, `Codex entry in category "${entry.category}".`, ref, {
        description: entry.content || entry.summary || '',
        aliases: entry.aliases || [],
        tags: entry.tags || [],
        entityNature: 'active'
      });
    });

    // 3. Scan Research Notes (Reference Only — Suppress Direct Cast Pollution)
    project.researchNotes?.forEach(note => {
      const ref: SourceReference = {
        documentId: note.id,
        documentTitle: `Research Note: ${note.title}`,
        documentType: 'research',
        sourceCategory: 'research',
        snippet: (note.content || note.summary || '').substring(0, 150),
        reason: 'Research documentation reference.'
      };

      addOrUpdateCandidate('research', note.title, 0.90, 'Research documentation note.', ref, {
        content: note.content || '',
        category: note.category,
        entityNature: 'research-reference'
      });

      // When scanning inside research text, mark entities as research-reference so they don't pollute the main cast
      const paragraphs = extractParagraphs(note.content || '');
      paragraphs.forEach((para, pIndex) => {
        // Extract comma-separated named references or "Name of Place" in research notes
        const listRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:\s+of\s+[A-Z][a-z]+|\s+the\s+[A-Z][a-z]+)?)(?:,|\.|\sand\s|$)/g;
        let lMatch: RegExpExecArray | null;
        while ((lMatch = listRegex.exec(para)) !== null) {
          const rawName = lMatch[1].trim();
          if (rawName.length > 3 && !COMMON_NON_ENTITIES.has(rawName)) {
            const snippet = para.substring(Math.max(0, lMatch.index - 20), Math.min(para.length, lMatch.index + 70));
            addOrUpdateCandidate('character', rawName, 0.35, `Historical reference listed in research note "${note.title}".`, {
              documentId: note.id,
              documentTitle: `Research: ${note.title}`,
              documentType: 'research',
              sourceCategory: 'research',
              paragraphIndex: pIndex,
              snippet: `...${snippet}...`,
              reason: `Research documentation reference: "${rawName}"`
            }, {
              entityNature: 'research-reference'
            });
          }
        }

        this.scanParagraphForEntities(para, note.id, `Research: ${note.title}`, 'research', 'research', pIndex, (d, n, c, r, srcRef, attrs, coOcc) => {
          // Reduce confidence of extracted entities from research notes so they require explicit review
          addOrUpdateCandidate(d, n, Math.min(0.40, c - 0.40), `Referenced in research note "${note.title}".`, srcRef, {
            ...attrs,
            entityNature: 'research-reference'
          }, coOcc);
        });
      });

    });

    // 4. Scan Cut Drawer Scenes (Stale / Historical Draft Material)
    project.cutScenes?.forEach(cut => {
      const ref: SourceReference = {
        documentId: cut.id,
        documentTitle: `Cut Drawer: ${cut.title}`,
        documentType: 'scene',
        sourceCategory: 'cut-drawer',
        snippet: (cut.content || '').substring(0, 150),
        reason: `Preserved in cut drawer from ${cut.originalChapterTitle || 'manuscript'}.`
      };

      addOrUpdateCandidate('outline', cut.title, 0.70, 'Draft scene preserved in cut drawer.', ref, {
        rawContent: cut.content,
        wordCount: cut.wordCount,
        cutReason: cut.reason,
        isStaleDraft: true
      });

      // Extract entities from cut material with stale draft flag
      const paragraphs = extractParagraphs(cut.content || '');
      paragraphs.forEach((para, pIndex) => {
        this.scanParagraphForEntities(para, cut.id, `Cut Drawer: ${cut.title}`, 'scene', 'cut-drawer', pIndex, (d, n, c, r, srcRef, attrs, coOcc) => {
          addOrUpdateCandidate(d, n, Math.min(0.65, c - 0.20), `Extracted from cut drawer draft "${cut.title}".`, srcRef, {
            ...attrs,
            isStaleDraft: true
          }, coOcc);
        });
      });
    });

    return Array.from(candidatesMap.values());
  },

  /**
   * Scans a single paragraph for character, location, faction, item, and contextual collisions.
   */
  scanParagraphForEntities(
    paragraph: string,
    docId: string,
    docTitle: string,
    docType: 'chapter' | 'scene' | 'research' | 'file',
    sourceCategory: 'primary-manuscript' | 'codex' | 'notes' | 'cut-drawer' | 'research',
    pIndex: number,
    emit: (
      domain: OrganizationDomain, 
      name: string, 
      conf: number, 
      reason: string, 
      ref: SourceReference, 
      attrs?: Record<string, any>,
      coOccurring?: string[]
    ) => void
  ) {
    if (!paragraph || paragraph.length < 15) return;

    // Track all entities mentioned in this specific paragraph for co-occurrence verification
    const paragraphEntities: string[] = [];
    const emissions: Array<{
      domain: OrganizationDomain;
      name: string;
      conf: number;
      reason: string;
      ref: SourceReference;
      attrs?: Record<string, any>;
    }> = [];

    const localEmit = (
      domain: OrganizationDomain,
      name: string,
      conf: number,
      reason: string,
      ref: SourceReference,
      attrs?: Record<string, any>
    ) => {
      paragraphEntities.push(name);
      // Also add single word if name is multi-word
      name.split(/\s+/).forEach(part => {
        if (part.length > 2 && !COMMON_NON_ENTITIES.has(part)) {
          paragraphEntities.push(part);
        }
      });
      emissions.push({ domain, name, conf, reason, ref, attrs });
    };

    // Pre-scan for capitalized entity names connected by conjunctions (e.g., "Arin and Aria")
    const capitalizedPairRegex = /\b([A-Z][a-z]+)\s+(?:and|with|beside|against|to)\s+([A-Z][a-z]+)\b/g;
    let match: RegExpExecArray | null;
    while ((match = capitalizedPairRegex.exec(paragraph)) !== null) {
      if (!COMMON_NON_ENTITIES.has(match[1])) paragraphEntities.push(match[1]);
      if (!COMMON_NON_ENTITIES.has(match[2])) paragraphEntities.push(match[2]);
    }

    // ─── A. Character Dialogue Attribution Patterns ───
    const dialogueAttributionRegex = /(?:["”]\s*(?:said|whispered|shouted|replied|muttered|asked|demanded|growled|gasped|laughed|sighed)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|whispered|shouted|replied|muttered|asked|demanded|growled|gasped|looked|stepped|turned|walked|smiled|nodded|drew|paused)[,\s])/g;

    while ((match = dialogueAttributionRegex.exec(paragraph)) !== null) {
      const name = (match[1] || match[2])?.trim();
      if (name && !COMMON_NON_ENTITIES.has(name)) {
        const snippet = paragraph.substring(Math.max(0, match.index - 30), Math.min(paragraph.length, match.index + 80));
        localEmit('character', name, 0.90, 'Identified via direct dialogue attribution or active character gesture.', {
          documentId: docId,
          documentTitle: docTitle,
          documentType: docType,
          sourceCategory,
          paragraphIndex: pIndex,
          snippet: `“...${snippet}...”`,
          reason: `Active dialogue attribution: "${match[0].trim()}"`
        }, {
          role: 'Primary / Speaking Character'
        });
      }
    }

    // ─── B. Honorific & Titled Entities ───
    HONORIFICS.forEach(hon => {
      const honRegex = new RegExp(`\\b(${hon}\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?(?:\\s+[IVXLCDM]+)?)\\b`, 'g');
      while ((match = honRegex.exec(paragraph)) !== null) {
        const fullName = match[1].trim();
        if (!COMMON_NON_ENTITIES.has(fullName)) {
          const isHistorical = /died|centuries ago|ancient|legendary|reigned|centuries prior/i.test(paragraph);
          const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));
          localEmit('character', fullName, isHistorical ? 0.60 : 0.92, `Character identified with formal honorific/title "${hon}".`, {
            documentId: docId,
            documentTitle: docTitle,
            documentType: docType,
            sourceCategory,
            paragraphIndex: pIndex,
            snippet: `...${snippet}...`,
            reason: `Formal title attribution: "${fullName}"`
          }, {
            title: hon,
            role: isHistorical ? 'Historical Figure' : 'Titled Entity / Character',
            entityNature: isHistorical ? 'historical' : 'active'
          });
        }
      }
    });

    // ─── B2. Physical Traits & Status Signals ───
    const physicalTraitRegex = /\b([A-Z][a-z]+)\s+(?:has|had|with|wore)\s+([a-z]+)\s+(eyes|hair|skin|cloak|robes?|scars?)\b/gi;
    while ((match = physicalTraitRegex.exec(paragraph)) !== null) {
      const charName = match[1];
      const detail = `${match[2]} ${match[3]}`.toLowerCase();
      if (!COMMON_NON_ENTITIES.has(charName)) {
        const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 80));
        localEmit('character', charName, 0.88, `Physical attribute detected: "${detail}".`, {
          documentId: docId,
          documentTitle: docTitle,
          documentType: docType,
          sourceCategory,
          paragraphIndex: pIndex,
          snippet: `...${snippet}...`,
          reason: `Physical description: "${match[0]}"`
        }, {
          physicalDetail: detail,
          traitType: match[3].toLowerCase()
        });
      }
    }

    // ─── B3. Character Age Mentions ───
    const numberWordMap: Record<string, number> = {
      'twenty-four': 24, 'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27,
      'twenty-eight': 28, 'twenty-nine': 29, 'thirty': 30, 'thirty-five': 35
    };

    const ageRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[,\s]+(?:was|is|turned|now|now\s+age|age|aged)\s+(?:age\s+)?(\d{1,3}|twenty-[a-z]+|thirty(?:-[a-z]+)?)\b/gi;
    while ((match = ageRegex.exec(paragraph)) !== null) {
      const charName = match[1].trim();
      const rawAge = match[2].toLowerCase();
      const ageNum = numberWordMap[rawAge] || parseInt(rawAge, 10);
      if (!COMMON_NON_ENTITIES.has(charName) && ageNum > 0 && ageNum < 150) {
        const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 80));
        localEmit('character', charName, 0.90, `Explicit age attribute detected (${ageNum}).`, {
          documentId: docId,
          documentTitle: docTitle,
          documentType: docType,
          sourceCategory,
          paragraphIndex: pIndex,
          snippet: `...${snippet}...`,
          reason: `Age attribution: "${match[0]}"`
        }, {
          age: ageNum
        });
      }
    }


    // ─── C. Faction Patterns & Collision Disambiguation ───
    FACTION_MARKERS.forEach(marker => {
      const factionRegex = new RegExp(`\\b(?:The\\s+)?([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?\\s+${marker}|${marker}\\s+of\\s+(?:the\\s+)?[A-Z][a-z]+)\\b`, 'g');
      while ((match = factionRegex.exec(paragraph)) !== null) {
        const factionName = match[0].trim();
        if (!COMMON_NON_ENTITIES.has(factionName)) {
          const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));
          localEmit('faction', factionName, 0.88, `Organizational faction detected with suffix/prefix "${marker}".`, {
            documentId: docId,
            documentTitle: docTitle,
            documentType: docType,
            sourceCategory,
            paragraphIndex: pIndex,
            snippet: `...${snippet}...`,
            reason: `Faction name pattern: "${factionName}"`
          }, {});
        }
      }
    });

    // ─── D. Location Patterns & Landmark Disambiguation ───
    LOCATION_MARKERS.forEach(marker => {
      const locRegex = new RegExp(`\\b(?:in|at|near|outside|beyond|towards|within|into)\\s+(?:the\\s+)?(?:ancient\\s+|grand\\s+|great\\s+)?(?:city\\s+of\\s+|fortress\\s+of\\s+|walls\\s+of\\s+|gates\\s+of\\s+)?([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?\\s+${marker}|${marker}\\s+of\\s+[A-Z][a-z]+|[A-Z][a-z]+(?:haven|hold|vale|shire|ford|bury|garde|stead|port|fell|wood|stone))\\b`, 'gi');
      while ((match = locRegex.exec(paragraph)) !== null) {
        const locName = (match[1] || match[0]).replace(/^(?:in|at|near|outside|beyond|towards|within|into)\s+(?:the\\s+)?(?:ancient\\s+|grand\\s+|great\\s+)?(?:city\\s+of\\s+|fortress\\s+of\\s+|walls\\s+of\\s+|gates\\s+of\\s+)?/i, '').trim();
        if (locName && !COMMON_NON_ENTITIES.has(locName)) {
          const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));
          localEmit('location', locName, 0.86, `Geographic location identified via spatial preposition and landmark marker "${marker}".`, {
            documentId: docId,
            documentTitle: docTitle,
            documentType: docType,
            sourceCategory,
            paragraphIndex: pIndex,
            snippet: `...${snippet}...`,
            reason: `Spatial setting reference: "${locName}"`
          }, {});
        }
      }
    });

    // Explicit "city/fortress/river of X" or "X city" pattern
    const explicitGeoRegex = /\b(?:the\s+)?(?:ancient\s+|grand\s+|great\s+)?(?:city|fortress|citadel|realm|river|valley|pass|forest|haven)\s+of\s+([A-Z][a-z]+)\b/gi;
    while ((match = explicitGeoRegex.exec(paragraph)) !== null) {
      const locName = match[1].trim();
      if (locName && !COMMON_NON_ENTITIES.has(locName)) {
        const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));
        localEmit('location', locName, 0.90, `Location identified via geographic noun phrase ("${match[0]}").`, {
          documentId: docId,
          documentTitle: docTitle,
          documentType: docType,
          sourceCategory,
          paragraphIndex: pIndex,
          snippet: `...${snippet}...`,
          reason: `Explicit geographic phrase: "${match[0]}"`
        }, {});
      }
    }

    // ─── E. Important Items & Artifacts ───
    ITEM_MARKERS.forEach(marker => {
      const itemRegex = new RegExp(`\\b(?:the\\s+)?([A-Z][a-z]+\\s+${marker}|${marker}\\s+of\\s+[A-Z][a-z]+)\\b`, 'g');
      while ((match = itemRegex.exec(paragraph)) !== null) {
        const itemName = match[0].trim();
        if (!COMMON_NON_ENTITIES.has(itemName)) {
          const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));
          localEmit('item', itemName, 0.84, `Important artifact or item identified via object noun "${marker}".`, {
            documentId: docId,
            documentTitle: docTitle,
            documentType: docType,
            sourceCategory,
            paragraphIndex: pIndex,
            snippet: `...${snippet}...`,
            reason: `Special item reference: "${itemName}"`
          }, {});
        }
      }
    });

    // ─── F. Explicit Weapon/Item Naming e.g. "the sword Ash", "the blade named Ash", "the blade Sunshard" ───
    const explicitItemNamingRegex = /\b(?:the\s+)?(?:great\s+|ancient\s+|fine\s+)?(?:sword|blade|dagger|staff|spear|bow|ship|galleon|relic|scepter|crown)(?:\s+named|\s+called)?\s+([A-Z][a-z]+)\b/gi;
    while ((match = explicitItemNamingRegex.exec(paragraph)) !== null) {
      const itemName = match[1].trim();
      if (!COMMON_NON_ENTITIES.has(itemName)) {
        const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));
        localEmit('item', itemName, 0.88, `Item identified by direct noun attribution ("${match[0]}").`, {
          documentId: docId,
          documentTitle: docTitle,
          documentType: docType,
          sourceCategory,
          paragraphIndex: pIndex,
          snippet: `...${snippet}...`,
          reason: `Explicit item noun: "${match[0]}"`
        }, {});
      }
    }

    // Dispatch all buffered emissions with complete deduplicated paragraph entities
    const uniqueEntities = Array.from(new Set(paragraphEntities));
    emissions.forEach(e => {
      emit(e.domain, e.name, e.conf, e.reason, e.ref, e.attrs, uniqueEntities);
    });
  },

  /**
   * Scans paragraph for explicit dates and relative chronological markers.
   */
  scanParagraphForTimeline(
    paragraph: string,
    docId: string,
    docTitle: string,
    docType: 'chapter' | 'scene' | 'research' | 'file',
    sourceCategory: 'primary-manuscript' | 'codex' | 'notes' | 'cut-drawer' | 'research',
    pIndex: number,
    emit: (domain: OrganizationDomain, name: string, conf: number, reason: string, ref: SourceReference, attrs?: Record<string, any>) => void
  ) {
    // 1. Explicit calendar timestamps: "Year 1042", "400 BCE", "In 1892", "First Moon of Year 450"
    const explicitYearRegex = /\b(?:In\s+the\s+year\s+|Year\s+|circa\s+|First\s+Moon\s+of\s+Year\s+)(\d{1,4}(?:\s*(?:BCE|CE|BC|AD|A\.D\.|B\.C\.))?)\b/gi;
    let match: RegExpExecArray | null;

    while ((match = explicitYearRegex.exec(paragraph)) !== null) {
      const yearStr = match[0].trim();
      const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));

      emit('timeline', yearStr, 0.94, `Explicit chronological era timestamp "${yearStr}".`, {
        documentId: docId,
        documentTitle: docTitle,
        documentType: docType,
        sourceCategory,
        paragraphIndex: pIndex,
        snippet: `...${snippet}...`,
        reason: `Explicit date reference: "${yearStr}"`
      }, {
        dateStr: yearStr,
        classification: 'historical',
        temporalCertainty: 'known'
      });
    }

    // 2. Relative offsets: "Three winters earlier", "Fourteen days later", "Two years before the war"
    const relativeTimeRegex = /\b((?:[Tt]hree|[Ff]our|[Ff]ive|[Ss]ix|[Ss]even|[Ee]ight|[Nn]ine|[Tt]en|[Tt]welve|[Ff]ourteen|[Tt]wenty|\d+)\s+(?:years?|winters?|months?|days?|hours?|decades?)\s+(?:before|after|earlier|later|prior to)(?:\s+(?:the\s+)?([A-Za-z\s]+?))?)(?:[.,;]|\s+a\b|\s+the\b)/g;
    while ((match = relativeTimeRegex.exec(paragraph)) !== null) {
      const fullPhrase = match[1].trim();
      const anchorEvent = match[2]?.trim();
      const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 80));

      emit('timeline', fullPhrase, 0.82, `Relative chronological temporal offset anchored to "${anchorEvent || 'narrative present'}".`, {
        documentId: docId,
        documentTitle: docTitle,
        documentType: docType,
        sourceCategory,
        paragraphIndex: pIndex,
        snippet: `...${snippet}...`,
        reason: `Relative temporal anchor: "${fullPhrase}"`
      }, {
        relativeOffset: fullPhrase,
        anchorEvent: anchorEvent || 'Narrative Present',
        classification: fullPhrase.toLowerCase().includes('before') || fullPhrase.toLowerCase().includes('earlier') ? 'flashback' : 'flashforward',
        temporalCertainty: 'inferred'
      });
    }

  },

  /**
   * Scans paragraph for narrative plot threads, dramatic stakes, and unresolved questions.
   */
  scanParagraphForPlotThreads(
    paragraph: string,
    docId: string,
    docTitle: string,
    docType: 'chapter' | 'scene' | 'research' | 'file',
    sourceCategory: 'primary-manuscript' | 'codex' | 'notes' | 'cut-drawer' | 'research',
    pIndex: number,
    emit: (domain: OrganizationDomain, name: string, conf: number, reason: string, ref: SourceReference, attrs?: Record<string, any>) => void
  ) {
    const threadRegex = /\b(?:the\s+)?(mystery\s+of\s+[A-Za-z\s]+|conspiracy\s+behind\s+[A-Za-z\s]+|curse\s+of\s+[A-Za-z\s]+|quest\s+for\s+[A-Za-z\s]+|secret\s+of\s+[A-Za-z\s]+|threat\s+of\s+[A-Za-z\s]+)\b/gi;
    let match: RegExpExecArray | null;

    while ((match = threadRegex.exec(paragraph)) !== null) {
      const rawThread = match[1].trim();
      const threadTitle = rawThread.replace(/\b\w/g, l => l.toUpperCase());
      const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 80));

      emit('plotThread', threadTitle, 0.84, `Dramatic plot thread or unresolved mystery identified in prose.`, {
        documentId: docId,
        documentTitle: docTitle,
        documentType: docType,
        sourceCategory,
        paragraphIndex: pIndex,
        snippet: `...${snippet}...`,
        reason: `Plot thread thematic pattern: "${rawThread}"`
      });
    }
  }
};
