/**
 * Swrite World Simulation Engine — Standard Rules & Validation
 * 
 * Provides built-in deterministic rules for economy, military, diplomacy,
 * social stability, and magic, as well as strict validation for user-created rules.
 */

import { WorldRule, RuleCondition, RuleEffect, SingleCondition } from './types';

/**
 * Validates a rule structure without using eval() or Function().
 * Ensures all operators and properties are constrained and safe.
 */
export function validateRule(rule: Partial<WorldRule>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rule.id || typeof rule.id !== 'string') {
    errors.push('Rule must have a valid string id.');
  }

  if (!rule.name || typeof rule.name !== 'string' || !rule.name.trim()) {
    errors.push('Rule must have a non-empty name.');
  }

  if (!rule.condition) {
    errors.push('Rule must contain a condition.');
  } else {
    validateCondition(rule.condition, errors);
  }

  if (!Array.isArray(rule.effects) || rule.effects.length === 0) {
    errors.push('Rule must specify at least one effect.');
  } else {
    rule.effects.forEach((eff, idx) => validateEffect(eff, idx, errors));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCondition(cond: RuleCondition, errors: string[]) {
  if (cond.single) {
    const s = cond.single;
    const allowedTargets = ['kingdom', 'relation', 'global', 'faction'];
    if (!allowedTargets.includes(s.target)) {
      errors.push(`Invalid condition target: "${s.target}". Must be one of: ${allowedTargets.join(', ')}`);
    }

    const allowedOperators = ['<', '<=', '==', '!=', '>=', '>', 'between'];
    if (!allowedOperators.includes(s.operator)) {
      errors.push(`Invalid condition operator: "${s.operator}".`);
    }

    if (s.operator === 'between') {
      if (!Array.isArray(s.value) || s.value.length !== 2 || typeof s.value[0] !== 'number' || typeof s.value[1] !== 'number') {
        errors.push('Operator "between" requires a tuple of [min, max] numbers.');
      }
    } else {
      if (typeof s.value !== 'number' && typeof s.value !== 'string') {
        errors.push('Condition value must be a number or string.');
      }
    }
  }

  if (cond.and) {
    if (!Array.isArray(cond.and) || cond.and.length === 0) {
      errors.push('AND condition list must contain at least one sub-condition.');
    } else {
      cond.and.forEach(sub => validateCondition(sub, errors));
    }
  }

  if (cond.or) {
    if (!Array.isArray(cond.or) || cond.or.length === 0) {
      errors.push('OR condition list must contain at least one sub-condition.');
    } else {
      cond.or.forEach(sub => validateCondition(sub, errors));
    }
  }

  if (cond.not) {
    validateCondition(cond.not, errors);
  }
}

function validateEffect(eff: RuleEffect, idx: number, errors: string[]) {
  const allowedTargets = ['kingdom', 'relation', 'global', 'faction', 'event'];
  if (!allowedTargets.includes(eff.target)) {
    errors.push(`Effect [${idx}] invalid target: "${eff.target}".`);
  }

  const allowedOps = ['add', 'subtract', 'set', 'multiply', 'trigger_event'];
  if (!allowedOps.includes(eff.operation)) {
    errors.push(`Effect [${idx}] invalid operation: "${eff.operation}".`);
  }

  if (!eff.explanation || typeof eff.explanation !== 'string') {
    errors.push(`Effect [${idx}] must provide an explanation string.`);
  }

  if (eff.operation === 'trigger_event' && !eff.eventDetails) {
    errors.push(`Effect [${idx}] with trigger_event must provide eventDetails.`);
  }
}

/**
 * Built-in Standard Rule Definitions
 */
export const DEFAULT_WORLD_RULES: WorldRule[] = [
  // 1. Food Shortage & Famine
  {
    id: 'rule-famine-unrest',
    name: 'Severe Food Shortage Causes Unrest',
    description: 'When a kingdom food supply drops below 25, public stability collapses and unrest ignites.',
    scope: 'kingdom',
    enabled: true,
    priority: 10,
    category: 'economy',
    condition: {
      single: {
        target: 'kingdom',
        property: 'foodSupply',
        operator: '<',
        value: 25
      }
    },
    effects: [
      {
        target: 'kingdom',
        property: 'stability',
        operation: 'subtract',
        value: 12,
        explanation: 'Famine diminishes civil order and public morale.'
      },
      {
        target: 'event',
        operation: 'trigger_event',
        value: 'famine',
        explanation: 'Severe malnutrition prompts food riots in lower quarters.',
        eventDetails: {
          type: 'famine',
          title: 'Food Shortage & Bread Riots',
          description: 'Depleted granaries lead to widespread unrest and grain seizures across metropolitan hubs.',
          severity: 'high'
        }
      }
    ]
  },

  // 2. High Border Tension Escalation
  {
    id: 'rule-border-tension-escalation',
    name: 'High Military Tension Escalates to Skirmish',
    description: 'When border military tension exceeds 75, hostility surges and border incidents risk active skirmishes.',
    scope: 'relation',
    enabled: true,
    priority: 15,
    category: 'military',
    condition: {
      single: {
        target: 'relation',
        property: 'militaryTension',
        operator: '>=',
        value: 75
      }
    },
    effects: [
      {
        target: 'relation',
        property: 'hostilityValue',
        operation: 'add',
        value: 10,
        explanation: 'Armed posturing and border fortifications heighten diplomatic friction.'
      },
      {
        target: 'relation',
        property: 'trustValue',
        operation: 'subtract',
        value: 15,
        explanation: 'Troop deployments erode diplomatic confidence.'
      },
      {
        target: 'event',
        operation: 'trigger_event',
        value: 'unrest',
        explanation: 'Frontier garrison skirmish reported along shared borderlands.',
        eventDetails: {
          type: 'unrest',
          title: 'Frontier Border Skirmish',
          description: 'Garrison troops clash over contested perimeter outposts.',
          severity: 'medium'
        }
      }
    ]
  },

  // 3. Outright Warfare State
  {
    id: 'rule-open-warfare-drain',
    name: 'Open Warfare Resource Drain',
    description: 'When bilateral hostility exceeds 85, kingdoms enter active warfare consuming treasury and military readiness.',
    scope: 'relation',
    enabled: true,
    priority: 20,
    category: 'military',
    condition: {
      single: {
        target: 'relation',
        property: 'hostilityValue',
        operator: '>=',
        value: 85
      }
    },
    effects: [
      {
        target: 'kingdom',
        entityId: 'source',
        property: 'treasury',
        operation: 'subtract',
        value: 15,
        explanation: 'Wartime mobilization and soldier stipends deplete state reserves.'
      },
      {
        target: 'kingdom',
        entityId: 'target',
        property: 'treasury',
        operation: 'subtract',
        value: 15,
        explanation: 'Defensive mobilization incurs heavy logistics and mercenary costs.'
      },
      {
        target: 'event',
        operation: 'trigger_event',
        value: 'war',
        explanation: 'Active campaign maneuvers reported across frontier provinces.',
        eventDetails: {
          type: 'war',
          title: 'Active Hostilities Declared',
          description: 'Full mobilization orders issued with open conflict underway.',
          severity: 'critical'
        }
      }
    ]
  },

  // 4. Robust Trade Benefits
  {
    id: 'rule-trade-prosperity',
    name: 'Bilateral Trade Mutual Prosperity',
    description: 'Thriving trade networks increase kingdom wealth and reinforce peaceful relations.',
    scope: 'relation',
    enabled: true,
    priority: 8,
    category: 'diplomacy',
    condition: {
      single: {
        target: 'relation',
        property: 'tradeValue',
        operator: '>=',
        value: 40
      }
    },
    effects: [
      {
        target: 'kingdom',
        entityId: 'source',
        property: 'treasury',
        operation: 'add',
        value: 8,
        explanation: 'Merchant tariffs and goods exchange boost state revenue.'
      },
      {
        target: 'kingdom',
        entityId: 'target',
        property: 'treasury',
        operation: 'add',
        value: 8,
        explanation: 'Export commerce enriches local merchant guilds.'
      },
      {
        target: 'relation',
        property: 'trustValue',
        operation: 'add',
        value: 4,
        explanation: 'Economic interdependence fosters diplomatic goodwill.'
      }
    ]
  },

  // 5. Treasury Insolvency
  {
    id: 'rule-treasury-collapse',
    name: 'State Treasury Insolvency',
    description: 'When state coffers are emptied, military discipline slips and public trust collapses.',
    scope: 'kingdom',
    enabled: true,
    priority: 12,
    category: 'economy',
    condition: {
      single: {
        target: 'kingdom',
        property: 'treasury',
        operator: '<=',
        value: 0
      }
    },
    effects: [
      {
        target: 'kingdom',
        property: 'stability',
        operation: 'subtract',
        value: 18,
        explanation: 'Unpaid municipal workers and delayed grain subsidies fuel rioting.'
      },
      {
        target: 'kingdom',
        property: 'militaryPower',
        operation: 'subtract',
        value: 10,
        explanation: 'Desertions and logistical failures weaken army combat-readiness.'
      },
      {
        target: 'event',
        operation: 'trigger_event',
        value: 'rebellion',
        explanation: 'Bankruptcy triggers mutinies and tax revolts.',
        eventDetails: {
          type: 'rebellion',
          title: 'Treasury Insolvency & Garrison Mutiny',
          description: 'State debts result in frozen disbursements and civil defiance.',
          severity: 'high'
        }
      }
    ]
  },

  // 6. Arcane Surge Anomaly
  {
    id: 'rule-magic-surge',
    name: 'Arcane Energy Saturation Surge',
    description: 'Excessive accumulation of unchanneled magic triggers unpredictable environmental anomalies.',
    scope: 'kingdom',
    enabled: true,
    priority: 5,
    category: 'magic',
    condition: {
      single: {
        target: 'kingdom',
        property: 'magicReserve',
        operator: '>=',
        value: 85
      }
    },
    effects: [
      {
        target: 'kingdom',
        property: 'stability',
        operation: 'subtract',
        value: 6,
        explanation: 'Aetheric tremors and volatile discharges unsettle local populace.'
      },
      {
        target: 'event',
        operation: 'trigger_event',
        value: 'magic_surge',
        explanation: 'Ley-line saturation overflows containment conduits.',
        eventDetails: {
          type: 'magic_surge',
          title: 'Arcane Resonance Surge',
          description: 'Unstable atmospheric mana precipitates shimmering auroras and localized enchantments.',
          severity: 'medium'
        }
      }
    ]
  }
];
