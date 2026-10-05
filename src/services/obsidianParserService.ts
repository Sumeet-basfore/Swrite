import { 
  ProjectData, Act, Chapter, Character, GraphData, GraphNode, GraphLink, 
  StoryGraphMode, Scene, Location, Faction, PlotThread, Event, StoryArc 
} from '../types';
import { StoryEngineQueries } from '../engine/queries';

export interface ObsidianParsedFile {
  title: string;
  rawContent: string;
  frontmatter: Record<string, any>;
  tags: string[];
  wikilinks: string[];
  detectedCharacters: string[];
  inferredType: 'chapter' | 'character' | 'lore' | 'beat' | 'notes';
  inferredAct?: string;
  inferredOrder?: number;
}

export function decodeHtmlEntities(str: string): string {
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

function cleanTitle(raw: string): string {
  let cleaned = decodeHtmlEntities(raw);
  cleaned = cleaned.replace(/\.(md|markdown|txt|docx|json|html|htm|rtf)$/i, '');
  cleaned = cleaned.replace(/^[0-9]+[.\-_]\s*[a-zA-Z0-9_\-\s]+\//, '');
  return cleaned.trim() || 'Untitled';
}

export const ObsidianParserService = {
  formatActTitle(rawAct: string, fallbackFolder: string): string {
    const trimmed = decodeHtmlEntities(rawAct).trim();
    if (!trimmed || trimmed === 'Root' || trimmed === 'root' || trimmed === 'Main Manuscript') {
      return fallbackFolder && fallbackFolder !== 'Root' ? fallbackFolder : 'Manuscript';
    }
    return trimmed;
  },

  detectCharactersInText(text: string): string[] {
    const commonStopWords = new Set([
      'The', 'A', 'An', 'In', 'On', 'At', 'To', 'For', 'With', 'By', 'From', 'About',
      'Into', 'Through', 'After', 'Before', 'Under', 'Above', 'Then', 'When', 'Where',
      'Why', 'How', 'What', 'Who', 'Which', 'This', 'That', 'These', 'Those', 'There',
      'Here', 'It', 'He', 'She', 'They', 'We', 'You', 'I', 'His', 'Her', 'Their',
      'Our', 'Your', 'My', 'Its', 'And', 'But', 'Or', 'Nor', 'So', 'Yet', 'If',
      'Because', 'Although', 'Even', 'While', 'Chapter', 'Act', 'Book', 'Scene', 'Part',
      'One', 'Two', 'Three', 'Four', 'Five', 'First', 'Second', 'Third', 'Every', 'All',
      'Some', 'None', 'Many', 'Few', 'Both', 'Each', 'Other', 'Another', 'Such', 'Behind',
      'Across', 'Beside', 'Around', 'Near', 'Along', 'Between', 'Without', 'Within',
      'World', 'Legal', 'Registry', 'Economy', 'Currency', 'Factions', 'Syndicate', 'Parchment', 
      'Purge', 'Veil', 'Sealed', 'Identity', 'Threshold', 'Routine', 'Cargo', 'Smear', 
      'Arc', 'Story', 'Power', 'Magic', 'Rules', 'Bleeding', 'Resonance', 'Character', 
      'Characters', 'Notes', 'Lore', 'Setting', 'Timeline', 'Plot', 'Summary', 'Draft', 
      'Manuscript', 'Overview', 'Index', 'Table', 'Guild', 'Church', 'Holy', 'Interception'
    ]);

    const nameCounts: Record<string, number> = {};

    const wikiRegex = /\[\[([^[\]|]+)(?:\|[^[\]]+)?\]\]/g;
    let match;
    while ((match = wikiRegex.exec(text)) !== null) {
      const name = cleanTitle(match[1].trim());
      if (name.length > 2 && !name.toLowerCase().includes('chapter') && !commonStopWords.has(name)) {
        nameCounts[name] = (nameCounts[name] || 0) + 10;
      }
    }

    const words = text.split(/[\s,.;:!?"'()\[\]{}—–]+/);
    words.forEach((w) => {
      const clean = w.replace(/[^a-zA-Z]/g, '');
      if (
        clean.length >= 3 &&
        /^[A-Z][a-z]+$/.test(clean) &&
        !commonStopWords.has(clean)
      ) {
        nameCounts[clean] = (nameCounts[clean] || 0) + 1;
      }
    });

    return Object.entries(nameCounts)
      .filter(([name, count]) => count >= 3 && !commonStopWords.has(name))
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 8);
  },

  parseObsidianMarkdown(rawText: string, fileName: string): ObsidianParsedFile {
    let cleanText = decodeHtmlEntities(rawText.trim());
    const frontmatter: Record<string, any> = {};
    let title = '';

    if (cleanText.startsWith('---')) {
      const endYaml = cleanText.indexOf('---', 3);
      if (endYaml !== -1) {
        const yamlStr = cleanText.substring(3, endYaml);
        cleanText = cleanText.substring(endYaml + 3).trim();

        const lines = yamlStr.split('\n');
        lines.forEach((l: string) => {
          const colonIdx = l.indexOf(':');
          if (colonIdx > 0) {
            const key = l.substring(0, colonIdx).trim().toLowerCase();
            let val = l.substring(colonIdx + 1).trim();
            val = val.replace(/^["']|["']$/g, '');
            frontmatter[key] = val;
          }
        });
      }
    }

    const headingMatch = cleanText.match(/^#+\s+(.+)$/m);
    if (headingMatch) {
      title = headingMatch[1].trim();
    } else if (frontmatter['title']) {
      title = frontmatter['title'];
    } else {
      title = cleanTitle(fileName);
    }

    const tags: string[] = [];
    if (frontmatter['tags']) {
      if (Array.isArray(frontmatter['tags'])) {
        tags.push(...frontmatter['tags'].map(t => String(t).replace(/^#/, '')));
      } else {
        tags.push(
          ...String(frontmatter['tags'])
            .split(/[\s,]+/)
            .map(t => t.replace(/^#/, ''))
        );
      }
    }

    const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\-/]+)/g;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(cleanText)) !== null) {
      const tag = tagMatch[1];
      if (!tags.includes(tag) && tag.length > 1) {
        tags.push(tag);
      }
    }

    const wikilinks: string[] = [];
    const wikiRegex = /\[\[([^[\]|]+)(?:\|[^[\]]+)?\]\]/g;
    let wikiMatch;
    while ((wikiMatch = wikiRegex.exec(cleanText)) !== null) {
      const target = cleanTitle(wikiMatch[1].trim());
      if (target && !wikilinks.includes(target)) {
        wikilinks.push(target);
      }
    }

    const detectedCharacters = this.detectCharactersInText(cleanText);

    let inferredType: 'chapter' | 'character' | 'lore' | 'beat' | 'notes' = 'chapter';
    const lowerTitle = title.toLowerCase();
    const lowerFile = fileName.toLowerCase();

    if (
      frontmatter['type'] === 'character' ||
      tags.some(t => t.includes('character') || t.includes('cast') || t.includes('person')) ||
      lowerFile.includes('character') ||
      lowerTitle.includes('character')
    ) {
      inferredType = 'character';
    } else if (
      frontmatter['type'] === 'lore' ||
      frontmatter['type'] === 'world' ||
      tags.some(t => t.includes('lore') || t.includes('world') || t.includes('faction') || t.includes('setting')) ||
      lowerFile.includes('location') ||
      lowerFile.includes('world') ||
      lowerFile.includes('magic') ||
      lowerFile.includes('mystery')
    ) {
      inferredType = 'lore';
    } else if (
      frontmatter['type'] === 'beat' ||
      tags.some(t => t.includes('beat') || t.includes('plot')) ||
      lowerTitle.includes('beat')
    ) {
      inferredType = 'beat';
    } else if (
      lowerFile.includes('scratchpad') ||
      lowerFile.includes('brainstorm') ||
      lowerFile.includes('notes')
    ) {
      inferredType = 'notes';
    }

    let inferredAct: string | undefined = frontmatter['act'];
    if (!inferredAct) {
      const actTag = tags.find(t => t.startsWith('act') || t.includes('act/'));
      if (actTag) {
        inferredAct = actTag.toUpperCase().replace('/', ' ');
      }
    }

    let inferredOrder: number | undefined = frontmatter['chapter'] ? Number(frontmatter['chapter']) : (
      frontmatter['order'] ? Number(frontmatter['order']) : undefined
    );
    if (!inferredOrder) {
      const numMatch = fileName.match(/^[0-9]+/);
      if (numMatch) {
        inferredOrder = parseInt(numMatch[0], 10);
      }
    }

    return {
      title,
      rawContent: cleanText,
      frontmatter,
      tags,
      wikilinks,
      detectedCharacters,
      inferredType,
      inferredAct,
      inferredOrder,
    };
  },

  /**
   * Build clean, uncluttered, mode-driven Graph Data
   */
  generateGraphData(
    project: ProjectData,
    scope: 'global' | 'local' = 'global',
    activeChapterId = '',
    localDepth = 1,
    graphMode: StoryGraphMode = 'story'
  ): GraphData {
    const rawNodes: GraphNode[] = [];
    const rawLinks: GraphLink[] = [];
    const nodeIds = new Set<string>();

    const allScenes = StoryEngineQueries.getAllScenes(project);
    const allCharacters = project.characters || [];
    const allLocations = project.locations || [];
    const allFactions = project.factions || [];
    const allThreads = project.plotThreads || [];
    const allArcs = project.storyArcs || [];
    const allEvents = project.events || [];
    const codex = project.codex || [];

    // =========================================================================
    // MODE 1: CHARACTERS (Character → relationships → scenes → events)
    // =========================================================================
    if (graphMode === 'characters') {
      // 1. Character Nodes
      allCharacters.forEach(char => {
        if (!nodeIds.has(char.id)) {
          const isProtagonist = char.role === 'Protagonist';
          const isAntagonist = char.role === 'Antagonist';
          rawNodes.push({
            id: char.id,
            label: char.name,
            type: 'character',
            subType: char.role,
            val: isProtagonist ? 24 : (isAntagonist ? 22 : 14),
            color: isProtagonist ? '#F59E0B' : (isAntagonist ? '#EF4444' : '#A78BFA'),
            targetId: char.id,
            synopsis: char.tagline || char.bio.slice(0, 100),
            excerpt: char.currentGoal ? `Goal: ${char.currentGoal}` : char.bio.slice(0, 100),
          });
          nodeIds.add(char.id);
        }

        // Direct Interpersonal Relationships
        if (char.relationships) {
          char.relationships.forEach(rel => {
            rawLinks.push({
              source: char.id,
              target: rel.targetId,
              label: rel.relation,
              type: 'character',
              isDirectional: true,
            });
          });
        }
      });

      // 2. Scenes where characters appear
      allScenes.forEach(sc => {
        const hasChars = sc.povCharacterId || (sc.characterIds && sc.characterIds.length > 0);
        if (!hasChars) return;

        if (!nodeIds.has(sc.id)) {
          rawNodes.push({
            id: sc.id,
            label: sc.title,
            type: 'scene',
            val: 12,
            color: '#10B981',
            targetId: sc.chapterId,
            synopsis: sc.synopsis || `Scene in chapter ${sc.chapterId}`,
          });
          nodeIds.add(sc.id);
        }

        // Link POV
        if (sc.povCharacterId && nodeIds.has(sc.povCharacterId)) {
          rawLinks.push({
            source: sc.povCharacterId,
            target: sc.id,
            label: 'POV',
            type: 'character',
            isDirectional: true,
          });
        }

        // Link Participating Cast
        (sc.characterIds || []).forEach(cId => {
          if (cId !== sc.povCharacterId && nodeIds.has(cId)) {
            rawLinks.push({
              source: cId,
              target: sc.id,
              label: 'Cast',
              type: 'character',
              isDirectional: false,
            });
          }
        });
      });

      // 3. Events where characters participated
      allEvents.forEach(evt => {
        const hasCharParticipants = (evt.participantCharacterIds || []).length > 0;
        if (!hasCharParticipants) return;

        const evtNodeId = `evt-${evt.id}`;
        if (!nodeIds.has(evtNodeId)) {
          rawNodes.push({
            id: evtNodeId,
            label: evt.title,
            type: 'event',
            val: 11,
            color: '#F43F5E',
            synopsis: evt.summary,
          });
          nodeIds.add(evtNodeId);
        }

        (evt.participantCharacterIds || []).forEach(cId => {
          if (nodeIds.has(cId)) {
            rawLinks.push({
              source: cId,
              target: evtNodeId,
              label: 'Participant',
              type: 'event',
              isDirectional: false,
            });
          }
        });
      });
    }

    // =========================================================================
    // MODE 2: PLOT THREADS (Plot Thread → scenes → characters → locations)
    // =========================================================================
    else if (graphMode === 'threads') {
      // 1. Story Arc Anchors
      allArcs.forEach(arc => {
        if (!nodeIds.has(arc.id)) {
          rawNodes.push({
            id: arc.id,
            label: arc.title,
            type: 'storyArc',
            val: 22,
            color: '#818CF8',
            synopsis: arc.description,
          });
          nodeIds.add(arc.id);
        }
      });

      // 2. Plot Thread Nodes
      allThreads.forEach(thread => {
        if (!nodeIds.has(thread.id)) {
          const isMain = thread.type === 'main-plot';
          rawNodes.push({
            id: thread.id,
            label: thread.title,
            type: 'plotThread',
            subType: thread.type,
            val: isMain ? 20 : 15,
            color: thread.color || (isMain ? '#A855F7' : '#C084FC'),
            synopsis: `${thread.type.toUpperCase()} • ${thread.status} • Payoff: ${thread.expectedPayoff || 'Pending'}`,
            excerpt: thread.description,
          });
          nodeIds.add(thread.id);
        }

        // Link Story Arc -> Plot Thread
        if (thread.storyArcId && nodeIds.has(thread.storyArcId)) {
          rawLinks.push({
            source: thread.storyArcId,
            target: thread.id,
            type: 'storyArc',
            isDirectional: false,
          });
        }

        // Link Related Characters
        (thread.relatedCharacterIds || []).forEach(cId => {
          const char = allCharacters.find(c => c.id === cId);
          if (char) {
            if (!nodeIds.has(char.id)) {
              rawNodes.push({
                id: char.id,
                label: char.name,
                type: 'character',
                subType: char.role,
                val: 12,
                color: '#F59E0B',
                targetId: char.id,
                synopsis: char.bio.slice(0, 80),
              });
              nodeIds.add(char.id);
            }
            rawLinks.push({
              source: thread.id,
              target: char.id,
              label: 'Involves',
              type: 'character',
              isDirectional: false,
            });
          }
        });
      });

      // 3. Scenes containing the thread
      allScenes.forEach(sc => {
        const matchingThreads = (sc.plotThreadIds || []).filter(tId => nodeIds.has(tId));
        if (matchingThreads.length === 0) return;

        if (!nodeIds.has(sc.id)) {
          rawNodes.push({
            id: sc.id,
            label: sc.title,
            type: 'scene',
            val: 11,
            color: '#10B981',
            targetId: sc.chapterId,
            synopsis: sc.synopsis || `Scene in chapter ${sc.chapterId}`,
          });
          nodeIds.add(sc.id);
        }

        matchingThreads.forEach(tId => {
          rawLinks.push({
            source: tId,
            target: sc.id,
            label: 'Progresses',
            type: 'plotThread',
            isDirectional: true,
          });
        });

        // Link Scene -> Location
        (sc.locationIds || []).forEach(locId => {
          const loc = allLocations.find(l => l.id === locId);
          if (loc) {
            if (!nodeIds.has(loc.id)) {
              rawNodes.push({
                id: loc.id,
                label: loc.name,
                type: 'location',
                val: 12,
                color: '#14B8A6',
                synopsis: loc.summary,
              });
              nodeIds.add(loc.id);
            }
            rawLinks.push({
              source: sc.id,
              target: loc.id,
              label: 'Setting',
              type: 'location',
              isDirectional: false,
            });
          }
        });
      });
    }

    // =========================================================================
    // MODE 3: LOCATIONS / WORLD (Locations → factions → characters → lore)
    // =========================================================================
    else if (graphMode === 'locations') {
      // 1. Location Nodes
      allLocations.forEach(loc => {
        if (!nodeIds.has(loc.id)) {
          rawNodes.push({
            id: loc.id,
            label: loc.name,
            type: 'location',
            subType: loc.type,
            val: loc.parentLocationId ? 14 : 20,
            color: '#14B8A6', // Teal
            synopsis: loc.summary || loc.description.slice(0, 100),
          });
          nodeIds.add(loc.id);
        }

        // Location Hierarchy (Parent -> Sub-location)
        if (loc.parentLocationId) {
          rawLinks.push({
            source: loc.parentLocationId,
            target: loc.id,
            label: 'Region',
            type: 'location',
            isDirectional: true,
          });
        }
      });

      // 2. Faction Nodes
      allFactions.forEach(fac => {
        if (!nodeIds.has(fac.id)) {
          rawNodes.push({
            id: fac.id,
            label: fac.name,
            type: 'faction',
            subType: fac.type,
            val: 18,
            color: '#F97316', // Orange
            synopsis: fac.summary || fac.description.slice(0, 100),
          });
          nodeIds.add(fac.id);
        }

        // Faction -> Headquarters Location
        if (fac.headquartersLocationId && nodeIds.has(fac.headquartersLocationId)) {
          rawLinks.push({
            source: fac.id,
            target: fac.headquartersLocationId,
            label: 'Seat of Power',
            type: 'location',
            isDirectional: false,
          });
        }

        // Faction -> Leader
        if (fac.leaderCharacterId) {
          const leader = allCharacters.find(c => c.id === fac.leaderCharacterId);
          if (leader) {
            if (!nodeIds.has(leader.id)) {
              rawNodes.push({
                id: leader.id,
                label: leader.name,
                type: 'character',
                val: 14,
                color: '#F59E0B',
                synopsis: `Leader of ${fac.name}`,
              });
              nodeIds.add(leader.id);
            }
            rawLinks.push({
              source: fac.id,
              target: leader.id,
              label: 'Leader',
              type: 'character',
              isDirectional: true,
            });
          }
        }

        // Faction -> Members
        (fac.memberCharacterIds || []).forEach(mId => {
          const member = allCharacters.find(c => c.id === mId);
          if (member && !nodeIds.has(member.id)) {
            rawNodes.push({
              id: member.id,
              label: member.name,
              type: 'character',
              val: 11,
              color: '#A78BFA',
              synopsis: `Member of ${fac.name}`,
            });
            nodeIds.add(member.id);
          }
          if (member) {
            rawLinks.push({
              source: fac.id,
              target: member.id,
              label: 'Member',
              type: 'character',
              isDirectional: false,
            });
          }
        });

        // Faction -> Rival Faction
        (fac.rivalFactionIds || []).forEach(rfId => {
          if (allFactions.some(f => f.id === rfId)) {
            rawLinks.push({
              source: fac.id,
              target: rfId,
              label: 'Rivalry',
              type: 'faction',
              isDirectional: true,
            });
          }
        });
      });

      // 3. World Codex / Lore Entries
      codex.forEach(entry => {
        if (entry.category === 'lore' || entry.category === 'item') {
          const loreId = `lore-${entry.id}`;
          if (!nodeIds.has(loreId)) {
            rawNodes.push({
              id: loreId,
              label: entry.name,
              type: 'lore',
              val: 10,
              color: '#34D399',
              synopsis: entry.summary || entry.content.slice(0, 100),
            });
            nodeIds.add(loreId);
          }
        }
      });
    }

    // =========================================================================
    // MODE 4: KNOWLEDGE (Character Knowledge & Secrets Network)
    // =========================================================================
    else if (graphMode === 'knowledge') {
      allCharacters.forEach(char => {
        const kList = char.knowledgeList || [];
        if (kList.length === 0 && !char.secrets) return;

        if (!nodeIds.has(char.id)) {
          rawNodes.push({
            id: char.id,
            label: char.name,
            type: 'character',
            subType: char.role,
            val: 18,
            color: '#F59E0B',
            synopsis: `Knows ${kList.length} documented facts`,
          });
          nodeIds.add(char.id);
        }

        // Knowledge Items
        kList.forEach(k => {
          const kNodeId = `k-${k.id}`;
          if (!nodeIds.has(kNodeId)) {
            const cert = k.certainty || 'certain';
            const kColor = 
              cert === 'certain' ? '#10B981' :
              cert === 'suspected' ? '#EAB308' :
              cert === 'rumor' ? '#A855F7' : '#F43F5E';

            rawNodes.push({
              id: kNodeId,
              label: k.information || k.statement || 'Knowledge',
              type: 'knowledge',
              val: 10,
              color: kColor,
              certainty: cert,
              synopsis: `Certainty: ${cert.toUpperCase()}${k.source ? ` • Source: ${k.source}` : ''}${k.learnedAt ? ` • Learned: ${k.learnedAt}` : ''}`,
            });
            nodeIds.add(kNodeId);
          }

          rawLinks.push({
            source: char.id,
            target: kNodeId,
            label: k.certainty || 'knows',
            type: 'knowledge',
            isDirectional: true,
          });

          // Link Knowledge -> Source if source is another Character
          if (k.source) {
            const srcChar = allCharacters.find(c => c.name.toLowerCase() === k.source!.toLowerCase() || c.id === k.source);
            if (srcChar) {
              if (!nodeIds.has(srcChar.id)) {
                rawNodes.push({
                  id: srcChar.id,
                  label: srcChar.name,
                  type: 'character',
                  val: 14,
                  color: '#A78BFA',
                  synopsis: srcChar.bio.slice(0, 80),
                });
                nodeIds.add(srcChar.id);
              }
              rawLinks.push({
                source: srcChar.id,
                target: kNodeId,
                label: 'Source',
                type: 'knowledge',
                isDirectional: true,
              });
            }
          }
        });
      });
    }

    // =========================================================================
    // MODE 5: STORY (Manuscript Architecture & Comprehensive Universe)
    // =========================================================================
    else {
      // 1. Act Nodes (Anchor hubs)
      project.acts.forEach(act => {
        if (!nodeIds.has(act.id)) {
          rawNodes.push({
            id: act.id,
            label: act.title,
            type: 'act',
            val: 22,
            color: '#818CF8', // Indigo
            synopsis: `Contains ${act.chapters.length} scenes`,
          });
          nodeIds.add(act.id);
        }
      });

      // 2. Chapter Nodes
      project.acts.forEach(act => {
        let prevChapterId: string | null = null;

        act.chapters.forEach(ch => {
          const plainText = ch.content.replace(/<[^>]+>/g, '').trim();
          const excerpt = plainText.slice(0, 140) + '...';

          const castInScene = project.characters
            .filter(c => {
              if (ch.povCharacterId === c.id) return true;
              const regex = new RegExp(`\\b${c.name}\\b`, 'gi');
              const matches = ch.content.match(regex);
              return matches && matches.length >= 2;
            })
            .map(c => c.name);

          if (!nodeIds.has(ch.id)) {
            rawNodes.push({
              id: ch.id,
              label: ch.title,
              type: 'chapter',
              subType: ch.status,
              val: Math.max(10, Math.min(22, 10 + Math.round(ch.wordCount / 180))),
              color: ch.status === 'final' ? '#10B981' : (ch.status === 'revised' ? '#6366F1' : '#38BDF8'),
              targetId: ch.id,
              actId: act.id,
              wordCount: ch.wordCount,
              synopsis: ch.synopsis || excerpt,
              excerpt,
              tags: ch.tags,
              castNames: castInScene,
            });
            nodeIds.add(ch.id);
          }

          // Link Act -> Chapter
          rawLinks.push({
            source: act.id,
            target: ch.id,
            type: 'act',
            isDirectional: false,
          });

          // Link Chapter -> Next Chapter (Sequential Timeline)
          if (prevChapterId) {
            rawLinks.push({
              source: prevChapterId,
              target: ch.id,
              type: 'sequence',
              isDirectional: true,
            });
          }
          prevChapterId = ch.id;

          // Link Characters
          castInScene.forEach(charName => {
            const targetChar = project.characters.find(c => 
              c.name.toLowerCase() === charName.toLowerCase()
            );

            if (targetChar) {
              rawLinks.push({
                source: ch.id,
                target: targetChar.id,
                type: 'character',
                isDirectional: false,
              });
            }
          });

          // WikiLinks in chapter
          const wikiRegex = /\[\[([^[\]|]+)(?:\|[^[\]]+)?\]\]/g;
          let match;
          while ((match = wikiRegex.exec(ch.content)) !== null) {
            const targetName = cleanTitle(match[1].trim());

            const targetChar = project.characters.find(c => 
              c.name.toLowerCase() === targetName.toLowerCase()
            );

            if (targetChar) {
              rawLinks.push({
                source: ch.id,
                target: targetChar.id,
                type: 'character',
                isDirectional: false,
              });
            } else {
              const targetCh = project.acts.flatMap(a => a.chapters).find(c => 
                c.title.toLowerCase().includes(targetName.toLowerCase())
              );
              if (targetCh && targetCh.id !== ch.id) {
                rawLinks.push({
                  source: ch.id,
                  target: targetCh.id,
                  type: 'sequence',
                  isDirectional: true,
                });
              } else if (targetName.length > 2 && !targetName.toLowerCase().includes('chapter')) {
                const loreId = `lore-${targetName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                if (!nodeIds.has(loreId)) {
                  rawNodes.push({
                    id: loreId,
                    label: targetName,
                    type: 'lore',
                    val: 9,
                    color: '#34D399',
                    synopsis: `WikiLink referenced in "${ch.title}"`,
                  });
                  nodeIds.add(loreId);
                }
                rawLinks.push({
                  source: ch.id,
                  target: loreId,
                  type: 'lore',
                  isDirectional: false,
                });
              }
            }
          }

          // Link POV
          if (ch.povCharacterId && nodeIds.has(ch.povCharacterId)) {
            rawLinks.push({
              source: ch.id,
              target: ch.povCharacterId,
              label: 'POV',
              type: 'character',
              isDirectional: false,
            });
          }
        });
      });

      // 3. Character Nodes
      project.characters.forEach(char => {
        if (!nodeIds.has(char.id)) {
          rawNodes.push({
            id: char.id,
            label: char.name,
            type: 'character',
            subType: char.role,
            val: char.role === 'Protagonist' ? 20 : (char.role === 'Antagonist' ? 18 : 13),
            color: char.role === 'Protagonist' ? '#F59E0B' : (char.role === 'Antagonist' ? '#EF4444' : '#A78BFA'),
            targetId: char.id,
            synopsis: char.tagline || char.bio.slice(0, 100),
            excerpt: char.motivations ? `Goal: ${char.motivations}` : char.bio.slice(0, 100),
          });
          nodeIds.add(char.id);
        }

        if (char.relationships) {
          char.relationships.forEach(rel => {
            rawLinks.push({
              source: char.id,
              target: rel.targetId,
              label: rel.relation,
              type: 'character',
              isDirectional: true,
            });
          });
        }
      });
    }

    // Local Scope filtering if active
    if (scope === 'local' && activeChapterId && nodeIds.has(activeChapterId)) {
      const includedNodeIds = new Set<string>([activeChapterId]);
      let currentHopNodes = new Set<string>([activeChapterId]);

      for (let hop = 0; hop < localDepth; hop++) {
        const nextHopNodes = new Set<string>();
        rawLinks.forEach(l => {
          if (currentHopNodes.has(l.source)) {
            includedNodeIds.add(l.target);
            nextHopNodes.add(l.target);
          }
          if (currentHopNodes.has(l.target)) {
            includedNodeIds.add(l.source);
            nextHopNodes.add(l.source);
          }
        });
        currentHopNodes = nextHopNodes;
      }

      const filteredNodes = rawNodes.filter(n => includedNodeIds.has(n.id));
      const filteredLinks = rawLinks.filter(l => includedNodeIds.has(l.source) && includedNodeIds.has(l.target));

      return { nodes: filteredNodes, links: filteredLinks };
    }

    return { nodes: rawNodes, links: rawLinks };
  }
};
