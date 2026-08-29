# Agent Runtime Risk Monitor — Current Handoff

## Current objective and stop gate

ARRM M0 and M1 are complete in implementation commit `e0cc0ca` (`feat: implement deterministic ARRM M1 slice`). The repository now contains a deterministic offline assessor for the approved thin vertical slice:

```text
load strict policy and canonical trace
→ validate structure and semantics
→ evaluate FILESYSTEM_READ, PROCESS_EXEC, and NETWORK_EGRESS
→ emit canonical deterministic JSON
```

Do not automatically broaden the implementation. M2 is the next planned milestone, but it requires explicit user authorization. A real collector, enforcement integration, effective-capability graph, dashboard, persistence, YAML, AEF integration, and other deferred subsystems remain out of scope.

## Repository state at this handoff

- Repository: `C:\dev\Capability_Sentinel`
- Branch: `main`
- Approved design commit: `b1e20dc` — `docs: define ARRM v0.1 security model`
- M0/M1 implementation commit: `e0cc0ca` — `feat: implement deterministic ARRM M1 slice`
- Planning and handoff documents now live under `docs/`.
- The documentation relocation/progress refresh is committed after `e0cc0ca`; use `git log -2 --oneline` for the exact latest commit.
- Inspect `git status` before editing and preserve any later user work.

## Completed implementation

### M0 — reproducible scaffold

- Node `24.13.0` is pinned in `.nvmrc`; the engine range is `>=24 <25`.
- npm scripts use the built-in Node test runner and a strict schema compilation check.
- Exact production dependencies are locked:
  - `ajv@8.20.0`
  - `ajv-formats@3.0.1`
  - `jsonc-parser@3.3.1`
- The online npm audit reported zero known vulnerabilities after Ajv was updated within the approved major.
- `observed_at` is bounded to 64 characters and documented.
- `assessment.schema.json` received behavior-preserving local property declarations required by Ajv strict mode.

### M1 — thin vertical slice

- Policy files are limited to 1 MiB and trace files to 64 MiB.
- The loader requires regular UTF-8 files and rejects BOMs, invalid UTF-8, empty documents, comments, trailing commas, trailing content, and duplicate keys.
- Loader diagnostics do not echo document content; input changes detected during reading fail safely.
- Policy and trace schemas are compiled with Ajv Draft 2020-12 strict mode and `date-time` validation.
- Semantic checks cover duplicate IDs, contiguous sequence from 1, trace-envelope agreement, policy/trace agent and platform agreement, canonical paths, canonical DNS labels, supported M1 capabilities, and derived finding-ID length.
- Windows and POSIX lexical path behavior is pure and performs no live target resolution.
- Filesystem subtree matching uses complete path segments; process and network matches use exact typed tuples.
- Matching rule selection is lexicographically stable regardless of policy rule order.
- Every accepted event is evaluated exactly once in trace order.
- Unmatched events create deterministic `CAPABILITY_DRIFT` findings and use fixed severity/response precedence.
- Canonical JSON recursively sorts object keys, preserves array order, uses two-space indentation and LF, and ends with one newline.
- The M1 CLI is `arrm assess POLICY.json TRACE.json --json`.
- Schema-valid capabilities outside `FILESYSTEM_READ`, `PROCESS_EXEC`, and `NETWORK_EGRESS` are controlled input errors in M1; they never produce `ALLOW`.

