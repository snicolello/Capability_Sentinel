# Explicit deferred scope

The following are not required to detect undeclared operations in trusted, deterministic fixture traces and are therefore outside v0.1.

## Authority and composition analysis

- Effective-capability graphs and attack-path search.
- Confused-deputy detection across package managers, proxies, services, and credentials.
- Shared-filesystem or timing/covert communication channels.
- Inferring latent authority from installed software or environment configuration.
- Multi-agent delegation and cross-agent attribution.

## Strong collection and enforcement

- Kernel telemetry, eBPF, ETW, auditd, syscall interposition, or endpoint agents.
- OS sandbox creation, containers, seccomp, Landlock, AppContainer, job objects, or firewall management.
- Automatic child-process inheritance or full process-tree observation.
- Pre-effect blocking, termination, rollback, or remediation.
- Tamper-proof collectors and cryptographically signed traces.

## Broader policy language

- Deny rules, priorities, inheritance, roles, groups, time conditions, or contextual risk scoring.
- Arbitrary glob patterns, regular expressions, wildcard domains, CIDRs, URL-path rules, or DNS pinning.
- Tool-specific argument schemas and semantic permissions.
- YAML input, environment interpolation, policy includes, remote policies, or a general Rego/OPA dependency.
- Resource sensitivity databases and target-dependent severity.

## Product and operations features

- Database persistence, dashboards, web UI, APIs, authentication, or multiple users.
- Cloud deployment, distributed streams, queues, SIEM export, alert routing, or historical analytics.
- ML anomaly detection, LLM enforcement, autonomous investigation, or threat intelligence.
- Enterprise IAM, credential brokering, secrets storage, or approval workflow implementation.
- AEF integration.

## Additional protocol coverage

- Raw TCP/UDP, DNS queries, Unix sockets, named pipes, IPC, clipboard, device access, registry access, and shared memory.
- Detailed filesystem operations such as execute, metadata changes, hard-link creation, mount operations, or permission changes.
- Inbound network listeners.

## Reconsideration rule

A deferred feature becomes eligible only when a concrete runtime adapter or test demonstrates an operation that the current model cannot represent safely. The design should then add the smallest new operation/target pair and a deterministic matcher, with threat-model and fixture updates in the same change.
