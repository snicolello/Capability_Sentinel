# Codebase Structure

## Core Sections (Required)

### 1) Top-Level Map

| Path | Purpose | Evidence |
|---|---|---|
| `src/` | Executable CLI and the validation/evaluation implementation | `src/cli.js`; `docs/06-architecture.md` |
| `schemas/` | Normative policy, event, trace, finding, and assessment JSON Schemas | `docs/03-event-model.md`; `scripts/check-schemas.js` |
| `fixtures/` | Example policy, five input traces, and canonical expected assessments | `docs/05-test-scenarios.md`; `fixtures/policies/example-agent.json` |
| `tests/unit/` | Focused tests of pure modules and input loading | `tests/unit/evaluate-run.test.js`; `tests/unit/load-json.test.js` |
| `tests/integration/` | End-to-end CLI behavior and exit-code tests | `tests/integration/assess-cli.test.js` |
| `tests/contract/` | Full accepted scenario and malformed-input contract | `tests/contract/full-scenarios.test.js` |
| `scripts/` | Repository maintenance command for strict schema compilation | `scripts/check-schemas.js` |
| `docs/` | Security model, architecture, milestone state, acceptance evidence, and handoff | `README.md`; `docs/CONTEXT_HANDOFF.md` |
| `package.json` | Runtime, executable, dependency, and command declaration | `package.json` |
| `.nvmrc` | Exact development Node version | `.nvmrc` |

`node_modules/` is generated dependency output and is not part of the source layout.

### 2) Entry Points

- Main runtime entry: `src/cli.js`.
- Secondary entry point: `scripts/check-schemas.js` for repository schema verification; there are no workers or background jobs.
- Entry selection: the `arrm` executable maps to `src/cli.js` through `package.json`; `npm.cmd run check` maps to `scripts/check-schemas.js`.

### 3) Module Boundaries

| Boundary | What belongs here | What must not be here | Evidence |
|---|---|---|---|
| `src/io/` | Bounded regular-file reads and strict JSON parsing | Policy decisions or live target resolution | `src/io/load-json.js`; `docs/06-architecture.md` |
| `src/schema/`, `src/policy/`, `src/trace/` | Structural and semantic input validation | Silent coercion into an allow result | `src/schema/validate-input.js`; `src/policy/validate-semantics.js`; `src/trace/validate-semantics.js` |
| `src/normalize/` | Pure lexical path normalization and scope comparison | Filesystem lookup, symlink resolution, or network I/O | `src/normalize/path.js`; `docs/00-problem-statement.md` |
| `src/evaluate/`, `src/response/` | Total target matching, event evaluation, severity, and response derivation | Process/filesystem I/O, wall-clock state, randomness, or enforcement | `src/evaluate/evaluate-run.js`; `src/response/derive-response.js`; `docs/06-architecture.md` |
| `src/audit/`, `src/render/` | Deterministic JSON and text presentation | Persistent storage or policy decisions | `src/audit/stable-json.js`; `src/render/text.js` |
| `src/cli.js` | Argument parsing and orchestration of the modules | Runtime collection or a claim that prescribed decisions were enforced | `src/cli.js`; `README.md` |

### 4) Naming and Organization Rules

- File naming pattern: lower-case kebab-case for multiword JavaScript files, for example `load-json.js`, `match-target.js`, and `stable-json.js`.
- Directory organization pattern: technical layer/responsibility rather than product feature.
- Import conventions: relative paths with explicit `.js` extensions; JSON Schemas use native JSON module imports in `src/schema/create-validator.js`.
- Test naming: lower-case kebab-case with `.test.js`, split under `unit`, `integration`, and `contract` directories.

### 5) Evidence

- `docs/codebase/.codebase-scan.txt`
- `package.json`
- `src/cli.js`
- `src/schema/create-validator.js`
- `src/evaluate/evaluate-run.js`
- `tests/integration/assess-cli.test.js`
