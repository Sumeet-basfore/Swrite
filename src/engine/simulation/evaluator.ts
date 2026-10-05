/**
 * Swrite World Simulation Engine — Deterministic Rule Evaluator
 * 
 * Evaluates rule conditions against simulation state without using eval() or Function().
 * Applies effects deterministically and constructs cause-and-effect traces.
 */

import { 
  SimulationState, WorldRule, RuleCondition, SingleCondition, 
  RuleEffect, Kingdom, WorldRelation, CauseChainNode, SimulationEvent 
} from './types';

export interface EvaluationResult {
  ruleId: string;
  ruleName: string;
  matchedEntityId: string;
  matchedEntityName: string;
  matchedScope: 'kingdom' | 'relation' | 'global';
  causeNodes: CauseChainNode[];
  generatedEvents: SimulationEvent[];
}

/**
 * Evaluates a single condition against the provided entity and state context.
 */
export function evaluateSingleCondition(
  cond: SingleCondition, 
  context: { kingdom?: Kingdom; relation?: WorldRelation; globalVariables: Record<string, number>; state: SimulationState }
): boolean {
  let targetValue: any = undefined;

  if (cond.target === 'kingdom' && context.kingdom) {
    targetValue = (context.kingdom as any)[cond.property];
  } else if (cond.target === 'relation' && context.relation) {
    targetValue = (context.relation as any)[cond.property];
  } else if (cond.target === 'global') {
    targetValue = context.globalVariables[cond.property];
  }

  if (targetValue === undefined) {
    return false;
  }

  const expected = cond.value;

  switch (cond.operator) {
    case '<':
      return typeof targetValue === 'number' && typeof expected === 'number' && targetValue < expected;
    case '<=':
      return typeof targetValue === 'number' && typeof expected === 'number' && targetValue <= expected;
    case '==':
      return targetValue === expected;
    case '!=':
      return targetValue !== expected;
    case '>=':
      return typeof targetValue === 'number' && typeof expected === 'number' && targetValue >= expected;
    case '>':
      return typeof targetValue === 'number' && typeof expected === 'number' && targetValue > expected;
    case 'between':
      if (Array.isArray(expected) && expected.length === 2 && typeof targetValue === 'number') {
        return targetValue >= expected[0] && targetValue <= expected[1];
      }
      return false;
    default:
      return false;
  }
}

/**
 * Evaluates a composite condition tree (AND, OR, NOT).
 */
export function evaluateCondition(
  cond: RuleCondition, 
  context: { kingdom?: Kingdom; relation?: WorldRelation; globalVariables: Record<string, number>; state: SimulationState }
): boolean {
  if (cond.single) {
    return evaluateSingleCondition(cond.single, context);
  }

  if (cond.and && cond.and.length > 0) {
    return cond.and.every(c => evaluateCondition(c, context));
  }

  if (cond.or && cond.or.length > 0) {
    return cond.or.some(c => evaluateCondition(c, context));
  }

  if (cond.not) {
    return !evaluateCondition(cond.not, context);
  }

  return true;
}

/**
 * Applies a single effect mutation onto the simulation state and records the cause node.
 */
