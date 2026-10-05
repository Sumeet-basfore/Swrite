import { 
  ProjectData, Chapter, Character, Scene, PlotThread, 
  WritingPartnerMode, StructuredPartnerContext, AIProviderConfig 
} from '../types';
import { StoryEngineQueries } from '../engine/queries';
import { ContinuityEngine } from '../engine/continuityEngine';

export interface PromptContext {
  activeChapter?: Chapter;
  characters: Character[];
  novelTitle: string;
  genre: string;
  userPrompt: string;
  mode: WritingPartnerMode;
}

export const WritingPartnerService = {
  /**
   * Extract bounded, structured story context from the Story Engine
   * Does NOT send the entire manuscript!
   */
  buildStructuredContext(
    project: ProjectData, 
    activeChapterId?: string, 
    activeSceneId?: string | null
  ): StructuredPartnerContext {
    let currentChapter: Chapter | undefined;
    let currentActTitle = 'Manuscript';
    let currentActOrder = 1;

    for (const act of project.acts) {
      const ch = act.chapters.find(c => c.id === activeChapterId);
      if (ch) {
        currentChapter = ch;
        currentActTitle = act.title;
        currentActOrder = act.order;
        break;
      }
    }

    if (!currentChapter && project.acts[0]?.chapters[0]) {
      currentChapter = project.acts[0].chapters[0];
      currentActTitle = project.acts[0].title;
      currentActOrder = project.acts[0].order;
    }

    // Identify active or focused scene
    let currentScene: Scene | undefined;
    if (currentChapter?.scenes && currentChapter.scenes.length > 0) {
      if (activeSceneId) {
        currentScene = currentChapter.scenes.find(s => s.id === activeSceneId);
      }
      if (!currentScene) {
        currentScene = currentChapter.scenes[0];
      }
    }

    // Determine POV Character with smart fallback
    let povCharId = currentScene?.povCharacterId || currentChapter?.povCharacterId;
    if (!povCharId && currentChapter?.wikilinks && currentChapter.wikilinks.length > 0) {
      const match = project.characters.find(c => 
        currentChapter?.wikilinks?.some(w => w.toLowerCase() === c.name.toLowerCase())
      );
      if (match) povCharId = match.id;
    }
    if (!povCharId && project.characters.length > 0) {
      const protag = project.characters.find(c => c.role === 'Protagonist') || project.characters[0];
      if (protag) povCharId = protag.id;
    }

    const povChar = project.characters.find(c => c.id === povCharId);

    // Involved Characters (in current scene or chapter)
    const involvedCharIds = new Set<string>();
    if (povCharId) involvedCharIds.add(povCharId);
    if (currentScene?.characterIds) {
      currentScene.characterIds.forEach(id => involvedCharIds.add(id));
    }
    if (currentChapter?.characterIds) {
      currentChapter.characterIds.forEach(id => involvedCharIds.add(id));
    }

    const involvedCharacters = Array.from(involvedCharIds).map(id => {
      const c = project.characters.find(char => char.id === id);
      if (!c) return null;
      
      const rels = (c.relationships || []).map(r => {
        const target = project.characters.find(tc => tc.id === r.targetId);
        return `${r.relation} to ${target?.name || 'Unknown'}${r.currentState ? ` (${r.currentState})` : ''}`;
      });

      const knowSummary: string[] = [];
      if (c.knowledgeList && c.knowledgeList.length > 0) {
        c.knowledgeList.slice(0, 3).forEach(k => {
          knowSummary.push(`"${k.information}" (Certainty: ${k.certainty || 'known'})`);
        });
      } else if (c.knowledge && c.knowledge.length > 0) {
        c.knowledge.slice(0, 3).forEach(k => {
          knowSummary.push(`"${k}"`);
        });
      }

      return {
        id: c.id,
        name: c.name,
        role: c.role,
        currentGoal: c.currentGoal || c.motivations,
        currentState: c.currentState,
        flaws: c.flaws,
        secrets: c.secrets,
        relationships: rels,
        knowledgeSummary: knowSummary,
      };
    }).filter(Boolean) as StructuredPartnerContext['involvedCharacters'];

    // Active Plot Threads
    const threadIds = new Set<string>([
      ...(currentScene?.plotThreadIds || []),
      ...(currentChapter?.plotThreadIds || []),
    ]);

    const activePlotThreads = (project.plotThreads || [])
      .filter(t => threadIds.has(t.id) || t.status === 'active' || t.status === 'payoff-pending' || t.status === 'in-progress')
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        type: t.type,
        status: t.status,
        expectedPayoff: t.expectedPayoff,
      }));

    // Relevant World Codex
    const relevantCodex = (project.codex || []).slice(0, 4).map(e => ({
      category: e.category,
      name: e.name,
      summary: e.summary,
    }));

    // Timeline Position
    let timelinePosition: StructuredPartnerContext['timelinePosition'];
    if (currentChapter) {
      const matchedBeat = project.timeline.find(b => b.targetChapterId === currentChapter?.id);
      if (matchedBeat) {
        timelinePosition = {
          beatTitle: matchedBeat.title,
          beatType: matchedBeat.beatType,
          act: matchedBeat.act,
          tensionLevel: matchedBeat.tensionLevel,
        };
      }
    }

    // Continuity Warnings for current scene/chapter
    const continuityWarnings = ContinuityEngine.runAudit(project);
    const recentContinuityWarnings = continuityWarnings
      .filter(w => !w.isIgnored && (w.evidence?.some(e => e.chapterId === currentChapter?.id) || w.primaryChapterId === currentChapter?.id))
      .slice(0, 3)
      .map(w => ({
        type: w.type,
        title: w.title,
        description: w.description,
      }));

    // Strictly bounded draft excerpt (max 1500 chars to avoid sending full manuscript)
    let boundedDraftExcerpt: string | undefined;
    if (currentScene?.content) {
      boundedDraftExcerpt = currentScene.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);
    } else if (currentChapter?.content) {
      boundedDraftExcerpt = currentChapter.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);
    }

    return {
      projectTitle: project.metadata.title,
      genre: project.metadata.genre || 'Novel',
      currentAct: {
        id: `act-${currentActOrder}`,
        title: currentActTitle,
        order: currentActOrder,
      },
      currentChapter: currentChapter ? {
        id: currentChapter.id,
        title: currentChapter.title,
        synopsis: currentChapter.synopsis,
        status: currentChapter.status,
        wordCount: currentChapter.wordCount,
      } : undefined,
      currentScene: currentScene ? {
        id: currentScene.id,
        title: currentScene.title,
        purpose: currentScene.purpose,
        goal: currentScene.goal,
        conflict: currentScene.conflict,
        outcome: currentScene.outcome,
        consequence: currentScene.consequence,
        status: currentScene.status,
      } : undefined,
      povCharacter: povChar ? {
        id: povChar.id,
        name: povChar.name,
        role: povChar.role,
        currentGoal: povChar.currentGoal || povChar.motivations,
        currentState: typeof povChar.currentState === 'object' ? (povChar.currentState.emotional || povChar.currentState.emotionalState || JSON.stringify(povChar.currentState)) : povChar.currentState,
        flaws: povChar.flaws,
        secrets: typeof povChar.secrets === 'string' ? povChar.secrets : Array.isArray(povChar.secrets) ? povChar.secrets.map(s => typeof s === 'string' ? s : (s.content || s.secret)).join('; ') : undefined,
      } : undefined,
      involvedCharacters,
      activePlotThreads,
      relevantCodex,
      timelinePosition,
      recentContinuityWarnings,
      boundedDraftExcerpt,
    };
  },

  /**
   * Build targeted system prompt with strict author-centric craft guardrails
   */
  getSystemPrompt(context: StructuredPartnerContext, mode: WritingPartnerMode = 'discussion'): string {
    const charsList = context.involvedCharacters.map(c => 
      `- ${c.name} (${c.role}): Goal: ${c.currentGoal || 'N/A'} | State: ${c.currentState || 'Active'} | Secrets: ${c.secrets || 'None'}`
    ).join('\n') || 'No specific character context attached.';

    const threadsList = context.activePlotThreads.map(t => 
      `- [${t.type}] "${t.title}" (${t.status}) -> Payoff: ${t.expectedPayoff || 'N/A'}`
    ).join('\n') || 'No active plot threads linked.';

    const codexList = context.relevantCodex.map(e => 
      `- [${e.category.toUpperCase()}] ${e.name}: ${e.summary}`
    ).join('\n') || 'No codex entries attached.';

    const warningsList = context.recentContinuityWarnings?.map(w => 
      `- ⚠️ ${w.title}: ${w.description}`
    ).join('\n') || 'None detected.';

    // Mode-specific role instruction
    let modeDirective = '';
    switch (mode) {
      case 'brainstorm':
        modeDirective = `PRIMARY FOCUS: CREATIVE BRAINSTORMING & "WHAT IF" EXPLORATION
- Propose 2–3 divergent narrative paths, unexpected complications, or character choices.
- Explore high-stakes trade-offs and dilemma options.
- DO NOT write full prose chapters; provide structured possibilities for the author to choose.`;
        break;
      case 'critique':
        modeDirective = `PRIMARY FOCUS: CONSTRUCTIVE LITERARY CRITIQUE
- Analyze dramatic tension, character agency, scene purpose, and dialogue subtext.
- Flag passive exposition, telling instead of showing, or unearned emotional shifts.
- Offer 1–2 specific craft recommendations or micro-examples.`;
        break;
      case 'continuity':
        modeDirective = `PRIMARY FOCUS: CONTINUITY & STORY INTEGRITY INVESTIGATION
- Investigate potential timeline causality issues, character knowledge chronology, or state conflicts.
- Explain the evidence objectively and suggest narrative reconciliation options.`;
        break;
      case 'research':
        modeDirective = `PRIMARY FOCUS: WORLDBUILDING & LORE SYNTHESIS
- Help flesh out historical details, faction dynamics, magical/technical rules, or geographic consistency.
- Ensure world rules remain internally consistent with existing lore entries.`;
        break;
      case 'structure':
        modeDirective = `PRIMARY FOCUS: NARRATIVE ARCHITECTURE & SCENE BEATS
- Evaluate the scene's Goal -> Conflict -> Disaster / Reaction -> Dilemma -> Decision arc.
- Check 3-act pacing and plot thread payoff momentum.`;
        break;
      case 'discussion':
      default:
        modeDirective = `PRIMARY FOCUS: STORY CRAFT SOUNDING BOARD
- Act as an insightful mentor and editorial partner discussing character psychology, theme, and tone.
- Ask penetrating questions that help the author clarify their creative vision.`;
        break;
    }

    return `You are the Writing Partner for the novel "${context.projectTitle}" (Genre: ${context.genre}).
You are an editorial companion and sounding board.

=== CRAFT PRINCIPLES & GUARDRAILS ===
1. ${modeDirective}
2. NEVER modify the manuscript directly. All insights are advisory.
3. DO NOT generate unsolicited full chapters or replace authorial voice.
4. Keep advice concise, perceptive, and craft-grounded.

=== STRUCTURED STORY ENGINE CONTEXT ===
• Current Location: ${context.currentAct?.title || 'Act I'} > ${context.currentChapter?.title || 'Chapter'} ${context.currentScene ? `> Scene: "${context.currentScene.title}"` : ''}
${context.currentScene ? `• Scene Goal: ${context.currentScene.goal || 'N/A'}\n• Scene Conflict: ${context.currentScene.conflict || 'N/A'}\n• Scene Outcome: ${context.currentScene.outcome || 'N/A'}` : ''}
• POV Character: ${context.povCharacter ? `${context.povCharacter.name} (${context.povCharacter.role})` : 'Not specified'}

=== INVOLVED CHARACTERS ===
${charsList}

=== ACTIVE PLOT THREADS ===
${threadsList}

=== WORLD CODEX & LORE ===
${codexList}

=== CONTINUITY STATUS ===
${warningsList}

=== BOUNDED DRAFT EXCERPT (CURRENT SCENE/SECTION ONLY) ===
${context.boundedDraftExcerpt ? `"""\n${context.boundedDraftExcerpt}\n"""` : 'No draft text selected.'}
`;
  },

  /**
   * Fetch installed local models from Ollama
   */
  async fetchOllamaModels(endpoint = 'http://localhost:11434'): Promise<string[]> {
    try {
      const cleanUrl = endpoint.replace(/\/+$/, '');
      const response = await fetch(`${cleanUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.models || []).map((m: any) => m.name);
    } catch (e) {
      console.warn('Ollama tags endpoint not reachable:', e);
      return [];
    }
  },

  /**
   * Query the Writing Partner with structured context
   */
  async queryPartner(
    config: AIProviderConfig,
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    project: ProjectData,
    activeChapterId?: string,
    activeSceneId?: string | null,
    partnerMode: WritingPartnerMode = 'discussion'
  ): Promise<string> {
    // 1. If AI Assistance is OFF, return clean local advice
    if (config.mode === 'off') {
      return this.generateSimulatedEditorialResponse(
        messages[messages.length - 1]?.content || '',
        project,
        activeChapterId,
        activeSceneId,
        partnerMode
      );
    }

    const context = this.buildStructuredContext(project, activeChapterId, activeSceneId);
    const systemPrompt = this.getSystemPrompt(context, partnerMode);
    const lastUserPrompt = messages[messages.length - 1]?.content || '';

    try {
      // 2. LOCAL AI PROVIDERS
      if (config.mode === 'local') {
        const localType = config.localProvider || 'ollama';

        if (localType === 'ollama') {
          const endpoint = (config.baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
          const modelName = config.model || 'llama3';

          const response = await fetch(`${endpoint}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelName,
              stream: false,
              options: {
                temperature: config.temperature ?? 0.7,
              },
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map(m => ({ role: m.role, content: m.content }))
              ]
            })
          });

          if (!response.ok) {
            throw new Error(`Ollama server returned HTTP ${response.status}. Ensure model '${modelName}' is pulled.`);
          }

          const data = await response.json();
          return data.message?.content || "No response received from local Ollama model.";
        }

        // LM Studio or local OpenAI-compatible endpoint
        if (localType === 'lmstudio' || localType === 'custom-local') {
          const baseUrl = (config.baseUrl || 'http://localhost:1234/v1').replace(/\/+$/, '');
          const modelName = config.model || 'local-model';

          const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelName,
              temperature: config.temperature ?? 0.7,
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map(m => ({ role: m.role, content: m.content }))
              ]
            })
          });

          if (!response.ok) {
            throw new Error(`Local model endpoint returned HTTP ${response.status}. Check your LM Studio / local server.`);
          }

          const data = await response.json();
          return data.choices?.[0]?.message?.content || "No response received from local endpoint.";
        }
      }

      // 3. CLOUD AI PROVIDERS
      if (config.mode === 'cloud') {
        const cloudType = config.cloudProvider || config.provider || 'gemini';

        // A. Google Gemini API
        if (cloudType === 'gemini') {
          if (!config.apiKey) {
            return this.generateSimulatedEditorialResponse(lastUserPrompt, project, activeChapterId, activeSceneId, partnerMode);
          }
          const model = config.model || 'gemini-1.5-pro';
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              contents: messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
              })),
              generationConfig: {
                temperature: config.temperature ?? 0.75,
                maxOutputTokens: 2048,
              }
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Gemini API returned ${response.status}`);
          }

          const data = await response.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated by Gemini.";
        }

        // B. OpenAI / OpenRouter API
        if (cloudType === 'openai' || cloudType === 'openrouter' || cloudType === 'custom-cloud') {
          if (!config.apiKey) {
            return this.generateSimulatedEditorialResponse(lastUserPrompt, project, activeChapterId, activeSceneId, partnerMode);
          }
          const defaultBase = cloudType === 'openrouter' 
            ? 'https://openrouter.ai/api/v1' 
            : 'https://api.openai.com/v1';
          const baseUrl = (config.baseUrl || defaultBase).replace(/\/+$/, '');
          const model = config.model || (cloudType === 'openrouter' ? 'anthropic/claude-3.5-sonnet' : 'gpt-4o');

          const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
              model,
              temperature: config.temperature ?? 0.7,
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map(m => ({ role: m.role, content: m.content }))
              ]
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Cloud API returned ${response.status}`);
          }

          const data = await response.json();
          return data.choices?.[0]?.message?.content || "No response generated by cloud model.";
        }

        // C. Anthropic Claude API
        if (cloudType === 'anthropic') {
          if (!config.apiKey) {
            return this.generateSimulatedEditorialResponse(lastUserPrompt, project, activeChapterId, activeSceneId, partnerMode);
          }
          const model = config.model || 'claude-3-5-sonnet-20241022';
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': config.apiKey,
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
              model,
              max_tokens: 2048,
              system: systemPrompt,
              messages: messages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
              }))
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Anthropic API returned ${response.status}`);
          }

          const data = await response.json();
          return data.content?.[0]?.text || "No response generated by Claude.";
        }
      }
    } catch (err: any) {
      console.error('Writing Partner Service Error:', err);
      return `⚠️ Writing Partner Error (${config.mode}): ${err.message || 'Connection failed'}.\n\n*Tip: Check your provider settings or verify that the local server / API key is valid.*`;
    }

    // Fallback simulated response
    return this.generateSimulatedEditorialResponse(lastUserPrompt, project, activeChapterId, activeSceneId, partnerMode);
  },

  /**
   * Deterministic offline craft heuristics when AI is OFF or credentials are not present
   */
  generateSimulatedEditorialResponse(
    prompt: string, 
    project: ProjectData, 
    activeChapterId?: string,
    activeSceneId?: string | null,
    partnerMode: WritingPartnerMode = 'discussion'
  ): string {
    const context = this.buildStructuredContext(project, activeChapterId, activeSceneId);
    const chapterName = context.currentChapter?.title || "your active chapter";
    const povName = context.povCharacter?.name || "the protagonist";
    const activeThreads = context.activePlotThreads;

    if (partnerMode === 'brainstorm') {
      return `### 💡 Brainstorming Perspectives for "${chapterName}"\n\nHere are 3 divergent narrative directions grounded in your Story Engine:\n\n1. **Internal Escalation (${povName})**: Force ${povName} to confront their core secret when a sudden obstacle blocks their goal (${context.currentScene?.goal || 'their objective'}).\n2. **External Complication**: Introduce friction from an active plot thread ${activeThreads[0] ? `("${activeThreads[0].title}")` : 'by having an ally withhold critical knowledge'}.\n3. **Unexpected Discovery**: Uncover an unrecorded detail from your World Codex that reframes the stakes before the scene closes.\n\n*Which of these angles resonates best with your vision?*`;
    }

    if (partnerMode === 'critique') {
      return `### 🔍 Editorial Craft Critique for "${chapterName}"\n\n1. **Scene Stakes**: Verify whether ${povName} has an immediate, concrete objective with clear stakes if they fail.\n2. **Subtext in Dialogue**: Check if any character states their feelings too directly. Replace on-the-nose explanations with physical hesitation or oblique responses.\n3. **Sensory Grounding**: Ensure tactile sensory cues (temperature, lighting, physical pressure) anchor the opening paragraph.\n\n*Review your draft against these questions to sharpen dramatic impact.*`;
    }

    if (partnerMode === 'continuity') {
      const warnings = context.recentContinuityWarnings;
      if (warnings && warnings.length > 0) {
        return `### 🛡️ Continuity Investigation for "${chapterName}"\n\nFound ${warnings.length} active continuity note(s):\n\n${warnings.map(w => `- **${w.title}**: ${w.description}`).join('\n\n')}\n\n**Recommendation**: Check if this event was intentional or if character knowledge/timeline records need an adjustment.`;
      }
      return `### 🛡️ Continuity Status for "${chapterName}"\n\nNo objective continuity violations detected for this chapter and linked cast members. Character knowledge chronology and timeline causality are consistent.`;
    }

    if (partnerMode === 'structure') {
      return `### 📐 Structural Arc Analysis for "${chapterName}"\n\n- **Scene Goal**: ${context.currentScene?.goal || 'Ensure the scene opens with an explicit desire.'}\n- **Conflict & Resistance**: ${context.currentScene?.conflict || 'Introduce rising friction that prevents a quick resolution.'}\n- **Outcome / Disaster**: ${context.currentScene?.outcome || 'End with a "Yes, but..." or "No, and furthermore..." hook to propel the reader forward.'}`;
    }

    if (partnerMode === 'research') {
      return `### 📚 Worldbuilding & Codex Synthesis\n\n- **Linked Lore**: ${context.relevantCodex.map(c => `**${c.name}** (${c.category})`).join(', ') || 'No codex entries tagged yet.'}\n- **Consistency Rule**: Ensure societal norms, technology/magic limitations, and faction loyalties match your established lore rules.`;
    }

    return `### ✍️ Writing Partner Craft Sounding Board\n\nReflecting on **${chapterName}** in **"${project.metadata.title}"**:\n\n- **POV Focus**: Scene experienced through **${povName}**.\n- **Craft Inquiry**: What is the emotional shift between the opening paragraph and the concluding line?\n- **Narrative Momentum**: Does this scene advance at least one active story thread?\n\n*Swrite's Writing Partner provides craft reflection with zero external dependencies.*`;
  }
};

// Aliased export for compatibility
export const AIPartnerService = WritingPartnerService;
