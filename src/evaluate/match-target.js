import { InputError } from '../errors.js';
import { assertCanonicalAbsolutePath, pathScopeMatches, resolvePolicyPath } from '../normalize/path.js';

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function matchTarget(rule, event, policy) {
  if (rule.capability !== event.capability) return false;
  switch (event.capability) {
    case 'FILESYSTEM_READ':
    case 'FILESYSTEM_WRITE': {
      const scope = resolvePolicyPath(policy.workspace_root, rule.target.path, policy.platform);
      const eventPath = assertCanonicalAbsolutePath(event.target.path, policy.platform, 'event path');
      return pathScopeMatches(scope, eventPath, rule.target.recursive, policy.platform);
    }
    case 'PROCESS_EXEC':
      return rule.target.executable === event.target.executable
        && rule.target.shell === event.target.shell
        && arraysEqual(rule.target.args, event.target.args);
    case 'NETWORK_EGRESS':
      return rule.target.scheme === event.target.scheme
        && rule.target.host === event.target.host
        && rule.target.port === event.target.port;
    case 'CREDENTIAL_READ':
      return rule.target.provider === event.target.provider
        && rule.target.name === event.target.name;
    case 'TOOL_INVOKE':
      return rule.target.name === event.target.name;
    case 'UNCLASSIFIED':
      return false;
    default:
      throw new InputError(
        'UNSUPPORTED_CAPABILITY',
        'event capability is unsupported by the evaluator',
      );
  }
}
