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

## TypeScript Tooling

### tsgo vs typescript Adoption

| Project | Tool | Package | Version |
|---------|------|---------|---------|
| podinfo/cdk8s | `tsc` | `typescript` | `^4.9.5` |
| podinfo/cdk8s-nodeport | `tsc` | `typescript` | (none) |
| hyperdx/cdk8s | `tsc` | `typescript` | `^5.9.3` |
| hyperdx/cdk8s-debugexporter | `tsc` | `typescript` | `^5.9.3` |
| hyperdx/cdk8s-debugexporter-cil | `tsc` | `typescript` | `^5.9.3` |
| hyperdx/cdk8s-cilium-nodeport | `tsc` | `typescript` | `^5.3.0` |
| hyperdx/cdk8s-multistack | `tsgo` | `@typescript/native-preview` | `latest` |

### tsgo Implementation Pattern (hyperdx/cdk8s-multistack)

Only `hyperdx/cdk8s-multistack` uses `tsgo` from `@typescript/native-preview`.

**Monorepo Structure:**
```
hyperdx/cdk8s-multistack/
├── package.json              # Root: orchestrates with pnpm -r
├── pnpm-workspace.yaml       # Defines packages/*
├── tsconfig.base.json        # Shared tsconfig
└── packages/
    ├── contracts/
    │   ├── package.json      # typecheck script uses tsgo
    │   └── tsconfig.json     # extends base
    ├── workloads-stateful/
    ├── storage-init/
    ├── storage-clickhouse/
    └── storage-db/
```

**Root `package.json`:**
```json
{
  "name": "hyperdx-cdk8s-multistack",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.6.5",
  "scripts": {
    "typecheck": "pnpm -r run typecheck",
    "synth": "pnpm -r run synth"
  }
}
```

**Per-package `package.json` (e.g., contracts):**
```json
{
  "name": "@hyperdx-cdk8s-multistack/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsgo --noEmit -p tsconfig.json"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@typescript/native-preview": "latest"
  }
}
```

### Key Implementation Details

1. **Dependency hoisting**: `@typescript/native-preview` is declared in each package's `devDependencies`, not at root. pnpm's lockfile shows platform-specific binaries are resolved correctly.

2. **Script pattern**: All packages use identical typecheck script:
   ```json
   "typecheck": "tsgo --noEmit -p tsconfig.json"
   ```

3. **Version pinning**: Uses `"latest"` for `@typescript/native-preview` (dev build, not stable release)

4. **Workspace dependencies**: Packages reference each other via `workspace:*` protocol:
   ```json
   "dependencies": {
     "@hyperdx-cdk8s-multistack/contracts": "workspace:*"
   }
   ```

5. **ESM-first**: Root and all packages have `"type": "module"`

### Projects Still Using tsc

The following projects use the standard `typescript` package with `tsc`:

| Project | Script Pattern |
|---------|----------------|
| hyperdx/cdk8s | `"build": "tsc"` |
| hyperdx/cdk8s-debugexporter | `"build": "tsc"` |
| hyperdx/cdk8s-debugexporter-cil | `"build": "tsc"` |
| hyperdx/cdk8s-cilium-nodeport | `"build": "tsc"` |
| podinfo/cdk8s | No typecheck script (only `synth`) |

**Issues with current tsc projects:**
- No dedicated `typecheck` script (conflated with `build`)
- Mixed typescript versions (4.9.5, 5.3.0, 5.9.3)
- podinfo/cdk8s-nodeport has no typescript dependency at all

### Recommended Tooling Pattern

For consistency with AGENTS.md guidelines:

```json
{
  "scripts": {
    "typecheck": "tsgo --noEmit -p tsconfig.json"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@typescript/native-preview": "latest"
  }
}
```

**Benefits of tsgo:**
- Native Go implementation (faster than tsc)
- Same CLI arguments as tsc
- Aligns with AGENTS.md preference for `@typescript/native-preview`
