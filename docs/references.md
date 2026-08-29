# Concepts drawn from security models and standards

These sources are conceptual design references. ARRM draws on selected concepts from them; it does not implement, conform to, embed, or depend on seL4, NIST Zero Trust Architecture, OPA/Rego, Landlock, seccomp, or OSCAL. The references also make no claim that the separate Agent Execution Framework (AEF) implements or depends on any of them.

## Least privilege and audit evidence

[NIST SP 800-53 Rev. 5.1](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) provides established least-privilege and audit-control language. ARRM draws on concepts from that language: a process should receive only needed authority, and selected event types need records sufficient to reconstruct what happened. ARRM does not implement or claim compliance with SP 800-53.

[NIST OSCAL Assessment Results](https://pages.nist.gov/OSCAL/learn/concepts/layer/assessment/assessment-results/) distinguishes observations, findings, and risks. ARRM draws on that terminology by treating an event as evidence and a finding as a deterministic conclusion drawn from it. ARRM does not implement OSCAL, and OSCAL is not its wire format.

## Capability-based access control

[The seL4 capability model](https://sel4.systems/About/FAQ.html#what-are-capabilities) defines a capability as an object reference plus access rights and makes it the basis for authorized operations. ARRM draws on the narrower concept that an operation is meaningful only with respect to a target and rights. ARRM does not implement or depend on seL4, and an ARRM JSON rule is not equivalent to an OS capability.

## Policy decision versus enforcement

[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) describes policy decision and enforcement points, while [Open Policy Agent](https://www.openpolicyagent.org/docs) separates policy decisions on structured input from enforcement. ARRM draws on that separation by keeping its offline decision engine distinct from any future enforcing wrapper. ARRM does not implement NIST Zero Trust Architecture or OPA/Rego and has no dependency on either.

## Filesystem scopes and child inheritance

[Linux Landlock documentation](https://docs.kernel.org/userspace-api/landlock.html) models filesystem rights on path hierarchies and documents inherited restrictions. ARRM draws on the path-hierarchy concept when using exact and path-beneath scopes instead of arbitrary globs. ARRM does not implement, invoke, or depend on Landlock; its lexical comparison is materially weaker than kernel enforcement.

[Linux seccomp documentation](https://docs.kernel.org/userspace-api/seccomp_filter.html) documents syscall filtering, filter inheritance, and TOCTOU concerns with interposition. [The `no_new_privs` documentation](https://docs.kernel.org/userspace-api/no_new_privs.html) explains an inherited control that prevents `execve` from adding privileges. These sources illustrate containment properties that ARRM does not implement or depend on.

## Network normalization

[RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986) defines URI components and syntax-based normalization, including lowercase scheme/host and handling of default ports and dot segments. ARRM draws on those normalization concepts for the origin fields it needs. DNS identity, redirects, and proxy behavior remain outside URI-string equivalence.

## Schema validation

[JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12) provides a mature contract for structural validation. v0.1 uses strict JSON schemas plus explicit semantic validation for invariants JSON Schema cannot conveniently express, such as unique IDs, increasing sequence, and envelope agreement.

## Concepts deliberately not reinvented

- OS access controls and sandboxes remain responsible for strong containment.
- A general policy engine is deferred until the small matcher is demonstrably insufficient.
- OSCAL remains a source of terminology concepts rather than a dependency.
- Distributed trace context is unnecessary for a single-run local proof of concept; `run_id`, `event_id`, and sequence are enough.
