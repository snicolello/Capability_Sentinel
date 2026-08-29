import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertCanonicalAbsolutePath,
  normalizeLexicalPath,
  pathScopeMatches,
  resolvePolicyPath,
} from '../../src/normalize/path.js';

test('Windows policy paths resolve lexically under the workspace', () => {
  assert.equal(resolvePolicyPath('C:/work/repo', 'src/./lib', 'windows'), 'C:/work/repo/src/lib');
  assert.equal(assertCanonicalAbsolutePath('C:/work/repo/src/a.js', 'windows'), 'C:/work/repo/src/a.js');
});

test('subtree matching uses complete path segments', () => {
  const scope = 'C:/work/repo/src';
  assert.equal(pathScopeMatches(scope, scope, true, 'windows'), true);
  assert.equal(pathScopeMatches(scope, 'C:/work/repo/src/lib/a.js', true, 'windows'), true);
  assert.equal(pathScopeMatches(scope, 'C:/work/repo/src-old/a.js', true, 'windows'), false);
  assert.equal(pathScopeMatches(scope, 'C:/work/repo/src/a.js', false, 'windows'), false);
});

test('Windows comparison is case-insensitive and POSIX comparison is case-sensitive', () => {
  assert.equal(pathScopeMatches('C:/Repo/Src', 'C:/repo/src/A.js', true, 'windows'), true);
  assert.equal(pathScopeMatches('/repo/Src', '/repo/src/a.js', true, 'posix'), false);
});

test('unsafe or non-canonical path forms are rejected', () => {
  for (const value of ['../src', 'src//lib', 'C:relative', '//server/share']) {
    assert.throws(() => normalizeLexicalPath(value, 'windows'));
  }
  assert.throws(() => assertCanonicalAbsolutePath('c:/work/repo', 'windows'));
  assert.throws(() => assertCanonicalAbsolutePath('/repo/./src', 'posix'));
});
