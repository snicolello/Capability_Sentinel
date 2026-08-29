import { stableJsonLine } from '../audit/stable-json.js';

function renderEvaluation(evaluation) {
  const reference = evaluation.outcome === 'ALLOWED'
    ? `matched_rule=${evaluation.matched_rule_id}`
    : `finding=${evaluation.finding_id}`;
  return `- ${evaluation.event_id}: ${evaluation.outcome}; prescribed_decision=${evaluation.decision}; ${reference}`;
}

function renderFinding(finding) {
  const reasonExplanation = finding.reason === 'NO_MATCHING_ALLOW_RULE'
    ? 'no allow rule matched this observed operation'
    : 'the collector reported an operation it could not safely classify';
  return [
    `- ${finding.finding_id}`,
    `  Event: ${finding.event_id}`,
    `  Capability: ${finding.capability}`,
    `  Target: ${stableJsonLine(finding.target)}`,
    `  Reason: ${finding.reason} (${reasonExplanation})`,
    `  Severity: ${finding.severity}`,
    `  Prescribed decision: ${finding.decision}`,
  ];
}

export function renderText(assessment) {
  const lines = [
    'ARRM assessment',
    `Run: ${assessment.run_id}`,
    `Agent: ${assessment.agent_id}`,
    `Policy: ${assessment.policy_id}`,
    `Events observed: ${assessment.events_observed}`,
    `Matched policy: ${assessment.matched_policy}`,
    `Capability drift: ${assessment.capability_drift}`,
    `Overall prescribed decision: ${assessment.overall_decision}`,
    '',
    'Evaluations:',
  ];

  if (assessment.evaluations.length === 0) lines.push('- none');
  else lines.push(...assessment.evaluations.map(renderEvaluation));

  lines.push('', 'Findings:');
  if (assessment.findings.length === 0) lines.push('- none');
  else {
    for (const finding of assessment.findings) lines.push(...renderFinding(finding));
  }

  return `${lines.join('\n')}\n`;
}
