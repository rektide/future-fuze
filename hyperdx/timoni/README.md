# HyperDX Timoni Implementation

Timoni-based Kubernetes stack definition for HyperDX, using local Timoni modules and a Bundle for orchestration.

## Prerequisites

- [Timoni](https://timoni.sh/install/) CLI
- Kubernetes cluster (only required for `apply`)

## Structure

- [`/timoni/hyperdx.bundle.cue`](/timoni/hyperdx.bundle.cue): bundle that composes the full stack from local modules.
- MongoDB stack:
  - [`/timoni/modules/storage-mongo`](/timoni/modules/storage-mongo): MongoDB PVC.
  - [`/timoni/modules/storage-mongo-init`](/timoni/modules/storage-mongo-init): MongoDB volume bootstrap job.
  - [`/timoni/modules/stateful-mongo`](/timoni/modules/stateful-mongo): MongoDB deployment and service.
- ClickHouse stack:
  - [`/timoni/modules/storage-clickhouse`](/timoni/modules/storage-clickhouse): ClickHouse PVCs (data + logs).
  - [`/timoni/modules/storage-clickhouse-init`](/timoni/modules/storage-clickhouse-init): ClickHouse volume bootstrap jobs.
  - [`/timoni/modules/stateful-clickhouse`](/timoni/modules/stateful-clickhouse): ClickHouse configmap, deployment, and service.
- App stack:
  - [`/timoni/modules/app`](/timoni/modules/app): OTEL collector and HyperDX app workloads.

## Validate and Render

```bash
cd hyperdx/timoni
timoni bundle vet -f hyperdx.bundle.cue
timoni bundle build -f hyperdx.bundle.cue
```

## Apply / Delete

```bash
timoni bundle apply -f hyperdx.bundle.cue
timoni bundle delete -f hyperdx.bundle.cue
```

## Storage Separation Pattern

This implementation keeps storage in dedicated modules per component:

1. `storage-mongo` creates MongoDB PVC.
2. `storage-mongo-init` runs bootstrap `Job` with `initContainers` to prepare ownership and directories.
3. `stateful-mongo` mounts the existing claim and runs MongoDB.
4. `storage-clickhouse` creates ClickHouse data and logs PVCs.
5. `storage-clickhouse-init` runs bootstrap `Job` resources for both ClickHouse volumes.
6. `stateful-clickhouse` mounts existing claims and runs ClickHouse.

That split allows storage lifecycle management independent of app rollout, and enables per-component versioning and distribution.
