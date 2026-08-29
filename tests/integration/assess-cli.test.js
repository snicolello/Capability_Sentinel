import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import policyFixture from '../../fixtures/policies/example-agent.json' with { type: 'json' };
import normalTrace from '../../fixtures/traces/normal-run.json' with { type: 'json' };

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cliPath = path.join(repositoryRoot, 'src', 'cli.js');
const policyPath = path.join(repositoryRoot, 'fixtures', 'policies', 'example-agent.json');

function assess(traceName) {
  const tracePath = path.join(repositoryRoot, 'fixtures', 'traces', traceName);
  return spawnSync(process.execPath, [cliPath, 'assess', policyPath, tracePath, '--json'], {
    cwd: repositoryRoot,
    encoding: null,
  });
}

for (const [traceName, expectedName, exitCode] of [
  ['normal-run.json', 'normal-run.assessment.json', 0],
  ['network-drift-run.json', 'network-drift-run.assessment.json', 4],
]) {
  test(`${traceName} emits committed deterministic assessment`, async () => {
    const expected = await readFile(path.join(repositoryRoot, 'fixtures', 'expected', expectedName));
    const first = assess(traceName);
    const second = assess(traceName);
    assert.equal(first.status, exitCode);
    assert.equal(second.status, exitCode);
    assert.equal(first.stderr.length, 0);
    assert.deepEqual(first.stdout, expected);
    assert.deepEqual(second.stdout, expected);
    assert.deepEqual(first.stdout, second.stdout);
  });
}

test('invalid JSON produces a controlled content-safe error and no assessment', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arrm-cli-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const tracePath = path.join(directory, 'invalid-trace.json');
  const secret = 'do-not-echo-this-secret';
  await writeFile(tracePath, `{"secret":"${secret}",}`);
  const result = spawnSync(process.execPath, [cliPath, 'assess', policyPath, tracePath, '--json'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 65);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^ARRM_ERROR MALFORMED_JSON:/u);
  assert.equal(result.stderr.includes(secret), false);
  assert.equal(result.stderr.includes('ALLOW'), false);
});

test('schema-valid unsupported capability fails with no assessment', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arrm-cli-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const tracePath = path.join(directory, 'unsupported-trace.json');
  const trace = structuredClone(normalTrace);
  trace.events = [{
    ...trace.events[0],
    capability: 'FILESYSTEM_WRITE',
    target: { kind: 'path', path: 'C:/work/repo/output.txt' },
  }];
  await writeFile(tracePath, JSON.stringify(trace));
  const result = spawnSync(process.execPath, [cliPath, 'assess', policyPath, tracePath, '--json'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 65);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^ARRM_ERROR UNSUPPORTED_CAPABILITY:/u);
});

test('malformed policy produces a controlled error and no assessment', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arrm-cli-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const invalidPolicyPath = path.join(directory, 'invalid-policy.json');
  await writeFile(invalidPolicyPath, '{"schema_version":"0.1",}');
  const tracePath = path.join(repositoryRoot, 'fixtures', 'traces', 'normal-run.json');
  const result = spawnSync(
    process.execPath,
    [cliPath, 'assess', invalidPolicyPath, tracePath, '--json'],
    { cwd: repositoryRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 65);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^ARRM_ERROR MALFORMED_JSON:/u);
  assert.equal(result.stderr.includes('ALLOW'), false);
});

test('schema-valid unsupported policy capability fails with no assessment', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arrm-cli-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const unsupportedPolicyPath = path.join(directory, 'unsupported-policy.json');
  const policy = structuredClone(policyFixture);
  policy.rules = [{
    id: 'write-output',
    capability: 'FILESYSTEM_WRITE',
    target: { kind: 'path_scope', path: 'output', recursive: true },
  }];
  await writeFile(unsupportedPolicyPath, JSON.stringify(policy));
  const tracePath = path.join(repositoryRoot, 'fixtures', 'traces', 'normal-run.json');
  const result = spawnSync(
    process.execPath,
    [cliPath, 'assess', unsupportedPolicyPath, tracePath, '--json'],
    { cwd: repositoryRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 65);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^ARRM_ERROR UNSUPPORTED_CAPABILITY:/u);
});

test('invalid command usage exits 64 without an assessment', () => {
  const result = spawnSync(process.execPath, [cliPath, 'assess'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 64);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^ARRM_ERROR INVALID_USAGE:/u);
});
