import { SUPPORTED_CAPABILITIES } from '../constants.js';
import { InputError } from '../errors.js';
import { assertCanonicalAbsolutePath, normalizeLexicalPath } from '../normalize/path.js';

const supported = new Set(SUPPORTED_CAPABILITIES);

function validateNetworkHost(host) {
  if (host.split('.').some((label) => (
    label.length === 0
    || label.length > 63
    || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(label)
  ))) {
    throw new InputError('NON_CANONICAL_NETWORK_ORIGIN', 'policy contains a non-canonical network host');
  }
}

export function validatePolicySemantics(policy) {
  const ruleIds = new Set();
  assertCanonicalAbsolutePath(policy.workspace_root, policy.platform, 'workspace_root');

  for (const rule of policy.rules) {
    if (ruleIds.has(rule.id)) {
      throw new InputError('DUPLICATE_RULE_ID', 'policy contains a duplicate rule id');
    }
    ruleIds.add(rule.id);
    if (!supported.has(rule.capability)) {
      throw new InputError(
        'UNSUPPORTED_CAPABILITY',
        'policy contains a capability unsupported by the M1 evaluator',
      );
    }
    if (rule.capability === 'FILESYSTEM_READ') {
      normalizeLexicalPath(rule.target.path, policy.platform, { label: 'policy path' });
    } else if (rule.capability === 'NETWORK_EGRESS') {
      validateNetworkHost(rule.target.host);
    }
  }
  return policy;
}