export function applyEffect(
  effect: RuleEffect,
  rule: WorldRule,
  currentTurn: number,
  context: { kingdom?: Kingdom; relation?: WorldRelation; state: SimulationState }
): { causeNode?: CauseChainNode; generatedEvent?: SimulationEvent } {
  const { state } = context;

  // 1. Event trigger effect
  if (effect.operation === 'trigger_event' && effect.eventDetails) {
    const primaryName = context.kingdom?.name || (context.relation ? `${state.kingdoms[context.relation.sourceEntityId]?.name || 'Realm'} - ${state.kingdoms[context.relation.targetEntityId]?.name || 'Realm'}` : 'Global');
    const newEvent: SimulationEvent = {
      id: `ev-${currentTurn}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      turn: currentTurn,
      title: effect.eventDetails.title,
      description: effect.eventDetails.description,
      type: effect.eventDetails.type,
      severity: effect.eventDetails.severity,
      primaryEntityId: context.kingdom?.id || context.relation?.sourceEntityId,
      primaryEntityName: primaryName,
      secondaryEntityId: context.relation?.targetEntityId,
      secondaryEntityName: context.relation ? state.kingdoms[context.relation.targetEntityId]?.name : undefined,
      causes: [effect.explanation],
      effectsSummary: [`Triggered by rule "${rule.name}"`]
    };

    return { generatedEvent: newEvent };
  }

  // 2. Kingdom property mutation
  if (effect.target === 'kingdom') {
    let targetKingdom: Kingdom | undefined = undefined;

    if (effect.entityId === 'source' && context.relation) {
      targetKingdom = state.kingdoms[context.relation.sourceEntityId];
    } else if (effect.entityId === 'target' && context.relation) {
      targetKingdom = state.kingdoms[context.relation.targetEntityId];
    } else if (effect.entityId && effect.entityId !== 'current' && effect.entityId !== 'all') {
      targetKingdom = state.kingdoms[effect.entityId];
    } else {
      targetKingdom = context.kingdom;
    }

    if (!targetKingdom || !effect.property) return {};

    const prop = effect.property;
    const beforeVal = (targetKingdom as any)[prop] ?? 0;
    let afterVal = beforeVal;

    const numVal = typeof effect.value === 'number' ? effect.value : Number(effect.value) || 0;

    switch (effect.operation) {
      case 'add':
        afterVal = beforeVal + numVal;
        break;
      case 'subtract':
        afterVal = beforeVal - numVal;
        break;
      case 'multiply':
        afterVal = Math.round(beforeVal * numVal);
        break;
      case 'set':
        afterVal = numVal;
        break;
    }

    // Apply standard bounds clamping
    if (['stability', 'foodSupply', 'influence', 'magicReserve'].includes(prop)) {
      afterVal = Math.max(0, Math.min(100, afterVal));
    } else if (['treasury', 'militaryPower', 'population'].includes(prop)) {
      afterVal = Math.max(0, afterVal);
    }

    (targetKingdom as any)[prop] = afterVal;

    const causeNode: CauseChainNode = {
      turn: currentTurn,
      trigger: rule.name,
      sourceEntityName: targetKingdom.name,
      targetProperty: `${targetKingdom.name}.${prop}`,
      beforeValue: beforeVal,
      afterValue: afterVal,
      rationale: effect.explanation,
      ruleId: rule.id,
      ruleName: rule.name
    };

    return { causeNode };
  }

  // 3. Relation property mutation
  if (effect.target === 'relation' && context.relation && effect.property) {
    const rel = context.relation;
    const prop = effect.property;
    const beforeVal = (rel as any)[prop] ?? 0;
    let afterVal = beforeVal;
    const numVal = typeof effect.value === 'number' ? effect.value : Number(effect.value) || 0;

    switch (effect.operation) {
      case 'add':
        afterVal = beforeVal + numVal;
        break;
      case 'subtract':
        afterVal = beforeVal - numVal;
        break;
      case 'multiply':
        afterVal = Math.round(beforeVal * numVal);
        break;
      case 'set':
        afterVal = numVal;
        break;
    }

    // Bounds clamping
    if (['hostilityValue', 'militaryTension', 'tradeValue'].includes(prop)) {
      afterVal = Math.max(0, Math.min(100, afterVal));
    } else if (['value', 'trustValue'].includes(prop)) {
      afterVal = Math.max(-100, Math.min(100, afterVal));
    }

    (rel as any)[prop] = afterVal;

    const srcName = state.kingdoms[rel.sourceEntityId]?.name || 'Realm A';
    const tgtName = state.kingdoms[rel.targetEntityId]?.name || 'Realm B';

    const causeNode: CauseChainNode = {
      turn: currentTurn,
      trigger: rule.name,
      sourceEntityName: `${srcName} ↔ ${tgtName}`,
      targetProperty: `Relation(${srcName}, ${tgtName}).${prop}`,
      beforeValue: beforeVal,
      afterValue: afterVal,
      rationale: effect.explanation,
      ruleId: rule.id,
      ruleName: rule.name
    };

    return { causeNode };
  }

  return {};
}

/**
 * Runs a single pass of all enabled rules across all kingdoms, relations, and global state.
 */
export function evaluateAllRules(
  state: SimulationState, 
  rules: WorldRule[]
): EvaluationResult[] {
  const sortedRules = [...rules]
    .filter(r => r.enabled)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const results: EvaluationResult[] = [];

  for (const rule of sortedRules) {
    if (rule.scope === 'kingdom') {
      // Evaluate for each kingdom
      for (const kingdom of Object.values(state.kingdoms)) {
        if (rule.targetEntityId && rule.targetEntityId !== kingdom.id) continue;

        const isMatch = evaluateCondition(rule.condition, { kingdom, globalVariables: state.globalVariables, state });
        if (isMatch) {
          const causeNodes: CauseChainNode[] = [];
          const generatedEvents: SimulationEvent[] = [];

          for (const effect of rule.effects) {
            const { causeNode, generatedEvent } = applyEffect(effect, rule, state.turn, { kingdom, state });
            if (causeNode) causeNodes.push(causeNode);
            if (generatedEvent) generatedEvents.push(generatedEvent);
          }

          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            matchedEntityId: kingdom.id,
            matchedEntityName: kingdom.name,
            matchedScope: 'kingdom',
            causeNodes,
            generatedEvents
          });
        }
      }
    } else if (rule.scope === 'relation') {
      // Evaluate for each relation
      for (const relation of Object.values(state.relations)) {
        if (rule.targetEntityId && rule.targetEntityId !== relation.id) continue;

        const isMatch = evaluateCondition(rule.condition, { relation, globalVariables: state.globalVariables, state });
        if (isMatch) {
          const causeNodes: CauseChainNode[] = [];
          const generatedEvents: SimulationEvent[] = [];

          for (const effect of rule.effects) {
            const { causeNode, generatedEvent } = applyEffect(effect, rule, state.turn, { relation, state });
            if (causeNode) causeNodes.push(causeNode);
            if (generatedEvent) generatedEvents.push(generatedEvent);
          }

          const srcName = state.kingdoms[relation.sourceEntityId]?.name || relation.sourceEntityId;
          const tgtName = state.kingdoms[relation.targetEntityId]?.name || relation.targetEntityId;

          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            matchedEntityId: relation.id,
            matchedEntityName: `${srcName} ↔ ${tgtName}`,
            matchedScope: 'relation',
            causeNodes,
            generatedEvents
          });
        }
      }
    } else if (rule.scope === 'global') {
      const isMatch = evaluateCondition(rule.condition, { globalVariables: state.globalVariables, state });
      if (isMatch) {
        const causeNodes: CauseChainNode[] = [];
        const generatedEvents: SimulationEvent[] = [];

        for (const effect of rule.effects) {
          const { causeNode, generatedEvent } = applyEffect(effect, rule, state.turn, { state });
          if (causeNode) causeNodes.push(causeNode);
          if (generatedEvent) generatedEvents.push(generatedEvent);
        }

        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          matchedEntityId: 'global',
          matchedEntityName: 'Global World State',
          matchedScope: 'global',
          causeNodes,
          generatedEvents
        });
      }
    }
  }

  return results;
}
