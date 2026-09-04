# Capability Sentinel / Agent Runtime Risk Monitor

- Project code: `CAP-SENT`
- Trust zone: `Personal`
- Repository: https://github.com/snicolello/Capability_Sentinel
- Portfolio board: https://github.com/users/snicolello/projects/1
- Coordination repository: https://github.com/snicolello/stephen-project-hub
- Project intake: https://github.com/snicolello/stephen-project-hub/issues/2

## Outcome

Provide a deterministic offline proof of concept that compares a trusted agent policy with a trusted runtime trace and reports operations lacking a matching allow rule.

## Boundaries

- Current accepted scope is ARRM v0.1 only.
- It is a conformance monitor, not a collector, sandbox, enforcement point, or proof of complete runtime visibility.
- M6 runtime-integration discovery requires separate user authorization.

## Verification

All committed scenarios and malformed inputs pass, JSON/text output remains deterministic, and the accepted M5 review contract remains satisfied.
