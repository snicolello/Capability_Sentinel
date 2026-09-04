# Agent Instructions

Read `PROJECT.md`, `STATE.md`, `README.md`, and `docs/09-v0.1-review.md` before changing this repository.

- Preserve the accepted v0.1 stop gate; do not begin M6 or deferred capabilities without explicit authorization.
- Treat the monitor as offline conformance analysis, not enforcement or proof of trace completeness.
- Keep evaluation deterministic and deny by default when no allow rule matches.
- Preserve unrelated user changes and never expose secrets or sensitive trace contents.
- Run the full tests and schema checks for implementation changes.
- Update `STATE.md` when an authorized milestone changes the baseline.
- Return a completion packet with changes, acceptance evidence, verification, decisions, limitations, and next action.
