# HyperDX cdk8s OpenTelemetry Debug Exporter (Cilium NodePort)

TypeScript-based cdk8s package that deploys an OpenTelemetry Collector using debug exporters with Cilium-friendly NodePort exposure.

## Setup

```bash
cd hyperdx/cdk8s-debugexporter-cil
pnpm install
```

## Build and synthesize

```bash
pnpm build
pnpm synth
```

## What this package adds

- NodePort service mode for OTLP and diagnostics endpoints
- Optional Cilium `CiliumClusterwideNetworkPolicy` for localhost-only behavior
- Extensive `ConfigMap` for debug exporter focused collector pipelines

## Default NodePort assignments

- `30133` for health
- `30317` for OTLP gRPC
- `30318` for OTLP HTTP
- `30888` for metrics

## Localhost-only mode

Set `cilium.localhostOnly: true` in `src/config.ts` to generate policy that denies ingress from `world` and allows only `cluster` and `host` entities for the configured NodePorts.
