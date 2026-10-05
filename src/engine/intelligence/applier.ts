/**
 * SWRITE — Project Intelligence Engine: Safe Application Layer
 * Takes approved OrganizationProposal objects, captures an automatic pre-apply safety snapshot,
 * deterministically mutates ProjectData, and provides instant reversible rollback.
 */

import { ProjectData, Character, Location, Faction, Item, PlotThread, Event, ResearchNote, Scene } from '../../types';
import { OrganizationProposal } from '../../types/intelligence';
import { createSnapshot, restoreSnapshot } from '../snapshot/engine';

export const ProjectIntelligenceApplier = {
  /**
   * Applies all approved organization proposals with automatic pre-apply safety snapshot.
   */
  applyApprovedProposals(
    project: ProjectData,
    proposalsToApply: OrganizationProposal[]
  ): { updatedProject: ProjectData; appliedCount: number; safetySnapshotId: string } {
    // 1. Capture Automatic Pre-Organization Safety Snapshot
    const preSafetySnap = createSnapshot(project, {
      label: `Pre-Organization Safety (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      description: `Automatic snapshot captured before applying ${proposalsToApply.length} organization proposals.`,
      type: 'pre-restore',
      source: 'auto'
    });

    const updated: ProjectData = JSON.parse(JSON.stringify(project));
    let appliedCount = 0;

    // Ensure array containers exist
    if (!updated.characters) updated.characters = [];
    if (!updated.locations) updated.locations = [];
    if (!updated.factions) updated.factions = [];
    if (!updated.items) updated.items = [];
    if (!updated.plotThreads) updated.plotThreads = [];
    if (!updated.events) updated.events = [];
    if (!updated.researchNotes) updated.researchNotes = [];

    // Ensure project has snapshots array initialized
    if (!updated.snapshots) updated.snapshots = [];
    updated.snapshots.unshift(preSafetySnap);

    proposalsToApply.forEach(proposal => {
      if (proposal.status === 'rejected') return;

      switch (proposal.domain) {
        case 'character': {
          const existing = updated.characters.find(c => 
            c.id === proposal.targetEntityId || 
            c.name.toLowerCase() === proposal.targetName.toLowerCase()
          );

          if (existing) {
            // Check if duplicate merge
            if (proposal.duplicateCandidate && proposal.operation === 'merge') {
              if (!existing.aliases) existing.aliases = [];
              if (!existing.aliases.includes(proposal.duplicateCandidate.aliasCandidateName)) {
                existing.aliases.push(proposal.duplicateCandidate.aliasCandidateName);
              }
            } else {
              // Update existing character
              if (proposal.proposedData.role) existing.role = proposal.proposedData.role;
              if (proposal.proposedData.bio) existing.bio = proposal.proposedData.bio;
              if (proposal.proposedData.motivations) existing.motivations = proposal.proposedData.motivations;
            }
          } else {
            // Create new character
            const newChar: Character = {
              id: proposal.targetEntityId || `char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: proposal.targetName,
              role: proposal.proposedData.role || 'Supporting',
              bio: proposal.reasoning || `Character identified via project intelligence extraction.`,
              motivations: proposal.proposedData.motivations || '',
              flaws: proposal.proposedData.flaws || '',
              voiceNotes: proposal.proposedData.voiceNotes || '',
              aliases: proposal.proposedData.aliases || [],
              color: '#818CF8'
            };
            updated.characters.push(newChar);
          }
          appliedCount++;
          break;
        }

        case 'location': {
          const existing = updated.locations?.find(l => 
            l.id === proposal.targetEntityId || 
            l.name.toLowerCase() === proposal.targetName.toLowerCase()
          );

          if (!existing && updated.locations) {
            const newLoc: Location = {
              id: proposal.targetEntityId || `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: proposal.targetName,
              summary: proposal.reasoning || 'Location identified via project intelligence extraction.',
              description: proposal.reasoning || 'Location identified via project intelligence extraction.',
              aliases: proposal.proposedData.aliases || [],
              tags: ['extracted']
            };
            updated.locations.push(newLoc);
            appliedCount++;
          }
          break;
        }

        case 'faction': {
          const existing = updated.factions?.find(f => 
            f.id === proposal.targetEntityId || 
            f.name.toLowerCase() === proposal.targetName.toLowerCase()
          );

          if (!existing && updated.factions) {
            const newFaction: Faction = {
              id: proposal.targetEntityId || `fac-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: proposal.targetName,
              summary: proposal.reasoning || 'Organizational faction identified via project intelligence extraction.',
              description: proposal.reasoning || 'Organizational faction identified via project intelligence extraction.',
              aliases: proposal.proposedData.aliases || [],
              tags: ['extracted']
            };
            updated.factions.push(newFaction);
            appliedCount++;
          }
          break;
        }

        case 'item': {
          const existing = updated.items?.find(i => 
            i.id === proposal.targetEntityId || 
            i.name.toLowerCase() === proposal.targetName.toLowerCase()
          );

          if (!existing && updated.items) {
            const newItem: Item = {
              id: proposal.targetEntityId || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: proposal.targetName,
              summary: proposal.reasoning || 'Artifact / item identified via project intelligence extraction.',
              description: proposal.reasoning || 'Artifact / item identified via project intelligence extraction.',
              type: 'artifact',
              tags: ['extracted']
            };
            updated.items.push(newItem);
            appliedCount++;
          }
          break;
        }

        case 'plotThread': {
          const existing = updated.plotThreads?.find(t => 
            t.id === proposal.targetEntityId || 
            t.title.toLowerCase() === proposal.targetName.toLowerCase()
          );

          if (!existing && updated.plotThreads) {
            const newThread: PlotThread = {
              id: proposal.targetEntityId || `thread-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: proposal.targetName,
              description: proposal.reasoning || 'Narrative plot thread identified via project intelligence.',
              type: proposal.proposedData.type || 'main-plot',
              status: 'active'
            };
            updated.plotThreads.push(newThread);
            appliedCount++;
          }
          break;
        }

        case 'timeline':
        case 'event': {
          const existing = updated.events?.find(e => 
            e.id === proposal.targetEntityId || 
            e.title.toLowerCase() === proposal.targetName.toLowerCase()
          );

          if (!existing && updated.events) {
            const newEvent: Event = {
              id: proposal.targetEntityId || `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: proposal.targetName,
              summary: proposal.reasoning || 'Chronological event identified via project intelligence.',
              description: proposal.reasoning || 'Chronological event identified via project intelligence.',
              timelineDate: proposal.proposedData.dateStr || proposal.targetName,
              order: (updated.events.length || 0) + 1,
              type: 'historical',
              tags: ['extracted']
            };
            updated.events.push(newEvent);
            appliedCount++;
          }
          break;
        }

        case 'research': {
          const existing = updated.researchNotes?.find(r => 
            r.id === proposal.targetEntityId || 
            r.title.toLowerCase() === proposal.targetName.toLowerCase()
          );

          if (!existing && updated.researchNotes) {
            const newNote: ResearchNote = {
              id: proposal.targetEntityId || `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: proposal.targetName,
              summary: proposal.reasoning || 'Research note identified via project intelligence extraction.',
              content: proposal.proposedData.content || proposal.reasoning || '',
              category: 'reference',
              tags: ['extracted'],
              updatedAt: new Date().toISOString()
            };
            updated.researchNotes.push(newNote);
            appliedCount++;
          }
          break;
        }

        case 'outline': {
          // Segment unsegmented chapters into default scenes
          updated.acts.forEach(act => {
            act.chapters.forEach(ch => {
              if (!ch.scenes || ch.scenes.length === 0) {
                const defaultScene: Scene = {
                  id: `scene-${ch.id}-1`,
                  chapterId: ch.id,
                  title: `${ch.title} - Scene 1`,
                  content: ch.content || '',
                  order: 1,
                  status: ch.status || 'draft',
                  wordCount: ch.wordCount || 0,
                  updatedAt: new Date().toISOString()
                };
                ch.scenes = [defaultScene];
                appliedCount++;
              }
            });
          });
          break;
        }
      }

      proposal.status = 'applied';
      proposal.appliedAt = new Date().toISOString();
    });

    updated.metadata.updatedAt = new Date().toISOString();

    return {
      updatedProject: updated,
      appliedCount,
      safetySnapshotId: preSafetySnap.id
    };
  },

  /**
   * Instantly rolls back an organization batch using its safety snapshot.
   */
  rollbackOrganization(
    project: ProjectData,
    safetySnapshotId: string
  ): ProjectData {
    const snap = (project.snapshots || []).find(s => s.id === safetySnapshotId);
    if (!snap) {
      console.warn(`Snapshot ${safetySnapshotId} not found for rollback.`);
      return project;
    }
    const result = restoreSnapshot(project, snap, {
      restoreScope: 'manuscript'
    });
    return result.restoredProject;
  }
};
