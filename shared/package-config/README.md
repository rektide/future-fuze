# @future-fuze/package-config

Shared configuration for future-fuze projects.

## Policy: Leaf-first portability

Even in a monorepo, package configs in this project are designed so a single package folder
can run on its own without requiring parent/root config files.

- Base config files are the default for package-level apply behavior.
- `recursive/` config sources are optional root overrides for monorepo root usage only.
- Leaf packages must remain executable and valid when copied out of the monorepo.

## Usage

### TypeScript

Extend the base config in your `tsconfig.json`:

```json
{
	"extends": "@future-fuze/package-config/typescript/base.json",
	"include": ["src/**/*.ts"]
}
```

For CDK8S projects (enables decorators):

```json
{
	"extends": "@future-fuze/package-config/typescript/cdk8s.json",
	"include": ["src/**/*.ts"]
}
```

### Prettier

Reference in your `package.json`:

```json
{
	"prettier": "@future-fuze/package-config/prettier"
}
```

Or create `.prettierrc.json`:

```json
"@future-fuze/package-config/prettier"
```

## Apply CLI

Use the apply tool to configure the current project in-place:

```sh
node ./node_modules/@future-fuze/package-config/index.ts apply --config tsconfig
node ./node_modules/@future-fuze/package-config/index.ts apply --config tsconfig --tsconfig-profile cdk8s
node ./node_modules/@future-fuze/package-config/index.ts apply --config prettier
node ./node_modules/@future-fuze/package-config/index.ts apply --config concurrently
node ./node_modules/@future-fuze/package-config/index.ts apply --config cdk8s
node ./node_modules/@future-fuze/package-config/index.ts apply --config vitest
node ./node_modules/@future-fuze/package-config/index.ts apply --config esm
node ./node_modules/@future-fuze/package-config/index.ts apply --config tsconfig --config prettier
node ./node_modules/@future-fuze/package-config/index.ts apply --config all
node ./node_modules/@future-fuze/package-config/index.ts apply --config all --recursive
node ./node_modules/@future-fuze/package-config/apply.ts --config tsconfig
node ./node_modules/@future-fuze/package-config/apply.ts --config prettier
```

### Global flags

- `--config <name>`: config to apply (`tsconfig`, `prettier`, `concurrently`, `cdk8s`, `vitest`, `esm`, `all`); repeat to apply multiple configs
- `--recursive`, `-r`: apply to each discovered package project under current project root
- `--tsconfig-profile <profile>`: tsconfig profile (`base` default, `cdk8s`) when applying `tsconfig`
- `--dry-run`: print planned install/file changes without writing
- `--update`: install `@future-fuze/package-config@latest` as a dev dependency
- `--verbose`: log each changed `package.json` JSON-path per config (`created` / `overwrote`)
- `--conflict <mode>`: conflict handling strategy
  - `error` (default): fail when existing config conflicts
  - `overwrite`: replace conflicting config values
  - `skip`: leave conflicting files unchanged

### Package config source files

Package `package.json` updates are sourced from bundle-level files:

- `typescript/package.json`
- `concurrently/package.json`
- `cdk8s/package.json`
- `vitest/package.json`
- `esm/package.json`

Optional monorepo-root overrides can be provided in `recursive/`:

- `typescript/recursive/package.json`
- `cdk8s/recursive/package.json`

When applying from a monorepo root (detected via `pnpm-workspace.yaml` or npm `workspaces`),
base `package.json` is merged first and `recursive/package.json` is merged after it when present.
Leaf packages only use base `package.json`.

An empty config source `package.json` is invalid and causes apply to fail.
