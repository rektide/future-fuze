# HyperDX cdk8s Multistack

This is a standalone pnpm monorepo for a split-stack cdk8s implementation where storage is managed separately from runtime workloads.

## Goals

- Keep persistent storage lifecycle independent from application rollout lifecycle.
- Give each storage area its own cdk8s project/package.
- Share claim names through one contract package so workload charts can safely bind to existing claims.
- Keep volume bootstrap/init logic in a dedicated package so storage can be prepared before app pods run.

## Packages

- [`/cdk8s-multistack/packages/contracts/src/index.ts`](/cdk8s-multistack/packages/contracts/src/index.ts): shared namespace, claim names, and labels.
- [`/cdk8s-multistack/packages/storage-db/src/main.ts`](/cdk8s-multistack/packages/storage-db/src/main.ts): MongoDB PVC stack.
- [`/cdk8s-multistack/packages/storage-clickhouse/src/main.ts`](/cdk8s-multistack/packages/storage-clickhouse/src/main.ts): ClickHouse PVC stack (data + logs).
- [`/cdk8s-multistack/packages/storage-init/src/main.ts`](/cdk8s-multistack/packages/storage-init/src/main.ts): storage bootstrap Jobs with init containers.
- [`/cdk8s-multistack/packages/workloads-stateful/src/main.ts`](/cdk8s-multistack/packages/workloads-stateful/src/main.ts): stateful runtime workloads that only consume pre-created claims.

## Claim to Volume Binding

The runtime chart refers to a volume by PVC claim name only.

```yaml
volumes:
  - name: ch-data
    persistentVolumeClaim:
      claimName: ch-data
```

Binding behavior:

1. The storage stack creates the PVC (`ch-data`).
2. Kubernetes binds that PVC to a PV via `storageClassName` + provisioner (or explicit `volumeName` if desired).
3. The workload pod mounts the PVC by `claimName` and does not need to know the PV identity.

This keeps the workload package decoupled from backend storage implementation details.

## Init Container Strategy

`storage-init` uses `Job` resources with init containers that mount each claim and perform bootstrap work (`mkdir`, `chown`, sentinel file). This provides a safe pre-flight path where volumes can be initialized before app/runtime pods are rolled out.

The runtime package also includes lightweight init containers that verify mounted paths are writable, so startup fails early if storage contracts are missing.

## Render Manifests

```bash
cd cdk8s-multistack
pnpm install
pnpm synth
```

Or synthesize one stack at a time:

```bash
pnpm --filter @hyperdx-cdk8s-multistack/storage-db synth
pnpm --filter @hyperdx-cdk8s-multistack/storage-clickhouse synth
pnpm --filter @hyperdx-cdk8s-multistack/storage-init synth
pnpm --filter @hyperdx-cdk8s-multistack/workloads-stateful synth
```

Suggested apply order:

1. `storage-db`
2. `storage-clickhouse`
3. `storage-init`
4. `workloads-stateful`
