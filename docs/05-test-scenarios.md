# Deterministic test scenarios

These are design-level acceptance scenarios. Each uses valid canonical inputs. When implemented, every scenario must be run twice and its canonical JSON assessment compared byte-for-byte.

## A. Declared repository read and test process

Policy rules:

```text
FILESYSTEM_READ path=src recursive=true
PROCESS_EXEC executable=npm.cmd args=["test"] shell=false
```

Ordered events:

```text
1 FILESYSTEM_READ C:/work/repo/src/index.js
2 PROCESS_EXEC npm.cmd ["test"] shell=false
```

Expected:

```text
events_observed=2
matched_policy=2
capability_drift=0
findings=[]
overall_decision=ALLOW
```

This also proves that path-subtree matching uses segments and that exact process tuples match.

## B. Unauthorized filesystem write

Policy rule:

```text
FILESYSTEM_WRITE path=output recursive=true
```

Event:

```text
FILESYSTEM_WRITE C:/Windows/System32/drivers/etc/hosts
```

Expected:

```text
CAPABILITY_DRIFT
reason=NO_MATCHING_ALLOW_RULE
severity=HIGH
decision=BLOCK
overall_decision=BLOCK
```

A sibling-prefix assertion must also show that `C:/work/repo/output-old/x` does not match scope `C:/work/repo/output`.

## C. Unauthorized network request

Policy has no `NETWORK_EGRESS` rule.

Event:

```text
NETWORK_EGRESS https registry.npmjs.org 443
```

Expected:

```text
CAPABILITY_DRIFT
severity=HIGH
decision=BLOCK
overall_decision=BLOCK
```

Adapter-normalizer unit assertions show that `HTTPS`, `registry.npmjs.org.`, and an omitted HTTPS default port become the canonical tuple above before trace assembly. No suffix or wildcard match is implied.

## D. Unauthorized process execution

Policy rules allow only:

```text
npm.cmd ["test"] shell=false
git.exe ["status"] shell=false
```

Event:

```text
powershell.exe ["-NoProfile", "-Command", "Get-ChildItem"] shell=false
```

Expected:

```text
CAPABILITY_DRIFT
severity=HIGH
decision=BLOCK
overall_decision=BLOCK
```

Additional assertions show that `npm.cmd ["test", "--", "--watch"]` and `npm.cmd ["test"] shell=true` do not match the allowed tuple.

## E. Unauthorized credential access dominates the run

Policy allows the repository read from scenario A but has no credential rule.

Ordered events:

```text
1 FILESYSTEM_READ C:/work/repo/src/index.js
2 CREDENTIAL_READ environment NPM_TOKEN
3 NETWORK_EGRESS https registry.npmjs.org 443
```

Expected:

```text
events_observed=3
matched_policy=1
capability_drift=2
event 2: CRITICAL / TERMINATE
event 3: HIGH / BLOCK
overall_decision=TERMINATE
```

The credential event contains the identifier `NPM_TOKEN`, never its value. Findings remain in event order even though overall precedence is computed independently.

## Mandatory failure cases

These are parser/evaluator tests, not counted among the five behavioral scenarios:

- malformed policy, unknown property, duplicate rule ID, or unknown version: policy error, no assessment;
- malformed trace, duplicate event ID, non-increasing sequence, or envelope mismatch: trace error, no assessment;
- valid `UNCLASSIFIED` event: one `HIGH/BLOCK` drift finding;
- empty valid trace: `ALLOW` with zero counts;
- rules listed in a different order: identical decisions and stable matched rule ID;
- repeated identical assessment: identical canonical JSON output.
