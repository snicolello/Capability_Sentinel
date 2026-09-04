# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|---|---|---|
| Primary language | JavaScript | `package.json`; `src/cli.js` |
| Runtime + version | Node.js 24.13.0; package engine range `>=24 <25` | `.nvmrc`; `package.json` |
| Package manager | npm 11.6.2; lockfile version 3 | `package-lock.json`; terminal `npm.cmd --version` on 2026-09-04 |
| Module/build system | Native ECMAScript modules (`"type": "module"`); no compilation/build step | `package.json`; `src/schema/create-validator.js` |

### 2) Production Frameworks and Dependencies

The CLI has no application framework. Its three direct runtime dependencies are exactly pinned.

| Dependency | Version | Role in system | Evidence |
|---|---:|---|---|
| `ajv` | 8.20.0 | JSON Schema Draft 2020-12 compilation and validation | `package.json`; `src/schema/create-validator.js` |
| `ajv-formats` | 3.0.1 | Bounded `date-time` validation | `package.json`; `src/schema/create-validator.js` |
| `jsonc-parser` | 3.3.1 | Strict JSON syntax-tree parsing and duplicate-key detection | `package.json`; `src/io/load-json.js` |

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|---|---|---|
| Node built-in test runner | Runs unit, integration, and contract tests | `package.json`; `tests/unit/evaluate-run.test.js` |
| Node `assert/strict` | Assertions; no third-party assertion library | `tests/unit/evaluate-run.test.js`; `tests/integration/assess-cli.test.js` |
| Ajv schema check | Compiles all five repository schemas in strict mode | `scripts/check-schemas.js`; `package.json` |
| Formatter/linter | [TODO] No formatter or linter is configured | `.codebase-scan.txt`; `package.json` |

There are no `devDependencies` in `package.json`.

### 4) Key Commands

```powershell
npm.cmd ci
# No build command; source runs directly on Node.js.
npm.cmd test
npm.cmd run check
node src/cli.js assess fixtures/policies/example-agent.json fixtures/traces/normal-run.json --json
```

### 5) Environment and Config

- Config sources: `.nvmrc`, `package.json`, the JSON files in `schemas/`, and policy/trace documents supplied on the command line.
- Required environment variables: none read by production source; `rg` found no `process.env` use under `src/` on 2026-09-04.
- Deployment/runtime constraints: this is an offline local CLI. It requires Node 24, reads regular local files, and writes an assessment or diagnostic to process streams.
- Containers and CI/CD: [TODO] No container configuration or CI/CD pipeline exists in the scanned repository.

### 6) Evidence

- `.nvmrc`
- `package.json`
- `package-lock.json`
- `src/schema/create-validator.js`
- `src/io/load-json.js`
- `scripts/check-schemas.js`
- `docs/codebase/.codebase-scan.txt`
