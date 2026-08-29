import assert from 'node:assert/strict';
import test from 'node:test';
import policyFixture from '../../fixtures/policies/example-agent.json' with { type: 'json' };
import normalTrace from '../../fixtures/traces/normal-run.json' with { type: 'json' };
import { createValidator } from '../../src/schema/create-validator.js';
import { validatePolicyStructure, validateTraceStructure } from '../../src/schema/validate-input.js';
import { validatePolicySemantics } from '../../src/policy/validate-semantics.js';
import { validateInputPair, validateTraceSemantics } from '../../src/trace/validate-semantics.js';

test('all repository schemas compile in strict mode', () => {
  assert.doesNotThrow(() => createValidator());
});

test('M1 fixtures pass structural and semantic validation', () => {
  assert.equal(validatePolicySemantics(validatePolicyStructure(policyFixture)), policyFixture);
  assert.equal(validateTraceSemantics(validateTraceStructure(normalTrace)), normalTrace);
  assert.doesNotThrow(() => validateInputPair(policyFixture, normalTrace));
});

test('unknown properties and versions fail structural validation', () => {
  const unknownProperty = { ...structuredClone(policyFixture), typo: true };
  const unknownVersion = { ...structuredClone(normalTrace), schema_version: '9.9' };
  assert.throws(() => validatePolicyStructure(unknownProperty), { code: 'SCHEMA_VALIDATION_FAILED' });
  assert.throws(() => validateTraceStructure(unknownVersion), { code: 'SCHEMA_VALIDATION_FAILED' });
});

test('duplicate rule and event identifiers fail semantic validation', () => {
  const policy = structuredClone(policyFixture);
  policy.rules.push({ ...structuredClone(policy.rules[0]) });
  assert.throws(() => validatePolicySemantics(policy), { code: 'DUPLICATE_RULE_ID' });

  const trace = structuredClone(normalTrace);
  trace.events[1].event_id = trace.events[0].event_id;
  assert.throws(() => validateTraceSemantics(trace), { code: 'DUPLICATE_EVENT_ID' });
});

test('sequence gaps and envelope mismatches fail semantic validation', () => {
  const sequenceGap = structuredClone(normalTrace);
  sequenceGap.events[1].sequence = 3;
  assert.throws(() => validateTraceSemantics(sequenceGap), { code: 'INVALID_EVENT_SEQUENCE' });

  const envelopeMismatch = structuredClone(normalTrace);
  envelopeMismatch.events[0].run_id = 'another-run';
  assert.throws(() => validateTraceSemantics(envelopeMismatch), { code: 'TRACE_ENVELOPE_MISMATCH' });
});

test('policy/trace platform and agent mismatches fail', () => {
  assert.throws(
    () => validateInputPair({ ...policyFixture, platform: 'posix' }, normalTrace),
    { code: 'PLATFORM_MISMATCH' },
  );
  assert.throws(
    () => validateInputPair({ ...policyFixture, agent_id: 'other-agent' }, normalTrace),
    { code: 'AGENT_MISMATCH' },
  );
});

test('all declarable capability rules pass semantic validation', () => {
  const policy = structuredClone(policyFixture);
  policy.rules = [
    ...policy.rules,
    {
      id: 'write-output',
      capability: 'FILESYSTEM_WRITE',
      target: { kind: 'path_scope', path: 'output', recursive: true },
    },
    {
      id: 'read-api-token',
      capability: 'CREDENTIAL_READ',
      target: { kind: 'credential', provider: 'environment', name: 'API_TOKEN' },
    },
    {
      id: 'invoke-repository-search',
      capability: 'TOOL_INVOKE',
      target: { kind: 'tool', name: 'repository_search' },
    },
  ];
  validatePolicyStructure(policy);
  assert.equal(validatePolicySemantics(policy), policy);
});

test('a valid UNCLASSIFIED event passes semantic validation but cannot be declared', () => {
  const trace = structuredClone(normalTrace);
  trace.events = [{
    ...trace.events[0],
    capability: 'UNCLASSIFIED',
    target: { kind: 'opaque', operation: 'unrecognized-boundary-operation' },
  }];
  validateTraceStructure(trace);
  assert.equal(validateTraceSemantics(trace), trace);

  const policy = structuredClone(policyFixture);
  policy.rules = [{
    id: 'unclassified-rule',
    capability: 'UNCLASSIFIED',
    target: { kind: 'opaque', operation: 'unrecognized-boundary-operation' },
  }];
  assert.throws(() => validatePolicyStructure(policy), { code: 'SCHEMA_VALIDATION_FAILED' });
});

test('event identifiers must leave room for their derived finding identifier', () => {
  const trace = structuredClone(normalTrace);
  trace.events[0].event_id = `e${'x'.repeat(103)}`;
  validateTraceStructure(trace);
  assert.throws(() => validateTraceSemantics(trace), { code: 'EVENT_ID_TOO_LONG' });
});

test('network hosts must contain canonical DNS labels', () => {
  const trace = structuredClone(normalTrace);
  trace.events = [{
    ...trace.events[0],
    capability: 'NETWORK_EGRESS',
    target: { kind: 'network_origin', scheme: 'https', host: 'registry..npmjs.org', port: 443 },
  }];
  validateTraceStructure(trace);
  assert.throws(
    () => validateTraceSemantics(trace),
    { code: 'NON_CANONICAL_NETWORK_ORIGIN' },
  );
});
