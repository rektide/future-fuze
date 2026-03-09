# package-config apply

Reference documentation for the `apply` command and its configuration actions.

## Action Reference Table

| Config | Action | Description | Dry-Run |
|--------|--------|-------------|:-------:|
| **global** | ensure-self | Install `@future-fuze/package-config` as devDependency | ☐ |
| **global** | pm-install | Run package manager install (`pnpm install` or `npm install`) | ☐ |
| **formatting** | prettierrc | Create/update `.prettierrc.json` with `"@future-fuze/package-config/formatting"` | ☐ |
| **formatting** | package-json | Add `type: "module"`, `oxfmt` devDependency, `fmt` script to `package.json` | ☐ |
| **formatting** | oxfmt | Run `oxfmt .` to format project files | ☐ |
| **tsconfig** | package-json | Add `@typescript/native-preview` devDependency, `test:tsgo` script to `package.json` | ☐ |
| **tsconfig** | tsconfig | Create/update `tsconfig.json` with extends and compilerOptions | ☐ |
| **esm** | package-json | Add `type: "module"` to `package.json` | ☐ |
| **vitest** | package-json | Add `vitest` devDependency, `test:vitest` script to `package.json` | ☐ |
| **concurrently** | package-json | Add `concurrently` devDependency, `build` and `test` scripts to `package.json` | ☐ |
| **cdk8s** | package-json | Add `build:cdk8s` script to `package.json` | ☐ |

### Legend

- **Config**: The `--config` value that triggers this action
- **Action**: Identifier for the specific action within that config
- **Description**: What the action does
- **Dry-Run**: Whether the action has dry-run verification (☐ = not yet implemented, ☑ = implemented)

## Execution Order

1. `ensure-self` - Install package-config itself
2. Per-config actions (in order: tsconfig, formatting, concurrently, cdk8s, vitest, esm)
3. `pm-install` - Run package manager install
4. `oxfmt` - Format files (only if formatting config was applied)

## Action Result Status

Each action should report one of three statuses:

| Status | Meaning |
|--------|---------|
| `created` | File or field was newly added |
| `updated` | Existing file or field was modified |
| `unchanged` | File or field already matched desired state |

## Early-Exit Problem

Currently, configs may exit early when the first check passes, skipping subsequent actions. For example:

- `formatting` exits after confirming `.prettierrc.json` is correct, but may skip `package.json` updates
- Actions need to check all their responsibilities before reporting "already up-to-date"

## Future Work

- [ ] Implement dry-run verification for all actions
- [ ] Make each action report `created`/`updated`/`unchanged` status
- [ ] Fix early-exit behavior to check all actions before stopping
