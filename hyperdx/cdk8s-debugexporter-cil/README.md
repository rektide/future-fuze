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

## Example L2 announcement trace debugger

- [`examples/otel-trace-debugger-l2announcement.yaml`](/cdk8s-debugexporter-cil/examples/otel-trace-debugger-l2announcement.yaml)
- Includes a trace-only OpenTelemetry collector debug pipeline, a `LoadBalancer` service, `CiliumLoadBalancerIPPool`, and `CiliumL2AnnouncementPolicy` for that service.
- Uses `externalTrafficPolicy: Cluster` because Cilium L2 announcements are not compatible with `externalTrafficPolicy: Local`.

Reference docs:

- [`Cilium` `L2 Announcements / L2 Aware LB (Beta)`](https://docs.cilium.io/en/stable/network/l2-announcements/)
- [`Cilium` `LoadBalancer IP Address Management (LB IPAM)`](https://docs.cilium.io/en/stable/network/lb-ipam/)
