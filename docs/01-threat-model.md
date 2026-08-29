# Threat model lite

## Scope

The system under analysis is one local agent run observed through an execution wrapper or tool gateway. The v0.1 CLI assesses a previously captured trace. A future in-process adapter may query the same evaluator before performing an operation, but kernel-level containment is out of scope.

## Assets

- Integrity and availability of the policy.
- Completeness, ordering, attribution, and integrity of trace events.
- Correctness and determinism of policy decisions.
- Integrity of findings and audit output.
- Host files, processes, network destinations, credentials, and tools named by policy.
- Confidentiality of sensitive target names and event data in logs.

## Actors and trust

| Actor or component | Trust in v0.1 |
|---|---|
| Policy author | Trusted to express intended authority; may make mistakes. |
| Agent and agent-generated input | Untrusted; may be buggy or deliberately evasive. |
| Collector/execution wrapper | Trusted for mediation, classification, attribution, and event order. |
| Normalizer, validator, evaluator | Trusted computing base. |
| Invoked process, tool, proxy, or service | Untrusted beyond the specific declared invocation. |
| Audit consumer | Trusted to interpret prescribed responses as decisions, not proof of enforcement. |

The collector is the largest assumption. If the agent can act outside it, ARRM can have false negatives without knowing that telemetry is missing.

## Trust boundaries

```text
Untrusted agent input
        |
        v
[collector / wrapper] -----> operating system, tool, or service
        |                         (effects may exceed visibility)
        v
 structured trace
        |
        v
[schema + normalizer] <----- policy file from trusted author
        |
        v
[deterministic evaluator] -----> prescribed decision
        |
        v
[audit writer] -------------> audit consumer
```

An enforcement point would have to sit before the effect-producing call. Post-hoc trace assessment cannot retroactively block an operation.

## Threats and v0.1 treatment

| Threat | Consequence | v0.1 treatment | Residual limitation |
|---|---|---|---|
| Bypass collector | Undeclared action is invisible | State mediation assumption prominently; adapters emit structured events | No bypass resistance |
| Drop, forge, reorder, or misattribute events | Incorrect assessment | Require run/agent IDs and monotonic sequence; reject duplicates/gaps by semantic validation | No cryptographic provenance |
| Ambiguous shell command parsing | Rule bypass or false match | Match executable and argument array; never split a command string in the core | Invoked program may interpret arguments unexpectedly |
| Path traversal or prefix confusion | Out-of-scope file matches | Normalize separators and dot segments; compare whole path segments; use exact or subtree scopes only | Symlinks, junctions, mounts, case rules, and TOCTOU remain |
| Process indirection | Allowed launcher starts undeclared child | Declare only the direct invocation as observed; document descendants as unobserved unless separately collected | No inherited monitoring guarantee |
| DNS, proxy, redirect, or URL confusion | Actual network peer differs from declared host | Match canonical scheme/host/port of each reported request | Ultimate connection and redirect chain may be invisible |
| Secret material in telemetry | Audit log leaks credentials | Record credential identifiers, never values; raw payloads are outside canonical events | Target names may still be sensitive |
| Overbroad allow rules | Harmful operation is declared | No wildcard hosts or arbitrary globs in v0.1; exact targets and path subtrees only | Policy quality remains a human responsibility |
| Malformed/unknown input | Authority expands by parser failure | Schema validation fails closed; a valid `UNCLASSIFIED` event always drifts | Availability can be denied by bad input |
| Response adapter fails | Decision says block but effect occurs | Audit prescribed response separately from enforcement outcome | v0.1 has no enforcement outcome |
| Tampered policy or audit | False allow or hidden finding | File permissions and digests are implementation research items | No tamper-evident storage in v0.1 |
| Confused deputy through allowed tool | Tool performs broader operation | Flag as effective-authority problem | Explicitly deferred to composition research |

## Attacker goals considered

- Read or write a target outside declared filesystem scope.
- Start a process other than the declared executable/arguments.
- Reach an undeclared network origin.
- Read an undeclared credential.
- Invoke an undeclared tool.
- Make an operation unclassifiable or make a broad rule match it accidentally.
- Cause output to claim containment that did not occur.

## Out-of-scope attacker powers

The v0.1 guarantee does not survive an attacker that can modify the evaluator, policy, collector, trace, or audit output; act through an uninstrumented channel; exploit the host kernel; or control the policy author. Those require real isolation, OS controls, provenance, and enforcement mechanisms.
