# Open security questions

These questions need implementation-driven research. Each has a conservative v0.1 assumption so fixture work can proceed without silently answering it.

## Questions that affect a real collector

1. **What boundary can actually mediate all in-scope operations?**
   - v0.1 assumption: only operations routed through an explicit wrapper or tool gateway are in scope.
   - Research: enumerate direct runtime APIs, native subprocess escape paths, and tool-internal effects before claiming coverage.

2. **Are events attempts or completed effects?**
   - v0.1 assumption: offline traces prove only that the collector reported an operation; prescribed responses are not enforcement outcomes.
   - Research: define pre-effect and post-effect records before adding a blocking adapter.

3. **How should child processes inherit observation and authority?**
   - v0.1 assumption: `PROCESS_EXEC` covers only the direct wrapper invocation.
   - Research: compare platform process-tree controls with inherited sandbox mechanisms; do not infer descendants from a parent command.

4. **What is a stable filesystem target?**
   - v0.1 assumption: fixture paths are canonical absolute strings with no aliases.
   - Research: resolved handles/object IDs, symlinks, junctions, hard links, mounts, alternate data streams, case sensitivity, and TOCTOU on each supported OS.

5. **What network peer should policy name?**
   - v0.1 assumption: exact HTTP(S) request origin reported by the adapter.
   - Research: DNS resolution, redirects, proxies, CONNECT tunnels, service meshes, Unix sockets, and connection reuse. Hostname policy alone is not endpoint identity.

6. **How can collector provenance and completeness be checked?**
   - v0.1 assumption: collector and trace are trusted.
   - Research: sequence gap detection, chained hashes/signatures, protected logging, collector identity, and fail-safe behavior on telemetry loss.

## Questions that affect policy quality

7. **Is named tool invocation too coarse?**
   - v0.1 assumption: tool name is the entire declared boundary.
   - Research: use real tool schemas to find the minimum stable, non-secret argument dimensions needed for policy.

8. **Can credential access be classified without leaking secrets?**
   - v0.1 assumption: only credential-aware APIs emit provider and identifier.
   - Research: environment access, file-backed secrets, cloud metadata, token brokers, and redaction tests.

9. **How is policy integrity established?**
   - v0.1 assumption: local policy author and file are trusted.
   - Research: ownership, file permissions, version pinning, review, signatures, and rollback behavior before enforcement.

10. **When is fixed severity insufficient?**
    - v0.1 assumption: severity depends only on capability class.
    - Research: wait for real false-positive/impact evidence before adding resource labels. Avoid probabilistic or LLM-based enforcement.

## Questions intentionally postponed

11. How should effective authority be represented as a graph of actors, services, resources, credentials, and delegations?
12. Which graph edges represent potential authority versus observed causation?
13. How should confused deputies and shared-resource side channels be distinguished from intended delegation?

Those questions are the project's future research value, but answering them now would blur the clear v0.1 claim and expand the trusted surface before direct drift detection works.
