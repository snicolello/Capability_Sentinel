# External Integrations

## Core Sections (Required)

### 1) Integration Inventory

There are no runtime network APIs, databases, queues, authentication providers, monitoring services, agent runtimes, or LLMs in the implemented v0.1 path.

| System | Type | Purpose | Auth model | Criticality | Evidence |
|---|---|---|---|---|---|
| Local filesystem | Host boundary | Reads policy and trace JSON supplied to the CLI | Host OS file permissions; no application auth | High | `src/io/load-json.js`; `src/cli.js` |
| Process stdout/stderr | Host boundary | Emits valid assessments or content-safe diagnostics | Inherited process access; no application auth | High | `src/cli.js` |
| npm registry | Install-time package source only | Resolves the locked dependency graph during `npm ci` | [TODO] Depends on the operator's npm configuration; no repository-owned credential logic | Medium | `package-lock.json`; `package.json` |

Future collectors/runtime adapters depicted in design material are explicitly not implemented (`docs/06-architecture.md`, `docs/07-deferred-scope.md`).

### 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|---|---|---|---|---|
| None | No database, cache, persistent audit store, or output file is implemented | N/A | Assessment durability depends on the invoking process capturing stdout | `docs/06-architecture.md`; `src/cli.js` |

Input and fixture JSON files are documents, not an application-managed data store.

### 3) Secrets and Credentials Handling

- Credential sources: none read by production code; no environment variable or secrets-manager access exists under `src/`.
- Hardcoding checks: no secret values found in canonical schemas/fixtures; `CREDENTIAL_READ` represents only `provider` and credential `name` (`schemas/event.schema.json`; `fixtures/traces/credential-drift-run.json`).
- Structural/testing mitigation: credential values are not part of the canonical target schema, and contract tests verify that a supplied value is rejected without entering output (`tests/contract/full-scenarios.test.js`).
- Rotation or lifecycle notes: [TODO] Not applicable to v0.1 runtime; npm authentication, if an operator needs it, is outside repository-owned code.

### 4) Reliability and Failure Behavior

- Retry/backoff behavior: none. Local input reads fail with stable input errors; no remote call is retried (`src/io/load-json.js`).
- Timeout policy: none; production source has no remote integration. File size/cardinality limits bound accepted inputs but are not timeouts (`src/constants.js`, `schemas/policy.schema.json`, `schemas/trace.schema.json`).
- Circuit breaker/fallback: none. Invalid or changed input fails closed and produces no assessment (`src/io/load-json.js`, `src/cli.js`).

### 5) Observability for Integrations

- External-call logging: not applicable; there are no runtime external calls.
- Process-boundary visibility: stable assessment data is written to stdout; stable error code/message text is written to stderr (`src/cli.js`).
- Metrics/tracing: none implemented.
- Missing visibility gaps: no persistent audit sink; no telemetry for a future collector; no evidence of whether a prescribed response was enforced (`docs/07-deferred-scope.md`, `docs/08-open-questions.md`).

### 6) Evidence

- `src/io/load-json.js`
- `src/cli.js`
- `package.json`
- `package-lock.json`
- `schemas/event.schema.json`
- `tests/contract/full-scenarios.test.js`
- `docs/06-architecture.md`
- `docs/07-deferred-scope.md`
