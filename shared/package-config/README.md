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
node ./node_modules/@future-fuze/package-config/index.ts apply --config tsconfig --config prettier
node ./node_modules/@future-fuze/package-config/index.ts apply --config all
node ./node_modules/@future-fuze/package-config/index.ts apply --config all --recursive
node ./node_modules/@future-fuze/package-config/apply.ts --config tsconfig
node ./node_modules/@future-fuze/package-config/apply.ts --config prettier
```

### Global flags

- `--config <name>`: config to apply (`tsconfig`, `prettier`, `concurrently`, `cdk8s`, `all`); repeat to apply multiple configs
- `--recursive`, `-r`: apply to each discovered package project under current project root
- `--tsconfig-profile <profile>`: tsconfig profile (`base` default, `cdk8s`) when applying `tsconfig`
- `--dry-run`: print planned install/file changes without writing
- `--update`: install `@future-fuze/package-config@latest` as a dev dependency
- `--conflict <mode>`: conflict handling strategy
  - `error` (default): fail when existing config conflicts
  - `overwrite`: replace conflicting config values
  - `skip`: leave conflicting files unchanged

### Package config source files

Package `devDependencies` and `scripts` settings are sourced from section files,
not mixed nested structures:

- `typescript/devDependencies.json` or `typescript/devDependencies.ts`
- `typescript/scripts.json` or `typescript/scripts.ts`
- `typescript/tsconfig.json` or `typescript/tsconfig.ts`
- `concurrently/devDependencies.json` or `concurrently/devDependencies.ts`
- `concurrently/scripts.json` or `concurrently/scripts.ts`
- `cdk8s/devDependencies.json` or `cdk8s/devDependencies.ts`
- `cdk8s/scripts.json` or `cdk8s/scripts.ts`

Optional monorepo root overrides can be provided in `recursive/` subfolders
for configs that support package section updates:

- `typescript/recursive/devDependencies.json` or `.ts`
- `typescript/recursive/scripts.json` or `.ts`
- `typescript/recursive/tsconfig.json` or `.ts`
- `concurrently/recursive/devDependencies.json` or `.ts`
- `concurrently/recursive/scripts.json` or `.ts`
- `cdk8s/recursive/devDependencies.json` or `.ts`
- `cdk8s/recursive/scripts.json` or `.ts`

When using `.ts` files, export either the named key (`devDependencies` / `scripts`) or `config`.

When applying from a monorepo root (detected via `pnpm-workspace.yaml` or npm `workspaces`),
`recursive/*` is used when present. Leaf packages continue using non-recursive files.
An empty recursive source file is treated as a no-op for that section.
