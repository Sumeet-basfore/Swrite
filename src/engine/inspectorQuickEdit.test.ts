import { StoryEngine } from './storyEngine';
import { migrateProjectToStoryEngine } from './migration';
import { INITIAL_NOVEL_DATA } from '../services/storageService';
import { ProjectData } from '../types';

export function runInspectorQuickEditTests() {
  const results: string[] = [];
  let project: ProjectData = JSON.parse(JSON.stringify(INITIAL_NOVEL_DATA));
  const character = project.characters[0];
  const other = project.characters[1] || StoryEngine.addCharacter(project, { name: 'Other', role: 'Supporting', bio: '' }).character;
  if (!project.characters.includes(other)) project.characters.push(other);

  project = StoryEngine.updateCharacterState(project, character.id, {
    currentGoal: 'Find Cael before the Order does.', currentConflict: 'The gate is sealed',
    emotional: 'Suspicious', physical: 'Wounded', mental: 'Alert', motivation: 'Protect Lucan',
  });
  const state = project.characters.find(c => c.id === character.id)?.currentState as any;
  if (!state || state.currentGoal !== 'Find Cael before the Order does.' || state.currentConflict !== 'The gate is sealed' || state.emotional !== 'Suspicious' || state.physical !== 'Wounded' || state.mental !== 'Alert' || state.motivation !== 'Protect Lucan') throw new Error('Character quick state edit failed');
  results.push('✓ Character goal, conflict, emotional, physical, mental, and motivation edits');

  const goal = StoryEngine.addGoal(project, character.id, 'Find the missing key').goal;
  project = StoryEngine.updateGoal(project, character.id, goal.id, { description: 'Find the missing key before dawn' });
  const belief = StoryEngine.addBelief(project, character.id, 'I cannot trust the royal court.').belief;
  project = StoryEngine.updateBelief(project, character.id, belief.id, { statement: 'I cannot trust the royal court anymore.', certainty: 'moderate', status: 'challenged' });
  const secret = StoryEngine.addSecret(project, character.id, 'Malric knows the true name.').secret;
  project = StoryEngine.updateSecret(project, character.id, secret.id, { status: 'revealed', revealedIn: 'scene-reveal' });
  const changed = project.characters.find(c => c.id === character.id)!;
  if (!(changed.goals || []).some(g => typeof g !== 'string' && g.description.includes('before dawn'))) throw new Error('Goal edit failed');
  if (!(changed.beliefs || []).some(b => typeof b !== 'string' && b.status === 'challenged')) throw new Error('Belief edit failed');
  if (!Array.isArray(changed.secrets) || !changed.secrets.some(s => typeof s !== 'string' && s.status === 'revealed')) throw new Error('Secret edit failed');
  results.push('✓ Goal, belief, and secret quick edits');

  project = StoryEngine.setCharacterRelationship(project, character.id, other.id, 'Friend', { currentState: 'Uneasy', trustLevel: 'moderate', notes: 'Old debt' });
  const relation = project.characters.find(c => c.id === character.id)?.relationships?.[0];
  if (!relation || relation.relation !== 'Friend' || relation.currentState !== 'Uneasy' || relation.trustLevel !== 'moderate') throw new Error('Relationship quick edit failed');
  results.push('✓ Relationship quick edit');

  const thread = StoryEngine.addPlotThread(project, { title: 'Identity', description: 'Who is he?', status: 'active', type: 'mystery' }).thread;
  project = StoryEngine.updatePlotThread(project, thread.id, { title: 'True Identity', expectedPayoff: 'The Hollow Gate', notes: 'Seed early' });
  const updatedThread = project.plotThreads?.find(t => t.id === thread.id);
  if (!updatedThread || updatedThread.title !== 'True Identity' || updatedThread.expectedPayoff !== 'The Hollow Gate' || updatedThread.notes !== 'Seed early') throw new Error('Thread quick edit failed');
  results.push('✓ Plot thread quick edit');

  const reloaded = migrateProjectToStoryEngine(JSON.parse(JSON.stringify(project)));
  const reloadedChar = reloaded.characters.find(c => c.id === character.id)!;
  if (!(reloadedChar.beliefs || []).length || !(reloadedChar.secrets || []).length || !reloadedChar.relationships?.length) throw new Error('Quick edit persistence failed');
  results.push('✓ Quick edits survive project serialization and reload');
  return { results };
}
