# ARRM v0.1 Implementation Plan

## Purpose

This plan converts the approved discovery artifacts into a small, deterministic offline assessor. It does not broaden v0.1 into runtime enforcement, OS telemetry, effective-capability graphs, or a general security platform.

## Current execution status

Updated 2026-08-29 after completing the M5 v0.1 review and stop gate.

| Milestone | Status | Evidence |
|---|---|---|
| M0 — reproducible scaffold | Complete | Node `24.13.0` pin, exact npm lock, strict schema check, and approved dependency families are committed. |
| M1 — thin vertical slice | Complete | Scenarios A and C, canonical JSON, fail-closed CLI behavior, and 38 automated tests are committed. |
| M2 — complete deterministic core | Complete | All seven event capabilities now have total evaluation paths; all six declarable capabilities have deterministic matchers; focused M2 tests pass. |
| M3 — complete CLI and audit presentation | Complete | Stable text and canonical JSON modes have parity; all documented exit codes and prescribed-decision wording are tested. |
| M4 — full fixture and hardening matrix | Complete | Scenarios A–E and every mandatory failure row are automated; scenario outputs and individual findings validate against their schemas. |
| M5 — v0.1 review and stop gate | Complete | The ten unique definition-of-done obligations are evidenced, the threat model and documentation are reconciled, the trusted surface is reviewed, lessons are recorded, and v0.1 is formally accepted. |
| M6 — runtime integration discovery | Not authorized | This is a separate future design gate, not an automatic continuation. |

Current verification baseline:

- `npm.cmd test` passes 58 tests.
- `npm.cmd run check` compiles all five Draft 2020-12 schemas in strict mode.
- The normal fixture emits byte-stable `ALLOW` JSON and exits `0`.
- The network-drift fixture emits one `NETWORK_EGRESS`, `HIGH/BLOCK` finding and exits `4`.
- Text mode is byte-stable and expresses the same counts, findings, and overall prescribed decision as JSON mode.
- The complete `0/3/4/5/64/65/70` exit-code contract is automated.
- All five approved scenarios are byte-stable across repeated runs and match canonical expected assessments.
- Every scenario assessment and individual finding validates against the normative schemas.
- Every schema-valid capability is evaluated; malformed or unknown policy/trace input exits `65` and emits no assessment.
- The production lock uses `ajv@8.20.0`, `ajv-formats@3.0.1`, and `jsonc-parser@3.3.1`; the online npm audit reported zero known vulnerabilities at the verification point.
- The completed M5 evidence, residual limitations, lessons, and formal stop decision are recorded in [`09-v0.1-review.md`](09-v0.1-review.md).

The first implementation target is one thin vertical slice:

```text
load policy and canonical trace
        |
        v
validate and evaluate
        |
        +--> normal fixture: ALLOW
        |
        +--> network-drift fixture: HIGH / BLOCK
        |
        v
emit deterministic JSON
```

Implementation must preserve the core statement in [the problem definition](00-problem-statement.md): ARRM identifies an observed operation for which no allow rule matched. It does not prove trace completeness, effective authority, or containment.

## Program sequence: steps 1–6

### 1. Lock implementation decisions

- Use JavaScript ES modules on the Node.js 24 LTS line.
- Pin the exact development runtime in `.nvmrc`; the current workspace has Node `24.13.0` and npm `11.6.2`. Updating to a newer Node 24 patch is a separate, explicit toolchain change.
- Use strict JSON only. Reject comments, trailing commas, duplicate object keys, empty documents, and trailing non-whitespace content.
- Use JSON Schema Draft 2020-12 plus explicit semantic validation.
- Define ARRM canonical output as recursively lexicographically sorted object keys, preserved array order, two-space indentation, LF line endings, and one trailing newline.
- Treat Windows as the first exercised path platform while retaining explicit POSIX branches and tests.
- Record all dependency versions in `package-lock.json`; no floating runtime dependency resolution.

### 2. Build the offline assessment core

- Load policy and trace files with explicit byte limits.
- Parse strict JSON and report deterministic diagnostics without echoing document contents.
- Compile the five approved schemas and validate policy/trace structure.
- Apply semantic checks: unique rule/event IDs, contiguous sequence from 1, envelope agreement, platform agreement, canonical event targets, and canonical workspace root.
- Normalize policy path scopes without filesystem or network I/O.
- Match typed targets deterministically and deny by default.
- Derive findings, severity, response, evaluations, counters, and overall decision.

