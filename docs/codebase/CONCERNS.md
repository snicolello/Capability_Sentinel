# Codebase Concerns

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|---|---|---|---|---|
| High | Policy, trace completeness/attribution, collector, evaluator, and output channel are trusted; collector/provenance controls are absent | `docs/01-threat-model.md`; `docs/09-v0.1-review.md` | Missing or forged events can yield an assessment that is correct for supplied data but wrong about real activity | Keep the v0.1 claim narrow; require a separately authorized M6 design gate before integration claims |
| High | `BLOCK`/`TERMINATE` are decisions, not enforcement | `src/render/text.js`; `README.md`; `docs/06-architecture.md` | Consumers could mistakenly treat post-hoc output as containment | Preserve prescribed-decision wording and design a pre-effect enforcement boundary before stronger claims |
| Medium | Valid assessment output exposes typed target metadata | `src/evaluate/evaluate-run.js`; `src/render/text.js`; `docs/09-v0.1-review.md` | Paths, arguments, hosts, tool names, and credential identifiers can leak through captured logs | Classify/protect stdout and define redaction requirements before persistent export |
| Medium | Evaluation complexity is events multiplied by policy rules | `src/evaluate/evaluate-run.js`; `schemas/trace.schema.json`; `schemas/policy.schema.json` | At schema maxima (100,000 events and 10,000 rules), CPU/memory use may be impractical | Benchmark representative upper bounds before accepting untrusted or large runtime traces |

### 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|---|---|---|---|---|
| No formatter or linter | The proof of concept kept tooling/dependencies minimal | `package.json`; `docs/codebase/.codebase-scan.txt` | Style drift and preventable static mistakes as the codebase grows | [ASK USER] Decide whether future work justifies a zero/minimal-dependency lint/format standard |
| No coverage measurement | Acceptance relies on behavior/contract tests rather than a coverage gate | `package.json`; `tests/` | Untested branches may become less visible as scope grows | Add coverage reporting only with an explicit, evidence-based threshold |
| Loader mutation detection is not adversarial integrity | It compares size and modification time around a single-handle read | `src/io/load-json.js`; `docs/09-v0.1-review.md` | Hostile same-size/same-time replacement or filesystem behavior is not proven safe | Specify provenance/signature/locking requirements at the M6 gate |
| Validator is process-global after first use | A lazy singleton keeps compiled schemas cached | `src/schema/validate-input.js` | Low in the current immutable-schema CLI; would complicate dynamic schemas or multitenant policy versions | Keep schemas static in v0.1; revisit only if requirements change |

### 3) Security Concerns

| Risk | OWASP category (if applicable) | Evidence | Current mitigation | Gap |
|---|---|---|---|---|
| Incomplete/untrusted telemetry | N/A | `docs/01-threat-model.md`; `docs/08-open-questions.md` | Trust assumption is explicit; sequence/envelope invariants catch some malformed traces | No collector, signature, completeness proof, or bypass resistance |
| Lexical path and origin identity mismatch | A01 (related access-control risk) | `src/normalize/path.js`; `src/evaluate/match-target.js`; `docs/01-threat-model.md` | Canonical strings, full path segments, exact network origin tuples | No symlink/junction/object identity, DNS/redirect/proxy, or TOCTOU resolution |
| Allowed launcher/tool can have broader effects | A01 | `src/evaluate/match-target.js`; `docs/02-capability-taxonomy.md` | Exact process tuples and exact tool names | Descendants and tool-internal effects are outside the model |
| Sensitive metadata in audit output | A09 (related logging exposure) | `src/render/text.js`; `docs/09-v0.1-review.md` | Secret values are structurally excluded; diagnostics avoid input content | Valid target identifiers remain visible; no redacted output mode or protected sink |
| Dependency advisories can change after review | A06 | `package-lock.json`; `docs/09-v0.1-review.md` | Exact versions and a point-in-time zero-advisory audit at M5 | No automated dependency/security pipeline is configured |

### 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---|---|---|---|---|
| Nested event/rule matching | `src/evaluate/evaluate-run.js`; schema maxima in `schemas/trace.schema.json` and `schemas/policy.schema.json` | No benchmark or reported current failure | Worst-case comparisons scale as `events × rules`; the complete assessment is retained in memory | Add representative benchmarks, then index rules by capability/target only if evidence shows need |
| Multiple in-memory representations of large input/output | `src/io/load-json.js`; `src/audit/stable-json.js`; `src/evaluate/evaluate-run.js` | None documented | A valid 64 MiB trace can exist as bytes, parsed objects, validation data, assessment objects, and serialized text | Measure peak memory before accepting large automated workloads; consider streaming only if it preserves determinism/contracts |

### 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|---|---|---|---|
| `docs/IMPLEMENTATION_PLAN.md`, `docs/CONTEXT_HANDOFF.md` | They encode scope and stop-gate state used by future agents | Five changes each in the last 90 days (`docs/codebase/.codebase-scan.txt`) | Update together with implementation/acceptance evidence; do not silently authorize M6 |
| `tests/unit/schema-validation.test.js` | It protects the structural/semantic boundary | Four changes in the last 90 days | Change schemas and semantic tests in the same reviewable unit |
| `tests/integration/assess-cli.test.js` | It locks public output and exit-code behavior | Four changes in the last 90 days | Preserve stdout/stderr separation and assert exact exit semantics |
| `src/cli.js`, `src/evaluate/evaluate-run.js` | They connect most core boundaries and security conclusions | Two changes each in the last 90 days | Run all unit, integration, contract, and schema checks after edits |

No production TODO/FIXME/HACK markers were found, and no production JavaScript file exceeds 500 lines (`docs/codebase/.codebase-scan.txt`; terminal file-line inventory on 2026-09-04).

### 6) `[ASK USER]` Questions

1. [ASK USER] Should Capability Sentinel remain stopped at the accepted offline v0.1 gate, or is a separate M6 runtime-integration discovery phase now authorized?
2. [ASK USER] If M6 is authorized later, which concrete agent runtime/tool gateway must be investigated first, and can it mediate every operation that would be in scope?
3. [ASK USER] Must future assessment output support a redacted mode or protected persistent sink before it can be used outside local development?
4. [ASK USER] Is adding formatter/linter and coverage tooling desirable before any post-v0.1 implementation, or should the dependency-minimal posture remain authoritative?

### 7) Evidence

- `docs/codebase/.codebase-scan.txt`
- `docs/01-threat-model.md`
- `docs/07-deferred-scope.md`
- `docs/08-open-questions.md`
- `docs/09-v0.1-review.md`
- `src/io/load-json.js`
- `src/evaluate/evaluate-run.js`
- `src/render/text.js`
- `schemas/policy.schema.json`
- `schemas/trace.schema.json`
