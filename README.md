# Agent Runtime Risk Monitor

Agent Runtime Risk Monitor (ARRM) is a small, learning-oriented proof of concept for comparing an agent's declared authority with structured operations observed at runtime.

The narrow v0.1 question is:

> Does this trusted runtime trace contain an operation for which the policy has no matching allow rule?

ARRM is a conformance monitor, not a sandbox. It does not infer every capability available to an agent, prove trace completeness, or contain an agent that can bypass the monitored execution wrapper.

## Current status

ARRM v0.1 is accepted at the M5 stop gate. The repository contains a reproducible, deterministic offline assessor for all seven observable capability classes and all six declarable policy capabilities. All five approved scenarios, the malformed-input matrix, deterministic JSON and text presentation, and the documented exit-code contract are automated.

This acceptance remains deliberately narrow: ARRM compares a trusted policy with a valid, ordered, trusted trace. It is not a collector, sandbox, enforcement point, effective-authority analyzer, or proof of complete runtime visibility. Runtime-integration discovery is an unstarted M6 design gate that requires separate authorization.

The v0.1 design and acceptance record are organized as ten reviewable artifacts:

1. [Problem statement](docs/00-problem-statement.md)
2. [Threat model](docs/01-threat-model.md)
3. [Capability taxonomy](docs/02-capability-taxonomy.md)
4. [Event and finding model](docs/03-event-model.md)
5. [Policy model](docs/04-policy-model.md)
6. [Deterministic test scenarios](docs/05-test-scenarios.md)
7. [Architecture](docs/06-architecture.md)
8. [Deferred scope](docs/07-deferred-scope.md)
9. [Open security questions](docs/08-open-questions.md)
10. [v0.1 review and acceptance](docs/09-v0.1-review.md)

Machine-readable design contracts live in [`schemas/`](schemas/). The design draws on concepts from established security models and standards summarized in [references](docs/references.md); it does not claim to implement or depend on those systems.

ARRM remains conceptually separate from the Agent Execution Framework (AEF). Nothing in this repository asserts that AEF implements or depends on the external models cited here.

## Assessment command

```text
arrm assess POLICY.json TRACE.json --json
```

Install the pinned dependencies and run the committed fixtures with:

```powershell
npm.cmd ci
npm.cmd test
node src/cli.js assess fixtures/policies/example-agent.json fixtures/traces/normal-run.json --json
```

The command validates a policy and canonical trace, normalizes policy scopes, evaluates every v0.1 event class with deny-by-default allow rules, and emits canonical JSON. Omitting `--json` emits stable human-readable text. A `BLOCK` or `TERMINATE` result is a prescribed response, not proof that containment occurred.

Implementation remains bounded by the [`IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md), with the M5 evidence and formal stop decision in the [v0.1 review](docs/09-v0.1-review.md). Collectors, enforcement, YAML, persistence, dashboards, AEF integration, and capability composition remain deferred.
