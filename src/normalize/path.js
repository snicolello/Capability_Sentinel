import { InputError } from '../errors.js';

function fail(label, reason) {
  throw new InputError('NON_CANONICAL_PATH', `${label} is not a canonical path: ${reason}`);
}

function isWindowsAbsolute(value) {
  return /^[A-Za-z]:\//u.test(value);
}

function isPosixAbsolute(value) {
  return value.startsWith('/') && !value.startsWith('//');
}

export function normalizeLexicalPath(value, platform, { label = 'path', requireAbsolute = false } = {}) {
  if (typeof value !== 'string' || value.length === 0) fail(label, 'empty value');
  if (value.includes('\0')) fail(label, 'NUL is forbidden');
  if (value.includes('\\')) fail(label, 'backslash separators are forbidden');

  let root = '';
  let remainder = value;
  if (platform === 'windows') {
    if (value.startsWith('//') || /^\/(?:\?|\.)\//u.test(value)) fail(label, 'device and UNC paths are forbidden');
    if (isWindowsAbsolute(value)) {
      root = `${value[0].toUpperCase()}:/`;
      remainder = value.slice(3);
    } else if (/^[A-Za-z]:/u.test(value)) {
      fail(label, 'drive-relative syntax is forbidden');
    } else if (value.startsWith('/')) {
      fail(label, 'a Windows absolute path requires a drive');
    }
  } else if (platform === 'posix') {
    if (/^[A-Za-z]:/u.test(value)) fail(label, 'drive syntax is forbidden on POSIX');
    if (isPosixAbsolute(value)) {
      root = '/';
      remainder = value.slice(1);
    } else if (value.startsWith('//')) {
      fail(label, 'double-root syntax is forbidden');
    }
  } else {
    throw new InputError('UNSUPPORTED_PLATFORM', `${label} uses an unsupported platform`);
  }

  if (requireAbsolute && root === '') fail(label, 'an absolute path is required');

  if (remainder === '') return root || '.';
  const output = [];
  for (const segment of remainder.split('/')) {
    if (segment === '') fail(label, 'empty segments are forbidden');
    if (segment === '..') fail(label, 'parent segments are forbidden');
    if (segment === '.') continue;
    output.push(segment);
  }
  if (output.length === 0) return root || '.';
  return `${root}${output.join('/')}`;
}

export function assertCanonicalAbsolutePath(value, platform, label = 'path') {
  const normalized = normalizeLexicalPath(value, platform, { label, requireAbsolute: true });
  if (normalized !== value) fail(label, 'normalization would change the value');
  return normalized;
}

export function resolvePolicyPath(workspaceRoot, policyPath, platform) {
  const normalizedRoot = assertCanonicalAbsolutePath(workspaceRoot, platform, 'workspace_root');
  const normalizedScope = normalizeLexicalPath(policyPath, platform, { label: 'policy path' });
  const absolute = platform === 'windows'
    ? isWindowsAbsolute(normalizedScope)
    : isPosixAbsolute(normalizedScope);
  if (absolute) return normalizedScope;
  if (normalizedScope === '.') return normalizedRoot;
  const separator = normalizedRoot.endsWith('/') ? '' : '/';
  return `${normalizedRoot}${separator}${normalizedScope}`;
}

export function pathScopeMatches(scopePath, eventPath, recursive, platform) {
  const comparisonScope = platform === 'windows' ? scopePath.toLowerCase() : scopePath;
  const comparisonEvent = platform === 'windows' ? eventPath.toLowerCase() : eventPath;
  if (comparisonScope === comparisonEvent) return true;
  if (!recursive) return false;
  const prefix = comparisonScope.endsWith('/') ? comparisonScope : `${comparisonScope}/`;
  return comparisonEvent.startsWith(prefix);
}
