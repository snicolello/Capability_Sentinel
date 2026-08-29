# v0.1 capability taxonomy

## Model

Each capability is an **operation class plus a typed target**. This draws on a concept from capability-based access-control models—authority is meaningful only in relation to an object and permitted operation—without claiming that ARRM implements such a model or that an ARRM policy rule is an unforgeable OS capability.

The taxonomy is deliberately about observable boundary operations, not business intent such as “maintain repository.”

| Capability | Canonical target | What it means in v0.1 | Default drift severity | Default response |
|---|---|---|---|---|
| `FILESYSTEM_READ` | normalized path | Wrapper reported a file-content read operation | `MEDIUM` | `REQUIRE_APPROVAL` |
| `FILESYSTEM_WRITE` | normalized path | Wrapper reported creation, replacement, append, or deletion as a write-class operation | `HIGH` | `BLOCK` |
| `PROCESS_EXEC` | executable, argv, shell flag | Wrapper requested one process invocation | `HIGH` | `BLOCK` |
| `NETWORK_EGRESS` | scheme, host, port | Wrapper reported one HTTP(S) request origin | `HIGH` | `BLOCK` |
| `CREDENTIAL_READ` | provider and credential name | Credential-aware adapter requested secret material | `CRITICAL` | `TERMINATE` |
| `TOOL_INVOKE` | tool name | Agent runtime invoked a named tool boundary | `HIGH` | `BLOCK` |
| `UNCLASSIFIED` | opaque operation label | Collector observed an in-scope operation it could not safely classify | `HIGH` | `BLOCK` |

`UNCLASSIFIED` is valid in a trace but cannot appear in an allow rule. It exists so a classification failure is explicit and fail-safe rather than dropped.

## Deliberate simplifications

### Filesystem

- v0.1 has only read and write. Delete, rename, chmod, and execute-file rights may deserve separate classes in an enforcement system, but the fixture-based monitor does not yet have evidence that it can observe them reliably.
- Policy scopes are exact paths or path subtrees, modeled after path-beneath rules rather than arbitrary glob syntax.
- A policy-relative path is anchored to `workspace_root`; `..` is forbidden in policy paths.
- Event paths must already be absolute and lexically normalized by the adapter. The pure evaluator does not resolve symlinks or query a live filesystem.
- Path comparison uses the policy's declared platform mode. Prefix strings are never sufficient: `C:/repo/src2` is not beneath `C:/repo/src`.

### Process execution

- A process target is `(executable, argv[], shell)`, not a command-line string.
- Exact array equality is required. No regex, prefix, substring, or shell-token parsing is allowed.
- `shell: true` describes execution through a shell and must match an explicit rule with the same shell invocation. Allowing `npm test` does not imply authority to invoke arbitrary commands from a package script; that is a known effective-authority gap.
- PATH resolution, executable identity, environment variables, working directory, and descendants are recorded or controlled by collectors later, not inferred by the v0.1 evaluator.

### Network egress

- v0.1 covers HTTP and HTTPS request origins only, not arbitrary sockets.
- Scheme and registered host are lowercase. A trailing root dot is removed. Internationalized names must arrive as ASCII/Punycode. Default ports are materialized (`80` or `443`).
- Matching is exact on scheme, host, and port. Wildcard domains, CIDRs, URL paths, DNS answers, proxies, and redirect inheritance are deferred.

### Credentials

- `CREDENTIAL_READ` is emitted only by a credential-aware adapter. The evaluator does not guess that a file or environment variable contains a secret.
- Only provider and identifier are logged. Secret values are forbidden in canonical events.
- A file-backed secret may produce both `FILESYSTEM_READ` and `CREDENTIAL_READ` if the collector has both facts; they are evaluated independently.

### Tools

- A tool invocation is a real authority boundary when the runtime exposes named tools. It is not a substitute for the lower-level effects the tool causes.
- Tool arguments are deliberately absent in v0.1. A tool rule authorizes invoking the named interface, which may be too broad; tool-specific argument policies belong in a later, evidence-driven extension.

## Severity derivation

Severity is a static function of unmatched capability. Target sensitivity is not inferred. This is intentionally crude but reproducible. A future model may classify resources, but v0.1 must not pretend that `/etc/config` is intrinsically knowable as more sensitive than an arbitrary project file on every platform.

Allowed events always receive decision `ALLOW` and do not create findings. Unmatched events receive the table's severity, then the policy's constrained response map translates severity to a prescribed decision. Configuration may strengthen the response, but it cannot reduce the safe default.
