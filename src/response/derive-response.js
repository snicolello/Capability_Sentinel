import {
  DECISION_PRECEDENCE,
  DEFAULT_DECISION_BY_SEVERITY,
  SEVERITY_BY_CAPABILITY,
} from '../constants.js';
import { InputError } from '../errors.js';

export function deriveResponse(capability, responseMap) {
  const severity = SEVERITY_BY_CAPABILITY[capability];
  if (!severity) {
    throw new InputError('UNSUPPORTED_CAPABILITY', 'capability has no severity mapping');
  }
  const decision = responseMap?.[severity];
  const minimumDecision = DEFAULT_DECISION_BY_SEVERITY[severity];
  if (
    !minimumDecision
    || DECISION_PRECEDENCE.indexOf(decision) < DECISION_PRECEDENCE.indexOf(minimumDecision)
  ) {
    throw new InputError('INVALID_RESPONSE_MAP', 'response map is missing or weakens the safe default');
  }
  return { severity, decision };
}

export function higherDecision(left, right) {
  const leftIndex = DECISION_PRECEDENCE.indexOf(left);
  const rightIndex = DECISION_PRECEDENCE.indexOf(right);
  if (leftIndex < 0 || rightIndex < 0) {
    throw new InputError('UNSUPPORTED_DECISION', 'decision is not in the fixed precedence table');
  }
  return leftIndex >= rightIndex
    ? left
    : right;
}
