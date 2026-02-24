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
| Namespace / shared primitives | x | x | x | x | - | - | x | x |
| app (website + API) | x | x | x | x | - | - | x | x |
| otel-collector | x | x | x | x | - | - | x | x |
| opamp supervisor behavior | ~ | ~ | ~ | ~ | - | - | ~ | ~ |
| ch-server (ClickHouse) | x | x | x | x | - | - | x | x |
| db (MongoDB) | x | x | x | x | - | - | x | x |
| ingress/service exposure | ~ | ~ | ~ | ~ | - | - | ~ | ~ |
| secrets/config modeling | ~ | x | x | x | - | - | x | x |
| storage/PVC strategy | x | x | x | x | - | - | x | x |

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

### cdk8s-multistack/
Standalone pnpm monorepo for split cdk8s stacks, with storage managed independently from runtime workloads.

```bash
cd cdk8s-multistack
pnpm install
pnpm synth
```

See [`/cdk8s-multistack/README.md`](/cdk8s-multistack/README.md) for package-level stack boundaries, PVC claim contracts, and init-container bootstrap flow.

### ytt/
Carvel ytt templates. YAML-native templating with values file.

```bash
cd ytt
ytt -f .
```

### cue/
CUE-based manifests with schema validation.

```bash
cd cue
cue export -e output -o manifest.yaml
```

### helm/
Helm chart with templated values.

```bash
cd helm
helm template hyperdx ./hyperdx
helm install hyperdx ./hyperdx
```

### kustomize/
Kustomize base with dev/prod overlays.

```bash
cd kustomize
kubectl kustomize overlays/dev
kubectl apply -k overlays/prod
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
  cdk8s-multistack/
    package.json
    pnpm-workspace.yaml
    packages/
      contracts/
      storage-db/
      storage-clickhouse/
      storage-init/
      workloads-stateful/
    README.md
  ytt/
    values.yaml
    namespace.yaml
    db.yaml
    ch-server.yaml
    otel-collector.yaml
    app.yaml
    README.md
  cue/
    values.cue
    namespace.cue
    db.cue
    ch-server.cue
    otel-collector.cue
    app.cue
    export.cue
    README.md
  helm/
    hyperdx/
      Chart.yaml
      values.yaml
      templates/
        _helpers.tpl
        namespace.yaml
        db-*.yaml
        ch-server-*.yaml
        otel-collector-*.yaml
        app-*.yaml
      README.md
  kustomize/
    base/
      kustomization.yaml
      namespace.yaml
      db.yaml
      ch-server.yaml
      otel-collector.yaml
      app.yaml
    overlays/
      dev/
        kustomization.yaml
      prod/
        kustomization.yaml
    README.md
  pulumi/
  jsonnet/
```

## Notes on Collector/Supervisor Focus

The collector Dockerfiles are multi-stage and combine several moving parts (collector binary, OpAMP supervisor, migration tooling, gomplate, runtime scripts). CUE and Pulumi are especially strong candidates for expressing this composition with explicit structure and reusable config constraints.

## Implementation Review

### Specific Observations

**Raw YAML (manifests/)**
- Pros: Immediate readability, no toolchain, direct `kubectl apply`
- Cons: No parametrization, duplication across environments, drift-prone
- Best for: Reference implementation, small static deployments

