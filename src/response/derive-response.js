import { DECISION_PRECEDENCE, SEVERITY_BY_CAPABILITY } from '../constants.js';
import { InputError } from '../errors.js';

export function deriveResponse(capability, responseMap) {
  const severity = SEVERITY_BY_CAPABILITY[capability];
  if (!severity) {
    throw new InputError('UNSUPPORTED_CAPABILITY', 'capability has no M1 severity mapping');
  }
  return { severity, decision: responseMap[severity] };
}

export function higherDecision(left, right) {
  return DECISION_PRECEDENCE.indexOf(left) >= DECISION_PRECEDENCE.indexOf(right)
    ? left
    : right;
}
