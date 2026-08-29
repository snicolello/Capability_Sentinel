# Canonical event, finding, and assessment model

The normative design contracts are:

- [`event.schema.json`](../schemas/event.schema.json)
- [`trace.schema.json`](../schemas/trace.schema.json)
- [`finding.schema.json`](../schemas/finding.schema.json)
- [`assessment.schema.json`](../schemas/assessment.schema.json)

All use JSON Schema Draft 2020-12. JSON is the canonical interchange format for v0.1; YAML is deferred so tags, aliases, duplicate keys, and scalar coercion cannot create parser differences.

`observed_at` must be a `date-time` string no longer than 64 characters. This bounds format-validation input while leaving room for canonical RFC 3339 timestamps used by collectors.

## Canonical event example

```json
{
  "schema_version": "0.1",
  "event_id": "evt-001",
  "observed_at": "2026-08-29T14:32:17.084Z",
  "sequence": 1,
  "run_id": "run-0042",
  "agent_id": "repo-maintainer",
  "capability": "NETWORK_EGRESS",
  "target": {
    "kind": "network_origin",
    "scheme": "https",
    "host": "registry.npmjs.org",
    "port": 443
  },
  "source": "wrapper"
}
```

Targets are typed objects rather than overloaded strings. That avoids unsafe reconstruction of process arguments and ambiguous network or path comparisons.

## Trace invariants beyond JSON Schema

The loader must reject the entire trace if:

- event IDs or sequence numbers are duplicated;
- an event ID is longer than 103 characters, because the deterministic finding ID derived from it must fit the 128-character identifier contract;
- sequence numbers are not contiguous from 1 in array order;
- an event's `run_id` or `agent_id` differs from the trace envelope;
- a target is not in canonical form for the declared `platform`;
- a credential value or raw request payload appears in an extension field (extensions are not accepted in v0.1).

A structurally valid `UNCLASSIFIED` event is not a malformed trace. It is evaluated and always produces drift.

## Finding example

```json
{
  "schema_version": "0.1",
  "finding_id": "finding:evt-001:capability-drift",
  "run_id": "run-0042",
  "event_id": "evt-001",
  "type": "CAPABILITY_DRIFT",
  "capability": "NETWORK_EGRESS",
  "target": {
    "kind": "network_origin",
    "scheme": "https",
    "host": "registry.npmjs.org",
    "port": 443
  },
  "declared": false,
  "reason": "NO_MATCHING_ALLOW_RULE",
  "severity": "HIGH",
  "decision": "BLOCK"
}
```

Finding IDs are derived from event IDs. They are not random. There is exactly one drift finding per unmatched event.

## Run assessment

The assessment contains an ordered evaluation entry for every event and an ordered finding list for unmatched events. The overall decision is the highest-precedence event decision:

```text
ALLOW < LOG < REQUIRE_APPROVAL < BLOCK < TERMINATE
```

`events_observed`, `matched_policy`, and `capability_drift` must agree with the arrays. An empty valid trace produces overall `ALLOW`; a missing or invalid trace produces no assessment and a nonzero CLI error.

The assessment intentionally has no generated timestamp or random assessment ID. The event timestamps are evidence supplied by the trace, and omitting output-time state makes identical inputs reproducible. A future audit envelope may add a content digest and signer without changing the decision core.

## Normalization boundary

Collectors translate runtime-specific data into structured raw events. Adapter normalizers then validate and canonicalize target components before assembling a trace that conforms to `event.schema.json`. The offline assessment core accepts canonical traces and must not turn `curl https://example.com` or `cat file` strings into security events: shell dialects, quoting, aliases, redirections, and invoked program behavior make that inference incomplete and unsafe.

If a collector cannot produce the required typed target, it emits `UNCLASSIFIED` with a non-sensitive operation label or rejects the event. It never guesses an allowable classification.
