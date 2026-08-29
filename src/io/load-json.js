import { constants } from 'node:fs';
import { open, stat } from 'node:fs/promises';
import { getNodeValue, parseTree, printParseErrorCode } from 'jsonc-parser';
import { InputError } from '../errors.js';

function locationAt(text, offset) {
  let line = 1;
  let column = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

function findDuplicateProperty(root) {
  const pending = [root];
  let earliestDuplicate;
  while (pending.length > 0) {
    const node = pending.pop();
    if (node.type === 'object') {
      const seen = new Set();
      for (const property of node.children ?? []) {
        const keyNode = property.children?.[0];
        const valueNode = property.children?.[1];
        if (seen.has(keyNode.value)
          && (!earliestDuplicate || keyNode.offset < earliestDuplicate.offset)) {
          earliestDuplicate = keyNode;
        }
        seen.add(keyNode.value);
        if (valueNode) pending.push(valueNode);
      }
    } else if (node.type === 'array') {
      pending.push(...(node.children ?? []));
    }
  }
  return earliestDuplicate;
}

export function parseStrictJson(bytes, label = 'input') {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throw new InputError('JSON_BOM_NOT_ALLOWED', `${label} must be UTF-8 without a byte-order mark`);
  }

  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new InputError('INVALID_UTF8', `${label} is not valid UTF-8`);
  }

  if (text.trim().length === 0) {
    throw new InputError('EMPTY_JSON', `${label} is empty`);
  }

  const parseErrors = [];
  const tree = parseTree(text, parseErrors, {
    allowEmptyContent: false,
    allowTrailingComma: false,
    disallowComments: true,
  });

  if (parseErrors.length > 0 || !tree) {
    const first = parseErrors[0] ?? { error: 'Unknown', offset: 0 };
    const location = locationAt(text, first.offset);
    const parseCode = typeof first.error === 'number'
      ? printParseErrorCode(first.error)
      : 'InvalidSymbol';
    throw new InputError(
      'MALFORMED_JSON',
      `${label} is not strict JSON (${parseCode} at ${location.line}:${location.column})`,
    );
  }

  const duplicate = findDuplicateProperty(tree);
  if (duplicate) {
    const location = locationAt(text, duplicate.offset);
    throw new InputError(
      'DUPLICATE_JSON_KEY',
      `${label} contains a duplicate object key at ${location.line}:${location.column}`,
    );
  }

  return getNodeValue(tree);
}

export async function loadJsonFile(filePath, { label, maxBytes }) {
  let handle;
  try {
    const pathStats = await stat(filePath);
    if (!pathStats.isFile()) {
      throw new InputError('INPUT_NOT_FILE', `${label} is not a regular file`);
    }
    if (pathStats.size > maxBytes) {
      throw new InputError('INPUT_TOO_LARGE', `${label} exceeds the ${maxBytes}-byte limit`);
    }

    handle = await open(filePath, constants.O_RDONLY | constants.O_NONBLOCK);
    const stats = await handle.stat();
    if (!stats.isFile()) {
      throw new InputError('INPUT_NOT_FILE', `${label} is not a regular file`);
    }
    if (stats.size > maxBytes) {
      throw new InputError('INPUT_TOO_LARGE', `${label} exceeds the ${maxBytes}-byte limit`);
    }
    const chunks = [];
    let totalBytes = 0;
    while (totalBytes <= maxBytes) {
      const remaining = maxBytes + 1 - totalBytes;
      const chunk = Buffer.alloc(Math.min(64 * 1024, remaining));
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, null);
      if (bytesRead === 0) break;
      chunks.push(chunk.subarray(0, bytesRead));
      totalBytes += bytesRead;
    }
    if (totalBytes > maxBytes) {
      throw new InputError('INPUT_TOO_LARGE', `${label} exceeds the ${maxBytes}-byte limit`);
    }
    const finalStats = await handle.stat();
    if (finalStats.size !== stats.size || finalStats.mtimeMs !== stats.mtimeMs) {
      throw new InputError('INPUT_CHANGED_DURING_READ', `${label} changed while it was being read`);
    }
    return parseStrictJson(Buffer.concat(chunks, totalBytes), label);
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError('INPUT_READ_FAILED', `${label} could not be read`, { cause: error });
  } finally {
    await handle?.close();
  }
}