## Committed fixtures and verified behavior

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run check
node src/cli.js assess fixtures/policies/example-agent.json fixtures/traces/normal-run.json --json
node src/cli.js assess fixtures/policies/example-agent.json fixtures/traces/network-drift-run.json --json
```

Verification baseline at handoff:

- 38 automated tests pass.
- All five schemas compile in strict Draft 2020-12 mode.
- Normal fixture: 2 observed, 2 matched, 0 drift, overall `ALLOW`, exit `0`.
- Network-drift fixture: one derived `NETWORK_EGRESS`, `HIGH/BLOCK` finding, overall `BLOCK`, exit `4`.
- Both commands are byte-identical across repeated runs and match committed expected JSON.
- Malformed or unsupported policy/trace data exits `65`, writes no assessment to stdout, and never prints an `ALLOW` conclusion.
- Invalid command usage exits `64`; unexpected internal errors exit `70` with no security conclusion.

## Authoritative documents

Read these before further implementation:

1. [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) — current milestone status, execution order, dependencies, test mapping, and acceptance gates.
2. [`00-problem-statement.md`](00-problem-statement.md) — exact claim and non-guarantees.
3. [`01-threat-model.md`](01-threat-model.md) — trust boundary and failure modes.
4. [`02-capability-taxonomy.md`](02-capability-taxonomy.md) — capabilities and severity defaults.
5. [`03-event-model.md`](03-event-model.md) — canonical event/finding/assessment rules.
6. [`04-policy-model.md`](04-policy-model.md) — deterministic match semantics.
7. [`05-test-scenarios.md`](05-test-scenarios.md) — five behavioral scenarios and mandatory failures.
8. [`06-architecture.md`](06-architecture.md) — module boundaries and CLI exit codes.
9. [`07-deferred-scope.md`](07-deferred-scope.md) — explicit guardrail.
10. [`08-open-questions.md`](08-open-questions.md) — unresolved assumptions.
11. [`../schemas/`](../schemas/) — normative machine-readable contracts.

## Locked interpretation

- **Declared authority:** operations the policy author intends to allow.
- **Observed operation:** a structured event attributed by a trusted collector.
- **Effective authority:** all reachable operations, exercised or not; deferred.
- `CAPABILITY_DRIFT` means no matching allow rule existed for the observed operation.
- A valid, complete, correctly attributed trace remains an explicit assumption.
- `BLOCK` and `TERMINATE` are prescribed decisions in the offline CLI, not proof of containment.
- The core remains deterministic, deny by default, external-I/O-free during evaluation, and uses no LLM for decisions.
- ARRM draws on concepts from cited external models; neither ARRM nor AEF implements or depends on those models or frameworks.

## Next planned milestone if explicitly authorized

M2 completes the deterministic core without adding runtime integration:

1. Add explicit total evaluation paths for `FILESYSTEM_WRITE`, `CREDENTIAL_READ`, `TOOL_INVOKE`, and `UNCLASSIFIED`.
2. Allow every declarable policy capability through semantic validation once its matcher is implemented.
3. Make valid `UNCLASSIFIED` events always produce the documented `HIGH/BLOCK` result and remain impossible to declare in policy.
4. Extend severity/response coverage to the complete approved taxonomy.
5. Add focused unit and schema tests for every new total path and ensure no unexpected state falls through to allow.
6. Keep M3 presentation work, M4 full fixture matrix, M5 review, and M6 runtime discovery separate.

Do not treat M2 authorization as permission to add full scenarios B, D, and E automatically where the plan assigns them to M4, or to add a collector, enforcement, YAML, persistence, AEF integration, capability composition, or OS controls.

## Suggested fresh-chat prompt

> Resume ARRM work in `C:\dev\Capability_Sentinel`.
>
> Read `docs/CONTEXT_HANDOFF.md`, then `docs/IMPLEMENTATION_PLAN.md`, the authoritative design documents, and the schemas. Inspect `git status` and preserve existing work.
>
> M0 and M1 are complete at implementation commit `e0cc0ca`. Do not repeat them. Ask for or confirm explicit authorization before beginning M2, and do not add runtime collection, enforcement, YAML, persistence, dashboards, AEF integration, capability composition, or other deferred scope.

## Stop conditions

Stop and ask for direction if:

- M2 or any later milestone has not been explicitly authorized;
- a required change would weaken an approved schema or security invariant;
- completing a matcher would require runtime target resolution, a collector, or another deferred subsystem;
- the installed Node major must change or a new dependency family is proposed;
- existing user changes overlap the next milestone in a way that cannot be preserved.
