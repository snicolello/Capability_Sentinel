import assert from 'node:assert/strict';
import test from 'node:test';
import policyFixture from '../../fixtures/policies/example-agent.json' with { type: 'json' };
import normalTrace from '../../fixtures/traces/normal-run.json' with { type: 'json' };
import networkTrace from '../../fixtures/traces/network-drift-run.json' with { type: 'json' };
import { evaluateRun } from '../../src/evaluate/evaluate-run.js';

test('normal run evaluates every event once in trace order', () => {
  const assessment = evaluateRun(policyFixture, normalTrace);
  assert.deepEqual(assessment.evaluations.map(({ event_id }) => event_id), [
    'evt-normal-001',
    'evt-normal-002',
  ]);
  assert.equal(assessment.events_observed, 2);
  assert.equal(assessment.matched_policy, 2);
  assert.equal(assessment.capability_drift, 0);
  assert.equal(assessment.overall_decision, 'ALLOW');
  assert.deepEqual(assessment.findings, []);
});

test('network drift creates one derived HIGH/BLOCK finding', () => {
  const assessment = evaluateRun(policyFixture, networkTrace);
  assert.equal(assessment.events_observed, 1);
  assert.deepEqual(assessment.evaluations.map(({ event_id }) => event_id), ['evt-network-001']);
  assert.equal(assessment.matched_policy, 0);
  assert.equal(assessment.capability_drift, 1);
  assert.equal(assessment.overall_decision, 'BLOCK');
  assert.deepEqual(
    assessment.findings.map(({ finding_id, capability, severity, decision }) => ({
      finding_id,
      capability,
      severity,
      decision,
    })),
    [{
      finding_id: 'finding:evt-network-001:capability-drift',
      capability: 'NETWORK_EGRESS',
      severity: 'HIGH',
      decision: 'BLOCK',
    }],
  );
});

test('lexicographically smallest matching rule is stable across rule order', () => {
  const policy = structuredClone(policyFixture);
  policy.rules.push({ ...structuredClone(policy.rules[0]), id: 'aaa-read-src' });
  const reversed = { ...policy, rules: [...policy.rules].reverse() };
  assert.equal(evaluateRun(policy, normalTrace).evaluations[0].matched_rule_id, 'aaa-read-src');
  assert.deepEqual(evaluateRun(policy, normalTrace), evaluateRun(reversed, normalTrace));
});

function unmatchedEvent(capability, target, eventId) {
  const trace = structuredClone(normalTrace);
  trace.events = [{
    ...trace.events[0],
    event_id: eventId,
    capability,
    target,
  }];
  return trace;
}

test('every capability has an explicit unmatched severity and response path', () => {
  const cases = [
    ['FILESYSTEM_READ', { kind: 'path', path: 'C:/work/repo/unapproved.txt' }, 'MEDIUM', 'REQUIRE_APPROVAL'],
    ['FILESYSTEM_WRITE', { kind: 'path', path: 'C:/outside/result.txt' }, 'HIGH', 'BLOCK'],
    ['PROCESS_EXEC', { kind: 'process', executable: 'node.exe', args: ['script.js'], shell: false }, 'HIGH', 'BLOCK'],
    ['NETWORK_EGRESS', { kind: 'network_origin', scheme: 'https', host: 'example.test', port: 443 }, 'HIGH', 'BLOCK'],
    ['CREDENTIAL_READ', { kind: 'credential', provider: 'environment', name: 'API_TOKEN' }, 'CRITICAL', 'TERMINATE'],
    ['TOOL_INVOKE', { kind: 'tool', name: 'repository_search' }, 'HIGH', 'BLOCK'],
    ['UNCLASSIFIED', { kind: 'opaque', operation: 'unrecognized-boundary-operation' }, 'HIGH', 'BLOCK'],
  ];

  for (const [capability, target, severity, decision] of cases) {
    const assessment = evaluateRun(policyFixture, unmatchedEvent(capability, target, `evt-${capability}`));
    assert.equal(assessment.matched_policy, 0, capability);
    assert.equal(assessment.capability_drift, 1, capability);
    assert.equal(assessment.overall_decision, decision, capability);
    assert.deepEqual(
      assessment.findings.map((finding) => ({ capability: finding.capability, severity: finding.severity, decision: finding.decision })),
      [{ capability, severity, decision }],
      capability,
    );
  }
});

test('response maps may strengthen but never weaken an unmatched capability decision', () => {
  const strengthened = structuredClone(policyFixture);
  strengthened.response_map.MEDIUM = 'BLOCK';
  strengthened.response_map.HIGH = 'TERMINATE';
  const read = evaluateRun(
    strengthened,
    unmatchedEvent('FILESYSTEM_READ', { kind: 'path', path: 'C:/work/repo/unapproved.txt' }, 'evt-strengthened-read'),
  );
  const write = evaluateRun(
    strengthened,
    unmatchedEvent('FILESYSTEM_WRITE', { kind: 'path', path: 'C:/outside/result.txt' }, 'evt-strengthened-write'),
  );
  assert.equal(read.findings[0].decision, 'BLOCK');
  assert.equal(write.findings[0].decision, 'TERMINATE');
});

test('UNCLASSIFIED is always drift even if a caller supplies a matching-looking rule', () => {
  const policy = structuredClone(policyFixture);
  policy.rules.push({
    id: 'must-not-allow-unclassified',
    capability: 'UNCLASSIFIED',
    target: { kind: 'opaque', operation: 'unrecognized-boundary-operation' },
  });
  const assessment = evaluateRun(
    policy,
    unmatchedEvent('UNCLASSIFIED', { kind: 'opaque', operation: 'unrecognized-boundary-operation' }, 'evt-unclassified'),
  );
  assert.equal(assessment.matched_policy, 0);
  assert.equal(assessment.evaluations[0].outcome, 'DRIFT');
  assert.equal(assessment.findings[0].reason, 'UNCLASSIFIED_OPERATION');
  assert.equal(assessment.findings[0].severity, 'HIGH');
  assert.equal(assessment.findings[0].decision, 'BLOCK');
});

test('unexpected capability states throw instead of producing ALLOW', () => {
  assert.throws(
    () => evaluateRun(
      policyFixture,
      unmatchedEvent('UNKNOWN_CAPABILITY', { kind: 'opaque', operation: 'unexpected' }, 'evt-unknown'),
    ),
    { code: 'UNSUPPORTED_CAPABILITY' },
  );
});

test('missing or weakened response state throws instead of producing ALLOW', () => {
  const weakened = structuredClone(policyFixture);
  weakened.response_map.HIGH = 'ALLOW';
  assert.throws(
    () => evaluateRun(
      weakened,
      unmatchedEvent('FILESYSTEM_WRITE', { kind: 'path', path: 'C:/work/repo/output.txt' }, 'evt-weakened'),
    ),
    { code: 'INVALID_RESPONSE_MAP' },
  );

  const missing = structuredClone(policyFixture);
  delete missing.response_map.CRITICAL;
  assert.throws(
    () => evaluateRun(
      missing,
      unmatchedEvent('CREDENTIAL_READ', { kind: 'credential', provider: 'environment', name: 'API_TOKEN' }, 'evt-missing'),
    ),
    { code: 'INVALID_RESPONSE_MAP' },
  );
});
