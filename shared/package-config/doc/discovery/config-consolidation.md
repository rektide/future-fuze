# Config Consolidation Discovery

## Scope

Consolidate package config application so each config bundle uses **zero or one** `package.json` source file, with optional root-only override behavior.

Term choice is intentionally unchanged: we keep `config` / `configs` across docs and code.

## Why

Current package.json behavior is spread across section loaders and per-config apply implementations:

- [`/internal/package-json-sections.ts`](/internal/package-json-sections.ts)
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
- if neither exists, applying that config makes no package.json changes

Per-config `apply.ts` files should only:

1. resolve which source package.json to use
2. call one shared package.json merge/apply helper
3. run non-package-json config behavior (for example TypeScript `tsconfig` updates)

## Merge + Conflict Contract (Draft)

Merge behavior should be explicit and shared across configs.

- object keys: merge recursively
- scalar values (`string` / `number` / `boolean` / `null`): compare then apply conflict mode
- arrays: treat as scalar-like replace-on-overwrite (no special dedupe for now)
- missing key in target: always set
- missing key in source: no-op (never delete)

Conflict behavior remains mapped to [`/gunshi/conflict.ts`](/gunshi/conflict.ts):

- `error`: throw
- `overwrite`: use source value
- `skip`: keep target value

## Proposed Internal Shape

- add a single `internal/package-json-apply.ts` helper (name tentative)
  - `load source package.json`
  - `merge source into target with conflict policy`
  - `write if changed`
- reduce or remove section-centric helper logic in [`/internal/package-json-sections.ts`](/internal/package-json-sections.ts)
- keep CLI wiring in [`/gunshi/conflict.ts`](/gunshi/conflict.ts), conflict decision logic in internal runtime modules

## Incremental Work Items

1. define and test merge contract in pure unit tests
2. implement shared package.json merge/apply helper
3. migrate one config end-to-end (`typescript`) to validate shape
4. migrate remaining configs (`concurrently`, `cdk8s`, `vitest`)
5. remove fragment-source assumptions from docs/tests
6. delete obsolete helpers/files after green tests

## Open Questions

- Should empty source `package.json` be treated as explicit no-op with informational output?
- Do we want optional support for key deletion in the future, or keep additive-only behavior?
- For array fields, do we ever need configurable merge strategy per key?

## Tracking

Related cleanup ideas that are not core to this refactor are tracked in [`/doc/discovery/rework.md`](/doc/discovery/rework.md).
