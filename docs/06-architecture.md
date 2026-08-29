# Proposed v0.1 architecture

## Components

```text
runtime adapter                  offline CLI input
      |                                |
      v                                |
structured raw event                   |
      |                                |
      v                                v
adapter normalizer -----------> canonical trace document
                                      |
policy JSON ---> policy loader        |
                    |                 |
                    v                 v
                 schema validation + semantic validation
                              |
                              v
                  pure policy-scope normalizer
                              |
                              v
                   deterministic evaluator
                              |
                              v
               severity and response mapper
                              |
                  +-----------+-----------+
                  |                       |
                  v                       v
          canonical assessment       text renderer
                  |
                  v
              audit writer
```

Collection, decision, enforcement, and audit are separate responsibilities:

- **Collector/adapter:** observes a runtime-specific boundary and emits structured facts.
- **Adapter normalizer:** canonicalizes typed event targets before trace assembly or returns a classification error.
- **Policy decision point:** answers whether a rule matches and derives a prescribed response.
- **Policy enforcement point:** would apply a decision before an effect. It is not part of the offline v0.1 assessor.
- **Audit writer:** records inputs' evaluation results; it does not reinterpret them.

This separation draws on the established policy-decision/policy-enforcement distinction without implementing or importing any cited policy framework or engine.

## Proposed modules

```text
src/
  cli/
  schema/
  policy/
  normalize/
  evaluate/
  response/
  audit/
schemas/
fixtures/
tests/
```

The repository should not create these implementation directories until coding begins. Each module should expose pure functions where possible.

## Processing algorithm

1. Read policy and trace bytes with explicit size limits.
2. Parse strict JSON, rejecting duplicate keys.
3. Validate against the pinned schema version.
4. Apply semantic validation for uniqueness, envelope agreement, contiguous ordering, and canonical event values.
5. Normalize policy scopes without external I/O.
6. For every event in sequence order, select rules with the same capability and apply the capability's total matcher.
7. If matched, record `ALLOWED`, decision `ALLOW`, and the lexicographically smallest matching rule ID.
8. If unmatched, record `DRIFT`, derive fixed severity, map it to the configured non-weaker response, and create one finding.
9. Select overall decision by fixed precedence.
10. Serialize assessment fields in a documented order for reproducible JSON, then optionally render text.

Any exception or unsupported state before step 6 is an input/assessment error, not drift and not allow. Unexpected evaluator exceptions exit as internal errors and produce no security conclusion.

## CLI contract

```text
arrm assess POLICY.json TRACE.json [--json]
```

Proposed exit codes:

| Code | Meaning |
|---|---|
| `0` | Valid assessment, overall `ALLOW` or `LOG` |
| `3` | Valid assessment, `REQUIRE_APPROVAL` |
| `4` | Valid assessment, `BLOCK` |
| `5` | Valid assessment, `TERMINATE` |
| `64` | Invalid command usage |
| `65` | Invalid policy or trace data |
| `70` | Internal software error; no conclusion |

Nonzero drift exits make the CLI usable in scripts while keeping invalid input distinct from a security finding.

## Determinism boundary

Decision functions must not use current time, random IDs, locale-sensitive ordering, filesystem state, DNS, environment variables, or LLM output. Input timestamps are retained as evidence but never affect policy. Canonical output preserves event order and uses a fixed decision precedence and key order.

## Containment integration, later

An enforcing wrapper could call the evaluator with a proposed event before performing an effect and record whether the decision was applied. Even then, wrapper-level mediation is not equivalent to OS sandboxing. Kernel or platform controls should enforce child-process, filesystem, and network restrictions where strong containment is required.
