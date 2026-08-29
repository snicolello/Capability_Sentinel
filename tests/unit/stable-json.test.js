import assert from 'node:assert/strict';
import test from 'node:test';
import { stableJson } from '../../src/audit/stable-json.js';

test('stable JSON recursively sorts object keys and preserves array order', () => {
  const value = { z: 1, a: [{ z: 2, a: 3 }, 'first', 'second'] };
  assert.equal(stableJson(value), '{\n  "a": [\n    {\n      "a": 3,\n      "z": 2\n    },\n    "first",\n    "second"\n  ],\n  "z": 1\n}\n');
});

test('stable JSON uses LF, one trailing newline, and repeatable bytes', () => {
  const first = stableJson({ b: 2, a: 1 });
  const second = stableJson({ a: 1, b: 2 });
  assert.equal(first, second);
  assert.equal(first.includes('\r'), false);
  assert.equal(first.endsWith('\n'), true);
  assert.equal(first.endsWith('\n\n'), false);
});
