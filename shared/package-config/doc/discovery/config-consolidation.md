# Config Consolidation Discovery

## Scope

Consolidate package config application so each config bundle uses **zero or one** `package.json` source file, with optional root-only override behavior.

Term choice is intentionally unchanged: we keep `config` / `configs` across docs and code.

## Why

Previous package.json behavior was spread across section loaders and per-config apply implementations:

- [`/internal/apply/package-json.ts`](/internal/apply/package-json.ts)
- [`/internal/config-source.ts`](/internal/config-source.ts)
- [`/typescript/apply.ts`](/typescript/apply.ts)
- [`/concurrently/apply.ts`](/concurrently/apply.ts)
- [`/cdk8s/apply.ts`](/cdk8s/apply.ts)
- [`/vitest/apply.ts`](/vitest/apply.ts)

This creates duplicated branching and makes conflict behavior harder to reason about.

## Target Model

For each config directory:

- `config/package.json` is optional
- `config/recursive/package.json` is optional, used only when target project is monorepo root
- if both exist at monorepo root, `config/package.json` merges first and `config/recursive/package.json` merges after (override layer)
- if neither exists, applying that config makes no package.json changes

Per-config `apply.ts` files should only:

1. resolve which source package.json to use
2. call one shared package.json merge/apply helper
3. run non-package-json config behavior (for example TypeScript `tsconfig` updates)

## Merge + Conflict Contract (Draft)

Merge behavior should be explicit and shared across configs.

- object keys: merge recursively
- scalar values (`string` / `number` / `boolean` / `null`): compare then apply conflict mode
- arrays: merge additively (append missing items only, dedupe by deep equality)
- missing key in target: always set
- missing key in source: no-op (never delete)

Conflict behavior remains mapped to [`/gunshi/conflict.ts`](/gunshi/conflict.ts):

- `error`: throw
- `overwrite`: use source value
- `skip`: keep target value

### Logging Contract

- add `--verbose` via [`/gunshi/logging.ts`](/gunshi/logging.ts)
- when enabled, print one log line per changed JSON-path:
  - prefix includes config name
  - includes status (`created` or `overwrote`)
  - uses JSON-path style path notation

## Validation Rules

- Empty source `package.json` is invalid and should fail apply.
- `type: "module"` should be isolated to [`/esm/package.json`](/esm/package.json), not duplicated in other config sources.

## Proposed Internal Shape

- keep package.json apply behavior in [`/internal/apply/package-json.ts`](/internal/apply/package-json.ts)
- keep CLI flag wiring in plugin modules:
  - [`/gunshi/conflict.ts`](/gunshi/conflict.ts)
  - [`/gunshi/logging.ts`](/gunshi/logging.ts)
- keep conflict decision logic in internal runtime modules, not in gunshi plugins

## Incremental Work Items

1. define and test merge contract in pure unit tests
2. validate verbose JSON-path output coverage and formatting
3. remove fragment-source assumptions from docs/tests
4. delete obsolete helpers/files after green tests

## Open Questions

- Do we want optional support for key deletion in the future, or keep additive-only behavior?
- For array fields, do we ever need configurable merge strategy per key?
- Do we want a collection-specific conflict flag, or is additive merge enough for now?

## Tracking

Related cleanup ideas that are not core to this refactor are tracked in [`/doc/discovery/rework.md`](/doc/discovery/rework.md).
