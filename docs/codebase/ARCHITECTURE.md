# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: a layered, deterministic offline CLI pipeline with functional-core/imperative-shell separation.
- Why this classification: `src/cli.js` owns command/process orchestration and `src/io/load-json.js` owns input I/O, while normalization, matching, evaluation, response mapping, serialization, and rendering accept values and return values without application-directed external I/O.
- Primary constraints:
  - Assessment is deny-by-default and must never convert malformed, unknown, or unsupported state into `ALLOW`.
  - A decision is not enforcement; `BLOCK` and `TERMINATE` are prescribed outcomes only.
  - Identical valid inputs must produce identical ordered results without time, randomness, DNS, live target resolution, environment interpolation, network access, or an LLM.

### 2) System Flow

```text
CLI paths -> bounded strict JSON load -> structural + semantic validation
          -> lexical scope normalization + typed target matching
          -> ordered evaluation + severity/response derivation
          -> assessment schema check -> stable JSON or text -> stdout
```

1. `src/cli.js` accepts `assess POLICY.json TRACE.json [--json]` and passes each path to `loadJsonFile` with separate byte limits.
2. `src/io/load-json.js` verifies a regular file, bounds and reads it, rejects invalid UTF-8/non-strict JSON/duplicate keys, and detects ordinary size or modification-time change during the read.
3. `src/schema/validate-input.js`, `src/policy/validate-semantics.js`, and `src/trace/validate-semantics.js` validate structures, identifiers, event order, envelope agreement, platform agreement, and canonical typed targets.
4. `src/evaluate/evaluate-run.js` evaluates each event in trace order; `src/evaluate/match-target.js` applies the capability-specific matcher and selects the lexicographically smallest matching rule ID.
5. Unmatched events pass through `src/response/derive-response.js`; the completed assessment is schema-checked, deterministically rendered, and emitted by `src/cli.js`.

### 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|---|---|---|---|
| CLI shell | Arguments, orchestration, process output, and exit codes | Collection, persistence, or enforcement | `src/cli.js`; `docs/06-architecture.md` |
| Input boundary | Regular-file checks, byte limits, UTF-8, strict JSON, duplicate keys | Rule matching or target resolution | `src/io/load-json.js` |
| Contract boundary | Five Draft 2020-12 schemas plus semantic invariants | Permissive coercion or business-intent inference | `src/schema/create-validator.js`; `src/policy/validate-semantics.js`; `src/trace/validate-semantics.js` |
| Pure decision core | Lexical normalization, typed matching, event evaluation, severity, response precedence | External I/O, runtime mediation, or probabilistic decisions | `src/normalize/path.js`; `src/evaluate/`; `src/response/` |
| Presentation | Stable JSON and human-readable text | Altering assessment meaning | `src/audit/stable-json.js`; `src/render/text.js` |

### 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---|---|---|
| Validation pipeline | `src/schema/validate-input.js`, `src/policy/validate-semantics.js`, `src/trace/validate-semantics.js` | Separates schema shape from invariants such as unique IDs and contiguous sequence. |
| Capability strategy/dispatcher | `src/evaluate/match-target.js` | Gives each supported capability an explicit total matcher; `UNCLASSIFIED` cannot match. |
| Fail-closed typed errors | `src/errors.js`, `src/cli.js` | Keeps usage/input/internal failures distinct from valid security assessments. |
| Deterministic canonicalization | `src/audit/stable-json.js`, `src/evaluate/evaluate-run.js` | Stabilizes object-key ordering, event order, and selected rule IDs for reproducible audit evidence. |
| Lazy validator singleton | `src/schema/validate-input.js` | Reuses one compiled Ajv instance within a process. |

### 5) Known Architectural Risks

- Correctness depends on trusted policy and trace attribution/completeness; no collector or provenance mechanism is implemented (`docs/01-threat-model.md`, `docs/09-v0.1-review.md`).
- Typed target matching is lexical and direct: it does not establish filesystem object identity, ultimate network peer identity, descendant process effects, or tool-internal effects (`docs/09-v0.1-review.md`).
- Evaluation filters all policy rules for every event, so worst-case work grows with event count times rule count; schemas currently permit 100,000 events and 10,000 rules (`src/evaluate/evaluate-run.js`, `schemas/trace.schema.json`, `schemas/policy.schema.json`).

### 6) Evidence

- `src/cli.js`
- `src/io/load-json.js`
- `src/schema/validate-input.js`
- `src/evaluate/evaluate-run.js`
- `src/evaluate/match-target.js`
- `docs/06-architecture.md`
- `docs/09-v0.1-review.md`
