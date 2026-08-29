import assert from 'node:assert/strict';
import test from 'node:test';
import policyFixture from '../../fixtures/policies/example-agent.json' with { type: 'json' };
import normalTrace from '../../fixtures/traces/normal-run.json' with { type: 'json' };
import networkTrace from '../../fixtures/traces/network-drift-run.json' with { type: 'json' };
import { evaluateRun } from '../../src/evaluate/evaluate-run.js';
import { renderText } from '../../src/render/text.js';

test('text output is stable and reports the same assessment summary', () => {
  const assessment = evaluateRun(policyFixture, normalTrace);
  const first = renderText(assessment);
  const second = renderText(assessment);

  assert.equal(first, second);
  assert.equal(first.includes('\r'), false);
  assert.equal(first.endsWith('\n'), true);
  assert.equal(first.endsWith('\n\n'), false);
  assert.match(first, /^ARRM assessment\n/u);
  assert.match(first, /Events observed: 2\n/u);
  assert.match(first, /Matched policy: 2\n/u);
  assert.match(first, /Capability drift: 0\n/u);
  assert.match(first, /Overall prescribed decision: ALLOW\n/u);
  assert.match(first, /evt-normal-001: ALLOWED; prescribed_decision=ALLOW; matched_rule=read-src/u);
  assert.match(first, /Findings:\n- none\n$/u);
});

test('text findings retain target, reason, severity, and prescribed decision', () => {
  const text = renderText(evaluateRun(policyFixture, networkTrace));

  assert.match(text, /Capability drift: 1\n/u);
  assert.match(text, /Overall prescribed decision: BLOCK\n/u);
  assert.match(text, /no allow rule matched this observed operation/u);
  assert.match(text, /finding:evt-network-001:capability-drift/u);
  assert.match(text, /Capability: NETWORK_EGRESS/u);
  assert.match(text, /Target: \{"host":"registry\.npmjs\.org","kind":"network_origin","port":443,"scheme":"https"\}/u);
  assert.match(text, /Reason: NO_MATCHING_ALLOW_RULE/u);
  assert.match(text, /Severity: HIGH/u);
  assert.match(text, /Prescribed decision: BLOCK/u);
  assert.equal(text.includes('was blocked'), false);
  assert.equal(text.includes('enforced'), false);
});
