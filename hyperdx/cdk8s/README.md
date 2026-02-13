# HyperDX cdk8s Implementation

TypeScript-based Kubernetes manifests using cdk8s.

## Prerequisites

- Node.js 20+
- pnpm

## Setup

```bash
cd hyperdx/cdk8s
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

## Structure

```
cdk8s/
├── src/
│   ├── config.ts         # Configuration types and defaults
│   ├── namespace.ts      # Namespace construct
│   ├── db.ts             # MongoDB construct
│   ├── ch-server.ts      # ClickHouse construct
│   ├── otel-collector.ts # OpenTelemetry Collector construct
│   ├── app.ts            # HyperDX App construct
│   └── main.ts           # Entry point
├── package.json
├── tsconfig.json
└── cdk8s.yaml
```

## Customization

Edit `src/config.ts` to modify default values, or pass a custom config to `HyperDXStack`.

## Comparison with Raw YAML

Advantages:
- Type-safe configuration
- Reusable constructs
- Easy to parametrize for different environments
- IDE support for Kubernetes API types

Disadvantages:
- Build step required
- More verbose than raw YAML
- Learning curve for cdk8s patterns
