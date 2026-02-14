# HyperDX Kustomize Implementation

Kubernetes manifests using Kustomize for overlay-based configuration.

## Prerequisites

- kubectl with Kustomize support (v1.14+) or `kustomize` CLI

## Usage

### Build base manifests

```bash
cd hyperdx/kustomize
kubectl kustomize base
```

### Build dev overlay

```bash
kubectl kustomize overlays/dev
```

### Build prod overlay

```bash
kubectl kustomize overlays/prod
```

### Apply to cluster

```bash
# Apply dev
kubectl apply -k overlays/dev

# Apply prod
kubectl apply -k overlays/prod
```

## Structure

```
kustomize/
├── base/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── db.yaml
│   ├── ch-server.yaml
│   ├── otel-collector.yaml
│   └── app.yaml
├── overlays/
│   ├── dev/
│   │   └── kustomization.yaml
│   └── prod/
│       └── kustomization.yaml
└── README.md
```

## Overlays

### dev
- Smaller storage sizes (10Gi db, 50Gi clickhouse)
- `-dev` name suffix
- `environment: dev` label

### prod
- Larger storage sizes (100Gi db, 500Gi clickhouse)
- 3 replicas for app deployment
- `-prod` name suffix
- `environment: prod` label
- `owner: platform-team` annotation

## Customization

Create your own overlay:

```bash
mkdir -p overlays/my-env
cat > overlays/my-env/kustomization.yaml << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: hyperdx-mine

resources:
  - ../../base

commonLabels:
  environment: mine
EOF
```

## Comparison with Raw YAML

Advantages:
- Declarative overlay system
- Built into kubectl
- No templating language to learn
- Good for environment-specific patches

Disadvantages:
- Can become complex with many patches
- JSON patch syntax is verbose
- Limited conditional logic
