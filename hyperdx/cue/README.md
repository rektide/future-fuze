# HyperDX CUE Implementation

Schema-safe Kubernetes manifests using CUE.

## Prerequisites

- [cue](https://cuelang.org/) CLI tool (v0.6+)

## Usage

Validate configuration:

```bash
cd hyperdx/cue
cue vet .
```

Render manifests:

```bash
cue export -e output -o manifest.yaml
```

Print to stdout:

```bash
cue export -e output
```

Customize values by creating an override file:

```bash
# Create override
cat > my-values.cue << 'EOF'
package hyperdx

config: namespace: "my-namespace"
config: db: storageSize: "50Gi"
EOF

# Export with overrides
cue export -e output -o manifest.yaml
```

## Structure

```
cue/
├── values.cue         # Configuration schema and defaults
├── namespace.cue      # Namespace template
├── db.cue             # MongoDB template
├── ch-server.cue      # ClickHouse template
├── otel-collector.cue # OpenTelemetry Collector template
├── app.cue            # HyperDX App template
├── export.cue         # Combines all into output list
└── README.md
```

## Type Safety

CUE provides compile-time validation:

```bash
# This will fail with a type error
cue vet . <<EOF
package hyperdx

config: app: apiPort: "not-a-number"
EOF
```

## Comparison with Other Implementations

Advantages:
- Strong type system with schema validation
- String interpolation for clean templating
- Data merging/composition for overrides
- Single binary tool with no runtime dependencies

Disadvantages:
- Learning curve for CUE syntax
- Less IDE support than TypeScript
- Smaller community than Helm/Kustomize