### 3. Add the CLI

- Implement `arrm assess POLICY.json TRACE.json [--json]`.
- Emit canonical JSON for `--json` and stable human-readable text otherwise.
- Use the documented exit-code contract from [the architecture](06-architecture.md).
- Keep prescribed decisions separate from enforcement outcomes. The CLI must never claim an action was actually blocked or terminated.

### 4. Implement fixtures and tests

- Convert all five approved behavioral scenarios into committed fixtures.
- Add malformed-input, fail-closed, normalization, matcher, precedence, and CLI tests.
- Run each deterministic assessment twice and compare bytes.
- Test Windows path behavior first and retain focused POSIX tests for shared matcher logic.

### 5. Perform the v0.1 review and stop

- Trace every definition-of-done statement to an automated test or explicit documented limitation.
- Re-run the threat model against the implementation rather than the proposed architecture.
- Verify that output language does not overstate observation or containment.
- Review dependency footprint, input limits, diagnostics, and audit-data exposure.
- Stop after direct declared-versus-observed assessment is complete; record lessons learned before expanding scope.

### 6. Consider runtime integration only afterward

- Select exactly one real execution boundary.
- Define whether its events represent proposed attempts, completed effects, or both.
- Specify how response application is reported separately from prescribed decisions.
- Research collector completeness, bypass paths, process descendants, path identity, and network-peer identity before making stronger claims.
- Do not add effective-capability graphs, AEF integration, or OS enforcement as an automatic continuation of v0.1.

## Locked technical choices

### Runtime and module format

| Choice | Decision | Rationale |
|---|---|---|
| Runtime | Node.js 24 LTS | Matches the approved JavaScript direction and the available workspace runtime. |
| Module format | ES modules (`"type": "module"`) | Native Node format with no transpilation. |
| Language | JavaScript with JSDoc at public boundaries | Keeps the trusted surface and build chain small. |
| Package manager | npm with committed lockfile | Available locally and supports reproducible dependency resolution. |
| Tests | Built-in `node:test` and `node:assert/strict` | No test-framework dependency is needed. |
| CLI parsing | Project-owned exact argument parser | The v0.1 command surface is too small to justify a CLI framework. |

