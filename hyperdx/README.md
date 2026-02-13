# HyperDX Kubernetes Experiments Epic

This directory wraps an epic to build and compare multiple Kubernetes implementations of HyperDX.

Goal:
- Create a matrix of **HyperDX subcomponents** x **Kubernetes manifest systems**.
- Keep implementations side-by-side so we can evaluate maintainability, ergonomics, and operational behavior.
- Support experimentation first, then graduate strong options into maintained deployment paths.

## Scope

Subcomponents to model:
- `app` (website + API runtime image)
- `otel-collector` (collector + OpAMP supervisor orchestration)
- `ch-server` (ClickHouse)
- `db` (MongoDB)
- cluster entrypoints (Service/Ingress)
- config and secrets (ConfigMap/Secret)
- storage (PVC/storage classes)
- operational jobs (migrations/bootstrap checks)

## Current Baseline (One Epic Ticket)

Initial hand-written Kubernetes manifests have been generated and live in:
- `manifests/namespace.yaml`
- `manifests/app.yaml`
- `manifests/otel-collector.yaml`
- `manifests/ch-server.yaml`
- `manifests/db.yaml`

This baseline should be tracked as one ticket under this epic, and used as the control implementation to compare against generated/templated systems.

## Experiment Matrix

Legend:
- `x` = implemented
- `-` = not started
- `~` = partial/prototype

| Component | Raw YAML | Kustomize | Helm | CUE | Pulumi | Jsonnet/Tanka | cdk8s | Carvel ytt |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Namespace / shared primitives | x | - | - | - | - | - | x | x |
| app (website + API) | x | - | - | - | - | - | x | x |
| otel-collector | x | - | - | - | - | - | x | x |
| opamp supervisor behavior | ~ | - | - | - | - | - | ~ | ~ |
| ch-server (ClickHouse) | x | - | - | - | - | - | x | x |
| db (MongoDB) | x | - | - | - | - | - | x | x |
| ingress/service exposure | ~ | - | - | - | - | - | ~ | ~ |
| secrets/config modeling | ~ | - | - | - | - | - | x | x |
| storage/PVC strategy | x | - | - | - | - | - | x | x |

## Candidate Systems Beyond CUE + Pulumi

Useful manifest authoring systems to consider:
- Helm (chart templates)
- Kustomize (overlay composition)
- Jsonnet + Tanka (programmable manifests)
- cdk8s (TypeScript/Python/etc. to Kubernetes objects)
- Carvel ytt (YAML-native templating)
- kpt (package-oriented configuration management)

Optional/less common options:
- Kapitan
- Dhall for Kubernetes
- Ansible-based Kubernetes templating workflows

## Epic Structure (Suggested)

1. Baseline hardening
   - Keep raw YAML deployable as reference.
2. Helm implementation
   - Produce a chart that covers all baseline components.
3. Kustomize implementation
   - Base + environment overlays with minimal duplication.
4. CUE implementation
   - Focus on collector/supervisor composition and schema safety.
5. Pulumi implementation
   - Model full stack in code with reusable component abstractions.
6. Comparative evaluation
   - Measure complexity, readability, drift risk, and operational fit.

## Evaluation Criteria

For each implementation track:
- source-of-truth clarity
- diff readability and review quality
- environment customization ergonomics
- secret/config handling quality
- testability in CI
- onboarding and maintenance burden

## Implementations

### manifests/
Hand-written Kubernetes YAML - the baseline reference implementation.

### cdk8s/
TypeScript-based manifests using cdk8s. Generates type-safe Kubernetes resources.

```bash
cd cdk8s
pnpm install
pnpm build
pnpm synth
```

### ytt/
Carvel ytt templates. YAML-native templating with values file.

```bash
cd ytt
ytt -f .
```

## Directory Layout

```text
hyperdx/
  README.md
  manifests/
    namespace.yaml
    app.yaml
    otel-collector.yaml
    ch-server.yaml
    db.yaml
  cdk8s/
    src/
      config.ts
      namespace.ts
      db.ts
      ch-server.ts
      otel-collector.ts
      app.ts
      main.ts
    package.json
    tsconfig.json
    cdk8s.yaml
    README.md
  ytt/
    values.yaml
    namespace.yaml
    db.yaml
    ch-server.yaml
    otel-collector.yaml
    app.yaml
    README.md
  kustomize/
    base/
    overlays/
  helm/
    hyperdx/
  cue/
  pulumi/
  jsonnet/
```

## Notes on Collector/Supervisor Focus

The collector Dockerfiles are multi-stage and combine several moving parts (collector binary, OpAMP supervisor, migration tooling, gomplate, runtime scripts). CUE and Pulumi are especially strong candidates for expressing this composition with explicit structure and reusable config constraints.
