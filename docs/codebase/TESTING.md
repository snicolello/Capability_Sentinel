# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: Node.js built-in test runner from Node 24.13.0.
- Assertion/mocking tools: `node:assert/strict`; no third-party mocking library.
- Current verification on 2026-09-04: 58 tests passed, zero failed; all five schemas compiled in Ajv strict mode.

```powershell
npm.cmd test
node --test tests/unit
node --test tests/integration tests/contract
npm.cmd run check
# [TODO] No coverage command is configured.
```

### 2) Test Layout

- Tests are centralized under `tests/` and split into `unit/`, `integration/`, and `contract/`.
- Naming convention: lower-case kebab-case with `.test.js`.
- Setup files: none. Each file imports its own dependencies and constructs local fixtures or temporary directories as needed.
- Committed data fixtures live under `fixtures/policies`, `fixtures/traces`, and `fixtures/expected`.

### 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|---|---|---|---|
| Unit | Yes | Loader/parser, schema and semantic validation, path normalization, target matching, evaluator, deterministic rendering | Direct calls with Node assertions; files are isolated with temporary directories where needed. |
| Integration | Yes | CLI arguments, stdout/stderr, exit codes, JSON/text parity, malformed input | Spawns `node src/cli.js` against committed and temporary inputs. |
| Contract | Yes | Scenarios A-E, byte equality, schema validity, malformed/semantic failure matrix, credential redaction | Runs the CLI twice per accepted scenario and compares output with committed expected JSON. |
| E2E against a real runtime/collector | No | [TODO] Not in v0.1 scope | No collector, agent runtime, enforcement adapter, network service, or database exists. |

### 4) Mocking and Isolation Strategy

- Main approach: pure modules receive ordinary JavaScript values; tests create altered policy/trace objects rather than patching globals.
- CLI isolation: integration and contract tests use `spawnSync`, committed fixtures, and per-test temporary directories/files; cleanup runs through Node filesystem APIs.
- Injected process I/O: the internal-error test passes a small `io` object to exported `main` to simulate an output failure without replacing global process state (`tests/integration/assess-cli.test.js`).
- Common failure mode: schema-valid-looking test data can still fail semantic canonicalization or envelope checks; suites deliberately separate structural, semantic, and evaluator cases (`tests/unit/schema-validation.test.js`).

### 5) Coverage and Quality Signals

- Coverage tool + threshold: [TODO] None configured.
- Current reported coverage: [TODO] No coverage report exists.
- Quality signals: deterministic byte comparisons; schema validation of every full assessment and finding; explicit exit-code assertions; secret-safe diagnostics; all capability matchers and fail-closed paths represented in tests (`tests/contract/full-scenarios.test.js`, `tests/integration/assess-cli.test.js`).
- Known gaps: real collector/runtime behavior, enforcement outcomes, hostile filesystem semantics, and performance/load behavior are untested because they are deferred or absent (`docs/07-deferred-scope.md`, `docs/08-open-questions.md`).

### 6) Evidence

- `package.json`
- `tests/unit/evaluate-run.test.js`
- `tests/unit/schema-validation.test.js`
- `tests/integration/assess-cli.test.js`
- `tests/contract/full-scenarios.test.js`
- `fixtures/expected/normal-run.assessment.json`
- `scripts/check-schemas.js`
- `docs/09-v0.1-review.md`

