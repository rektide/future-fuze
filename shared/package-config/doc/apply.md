# prompt

we are creating an `apply` meta-tool for package-config to make it easier to apply the various package-configs. this repo is typically broken down by the tool being configured. example: typescript in typescript/.

## locked decisions

- install `@future-fuze/package-config` as a `devDependency`
- ship only `.ts` source files
- run with Node type stripping (no build output for runtime)
- use `tsgo` for type checking
- cross-cutting CLI flags are implemented as gunshi plugins
- `jj commit` after each step, big or small

## internal framework (build before feature-specific apply files)

1. `package-config/apply.ts`
   - CLI entrypoint for the apply meta-tool
   - register gunshi plugins
   - define `--config` argument (repeatable) to select one or more configs to apply
1. `package-config/internal/project.ts`
   - detect project root and load target `package.json`
   - detect package manager (`pnpm` vs `npm`) from package metadata first, then lockfiles
   - detect monorepo root status from `pnpm-workspace.yaml` or npm `workspaces`
   - defer environment-based detection for now
   - leave explicit TODO comments in code where env detection should be added later
1. `package-config/internal/install.ts`
   - ensure `@future-fuze/package-config` is installed in `devDependencies`
   - install latest when `--update` is enabled
1. `package-config/internal/files.ts`
   - JSON/text read+write helpers with dry-run support
1. `package-config/internal/conflict.ts`
   - shared conflict-resolution strategy used by apply operations
1. `package-config/gunshi/update.ts`
   - plugin that adds `--update`
1. `package-config/gunshi/dry-run.ts`
   - plugin that adds `--dry-run`
1. `package-config/gunshi/conflict.ts`
   - plugin that adds `--conflict`

## tasks

1. create `package-config/apply.ts` in small steps
   a. add `gunshi` dependency
   a. wire `gunshi/update.ts`, `gunshi/dry-run.ts`, and `gunshi/conflict.ts`
   a. support repeatable `--config` argument to select apply targets
   a. support `--config all` to run all apply targets
   a. support `--recursive` / `-r` to apply across nested package projects
   a. ensure `@future-fuze/package-config` is installed in `devDependencies` when missing
   a. auto-detect `pnpm` or `npm` and use detected tool for installs
   a. if `--update` is set, install `@future-fuze/package-config@latest`
1. create `package-config/typescript/apply.ts`
   a. keep leaf-first default: leaf `tsconfig.json` should extend package-config directly
   a. add optional tsconfig source files (`typescript/tsconfig.json` and `typescript/recursive/tsconfig.json`)
   a. use `typescript/recursive/tsconfig.*` only for monorepo root targets; leaf targets ignore it
   a. support tsconfig profile selection (for example `base` and `cdk8s`)
   a. continue applying shared `typescript/devDependencies.json` and `typescript/scripts.json` into target `package.json`
   a. support `.ts` source alternatives (`devDependencies.ts` / `scripts.ts`) with named export (`devDependencies` / `scripts`) or `config`
   a. preserve unrelated tsconfig keys and apply conflict policy field-by-field (`extends`, `include`, `exclude`, `compilerOptions`)
   a. honor `--dry-run` with clear output of planned tsconfig and package.json changes
1. create `package-config/prettier/apply.ts`
   a. apply shared `@future-fuze/package-config/prettier` configuration to target project
   a. honor `--conflict` behavior when existing prettier config differs
   a. honor `--dry-run` with clear output of planned changes
1. create `package-config/concurrently/apply.ts`
   a. apply `concurrently/devDependencies.json` and `concurrently/scripts.json` settings to target `package.json`
   a. support `.ts` source alternatives (`devDependencies.ts` / `scripts.ts`) with named export (`devDependencies` / `scripts`) or `config`
   a. include `devDependencies.concurrently: "*"`
   a. include scripts `build: "concurrently build:*"` and `test: "concurrently test:*"`
   a. if `concurrently/recursive/` sources exist and target is a monorepo root, use those instead of base sources for root-level apply
   a. if target is a leaf package, ignore `concurrently/recursive/` sources
   a. honor `--conflict` behavior and `--dry-run`
1. create `package-config/cdk8s/apply.ts`
   a. apply `cdk8s/scripts.json` settings to target `package.json`
   a. include script `build:cdk8s: "cdk8s synth"`
   a. support optional `.ts` source alternatives (`scripts.ts` / `devDependencies.ts`) with named export (`scripts` / `devDependencies`) or `config`
   a. if `cdk8s/recursive/` sources exist and target is a monorepo root, use those instead of base sources for root-level apply
   a. if target is a leaf package, ignore `cdk8s/recursive/` sources
   a. honor `--conflict` behavior and `--dry-run`
1. create `package-config/vitest/apply.ts`
   a. apply `vitest/devDependencies.json` and `vitest/scripts.json` settings to target `package.json`
   a. include `devDependencies.vitest: "*"`
   a. include script `test:vitest: "vitest run"`
   a. support optional `.ts` source alternatives (`scripts.ts` / `devDependencies.ts`) with named export (`scripts` / `devDependencies`) or `config`
   a. if `vitest/recursive/` sources exist and target is a monorepo root, use those instead of base sources for root-level apply
   a. if target is a leaf package, ignore `vitest/recursive/` sources
   a. honor `--conflict` behavior and `--dry-run`
1. add tests
   a. fixture tests for npm and pnpm projects
   a. tests for `--update`, `--dry-run`, and `--conflict`
1. update docs
   a. usage examples for `apply --config tsconfig` and `apply --config prettier`
   a. document conflict modes and dry-run behavior

## future tasks

- add a doctor/check mode to report drift without modifying files
- add tsconfig doctor/check rules (missing/incorrect `extends`, profile drift, source mismatch)

## notes

keep each task idempotent. running the same apply command repeatedly should produce no-op results when already up-to-date.
