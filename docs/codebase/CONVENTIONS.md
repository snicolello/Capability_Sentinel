# Coding Conventions

## Core Sections (Required)

### 1) Naming Rules

| Item | Rule | Example | Evidence |
|---|---|---|---|
| Files | Lower-case kebab-case; tests end in `.test.js` | `validate-input.js`, `evaluate-run.test.js` | `src/schema/validate-input.js`; `tests/unit/evaluate-run.test.js` |
| Functions/methods | lower camelCase; exported operations are named exports | `validateTraceSemantics`, `higherDecision` | `src/trace/validate-semantics.js`; `src/response/derive-response.js` |
| Types/interfaces | No TypeScript types or interfaces; error classes use PascalCase | `ArrmError`, `InputError`, `UsageError` | `src/errors.js` |
| Constants/env vars | Exported constants use upper snake case; internal constants use lower camelCase | `INPUT_LIMITS`, `supported` | `src/constants.js`; `src/policy/validate-semantics.js` |

### 2) Formatting and Linting

- Formatter: [TODO] None configured.
- Linter: [TODO] None configured.
- Observed source style: two-space indentation, single-quoted strings, semicolons, trailing commas in multiline structures, and braces for control flow.
- Enforced rules: [TODO] No tool-enforced style rules exist; the observed style is conventional rather than mechanically enforced.
- Run commands: `npm.cmd test` and `npm.cmd run check` validate behavior/contracts, not formatting.

### 3) Import and Module Conventions

- Node built-ins are imported with the `node:` prefix, followed by package imports and then relative project imports where all groups are needed (`src/io/load-json.js`).
- Project imports are relative and include the `.js` extension; no path aliases or barrel modules exist (`src/cli.js`).
- Public functions/constants/classes use direct named exports rather than a central export index (`src/constants.js`, `src/errors.js`).
- Repository schemas are statically imported with `{ type: 'json' }` in `src/schema/create-validator.js`.

### 4) Error and Logging Conventions

- Input/usage failures throw `InputError` or `UsageError`, both derived from `ArrmError`; the CLI converts these to stable `ARRM_ERROR <CODE>` diagnostics and documented exit codes (`src/errors.js`, `src/cli.js`).
- Unexpected exceptions produce a generic internal-error diagnostic and no assessment conclusion (`src/cli.js`).
- There is no logging framework. Successful results go to stdout and diagnostics go to stderr; `scripts/check-schemas.js` alone uses `console.log` for its maintenance result.
- Syntax diagnostics contain only a category and source location, not input content. Tests verify that malformed credential values do not enter diagnostics or assessment output (`src/io/load-json.js`, `tests/contract/full-scenarios.test.js`).
- Valid assessments intentionally include typed target metadata, including credential identifiers; consumers must treat assessment output as potentially sensitive (`docs/09-v0.1-review.md`).

### 5) Testing Conventions

- Tests live under `tests/unit`, `tests/integration`, or `tests/contract` and use the `*.test.js` suffix.
- Unit tests call modules directly. Integration/contract tests spawn the CLI synchronously and use temporary directories/files for isolation (`tests/integration/assess-cli.test.js`, `tests/contract/full-scenarios.test.js`).
- Assertions use `node:assert/strict`; external services are not mocked because the production CLI performs no network/database calls.
- Coverage expectation: [TODO] No coverage tool or threshold is configured.

### 6) Evidence

- `package.json`
- `src/cli.js`
- `src/io/load-json.js`
- `src/errors.js`
- `src/schema/create-validator.js`
- `tests/integration/assess-cli.test.js`
- `docs/codebase/.codebase-scan.txt`

