# HyperDX Carvel ytt Implementation

YAML-templated Kubernetes manifests using Carvel ytt.

## Prerequisites

- [ytt](https://carvel.dev/ytt/) CLI tool

## Usage

Render manifests with default values:

```bash
cd hyperdx/ytt
ytt -f .
```

Render with custom values:

```bash
ytt -f . --data-value namespace=my-namespace
ytt -f . --data-value app.logLevel=info
```

Render to a file:

```bash
ytt -f . > rendered.yaml
```

## Structure

```
ytt/
├── values.yaml       # Default configuration values
├── namespace.yaml    # Namespace template
├── db.yaml           # MongoDB template
├── ch-server.yaml    # ClickHouse template
├── otel-collector.yaml # OpenTelemetry Collector template
└── app.yaml          # HyperDX App template
```

## Customization

Edit `values.yaml` to modify defaults, or override with `--data-value` flags:

```bash
# Override specific values
ytt -f . \
  --data-value namespace=prod-hyperdx \
  --data-value db.storageSize=50Gi \
  --data-value clickhouse.dataStorageSize=200Gi
```

## Comparison with Raw YAML

Advantages:
- Simple templating syntax familiar to YAML users
- No build step - just ytt rendering
- Good separation of values from templates
- Supports overlays for environment-specific patches

Disadvantages:
- Less type safety than cdk8s
- Template syntax can be verbose
- Limited IDE support compared to TypeScript
