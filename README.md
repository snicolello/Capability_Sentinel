# Agent Runtime Risk Monitor

Agent Runtime Risk Monitor (ARRM) is a small, learning-oriented proof of concept for comparing an agent's declared authority with structured operations observed at runtime.

The narrow v0.1 question is:

> Does this trusted runtime trace contain an operation for which the policy has no matching allow rule?

ARRM is a conformance monitor, not a sandbox. It does not infer every capability available to an agent, prove trace completeness, or contain an agent that can bypass the monitored execution wrapper.

## Current status

The approved design package is complete. Milestones M0 and M1 now provide a reproducible Node.js scaffold and a thin offline assessment slice for declared repository reads/process execution and unauthorized network egress. This is not yet the complete v0.1 capability or scenario matrix.

The v0.1 design is organized as nine reviewable artifacts:

1. [Problem statement](docs/00-problem-statement.md)
2. [Threat model](docs/01-threat-model.md)
3. [Capability taxonomy](docs/02-capability-taxonomy.md)
4. [Event and finding model](docs/03-event-model.md)
5. [Policy model](docs/04-policy-model.md)
6. [Deterministic test scenarios](docs/05-test-scenarios.md)
7. [Architecture](docs/06-architecture.md)
8. [Deferred scope](docs/07-deferred-scope.md)
9. [Open security questions](docs/08-open-questions.md)

Machine-readable design contracts live in [`schemas/`](schemas/). The design draws on concepts from established security models and standards summarized in [references](docs/references.md); it does not claim to implement or depend on those systems.

ARRM remains conceptually separate from the Agent Execution Framework (AEF). Nothing in this repository asserts that AEF implements or depends on the external models cited here.

## M1 command

```text
arrm assess POLICY.json TRACE.json --json
```

Install the pinned dependencies and run the committed fixtures with:

```powershell
npm.cmd ci
npm.cmd test
node src/cli.js assess fixtures/policies/example-agent.json fixtures/traces/normal-run.json --json
```

The M1 command validates a policy and canonical trace, normalizes policy scopes, evaluates the supported event classes with deny-by-default allow rules, and emits canonical JSON. A `BLOCK` or `TERMINATE` result from this offline command is a prescribed response, not proof that containment occurred. Schema-valid capabilities outside the M1 slice fail as unsupported input and never produce an `ALLOW` assessment.

Implementation remains bounded by the [`IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md), with current continuation state recorded in [`CONTEXT_HANDOFF.md`](docs/CONTEXT_HANDOFF.md). Collectors, enforcement, YAML, persistence, dashboards, AEF integration, and capability composition remain deferred.
