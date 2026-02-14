# HyperDX Helm Chart

Helm chart for deploying HyperDX observability platform.

## Prerequisites

- Helm 3.x
- Kubernetes cluster

## Installation

```bash
cd hyperdx/helm

# Install with default values
helm install hyperdx ./hyperdx

# Install with custom namespace
helm install hyperdx ./hyperdx --namespace my-namespace --create-namespace

# Dry-run to see generated manifests
helm template hyperdx ./hyperdx
```

## Configuration

Key values can be customized via `values.yaml` or `--set` flags:

```bash
helm install hyperdx ./hyperdx \
  --set namespace=prod-hyperdx \
  --set db.storageSize=50Gi \
  --set clickhouse.dataStorageSize=200Gi \
  --set app.logLevel=info
```

### Values Reference

| Key | Default | Description |
|-----|---------|-------------|
| `namespace` | `hyperdx` | Kubernetes namespace |
| `db.image` | `mongo:5.0.32-focal` | MongoDB image |
| `db.storageSize` | `20Gi` | MongoDB PVC size |
| `clickhouse.image` | `clickhouse/clickhouse-server:25.6-alpine` | ClickHouse image |
| `clickhouse.httpPort` | `8123` | ClickHouse HTTP port |
| `clickhouse.nativePort` | `9000` | ClickHouse native port |
| `clickhouse.dataStorageSize` | `100Gi` | ClickHouse data PVC size |
| `clickhouse.logsStorageSize` | `10Gi` | ClickHouse logs PVC size |
| `otelCollector.image` | `docker.clickhouse.com/clickstack-otel-collector:2` | OTEL Collector image |
| `app.image` | `docker.hyperdx.io/hyperdx/hyperdx:2` | HyperDX app image |
| `app.apiPort` | `8000` | API port |
| `app.appPort` | `8080` | App/frontend port |
| `app.apiKey` | `replace-with-hyperdx-api-key` | API key (set via secret in production) |
| `app.serviceType` | `LoadBalancer` | Service type for app |

## Structure

```
helm/hyperdx/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── namespace.yaml
│   ├── db-pvc.yaml
│   ├── db-deployment.yaml
│   ├── db-service.yaml
│   ├── ch-server-configmap.yaml
│   ├── ch-server-pvc.yaml
│   ├── ch-server-deployment.yaml
│   ├── ch-server-service.yaml
│   ├── otel-collector-deployment.yaml
│   ├── otel-collector-service.yaml
│   ├── app-secret.yaml
│   ├── app-configmap.yaml
│   ├── app-deployment.yaml
│   └── app-service.yaml
└── README.md
```

## Uninstallation

```bash
helm uninstall hyperdx
```
