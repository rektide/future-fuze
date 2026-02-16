# HyperDX cdk8s Cilium NodePort Implementation

TypeScript-based Kubernetes manifests using cdk8s with Cilium NodePort service exposure.

## Prerequisites

- Node.js 20+
- pnpm
- Kubernetes cluster with Cilium CNI

## Setup

```bash
cd hyperdx/cdk8s-cilium-nodeport
pnpm install
```

## Build

```bash
pnpm build
```

## Synthesize Manifests

```bash
pnpm synth
```

Output goes to `dist/` directory.

## Configuration

### NodePort Settings

```typescript
nodePort: {
  enabled: true,
  appPort: 30080,      // HyperDX UI
  apiPort: 30000,      // HyperDX API
  otlpGrpcPort: 30317, // OTLP gRPC
  otlpHttpPort: 30318, // OTLP HTTP
}
```

### Cilium Settings

```typescript
cilium: {
  localhostOnly: false, // Set to true to restrict to localhost only
}
```

## Localhost-Only Access

**Important**: NodePort binding to localhost vs all interfaces is cluster-wide configuration, not per-service. 

To restrict NodePort access to localhost only, this implementation uses **Cilium Host Firewall** (`CiliumClusterwideNetworkPolicy`):

- Set `cilium.localhostOnly: true` in config
- A `CiliumClusterwideNetworkPolicy` is generated that:
  - Denies ingress from `world` entity (external traffic)
  - Allows ingress from `cluster` and `host` entities

### Accessing Services

With default NodePort configuration:

```bash
# HyperDX UI (localhost only if localhostOnly: true)
http://localhost:30080

# HyperDX API
http://localhost:30000

# OTLP gRPC (for telemetry ingestion)
localhost:30317

# OTLP HTTP
http://localhost:30318
```

### Alternative: Cluster-Wide Localhost Binding

For true localhost-only binding at the NodePort level (affects ALL NodePorts in cluster):

```bash
# Cilium Helm values
helm upgrade cilium cilium/cilium --namespace kube-system \
  --set nodePort.addresses='{"127.0.0.0/8"}'
```

**Warning**: This affects all NodePort services cluster-wide, not just HyperDX.

## Structure

```
cdk8s-cilium-nodeport/
├── src/
│   ├── config.ts         # Configuration types and defaults
│   ├── namespace.ts      # Namespace construct
│   ├── db.ts             # MongoDB construct
│   ├── ch-server.ts      # ClickHouse construct
│   ├── otel-collector.ts # OpenTelemetry Collector with NodePort
│   ├── app.ts            # HyperDX App with NodePort
│   ├── cilium-policy.ts  # CiliumLocalhostPolicy construct
│   └── main.ts           # Entry point
├── package.json
├── tsconfig.json
├── cdk8s.yaml
└── README.md
```

## Comparison with Base cdk8s

| Feature | Base cdk8s | Cilium NodePort |
|---------|-----------|-----------------|
| Service Type | LoadBalancer/ClusterIP | NodePort |
| Host Access | Requires LoadBalancer | Direct via NodePort |
| Localhost Option | No | Yes (via Cilium policy) |
| External IP | Depends on cloud | Node IP + NodePort |
| Cilium Required | No | Yes (for localhost policy) |

## Customization

Edit `src/config.ts` or create a custom config:

```typescript
import { HyperDXCiliumConfig, defaultConfig } from './config.js';

const myConfig: HyperDXCiliumConfig = {
  ...defaultConfig,
  nodePort: {
    enabled: true,
    appPort: 31080, // Custom port
    apiPort: 31000,
    otlpGrpcPort: 31317,
    otlpHttpPort: 31318,
  },
  cilium: {
    localhostOnly: true, // Restrict to localhost
  },
};
```

## Notes

- NodePorts must be in range 30000-32767 by default
- `externalTrafficPolicy: Local` preserves source IP and routes only to local pods
- Cilium must be installed with kube-proxy replacement or alongside kube-proxy
- The `CiliumClusterwideNetworkPolicy` requires Cilium's host firewall feature