**cdk8s/**
- Pros: Full TypeScript type safety, IDE autocomplete, composable constructs
- Cons: Build step required, cdk8s-plus API learning curve, verbose for simple cases
- Best for: Teams already in TypeScript, complex composition logic, reusable library building
- Notable: The `Config` type pattern provides good schema documentation

**ytt/**
- Pros: YAML-native, familiar syntax, Carvel ecosystem integration
- Cons: `#@` syntax can be confusing, limited type checking, stringly-typed values
- Best for: Platform teams comfortable with YAML, GitOps workflows, Carvel toolchain users

**CUE/**
- Pros: Strong schema validation, elegant string interpolation, unified data model
- Cons: Learning curve for CUE semantics, smaller community, tooling still maturing
- Best for: Schema-first teams, configuration-as-code purists, validation-critical environments
- Notable: The `#Config` definition pattern is reusable across projects

**Helm/**
- Pros: Widely adopted, rich ecosystem, `helm install/upgrade/rollback` workflow
- Cons: Go templating is verbose, limited type safety, chart debugging difficult
- Best for: Standard Kubernetes deployments, teams with Helm expertise, chart distribution

**Kustomize/**
- Pros: Built into kubectl, declarative overlays, no templating language
- Cons: JSON patches are verbose, complex patches hard to read, limited logic
- Best for: Environment-specific patches, kubectl-native workflows, simple customizations

## Alternative Decomposition Approaches

The current decomposition splits by **service** (app, db, ch-server, otel-collector). Other valid approaches:

### By Data Flow (Pipeline Decomposition)
```
ingestion/     → otel-collector, fluentd receivers
storage/       → ch-server, db
query/         → app API layer
presentation/  → app frontend
```
Useful when: Data sovereignty matters, different teams own pipeline stages.

### By Deployment Lifecycle
```
stateful/      → db, ch-server (careful rollout, backup policies)
stateless/     → app, otel-collector (can scale/replace freely)
support/       → namespace, secrets, config (prerequisites)
```
Useful when: Deployment automation varies by criticality, separate CI/CD pipelines.

### By Team Ownership (Conway's Law)
```
platform/      → namespace, shared secrets, storage classes
observability/ → otel-collector, monitoring config
data/          → ch-server, db, backup jobs
app/           → app deployment and service
```
Useful when: Multiple teams maintain the stack, clear ownership boundaries needed.

### By Dependency Layer
```
layer-0/       → namespace, RBAC, storage classes
layer-1/       → db, ch-server (persistent state)
layer-2/       → otel-collector (depends on layer-1)
layer-3/       → app (depends on all above)
```
Useful when: Staged rollouts, dependency-aware deployment ordering, ArgoCD ApplicationSets.

### By Resource Type
```
compute/       → all Deployments
network/       → all Services, Ingress
storage/       → all PVCs, ConfigMaps, Secrets
```
Useful when: Different teams manage different resource types, quota management by type.

## Cross-Project Applicable Lessons

### For Observability Platforms

1. **Collector complexity is underestimated** — OTel collectors combine configuration, supervision, and migrations. Model this explicitly, not as a generic "collector" component.

2. **Schema definitions pay dividends** — CUE's `#Config` and cdk8s's `Config` interface both serve as executable documentation. Prefer systems that encode schema.

3. **Defaults vs overlays** — Every system needs a way to express "sensible defaults" and "environment deltas". Helm values, Kustomize overlays, CUE value unification all solve this differently.

4. **Secret management is the hard problem** — None of the implementations here solve secrets well. They all use placeholder values. Real systems need: external-secrets, sealed-secrets, vault integration, or cloud KMS.

5. **Storage sizing is environment-specific** — Dev needs 10Gi, prod needs 500Gi. The decomposition must surface storage as configurable, not hardcoded.

### For Kubernetes Templating

1. **Type safety vs adoption** — cdk8s/CUE give type safety but smaller communities. Helm/Kustomize have adoption but weaker validation. Choose based on team size and change frequency.

2. **One tool rarely suffices** — Real stacks combine: Helm for packaging + Kustomize for patches + CUE for validation. Design for composability.

3. **The `helm template` escape hatch** — Even if using Helm, `helm template` into raw YAML for GitOps. It gives you the Helm ecosystem without Helm-as-deployer.

4. **Labels are your API** — Consistent labels (`app.kubernetes.io/*`) enable tooling. Every implementation should use standard labels from the start.

5. **Namespace isolation vs namespace-per-env** — Single namespace + labels vs namespace-per-environment is a fundamental choice. It affects RBAC, resource quotas, and blast radius.

## Possible Next Steps

### Immediate
- [ ] Add Pulumi implementation (infrastructure-as-code, full programming language)
- [ ] Add Jsonnet/Tanka implementation (mature, strong composition)
- [ ] Add OpAMP supervisor configuration modeling (currently `~` partial across all)
- [ ] Add Ingress/Gateway API templates (currently `~` partial)
- [ ] Add migration Job definitions (referenced in scope, not implemented)

### Improvements
- [ ] External secrets integration (vault, external-secrets-operator)
- [ ] Pod disruption budgets for stateful services
- [ ] Horizontal pod autoscaler configurations
- [ ] Network policies for namespace isolation
- [ ] Service mesh integration (Istio/Linkerd sidecar injection)
- [ ] Backup CronJob definitions for db and ch-server
- [ ] Resource quotas and limit ranges
- [ ] Prometheus ServiceMonitor/PodMonitor CRDs

### Evaluation Work
- [ ] Create comparison script that renders all implementations to YAML
- [ ] Line count comparison across implementations
- [ ] Diff analysis for semantic equivalence
- [ ] CI integration to verify all implementations stay in sync
- [ ] Performance comparison for large-scale deployments (100+ replicas)

### Documentation
- [ ] Migration guide: raw YAML → Helm chart
- [ ] Migration guide: Helm → CUE
- [ ] Decision tree: which implementation for which use case
- [ ] Runbook: common operations across all implementations

## Possible Improvements

### Architectural
- Consider **operator pattern** for HyperDX: a custom controller that manages the full stack as a single CRD
- Explore **separate charts per component** with umbrella chart for composition
- Model **multi-cluster** deployment (federated ClickHouse, regional collectors)

### Operational
- Add **health check** endpoints to all services
- Implement **graceful shutdown** for stateful services
- Add **init containers** for dependency checks
- Model **blue/green** deployment strategies

### Developer Experience
- Create a **unified CLI** that wraps all implementations
- Add **schema validation** CI step for raw YAML
- Generate **documentation** from CUE/cdk8s schemas
- Build **visualizer** for dependency graph between components

## Broader Observations

Building an observability platform on Kubernetes reveals patterns applicable to any complex multi-service deployment:

1. **State is the axis of complexity** — The difference between `app` (stateless) and `ch-server` (stateful) dominates deployment strategy. Separate these early.

2. **Configuration surface area grows faster than code** — Every implementation has ~5x more config-related content than compute. Plan for configuration management, not just deployment.

3. **The "all-in-one" image is a deployment trap** — HyperDX's docker-compose includes an all-in-one image. Kubernetes deployments should not replicate this; decompose into separate pods.

4. **Observability for observability is meta** — The stack monitors itself. Circular dependencies in health checks, scraping, and alerting require careful design.

5. **Migrations are not optional** — Both ClickHouse and the OTel collector have migration tooling. Kubernetes Jobs for migrations must be part of the deployment model.
