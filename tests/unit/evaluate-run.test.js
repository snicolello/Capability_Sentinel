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
