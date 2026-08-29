import assert from 'node:assert/strict';
import test from 'node:test';
import policyFixture from '../../fixtures/policies/example-agent.json' with { type: 'json' };
import normalTrace from '../../fixtures/traces/normal-run.json' with { type: 'json' };
import { matchTarget } from '../../src/evaluate/match-target.js';

test('filesystem read rule matches its subtree but not a sibling prefix', () => {
  const rule = policyFixture.rules[0];
  const event = normalTrace.events[0];
  assert.equal(matchTarget(rule, event, policyFixture), true);
  const sibling = structuredClone(event);
  sibling.target.path = 'C:/work/repo/src-old/index.js';
  assert.equal(matchTarget(rule, sibling, policyFixture), false);
});

test('process target requires exact executable, arguments, and shell flag', () => {
  const rule = policyFixture.rules[1];
  const event = normalTrace.events[1];
  assert.equal(matchTarget(rule, event, policyFixture), true);
  for (const target of [
    { ...event.target, executable: 'npm.exe' },
    { ...event.target, args: ['test', '--watch'] },
    { ...event.target, shell: true },
  ]) {
    assert.equal(matchTarget(rule, { ...event, target }, policyFixture), false);
  }
});

test('network target requires exact canonical origin tuple', () => {
  const rule = {
    id: 'registry',
    capability: 'NETWORK_EGRESS',
    target: { kind: 'network_origin', scheme: 'https', host: 'registry.npmjs.org', port: 443 },
  };
  const event = {
    capability: 'NETWORK_EGRESS',
    target: { kind: 'network_origin', scheme: 'https', host: 'registry.npmjs.org', port: 443 },
  };
  assert.equal(matchTarget(rule, event, policyFixture), true);
  assert.equal(matchTarget(rule, { ...event, target: { ...event.target, port: 80 } }, policyFixture), false);
});

test('filesystem write uses the same complete-segment path scope matching as reads', () => {
  const rule = {
    id: 'write-output',
    capability: 'FILESYSTEM_WRITE',
    target: { kind: 'path_scope', path: 'output', recursive: true },
  };
  const event = {
    capability: 'FILESYSTEM_WRITE',
    target: { kind: 'path', path: 'C:/work/repo/output/result.json' },
  };
  assert.equal(matchTarget(rule, event, policyFixture), true);
  assert.equal(
    matchTarget(rule, { ...event, target: { kind: 'path', path: 'C:/work/repo/output-old/result.json' } }, policyFixture),
    false,
  );
});

test('credential target requires the exact provider and credential name', () => {
  const rule = {
    id: 'read-api-token',
    capability: 'CREDENTIAL_READ',
    target: { kind: 'credential', provider: 'environment', name: 'API_TOKEN' },
  };
  const event = {
    capability: 'CREDENTIAL_READ',
    target: { kind: 'credential', provider: 'environment', name: 'API_TOKEN' },
  };
  assert.equal(matchTarget(rule, event, policyFixture), true);
  assert.equal(matchTarget(rule, { ...event, target: { ...event.target, provider: 'file' } }, policyFixture), false);
  assert.equal(matchTarget(rule, { ...event, target: { ...event.target, name: 'OTHER_TOKEN' } }, policyFixture), false);
});

test('tool invocation target requires an exact tool name', () => {
  const rule = {
    id: 'invoke-repository-search',
    capability: 'TOOL_INVOKE',
    target: { kind: 'tool', name: 'repository_search' },
  };
  const event = {
    capability: 'TOOL_INVOKE',
    target: { kind: 'tool', name: 'repository_search' },
  };
  assert.equal(matchTarget(rule, event, policyFixture), true);
  assert.equal(matchTarget(rule, { ...event, target: { kind: 'tool', name: 'repository_write' } }, policyFixture), false);
});
