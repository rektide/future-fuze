# Podinfo cdk8s Reference Toolchain

This note captures the reference build and synth toolchain from the imported PodInfo example in [`/podinfo/cdk8s-team-codex`](/podinfo/cdk8s-team-codex). This is discovery-only documentation; we are not wiring build automation in `future-fuze` yet.

## Canonical references

- Local copy: [`/podinfo/cdk8s-team-codex/package.json`](/podinfo/cdk8s-team-codex/package.json)
- Local synth config: [`/podinfo/cdk8s-team-codex/cdk8s.yaml`](/podinfo/cdk8s-team-codex/cdk8s.yaml)
- Local TS config: [`/podinfo/cdk8s-team-codex/tsconfig.json`](/podinfo/cdk8s-team-codex/tsconfig.json)
- Upstream package config: [`cdk8s-team/cdk8s-examples` `typescript/cdk8s-plus-pod-info/package.json`](https://github.com/cdk8s-team/cdk8s-examples/blob/main/typescript/cdk8s-plus-pod-info/package.json)
- Upstream synth config: [`cdk8s-team/cdk8s-examples` `typescript/cdk8s-plus-pod-info/cdk8s.yaml`](https://github.com/cdk8s-team/cdk8s-examples/blob/main/typescript/cdk8s-plus-pod-info/cdk8s.yaml)

## Reference toolchain

1. Package manager and scripts
   - Uses npm scripts in `package.json`.
   - `build` delegates to `synth`.
   - `synth` runs `cdk8s synth`.

2. Synthesis entrypoint
   - `cdk8s.yaml` declares `app: ts-node index.ts`.
   - `cdk8s-cli` executes the app through `ts-node` during synth.

3. Language and compile posture
   - TypeScript source is executed directly (`index.ts`).
   - `tsconfig.json` sets `noEmit: true`, so type-checking is separate from JS artifact emission.
   - Module target is CommonJS with strict compiler flags.

4. Runtime dependencies
   - `cdk8s` and `constructs` provide app/chart primitives.
   - `cdk8s-plus-26` provides higher-level Kubernetes constructs.
   - Dev toolchain includes `cdk8s-cli`, `ts-node`, and `typescript`.

5. Synth output model
   - The app calls `app.synth()` in `index.ts`.
   - Reference output is a Kubernetes manifest in `dist/` (for this example: `dist/pod-info.k8s.yaml`).

## What this means for `future-fuze`

- We now have the reference source layout and can run it manually later with the same command chain (`npm run build` -> `cdk8s synth`).
- No local build, install, or CI integration is added by this change.
