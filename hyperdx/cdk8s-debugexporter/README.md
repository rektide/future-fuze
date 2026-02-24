# HyperDX cdk8s OpenTelemetry Debug Exporter

TypeScript-based cdk8s package that deploys an OpenTelemetry Collector using the debug exporter.

## Setup

```bash
cd hyperdx/cdk8s-debugexporter
pnpm install
```

## Build and synthesize

```bash
pnpm build
pnpm synth
```

## What this package creates

- `Namespace` for the stack
- `ConfigMap` with an extensive collector config using `debug` exporters
- `Deployment` running `otel/opentelemetry-collector-contrib`
- `Service` exposing OTLP ingest and diagnostics ports

## Example config map detail

The generated `otel-debug-exporter-config` ConfigMap includes:

- OTLP gRPC + HTTP receiver
- Host metrics receiver
- Memory limiter, batch, resource, attributes, transform, and filter processors
- Two debug exporters (`normal` and `detailed` verbosity)
- Spanmetrics connector
- Prometheus exporter for scraped metrics

The configuration is generated in `src/debug-exporter.ts`.

## Example Prometheus metrics debug config

An example collector config focused on Prometheus metrics with `debug` export is available at:

- [`examples/prometheus-debug-exporter.yaml`](/cdk8s-debugexporter/examples/prometheus-debug-exporter.yaml)
