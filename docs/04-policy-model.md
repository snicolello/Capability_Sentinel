# Deterministic policy model

The normative contract is [`policy.schema.json`](../schemas/policy.schema.json). Policies use canonical JSON in v0.1.

## Example

```json
{
  "schema_version": "0.1",
  "policy_id": "repo-maintainer-v1",
  "agent_id": "repo-maintainer",
  "platform": "windows",
  "workspace_root": "C:/work/repo",
  "rules": [
    {
      "id": "read-src",
      "capability": "FILESYSTEM_READ",
      "target": {
        "kind": "path_scope",
        "path": "src",
        "recursive": true
      }
    },
    {
      "id": "run-tests",
      "capability": "PROCESS_EXEC",
      "target": {
        "kind": "process",
        "executable": "npm.cmd",
        "args": ["test"],
        "shell": false
      }
    }
  ],
  "response_map": {
    "INFO": "LOG",
    "LOW": "LOG",
    "MEDIUM": "REQUIRE_APPROVAL",
    "HIGH": "BLOCK",
    "CRITICAL": "TERMINATE"
  }
}
```

## Rule semantics

Rules are allow rules only. There are no explicit deny rules, priorities, inheritance, conditions, time windows, identities other than the policy agent, or rule effects in v0.1.

For event `e` and rule set `R`:

```text
allowed(e) = exists r in R:
  r.capability = e.capability
  and target_matches(r.target, e.target)
```

If `allowed(e)` is false, the result is drift. Multiple matching rules do not change the result; the lexicographically smallest matching rule ID is recorded so output stays stable regardless of rule order. Duplicate rule IDs are a semantic validation error.

## Target matching

### Path scopes

1. Convert `/` separators and remove `.` segments.
2. Reject NUL, empty segments, `..`, device paths, and non-canonical drive syntax.
3. Resolve a relative policy path against `workspace_root` lexically.
4. Apply platform case behavior: case-sensitive for `posix`; invariant lowercase comparison for `windows` in v0.1.
5. With `recursive: false`, require exact path equality.
6. With `recursive: true`, allow the scope path itself or descendants separated by a complete path segment.

This is lexical matching. It makes no claim about symlinks, junctions, hard links, bind mounts, short names, alternate data streams, or filesystem-specific case behavior. A security enforcement adapter must use resolved object identity or an OS primitive rather than rely only on this matcher.

### Processes

Require exact equality of executable string, argument count and values, and `shell`. No wildcard is supported. The collector must provide the actual wrapper invocation; the evaluator does not resolve PATH or parse a shell string.

### Network origins

Require exact equality of lowercase scheme and host plus numeric port. Only `http` and `https` are valid. The collector materializes default ports. Userinfo, path, query, and fragment are not policy dimensions because v0.1 authorizes an origin, not an application endpoint.

### Credentials and tools

Require exact equality of provider/name or tool name. `UNCLASSIFIED` has no policy-rule schema and therefore cannot match.

## Response mapping

Severity comes from the fixed taxonomy. The required response map may only preserve or strengthen defaults:

| Severity | Allowed configured response |
|---|---|
| `INFO` | `LOG` |
| `LOW` | `LOG`, `REQUIRE_APPROVAL`, `BLOCK`, `TERMINATE` |
| `MEDIUM` | `REQUIRE_APPROVAL`, `BLOCK`, `TERMINATE` |
| `HIGH` | `BLOCK`, `TERMINATE` |
| `CRITICAL` | `TERMINATE` |

This prevents a policy from translating a critical drift into a log-only result. `ALLOW` is produced only by a matching rule and never appears in `response_map`.

## Validation and failure behavior

- Unknown properties are rejected to catch misspelled security fields.
- Unknown capabilities, target kinds, and policy versions are rejected.
- Empty rule lists are valid and deny every classifiable operation.
- `UNCLASSIFIED` rules are invalid.
- Policy paths containing `..` are invalid; event paths are required to be absolute.
- Invalid policy means the run is not assessed. The CLI exits with a policy error and must not print an overall `ALLOW`.
- Policy loading and evaluation perform no environment-variable interpolation or network/filesystem lookup.

## Why not OPA/Rego in v0.1

ARRM draws on the policy-decision-versus-enforcement concept also used by OPA. It does not implement, embed, or depend on OPA or Rego. Adding a general policy language would enlarge the trusted surface and permit more semantics than this six-rule taxonomy needs. A small total matcher is easier to test exhaustively. OPA could be evaluated as a future dependency only if real requirements exceed exact and path-subtree rules.
