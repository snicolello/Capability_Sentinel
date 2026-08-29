import { MAX_EVENT_ID_FOR_DERIVED_FINDING, SUPPORTED_CAPABILITIES } from '../constants.js';
import { InputError } from '../errors.js';
import { assertCanonicalAbsolutePath } from '../normalize/path.js';

const supported = new Set(SUPPORTED_CAPABILITIES);

function validateNetworkHost(host) {
  if (host.split('.').some((label) => (
    label.length === 0
    || label.length > 63
    || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(label)
  ))) {
    throw new InputError('NON_CANONICAL_NETWORK_ORIGIN', 'trace contains a non-canonical network host');
  }
}

export function validateTraceSemantics(trace) {
  const eventIds = new Set();
  for (let index = 0; index < trace.events.length; index += 1) {
    const event = trace.events[index];
    if (eventIds.has(event.event_id)) {
      throw new InputError('DUPLICATE_EVENT_ID', 'trace contains a duplicate event id');
    }
    eventIds.add(event.event_id);
    if (event.event_id.length > MAX_EVENT_ID_FOR_DERIVED_FINDING) {
      throw new InputError('EVENT_ID_TOO_LONG', 'event id is too long for a derived finding id');
    }
    if (event.sequence !== index + 1) {
      throw new InputError('INVALID_EVENT_SEQUENCE', 'trace event sequence must be contiguous from 1');
    }
    if (event.run_id !== trace.run_id || event.agent_id !== trace.agent_id) {
      throw new InputError('TRACE_ENVELOPE_MISMATCH', 'trace event does not match its envelope');
    }
    if (!supported.has(event.capability)) {
      throw new InputError(
        'UNSUPPORTED_CAPABILITY',
        'trace contains a capability unsupported by the evaluator',
      );
    }
    if (event.capability === 'FILESYSTEM_READ' || event.capability === 'FILESYSTEM_WRITE') {
      assertCanonicalAbsolutePath(event.target.path, trace.platform, 'event path');
    } else if (event.capability === 'NETWORK_EGRESS') {
      validateNetworkHost(event.target.host);
    }
  }
  return trace;
}

export function validateInputPair(policy, trace) {
  if (policy.agent_id !== trace.agent_id) {
    throw new InputError('AGENT_MISMATCH', 'policy and trace agent identifiers do not match');
  }
  if (policy.platform !== trace.platform) {
    throw new InputError('PLATFORM_MISMATCH', 'policy and trace platforms do not match');
  }
}
