import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import policyFixture from '../../fixtures/policies/example-agent.json' with { type: 'json' };
import normalTrace from '../../fixtures/traces/normal-run.json' with { type: 'json' };
import { evaluateRun } from '../../src/evaluate/evaluate-run.js';
import { createValidator, SCHEMA_IDS } from '../../src/schema/create-validator.js';
import { stableJson } from '../../src/audit/stable-json.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cliPath = path.join(repositoryRoot, 'src', 'cli.js');
const policyPath = path.join(repositoryRoot, 'fixtures', 'policies', 'example-agent.json');

const scenarios = [
  ['A', 'normal-run.json', 'normal-run.assessment.json', 0],
  ['B', 'file-write-drift-run.json', 'file-write-drift-run.assessment.json', 4],
  ['C', 'network-drift-run.json', 'network-drift-run.assessment.json', 4],
  ['D', 'process-drift-run.json', 'process-drift-run.assessment.json', 4],
  ['E', 'credential-drift-run.json', 'credential-drift-run.assessment.json', 5],
];

function assess(policyFile, traceFile) {
  return spawnSync(process.execPath, [cliPath, 'assess', policyFile, traceFile, '--json'], {
    cwd: repositoryRoot,
    encoding: null,
  });
}

function assertSchemaValid(validate, value, label) {
  assert.equal(validate(value), true, `${label}: ${JSON.stringify(validate.errors)}`);
}

test('scenarios A-E are byte-stable, schema-valid, and match approved outcomes', async () => {
  const validator = createValidator();
  const validateAssessment = validator.getSchema(SCHEMA_IDS.assessment);
  const validateFinding = validator.getSchema(SCHEMA_IDS.finding);

  for (const [scenario, traceName, expectedName, exitCode] of scenarios) {
    const tracePath = path.join(repositoryRoot, 'fixtures', 'traces', traceName);
    const expected = await readFile(path.join(repositoryRoot, 'fixtures', 'expected', expectedName));
    const first = assess(policyPath, tracePath);
    const second = assess(policyPath, tracePath);

    assert.equal(first.status, exitCode, scenario);
    assert.equal(second.status, exitCode, scenario);
    assert.equal(first.stderr.length, 0, scenario);
    assert.deepEqual(first.stdout, expected, scenario);
    assert.deepEqual(second.stdout, expected, scenario);
    assert.deepEqual(first.stdout, second.stdout, scenario);

    const assessment = JSON.parse(first.stdout);
    assertSchemaValid(validateAssessment, assessment, `scenario ${scenario} assessment`);
    for (const finding of assessment.findings) {
      assertSchemaValid(validateFinding, finding, `scenario ${scenario} finding`);
    }
  }
});

test('scenario E preserves event order and credential evidence without a secret value', async () => {
  const expected = JSON.parse(await readFile(
    path.join(repositoryRoot, 'fixtures', 'expected', 'credential-drift-run.assessment.json'),
    'utf8',
  ));
  assert.deepEqual(expected.evaluations.map(({ event_id }) => event_id), [
    'evt-credential-001',
    'evt-credential-002',
    'evt-credential-003',
  ]);
  assert.deepEqual(expected.findings.map(({ capability, severity, decision }) => ({
    capability,
    severity,
    decision,
  })), [
    { capability: 'CREDENTIAL_READ', severity: 'CRITICAL', decision: 'TERMINATE' },
    { capability: 'NETWORK_EGRESS', severity: 'HIGH', decision: 'BLOCK' },
  ]);
  assert.equal(expected.overall_decision, 'TERMINATE');
  assert.deepEqual(expected.findings[0].target, {
    kind: 'credential',
    name: 'NPM_TOKEN',
    provider: 'environment',
  });
  assert.equal(Object.hasOwn(expected.findings[0].target, 'value'), false);
});

