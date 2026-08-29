# Refined problem statement

## Decision

The declared-versus-observed model is conceptually sound as a runtime conformance check, but the original vocabulary overstates what is known. v0.1 should distinguish:

- **Declared authority:** operations the policy author intends to permit.
- **Observed operation:** a structured record that a collector says was attempted or completed.
- **Effective authority:** all operations reachable through the agent, its tools, credentials, services, and environment, whether exercised or not.

An observed operation is evidence that authority was exercised; it is not a complete inventory of capability possession. The product may retain `CAPABILITY_DRIFT` as a concise finding name, but its documentation and output explanation must say “no allow rule matched this observed operation.”

## v0.1 problem

Given:

1. a valid policy for one agent;
2. a valid, ordered trace attributed to that agent; and
3. a trusted collector that mediates or faithfully reports the operations in scope;

deterministically decide whether each event matches an allow rule. Emit one drift finding for every unmatched event and derive a prescribed response from a fixed severity table.

## Security properties v0.1 can claim

For valid inputs and the specified evaluator version:

- Every well-formed trace event is evaluated exactly once in trace order.
- An event is allowed only when at least one rule with the same capability and a matching target exists.
- No rule, unknown classification, malformed policy, or malformed trace can silently become an allow.
- The same input documents produce the same ordered assessment, excluding presentation-only whitespace.
- A finding identifies the event, reason, severity, and prescribed response.

These are conditional software properties. They depend on the correctness of the validator, normalizer, evaluator, and input attribution.

## Properties v0.1 cannot claim

v0.1 does not establish that:

- the trace is complete or truthful;
- the agent lacked other undeclared authority that it did not exercise;
- an event was actually prevented;
- child processes, native code, tools, proxies, redirects, or side channels were observed;
- a pathname denotes the same filesystem object at evaluation and use time;
- a hostname denotes a particular IP address or ultimate destination;
- an allowed operation is safe, only that it is declared;
- capability composition is absent.

## Key invariants

1. **Deny by default.** Absence of a matching rule is drift.
2. **Structured inputs.** The core does not infer security meaning by parsing arbitrary shell command strings.
3. **Pure evaluation.** Core decisions do not read the network, inspect the live filesystem, call an LLM, or depend on wall-clock time.
4. **Decision is not enforcement.** `BLOCK` and `TERMINATE` are prescribed responses until an enforcement adapter reports an outcome.
5. **Observation is not authority analysis.** Effective-capability graphs are deferred.
6. **Fail closed on invalid state.** Invalid policy or trace input produces an assessment error, never `ALLOW`.

## Success criterion

The proof of concept is useful if a reader can inspect the policy, trace, matching rules, and output and independently reproduce why each operation was allowed or flagged. It should remain smaller and easier to reason about than the runtime it observes.
