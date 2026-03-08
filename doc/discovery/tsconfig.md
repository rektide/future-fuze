# tsconfig.json Comparison

This document compares TypeScript configurations across projects to establish a consistent reference.

## Projects Found

| Project | Path |
|---------|------|
| podinfo/cdk8s | `podinfo/cdk8s/tsconfig.json` |
| podinfo/cdk8s-nodeport | `podinfo/cdk8s-nodeport/tsconfig.json` |
| hyperdx/cdk8s | `hyperdx/cdk8s/tsconfig.json` |
| hyperdx/cdk8s-debugexporter | `hyperdx/cdk8s-debugexporter/tsconfig.json` |
| hyperdx/cdk8s-debugexporter-cil | `hyperdx/cdk8s-debugexporter-cil/tsconfig.json` |
| hyperdx/cdk8s-cilium-nodeport | `hyperdx/cdk8s-cilium-nodeport/tsconfig.json` |
| hyperdx/cdk8s-multistack | `hyperdx/cdk8s-multistack/tsconfig.base.json` + package configs |

## Patterns Identified

### Pattern A: podinfo (CDK8S Classic)

Used by: `podinfo/cdk8s`, `podinfo/cdk8s-nodeport`

```json
{
  "compilerOptions": {
    "alwaysStrict": true,
    "declaration": true,
    "experimentalDecorators": true,
    "inlineSourceMap": true,
    "inlineSources": true,
    "lib": ["es2016"],
    "module": "CommonJS",
    "noEmit": true,
    "noEmitOnError": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "strict": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "stripInternal": true,
    "target": "ES2017"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules*"]
}
```

**Characteristics:**
- Older target: `ES2017` / `lib: es2016`
- Uses `CommonJS` module system
- `noEmit: true` (type-checking only)
- Inline source maps
- Explicit strict flags (redundant with `strict: true`)
- `experimentalDecorators: true` (for CDK8S)
- No `rootDir`/`outDir` structure

### Pattern B: hyperdx Standalone (With Emit)

Used by: `hyperdx/cdk8s`, `hyperdx/cdk8s-debugexporter`, `hyperdx/cdk8s-debugexporter-cil`, `hyperdx/cdk8s-cilium-nodeport`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS" | "NodeNext",
    "moduleResolution": "Node" | "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Characteristics:**
- Modern target: `ES2022`
- Mixed module: `CommonJS` or `NodeNext`
- Emits to `dist/` directory
- External source maps (not inline)
- No explicit lint-like flags (`noUnusedLocals`, etc.)
- Has `esModuleInterop` and `forceConsistentCasingInFileNames`

### Pattern C: hyperdx Multistack (Base + Extends)

Used by: `hyperdx/cdk8s-multistack/packages/*`

**Base config (`tsconfig.base.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  }
}
```

**Package configs:**
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

**Characteristics:**
- Modern target: `ES2022`
- `NodeNext` module system (ESM-first)
- `noEmit: true` (type-checking only, per AGENTS.md guidelines)
- `verbatimModuleSyntax: true` (cleaner imports)
- `allowImportingTsExtensions: true` (per AGENTS.md: use `.ts` extensions)
- `isolatedModules: true` (for transpilation safety)
- Shared base config with simple extends

## Key Differences

| Feature | Pattern A (podinfo) | Pattern B (hyperdx standalone) | Pattern C (multistack) |
|---------|---------------------|-------------------------------|------------------------|
| Target | ES2017 | ES2022 | ES2022 |
| Module | CommonJS | CommonJS/NodeNext | NodeNext |
| ModuleResolution | (default) | Node/NodeNext | NodeNext |
| Emit | noEmit | emits to dist | noEmit |
| SourceMap | inline | external | none |
| verbatimModuleSyntax | no | no | yes |
| allowImportingTsExtensions | no | no | yes |
| isolatedModules | no | no | yes |
| experimentalDecorators | yes | no | no |
| Lint flags (noUnused*) | yes | no | no |
| Base config pattern | no | no | yes |

## Recommended Reference Config

Based on AGENTS.md guidelines (prefer `.ts` extensions, run directly, build only for npm distribution), Pattern C is closest to our standards.

### For Development/Type-Checking (no emit)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### For CDK8S Projects (needs decorators)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"],
    "experimentalDecorators": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### For Monorepo/Base Config Pattern

**`tsconfig.base.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  }
}
```

**Per-package `tsconfig.json`:**
```json
{
  "extends": "../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

## Migration Notes

1. **Target/Module**: All projects should use `ES2022` + `NodeNext` for ESM support
2. **noEmit**: Prefer `noEmit: true` for development; build tools (tsdown) handle distribution
3. **verbatimModuleSyntax**: Enable for cleaner auto-imports
4. **allowImportingTsExtensions**: Required for AGENTS.md guideline of `.ts` imports
5. **isolatedModules**: Ensures each file can be transpiled independently
6. **Lint flags**: Remove explicit `noUnused*` flags (use oxlint instead)
7. **Source maps**: Not needed with `noEmit: true`
8. **CDK8S**: Keep `experimentalDecorators: true` only where needed
