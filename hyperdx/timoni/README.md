# HyperDX Timoni Implementation

Timoni-based Kubernetes stack definition for HyperDX, using local Timoni modules and a Bundle for orchestration.

## Prerequisites

- [Timoni](https://timoni.sh/install/) CLI
- Kubernetes cluster (only required for `apply`)

## Structure

- [`/timoni/hyperdx.bundle.cue`](/timoni/hyperdx.bundle.cue): bundle that composes the full stack from local modules.
- [`/timoni/modules/storage`](/timoni/modules/storage): storage claims only (PVCs).
- [`/timoni/modules/storage-init`](/timoni/modules/storage-init): volume bootstrap jobs.
- [`/timoni/modules/stateful`](/timoni/modules/stateful): MongoDB and ClickHouse workloads.
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

This implementation keeps storage in dedicated modules and instances:

1. `storage` creates PVCs.
2. `storage-init` runs bootstrap `Job` resources with `initContainers` to prepare ownership and directories.
3. `stateful` mounts existing claims by name and does not create PVCs.

That split allows storage lifecycle management independent of app rollout.
