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
node ./node_modules/@future-fuze/package-config/apply.ts tsconfig
node ./node_modules/@future-fuze/package-config/apply.ts prettier
```

### Global flags

- `--dry-run`: print planned install/file changes without writing
- `--update`: install `@future-fuze/package-config@latest` as a dev dependency
- `--conflict <mode>`: conflict handling strategy
  - `error` (default): fail when existing config conflicts
  - `overwrite`: replace conflicting config values
  - `skip`: leave conflicting files unchanged
