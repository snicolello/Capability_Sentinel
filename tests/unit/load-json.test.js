import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadJsonFile, parseStrictJson } from '../../src/io/load-json.js';

function bytes(text) {
  return Buffer.from(text, 'utf8');
}

test('strict parser accepts one JSON value', () => {
  const value = parseStrictJson(bytes('{"ok":[1,true,null]}'), 'policy');
  assert.deepEqual(value.ok, [1, true, null]);
  assert.equal(Object.getPrototypeOf(value), null);
});

for (const [name, source, code] of [
  ['empty input', '  \r\n', 'EMPTY_JSON'],
  ['comments', '{"ok": true // no\n}', 'MALFORMED_JSON'],
  ['trailing commas', '{"ok": true,}', 'MALFORMED_JSON'],
  ['trailing content', '{"ok": true} false', 'MALFORMED_JSON'],
  ['duplicate keys', '{"outer": {"ok": 1, "ok": 2}}', 'DUPLICATE_JSON_KEY'],
]) {
  test(`strict parser rejects ${name}`, () => {
    assert.throws(
      () => parseStrictJson(bytes(source), 'policy'),
      (error) => error.code === code && error.exitCode === 65,
    );
  });
}

test('strict parser rejects BOM and malformed UTF-8', () => {
  assert.throws(
    () => parseStrictJson(Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d]), 'trace'),
    (error) => error.code === 'JSON_BOM_NOT_ALLOWED',
  );
  assert.throws(
    () => parseStrictJson(Buffer.from([0xc3, 0x28]), 'trace'),
    (error) => error.code === 'INVALID_UTF8',
  );
});

test('syntax diagnostics do not echo input contents', () => {
  const secret = 'super-secret-token-value';
  assert.throws(
    () => parseStrictJson(bytes(`{"token":"${secret}",}`), 'trace'),
    (error) => !error.message.includes(secret),
  );
});

test('file loader enforces the byte limit', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arrm-loader-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'large.json');
  await writeFile(filePath, '{"value":1}');
  await assert.rejects(
    loadJsonFile(filePath, { label: 'policy', maxBytes: 4 }),
    (error) => error.code === 'INPUT_TOO_LARGE',
  );
});

test('file loader rejects non-regular files', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arrm-loader-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await assert.rejects(
    loadJsonFile(directory, { label: 'trace', maxBytes: 1024 }),
    (error) => error.code === 'INPUT_NOT_FILE',
  );
});