Node 24 is an LTS release line according to the [official Node.js release schedule](https://nodejs.org/en/about/previous-releases). The engine range will be `>=24 <25`; CI and local development use the exact version recorded in `.nvmrc`.

### Production dependencies

| Package | Planned major | Purpose | Security/use constraint |
|---|---:|---|---|
| `ajv` | 8 | Compile and apply the Draft 2020-12 schemas | Import the Draft 2020 class, enable strict mode, and load only repository-owned schemas. |
| `ajv-formats` | 3 | Validate the event `date-time` format | Bound input/file sizes and use only the required format. |
| `jsonc-parser` | 3 | Build a JSON syntax tree so duplicate keys can be detected before value conversion | Set `disallowComments: true`, `allowTrailingComma: false`, check every parse error, and do not accept JSONC extensions. |

Ajv documents its separate [Draft 2020-12 entry point](https://ajv.js.org/json-schema.html) and external [format validation plugin](https://ajv.js.org/guide/formats). Microsoft's [`jsonc-parser`](https://www.npmjs.com/package/jsonc-parser) exposes a syntax tree and strict parse options; ARRM uses those facilities for strict JSON, despite the package name.

No YAML parser, database, logging framework, CLI framework, HTTP client, policy engine, or LLM dependency belongs in v0.1.

M1 locked exact versions rather than floating ranges: `ajv@8.20.0`, `ajv-formats@3.0.1`, and `jsonc-parser@3.3.1`. Ajv was advanced within the approved major after an advisory check identified a patched release; ARRM does not enable the affected optional `$data` mode.

### Input and output limits

Initial constants, reviewed before implementation merge:

| Input | Limit | Behavior when exceeded |
|---|---:|---|
| Policy file | 1 MiB | Input error; no assessment |
| Trace file | 64 MiB | Input error; no assessment |
| Schema files | Repository-owned only | Startup/internal error if compilation fails |

The existing schema cardinality limits remain authoritative. Before enabling `ajv-formats`, add a small maximum length to `observed_at` so format validation never receives an unbounded string.

## Proposed file layout and ownership

Files marked **M1** are required by the first thin slice. Later files must not be pulled into M1 unless a listed acceptance criterion requires them.

| File | Milestone | Responsibility |
|---|---:|---|
| `package.json` | M0 | Package metadata, `type`, `bin`, engine constraint, and scripts. |
| `package-lock.json` | M0 | Exact dependency graph. |
| `.nvmrc` | M0 | Exact Node 24 development version. |
| `.gitignore` | M0 | Ignore only generated local artifacts such as `node_modules/` and temporary output. |
| `scripts/check-schemas.js` | M0 | Reuse the runtime validator configuration to compile every repository schema in strict mode. |
| `src/constants.js` | M1 | Schema version, input limits, severity table, and decision precedence. |
| `src/errors.js` | M1 | Stable typed errors and public diagnostic codes. |
| `src/io/load-json.js` | M1 | Size-bounded UTF-8 read, strict parse, duplicate-key detection, and safe diagnostics. |
| `src/schema/create-validator.js` | M1 | Draft 2020 Ajv instance, formats, schema registration, and deterministic validation diagnostics. |
| `src/schema/validate-input.js` | M1 | Policy/trace structural validation entry points. |
| `src/policy/validate-semantics.js` | M1 | Unique rule IDs, supported thin-slice capabilities, canonical workspace root, and policy invariants. |
| `src/trace/validate-semantics.js` | M1 | Event uniqueness, contiguous sequence, envelope/platform agreement, and canonical targets. |
| `src/normalize/path.js` | M1 | Pure Windows/POSIX lexical path normalization and complete-segment subtree comparison. |
| `src/evaluate/match-target.js` | M1 | Dispatch and total matchers for filesystem read, process execution, and network origin in the thin slice. |
| `src/evaluate/evaluate-run.js` | M1 | One-pass ordered evaluation, matched rule selection, findings, counters, and overall decision. |
| `src/response/derive-response.js` | M1 | Static severity lookup and non-weaker policy response mapping. |
| `src/audit/stable-json.js` | M1 | Recursively sorted deterministic JSON serialization. |
| `src/cli.js` | M1 | Minimal `assess ... --json` vertical-slice entry point and exit codes. |
| `src/render/text.js` | M3 | Stable human-readable assessment after JSON behavior is locked. |
| `fixtures/policies/example-agent.json` | M1 | Shared policy for the normal and network-drift slice. |
| `fixtures/traces/normal-run.json` | M1 | Scenario A canonical trace. |
| `fixtures/traces/network-drift-run.json` | M1 | Scenario C canonical trace. |
| `fixtures/expected/normal-run.assessment.json` | M1 | Byte-stable `ALLOW` output. |
| `fixtures/expected/network-drift-run.assessment.json` | M1 | Byte-stable `HIGH/BLOCK` output. |
| `fixtures/traces/file-write-drift-run.json` | M4 | Scenario B trace. |
| `fixtures/traces/process-drift-run.json` | M4 | Scenario D trace. |
| `fixtures/traces/credential-drift-run.json` | M4 | Scenario E trace. |
| `tests/unit/load-json.test.js` | M1 | Strict JSON, duplicate key, encoding, size, and redaction cases. |
| `tests/unit/schema-validation.test.js` | M1 | Schema compilation and valid/invalid policy/trace contracts. |
| `tests/unit/path.test.js` | M1 | Exact/subtree/sibling-prefix and platform cases. |
| `tests/unit/match-target.test.js` | M1 | Filesystem, process tuple, and network-origin matching. |
| `tests/unit/evaluate-run.test.js` | M1 | Ordered allow/drift results, stable rule selection, counters, and precedence. |
| `tests/unit/stable-json.test.js` | M1 | Key ordering, array preservation, LF, trailing newline, and repeatability. |
| `tests/integration/assess-cli.test.js` | M1 | End-to-end normal/network fixtures, bytes, stdout/stderr, and exit codes. |
| `tests/contract/full-scenarios.test.js` | M4 | Scenarios A–E and all mandatory failure cases. |

Public functions should accept values and return values rather than reading global environment state. Only `src/cli.js` and `src/io/load-json.js` perform process/filesystem I/O.

## Test mapping

### Approved behavioral scenarios

| Design scenario | Fixture | Primary tests | Expected result | First required milestone |
|---|---|---|---|---:|
| A — declared read and test process | `normal-run.json` | matcher, evaluator, CLI | 2 observed, 2 matched, 0 drift, `ALLOW` | M1 |
| B — unauthorized filesystem write | `file-write-drift-run.json` | path, evaluator, CLI | `HIGH`, `BLOCK` | M4 |
| C — unauthorized network request | `network-drift-run.json` | network matcher, evaluator, CLI | `HIGH`, `BLOCK` | M1 |
| D — unauthorized process | `process-drift-run.json` | process matcher, evaluator, CLI | `HIGH`, `BLOCK` | M4 |
| E — credential access dominates | `credential-drift-run.json` | evaluator, precedence, CLI | credential `CRITICAL/TERMINATE`; network `HIGH/BLOCK`; overall `TERMINATE` | M4 |

### Mandatory failure and determinism mapping

| Requirement | Test location | Expected behavior |
|---|---|---|
| Malformed JSON | `load-json.test.js` | Stable input error; no assessment |
| Duplicate JSON key | `load-json.test.js` | Stable duplicate-key diagnostic with location; no assessment |
| Comments or trailing comma | `load-json.test.js` | Rejected as non-JSON |
| Unknown property/version/capability | `schema-validation.test.js` | Schema error; no assessment |
| Duplicate rule ID | `schema-validation.test.js` | Semantic policy error; no assessment |
| Duplicate event ID or sequence | `schema-validation.test.js` | Semantic trace error; no assessment |
| Sequence does not start at 1 or has a gap | `schema-validation.test.js` | Semantic trace error; no assessment |
| Trace envelope mismatch | `schema-validation.test.js` | Semantic trace error; no assessment |
| Policy/trace platform mismatch | `schema-validation.test.js` | Semantic input error; no assessment |
| Sibling path prefix | `path.test.js` | Does not match subtree |
| Process argument or shell mismatch | `match-target.test.js` | Does not match rule |
| Rule reordering | `evaluate-run.test.js` | Same decision and lexicographically stable matched rule ID |
| Valid `UNCLASSIFIED` event | `full-scenarios.test.js` | One `HIGH/BLOCK` drift finding |
| Empty valid trace | `full-scenarios.test.js` | Zero counts and `ALLOW` |
| Repeat assessment | `stable-json.test.js`, `assess-cli.test.js` | Byte-for-byte identical output |
| Sensitive value in diagnostics | `load-json.test.js`, `assess-cli.test.js` | Input content is not echoed |

## Milestones and acceptance criteria

### M0 — Reproducible scaffold — complete

Deliverables: package metadata, runtime pin, lockfile, dependency installation, scripts, and schema readiness.

Acceptance criteria:

- `npm test` invokes the built-in test runner, even if the initial test set is only smoke tests.
- `npm run check` compiles every Draft 2020-12 schema in strict mode.
- The lockfile contains only the approved dependency families and their transitive dependencies.
- Comments, trailing commas, and duplicate-key detection have a documented parser approach before input code is merged.
- The `observed_at` length bound and any resulting schema documentation changes are reviewed together.

Completion evidence: implementation commit `e0cc0ca`; `observed_at` is bounded to 64 characters and documented, all schemas compile in strict mode, and only the approved dependency families are locked.

### M1 — Thin vertical slice — complete

Deliverables: load policy and trace, evaluate scenarios A and C, and emit deterministic JSON.

Acceptance criteria:

- `arrm assess fixtures/policies/example-agent.json fixtures/traces/normal-run.json --json` emits the committed expected `ALLOW` document and exits `0`.
- The same command against `network-drift-run.json` emits one `NETWORK_EGRESS` drift finding with `HIGH/BLOCK`, overall `BLOCK`, and exits `4`.
- Each command run twice produces identical stdout bytes.
- Every event is evaluated once and remains in trace order.
- The network finding ID is derived from its event ID.
- Invalid policy, trace, or unsupported thin-slice capability produces a controlled error and no `ALLOW` conclusion.
- No code path performs DNS, live filesystem target resolution, environment interpolation, network I/O, or LLM calls.
- `npm test` passes on the pinned Node version.

M1 is not v0.1 completion. It is a reviewable proof that the architectural seams work end to end.

Completion evidence: implementation commit `e0cc0ca`; all M1 acceptance commands and 38 automated tests pass. The implementation additionally rejects non-regular input files, detects ordinary concurrent input mutation, bounds derived finding IDs through semantic validation, and rejects non-canonical DNS labels.

### M2 — Complete deterministic core

Deliverables: remaining capability matchers, `UNCLASSIFIED`, complete semantic validation, and full finding/assessment production.

Acceptance criteria:

- Every capability in `event.schema.json` has an explicit total evaluation path.
- Every declarable capability in `policy.schema.json` has a deterministic matcher.
- `UNCLASSIFIED` cannot match policy and always produces the documented result.
- Severity and response behavior exactly match the approved taxonomy and constrained policy map.
- No unexpected input state falls through to allow.

Completion evidence: shared read/write path matching, exact credential and tool matching, explicit `UNCLASSIFIED_OPERATION` findings, the complete fixed severity table, and focused semantic/evaluator/CLI coverage are implemented. M2's focused tests remain passing.

### M3 — Complete CLI and audit presentation

Deliverables: text renderer, final diagnostics, documented exit codes, and output-file behavior if explicitly approved.

Acceptance criteria:

- JSON and text output express the same counts, findings, and overall decision.
- Exit codes match `0/3/4/5/64/65/70` as documented.
- Invalid input and internal errors are distinguishable from security findings.
- `BLOCK` and `TERMINATE` are always labeled prescribed decisions, never enforcement outcomes.

Completion evidence: M3 added a pure stable text renderer, made `--json` optional, verified text/JSON assessment parity, and covered all documented exit codes. Its acceptance tests remain passing. Output-file behavior was not separately approved and remains unimplemented.

### M4 — Full fixture and hardening matrix

Deliverables: scenarios A–E, mandatory failure cases, cross-platform matcher cases, and deterministic regression tests.

Acceptance criteria:

- Every row in both test-mapping tables is automated and passing.
- Each scenario output validates against `assessment.schema.json` and each finding against `finding.schema.json`.
- Repeat-run byte equality is demonstrated for all five scenarios.
- Input limits, secret-safe diagnostics, and malformed-data behavior are covered.
- Test output contains enough evidence to reproduce each decision without exposing credential values.

Completion evidence: scenarios A–E have canonical trace/assessment fixtures, run twice with byte equality, and validate at assessment and individual-finding levels. Mandatory malformed input, duplicate identifiers, sequence/envelope failures, `UNCLASSIFIED`, empty trace, rule ordering, input limits, and secret-safe diagnostics are covered across 58 passing tests. M5 and M6 remain deferred.

### M5 — v0.1 review and stop gate

Deliverables: completed definition-of-done checklist, implementation-aware threat-model update, and lessons-learned note.

Acceptance criteria:

- All ten v0.1 definition-of-done statements are evidenced by tests or generated artifacts.
- Documentation claims match observed implementation behavior.
- Dependency and trusted-surface review finds no unplanned subsystem.
- Deferred scope remains deferred.
- The team explicitly accepts v0.1 before any collector or capability-composition work begins.

Completion evidence: [`09-v0.1-review.md`](09-v0.1-review.md) reconciles the ambiguous eleven source bullets into ten unique obligations, maps them to tests or reviewed artifacts, records the implementation-aware threat and dependency review, documents lessons, and formally accepts only the narrow offline v0.1 claim. The final suite passes 58 tests, all five schemas compile strictly, and the point-in-time npm audit reports zero known vulnerabilities.

### M6 — Runtime integration discovery

M6 is a new design gate, not an automatic implementation milestone.

Acceptance criteria to authorize later work:

- One concrete runtime boundary and its mediation limits are documented.
- Attempt/completion semantics and enforcement-outcome recording are specified.
- Collector bypass, child-process, filesystem identity, and network identity assumptions are updated in the threat model.
- The proposed integration still avoids implying that ARRM or AEF implements or depends on the external security models cited as conceptual references.

## Execution order and change discipline

1. **Complete:** implement and review M0 (`e0cc0ca`).
2. **Complete:** implement M1 as one thin vertical slice (`e0cc0ca`).
3. **Complete:** compare M1 behavior with the approved schemas and claims before broadening capability coverage.
4. **Complete:** implement and verify M2 as a focused deterministic-core change.
5. **Complete:** implement and verify M3 as a focused presentation/CLI change.
6. **Complete:** complete M4 with tests and corresponding documentation changes.
7. **Complete:** execute M5, accept the narrow offline v0.1 claim, and stop.
8. **Not authorized:** open a separate design decision for M6 only if requested.

Do not combine M1 with a real agent adapter, YAML support, persistence, OPA/Rego, a dashboard, AEF integration, or OS containment.
