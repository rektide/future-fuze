# @future-fuze/package-config

Shared configuration for future-fuze projects.

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
node ./node_modules/@future-fuze/package-config/index.ts apply --config prettier
node ./node_modules/@future-fuze/package-config/index.ts apply --config tsconfig --config prettier
node ./node_modules/@future-fuze/package-config/index.ts apply --config all
node ./node_modules/@future-fuze/package-config/index.ts apply --config all --recursive
node ./node_modules/@future-fuze/package-config/apply.ts --config tsconfig
node ./node_modules/@future-fuze/package-config/apply.ts --config prettier
```

### Global flags

- `--config <name>`: config to apply (`tsconfig`, `prettier`, `all`); repeat to apply multiple configs
- `--recursive`, `-r`: apply to each discovered package project under current project root
- `--dry-run`: print planned install/file changes without writing
- `--update`: install `@future-fuze/package-config@latest` as a dev dependency
- `--conflict <mode>`: conflict handling strategy
  - `error` (default): fail when existing config conflicts
  - `overwrite`: replace conflicting config values
  - `skip`: leave conflicting files unchanged

### Package config source files

TypeScript apply settings can be sourced from either JSON files or TypeScript modules:

- `typescript/devDependencies.json` or `typescript/devDependencies.ts`
- `typescript/scripts.json` or `typescript/scripts.ts`
- optional monorepo root overrides in `typescript/recursive/`
  - `typescript/recursive/devDependencies.json` or `.ts`
  - `typescript/recursive/scripts.json` or `.ts`

When using `.ts` files, export either the named key (`devDependencies` / `scripts`) or `config`.

When applying from a monorepo root (detected via `pnpm-workspace.yaml` or npm `workspaces`),
`typescript/recursive/*` is used when present. Leaf packages continue using non-recursive files.
