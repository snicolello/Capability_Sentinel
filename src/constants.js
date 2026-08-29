export const SCHEMA_VERSION = '0.1';

export const INPUT_LIMITS = Object.freeze({
  policy: 1024 * 1024,
  trace: 64 * 1024 * 1024,
});

export const MAX_EVENT_ID_FOR_DERIVED_FINDING = 103;

export const SUPPORTED_CAPABILITIES = Object.freeze([
  'FILESYSTEM_READ',
  'FILESYSTEM_WRITE',
  'NETWORK_EGRESS',
  'PROCESS_EXEC',
  'CREDENTIAL_READ',
  'TOOL_INVOKE',
  'UNCLASSIFIED',
]);

export const DECLARABLE_CAPABILITIES = Object.freeze(
  SUPPORTED_CAPABILITIES.filter((capability) => capability !== 'UNCLASSIFIED'),
);

export const SEVERITY_BY_CAPABILITY = Object.freeze({
  FILESYSTEM_READ: 'MEDIUM',
  FILESYSTEM_WRITE: 'HIGH',
  NETWORK_EGRESS: 'HIGH',
  PROCESS_EXEC: 'HIGH',
  CREDENTIAL_READ: 'CRITICAL',
  TOOL_INVOKE: 'HIGH',
  UNCLASSIFIED: 'HIGH',
});

export const DEFAULT_DECISION_BY_SEVERITY = Object.freeze({
  MEDIUM: 'REQUIRE_APPROVAL',
  HIGH: 'BLOCK',
  CRITICAL: 'TERMINATE',
});

export const DECISION_PRECEDENCE = Object.freeze([
  'ALLOW',
  'LOG',
  'REQUIRE_APPROVAL',
  'BLOCK',
  'TERMINATE',
]);

export const EXIT_CODES = Object.freeze({
  success: 0,
  requireApproval: 3,
  block: 4,
  terminate: 5,
  usage: 64,
  input: 65,
  internal: 70,
});