test('malformed and semantically invalid policies and traces emit no assessment', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arrm-contract-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const validPolicyPath = path.join(directory, 'valid-policy.json');
  const validTracePath = path.join(directory, 'valid-trace.json');
  await writeFile(validPolicyPath, JSON.stringify(policyFixture));
  await writeFile(validTracePath, JSON.stringify(normalTrace));

  const invalidInputs = [];
  invalidInputs.push(['malformed-policy', '{"schema_version":"0.1",}', normalTrace]);
  invalidInputs.push(['unknown-policy-property', { ...structuredClone(policyFixture), typo: true }, normalTrace]);
  invalidInputs.push(['unknown-policy-version', { ...structuredClone(policyFixture), schema_version: '9.9' }, normalTrace]);
  const unknownCapabilityPolicy = structuredClone(policyFixture);
  unknownCapabilityPolicy.rules[0].capability = 'UNKNOWN_CAPABILITY';
  invalidInputs.push(['unknown-capability', unknownCapabilityPolicy, normalTrace]);
  const duplicateRulePolicy = structuredClone(policyFixture);
  duplicateRulePolicy.rules.push(structuredClone(duplicateRulePolicy.rules[0]));
  invalidInputs.push(['duplicate-rule', duplicateRulePolicy, normalTrace]);
  invalidInputs.push(['malformed-trace', policyFixture, '{"schema_version":"0.1",}']);
  const duplicateEventTrace = structuredClone(normalTrace);
  duplicateEventTrace.events[1].event_id = duplicateEventTrace.events[0].event_id;
  invalidInputs.push(['duplicate-event', policyFixture, duplicateEventTrace]);
  const nonIncreasingTrace = structuredClone(normalTrace);
  nonIncreasingTrace.events[1].sequence = 1;
  invalidInputs.push(['non-increasing-sequence', policyFixture, nonIncreasingTrace]);
  const envelopeMismatchTrace = structuredClone(normalTrace);
  envelopeMismatchTrace.events[0].agent_id = 'different-agent';
  invalidInputs.push(['envelope-mismatch', policyFixture, envelopeMismatchTrace]);

  for (const [name, policy, trace] of invalidInputs) {
    let casePolicyPath = typeof policy === 'string'
      ? path.join(directory, `${name}-policy.json`)
      : validPolicyPath;
    let caseTracePath = typeof trace === 'string'
      ? path.join(directory, `${name}-trace.json`)
      : validTracePath;
    if (typeof policy === 'string') await writeFile(casePolicyPath, policy);
    else if (policy !== policyFixture) {
      casePolicyPath = path.join(directory, `${name}-policy.json`);
      await writeFile(casePolicyPath, JSON.stringify(policy));
    }
    if (typeof trace === 'string') await writeFile(caseTracePath, trace);
    else if (trace !== normalTrace) {
      caseTracePath = path.join(directory, `${name}-trace.json`);
      await writeFile(caseTracePath, JSON.stringify(trace));
    }

    const result = assess(casePolicyPath, caseTracePath);
    assert.equal(result.status, 65, name);
    assert.equal(result.stdout.length, 0, name);
    const diagnostic = result.stderr.toString('utf8');
    assert.match(diagnostic, /^ARRM_ERROR /u, name);
    assert.equal(diagnostic.includes('overall_decision'), false, name);
  }
});

test('empty and UNCLASSIFIED traces have explicit deterministic outcomes', () => {
  const emptyTrace = {
    schema_version: '0.1',
    run_id: 'run-empty',
    agent_id: policyFixture.agent_id,
    platform: policyFixture.platform,
    events: [],
  };
  const emptyAssessment = evaluateRun(policyFixture, emptyTrace);
  assert.equal(emptyAssessment.events_observed, 0);
  assert.equal(emptyAssessment.matched_policy, 0);
  assert.equal(emptyAssessment.capability_drift, 0);
  assert.equal(emptyAssessment.overall_decision, 'ALLOW');
  assert.deepEqual(emptyAssessment.evaluations, []);
  assert.deepEqual(emptyAssessment.findings, []);
  assert.equal(stableJson(emptyAssessment), stableJson(evaluateRun(policyFixture, emptyTrace)));

  const unclassifiedTrace = structuredClone(normalTrace);
  unclassifiedTrace.events = [{
    ...unclassifiedTrace.events[0],
    capability: 'UNCLASSIFIED',
    target: { kind: 'opaque', operation: 'unrecognized-boundary-operation' },
  }];
  const unclassifiedAssessment = evaluateRun(policyFixture, unclassifiedTrace);
  assert.equal(unclassifiedAssessment.overall_decision, 'BLOCK');
  assert.deepEqual(unclassifiedAssessment.findings.map(({ reason, severity, decision }) => ({
    reason,
    severity,
    decision,
  })), [{ reason: 'UNCLASSIFIED_OPERATION', severity: 'HIGH', decision: 'BLOCK' }]);
});

test('rule ordering cannot change decisions or selected rule identifiers', () => {
  const duplicatedMatchPolicy = structuredClone(policyFixture);
  duplicatedMatchPolicy.rules.push({ ...structuredClone(duplicatedMatchPolicy.rules[0]), id: 'aaa-read-src' });
  const reversedPolicy = { ...duplicatedMatchPolicy, rules: [...duplicatedMatchPolicy.rules].reverse() };
  const first = evaluateRun(duplicatedMatchPolicy, normalTrace);
  const second = evaluateRun(reversedPolicy, normalTrace);
  assert.deepEqual(first, second);
  assert.equal(first.evaluations[0].matched_rule_id, 'aaa-read-src');
});

test('credential values are rejected without entering diagnostics or assessment output', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arrm-contract-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const trace = structuredClone(normalTrace);
  const secret = 'must-not-appear-in-output';
  trace.events = [{
    ...trace.events[0],
    capability: 'CREDENTIAL_READ',
    target: { kind: 'credential', provider: 'environment', name: 'NPM_TOKEN', value: secret },
  }];
  const tracePath = path.join(directory, 'credential-value.json');
  await writeFile(tracePath, JSON.stringify(trace));
  const result = assess(policyPath, tracePath);
  assert.equal(result.status, 65);
  assert.equal(result.stdout.length, 0);
  assert.equal(result.stderr.toString('utf8').includes(secret), false);
});
