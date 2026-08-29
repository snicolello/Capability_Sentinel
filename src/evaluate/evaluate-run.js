import { SCHEMA_VERSION } from '../constants.js';
import { matchTarget } from './match-target.js';
import { deriveResponse, higherDecision } from '../response/derive-response.js';

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function evaluateRun(policy, trace) {
  const evaluations = [];
  const findings = [];
  let matchedPolicy = 0;
  let overallDecision = 'ALLOW';

  for (const event of trace.events) {
    const matchingRules = policy.rules
      .filter((rule) => rule.capability === event.capability && matchTarget(rule, event, policy))
      .sort((left, right) => compareText(left.id, right.id));

    if (matchingRules.length > 0) {
      matchedPolicy += 1;
      evaluations.push({
        event_id: event.event_id,
        outcome: 'ALLOWED',
        decision: 'ALLOW',
        matched_rule_id: matchingRules[0].id,
      });
      continue;
    }

    const findingId = `finding:${event.event_id}:capability-drift`;
    const { severity, decision } = deriveResponse(event.capability, policy.response_map);
    evaluations.push({
      event_id: event.event_id,
      outcome: 'DRIFT',
      decision,
      finding_id: findingId,
    });
    findings.push({
      schema_version: SCHEMA_VERSION,
      finding_id: findingId,
      run_id: trace.run_id,
      event_id: event.event_id,
      type: 'CAPABILITY_DRIFT',
      capability: event.capability,
      target: event.target,
      declared: false,
      reason: event.capability === 'UNCLASSIFIED'
        ? 'UNCLASSIFIED_OPERATION'
        : 'NO_MATCHING_ALLOW_RULE',
      severity,
      decision,
    });
    overallDecision = higherDecision(overallDecision, decision);
  }

  return {
    schema_version: SCHEMA_VERSION,
    run_id: trace.run_id,
    agent_id: trace.agent_id,
    policy_id: policy.policy_id,
    events_observed: trace.events.length,
    matched_policy: matchedPolicy,
    capability_drift: findings.length,
    overall_decision: overallDecision,
    evaluations,
    findings,
  };
}
