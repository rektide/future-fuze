# @future-fuze/package-config

Shared configuration for future-fuze projects.

## Usage

### TypeScript

Extend the base config in your `tsconfig.json`:

```json
{
	"extends": "@future-fuze/package-config/tsconfig/base.json",
	"include": ["src/**/*.ts"]
}
```

For CDK8S projects (enables decorators):

```json
{
	"extends": "@future-fuze/package-config/tsconfig/cdk8s.json",
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
"@future-fuze/config/prettier"
```
