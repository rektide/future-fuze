# HyperDX Go Migration Tool

A discovery document exploring the Go program in the HyperDX observability platform.

## Overview

The HyperDX Go program (`packages/otel-collector/cmd/migrate/`) is a **ClickHouse schema migration/seed tool** that bootstraps the database schema required by HyperDX's OpenTelemetry collector.

**Repository**: https://github.com/hyperdxio/hyperdx
**Location**: `packages/otel-collector/cmd/migrate/`
**Language**: Go 1.25

### Purpose

- Creates ClickHouse tables for storing OTLP telemetry data (logs, metrics, traces, sessions)
- Uses `goose` migration library in "seed" mode (no version tracking - re-applies on every run)
- Supports TLS-secured ClickHouse connections (CA certs, client certs, mTLS)
- Converts TTL duration expressions to ClickHouse-compatible format

**Problem it solves**: The OTel collector needs ClickHouse tables to exist before it can write telemetry. This tool runs at container startup to ensure schemas are present, supporting both local dev and production deployments with various TLS configurations.

---

## Tech Stack Review

### Core Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `clickhouse-go/v2` | v2.43.0 | Native ClickHouse driver with HTTP/native protocol support, LZ4 compression, TLS |
| `goose/v3` | v3.26.0 | Database migration framework used in "seed" mode (no versioning) |
| Go | 1.25 | Runtime |

### Notable Transitive Dependencies

| Package | Purpose |
|---------|---------|
| `github.com/ClickHouse/ch-go` | Low-level ClickHouse protocol implementation |
| `github.com/pierrec/lz4/v4` | LZ4 compression for wire protocol |
| `github.com/klauspost/compress` | Additional compression support |
| `go.opentelemetry.io/otel` | OpenTelemetry tracing support |
| `github.com/google/uuid` | UUID generation |
| `github.com/sethvargo/go-retry` | Retry logic (used indirectly) |

### What These Tools Are Known For

**clickhouse-go/v2**: The official ClickHouse Go driver. Known for:
- Supporting both native (TCP) and HTTP protocols
- Full TLS/mTLS support
- Connection pooling
- LZ4 compression for better performance
- OpenTelemetry integration for observability of the driver itself

**goose/v3**: A popular database migration tool. Known for:
- Supporting multiple databases (PostgreSQL, MySQL, SQLite, ClickHouse)
- Both Go and SQL migrations
- The `WithNoVersioning()` option for "seed" mode (re-run without tracking)
- Clean CLI and Go API

---

## File Structure Review

```
packages/otel-collector/
├── cmd/migrate/
│   ├── main.go        # Core migration tool (427 lines)
│   └── main_test.go   # Comprehensive unit tests (709 lines)
├── go.mod             # Go 1.25, clickhouse-go/v2, goose/v3
├── go.sum
├── package.json       # npm package metadata (@hyperdx/otel-collector)
└── CHANGELOG.md
```

### External Schema Files

The SQL migrations are stored separately and mounted into the container:

```
docker/otel-collector/schema/seed/
├── 00001_create_database.sql      # Creates ${DATABASE}
├── 00002_otel_logs.sql            # otel_logs table
├── 00003_otel_metrics.sql         # otel_metrics_gauge, _sum, _histogram, etc.
├── 00004_hyperdx_sessions.sql     # hyperdx_sessions (session replay logs)
└── 00005_otel_traces.sql          # otel_traces table
```

### Source Code Structure (main.go)

| Lines | Function | Purpose |
|-------|----------|---------|
| 27-48 | `Config` struct | Holds all configuration options |
| 50-78 | `loadConfig()` | Reads env vars + CLI args into Config |
| 80-86 | `getEnv()` | Helper for env var with default |
| 88-122 | `parseTLSConfig()` | Builds tls.Config from files |
| 124-162 | `parseEndpoint()` | Parses tcp://, http://, https:// URLs |
| 171-221 | `createClickHouseDB()` | Creates *sql.DB connection |
| 223-235 | `parseTTLDuration()` | Parses "30d" format (Go doesn't support days) |
| 237-258 | `ttlToClickHouseInterval()` | Converts TTL to ClickHouse interval function |
| 260-310 | `processSchemaDir()` | Replaces ${DATABASE} and ${TABLES_TTL} macros |
| 313-342 | `runMigrationWithRetry()` | Runs goose with exponential backoff |
| 361-426 | `main()` | Entry point, orchestrates flow |

---

## Journal - Initial Exploration

### Investigation Goal

Understand what the Go program in HyperDX does, how it works, and its role in the broader system.

### Steps Taken

1. **Cloned the repository** to `.test-agent/hyperdx/`
2. **Identified Go files** at `packages/otel-collector/cmd/migrate/`
3. **Read main.go** (427 lines) - understood the migration tool structure
4. **Read go.mod** - identified dependencies (clickhouse-go, goose)
5. **Read SQL schema files** - understood table structures for logs, traces, metrics
6. **Read test file** - understood test coverage for TTL parsing, TLS, config loading

### Key Findings

1. **Not a collector** - Despite being in `packages/otel-collector/`, this Go program is NOT the OpenTelemetry collector itself. It's a schema migration tool that runs before the collector starts.

2. **Seed mode design** - Uses `goose.WithNoVersioning()` which means:
   - SQL files run every time (not tracked)
   - SQL must be idempotent (`CREATE TABLE IF NOT EXISTS`)
   - No version table created in ClickHouse

3. **Macro preprocessing** - SQL files use `${DATABASE}` and `${TABLES_TTL}` placeholders that are replaced at runtime before goose runs.

4. **Enterprise TLS support** - Full mTLS support suggests this is designed for ClickHouse Cloud and enterprise deployments.

---

## API Surfaces

### CLI Interface

```bash
migrate <schema-directory>
```

Single positional argument: path to directory containing SQL seed files.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLICKHOUSE_ENDPOINT` | `tcp://localhost:9000` | Connection URL (tcp/http/https) |
| `CLICKHOUSE_USER` | `default` | Username |
| `CLICKHOUSE_PASSWORD` | `""` | Password |
| `HYPERDX_OTEL_EXPORTER_CLICKHOUSE_DATABASE` | `default` | Target database |
| `HYPERDX_OTEL_EXPORTER_TABLES_TTL` | `720h` | Table TTL (supports `d`, `h`, `m`, `s`) |
| `CLICKHOUSE_TLS_CA_FILE` | `""` | CA certificate path |
| `CLICKHOUSE_TLS_CERT_FILE` | `""` | Client certificate path |
| `CLICKHOUSE_TLS_KEY_FILE` | `""` | Client private key path |
| `CLICKHOUSE_TLS_SERVER_NAME_OVERRIDE` | `""` | TLS server name override |
| `CLICKHOUSE_TLS_INSECURE_SKIP_VERIFY` | `""` | Set to `"true"` to skip verification |

### Exit Codes

- `0`: Success
- `1`: Failure (logged before exit)

---

## Journal - Schema Analysis

### Investigation Goal

Understand what tables are created and their schema design patterns.

### Files Examined

- `docker/otel-collector/schema/seed/00002_otel_logs.sql`
- `docker/otel-collector/schema/seed/00005_otel_traces.sql`

### Key Schema Patterns

**MergeTree Engine**: All tables use ClickHouse's MergeTree with:
- `PARTITION BY toDate(TimestampTime)` - daily partitions
- `ORDER BY (ServiceName, TimestampTime, Timestamp)` - optimized for service-based queries
- `TTL TimestampTime + ${TABLES_TTL}` - automatic data expiration

**Compression**: `CODEC(ZSTD(1))` and `CODEC(Delta(8), ZSTD(1))` for timestamps

**Indexes**:
- `bloom_filter(0.001)` for trace IDs (0.1% false positive rate)
- `bloom_filter(0.01)` for attribute keys/values
- `tokenbf_v1(32768, 3, 0)` for full-text search on Body/SpanName

**Materialized Columns**: Pre-extracted common attributes:
- `__hdx_materialized_k8s.*` - Kubernetes metadata
- `__hdx_materialized_deployment.environment.name`
- `__hdx_materialized_rum.sessionId` - RUM session correlation

### Tables Created

| Table | Purpose | Partition Key |
|-------|---------|---------------|
| `otel_logs` | OTLP log records | `toDate(TimestampTime)` |
| `otel_metrics_gauge` | Gauge metrics | `toDate(TimeUnix)` |
| `otel_metrics_sum` | Counter/sum metrics | `toDate(TimeUnix)` |
| `otel_metrics_histogram` | Histogram metrics | `toDate(TimeUnix)` |
| `otel_metrics_exponential_histogram` | Exponential histograms | `toDate(TimeUnix)` |
| `otel_metrics_summary` | Summary metrics | `toDate(TimeUnix)` |
| `hyperdx_sessions` | Session replay logs | `toDate(TimestampTime)` |
| `otel_traces` | OTLP trace spans | `toDate(Timestamp)` |

---

## Features and Capabilities

### 1. Multi-Protocol Endpoint Support

```go
// parseEndpoint handles multiple URL schemes:
// - tcp://host:9000    → native protocol (default port 9000)
// - http://host:8123   → HTTP protocol (default port 8123)
// - https://host:8443  → HTTPS with TLS (default port 8443)
```

### 2. Full TLS/mTLS Support

- CA certificate verification
- Client certificate authentication (mutual TLS)
- Server name override for certificate validation
- Insecure skip verify option (for development)

### 3. Extended Duration Parsing

```go
// Go's time.ParseDuration doesn't support days
// This tool adds "d" suffix support:
ttlToClickHouseInterval("30d")  // → "toIntervalDay(30)"
ttlToClickHouseInterval("36h")  // → "toIntervalHour(36)"
ttlToClickHouseInterval("90m")  // → "toIntervalMinute(90)"
```

### 4. Retry with Exponential Backoff

```go
// 5 retries: 1s, 2s, 4s, 8s, 16s
// Handles ClickHouse not being ready at container startup
runMigrationWithRetry(ctx, db, tempDir, 5)
```

### 5. Macro Preprocessing

SQL files can use variables that are replaced at runtime:

```sql
CREATE TABLE IF NOT EXISTS ${DATABASE}.otel_logs (
  ...
)
TTL TimestampTime + ${TABLES_TTL}
```

---

## Examples of Use

### Local Development (Docker Compose)

```yaml
# docker-compose.yml
services:
  otel-collector:
    image: docker.clickhouse.com/clickstack-otel-collector:2
    environment:
      CLICKHOUSE_ENDPOINT: 'tcp://ch-server:9000?dial_timeout=10s'
      HYPERDX_OTEL_EXPORTER_CLICKHOUSE_DATABASE: default
      HYPERDX_OTEL_EXPORTER_TABLES_TTL: 720h
    entrypoint: ["/entrypoint.sh", "/opampsupervisor"]
```

The entrypoint script runs:

```bash
if [ "$HYPERDX_OTEL_EXPORTER_CREATE_LEGACY_SCHEMA" != "true" ]; then
  migrate /etc/otel/schema/seed
fi
```

### ClickHouse Cloud with mTLS

```bash
export CLICKHOUSE_ENDPOINT="https://your-instance.clickhouse.cloud:8443"
export CLICKHOUSE_USER="default"
export CLICKHOUSE_PASSWORD="your-password"
export CLICKHOUSE_TLS_CA_FILE="/certs/ca.crt"
export CLICKHOUSE_TLS_CERT_FILE="/certs/client.crt"
export CLICKHOUSE_TLS_KEY_FILE="/certs/client.key"
export HYPERDX_OTEL_EXPORTER_CLICKHOUSE_DATABASE="hyperdx_prod"
export HYPERDX_OTEL_EXPORTER_TABLES_TTL="30d"

migrate /etc/otel/schema/seed
```

### Skip Migration (Legacy Mode)

```bash
export HYPERDX_OTEL_EXPORTER_CREATE_LEGACY_SCHEMA=true
# Migration is skipped - used when tables already exist
```

---

## Journal - Integration Context

### Investigation Goal

Understand how this tool fits into the broader HyperDX system.

### Integration Points

1. **Docker Build** (`docker/otel-collector/Dockerfile`):
   ```dockerfile
   # Build the Go migration tool
   FROM golang:1.25-alpine AS migrate-builder
   WORKDIR /build
   COPY packages/otel-collector/go.mod packages/otel-collector/go.sum ./
   RUN go mod download
   COPY packages/otel-collector/ ./
   RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /migrate ./cmd/migrate
   
   # Copy into final image
   COPY --from=migrate-builder /migrate /usr/local/bin/migrate
   ```

2. **Container Entrypoint** (`docker/otel-collector/entrypoint.sh`):
   ```bash
   if [ "$HYPERDX_OTEL_EXPORTER_CREATE_LEGACY_SCHEMA" != "true" ]; then
     migrate /etc/otel/schema/seed
   fi
   ```

3. **Kubernetes Deployment** (from our cdk8s work):
   - otel-collector deployment runs migrate at startup
   - Schema files mounted via ConfigMap

### Deployment Modes

1. **Standalone**: No `OPAMP_SERVER_URL` - collector runs directly
2. **Supervised**: With `OPAMP_SERVER_URL` - uses OpAMP for remote config management

---

## Options and Alternatives

### Alternative Migration Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Current (goose seed)** | Simple, idempotent, no state | Can't track which migrations ran |
| **goose with versioning** | Full migration history | Version table required, rollback complexity |
| **Flyway** | Mature, many DBs | Java-based, overkill for this use |
| **Raw SQL scripts** | No dependencies | No retry logic, no macro preprocessing |
| **ClickHouse migrations library** | Native | Less mature, fewer features |

### Alternative Schema Tools

| Tool | Notes |
|------|-------|
| `clickhouse-migrations` | Go-native ClickHouse migrations |
| `dbmate` | Multi-database, Go-based |
| `Atlas` | Declarative schema management |
| `Liquibase` | Java-based, enterprise features |

### Why Goose Seed Mode?

The choice of `goose.WithNoVersioning()` is intentional:

1. **Container-friendly**: Runs at every container start without state
2. **ClickHouse limitation**: Transaction support is limited, version table management is complex
3. **Idempotent SQL**: All tables use `CREATE TABLE IF NOT EXISTS`
4. **Simple deployment**: No need to track which migrations have run

---

## Discussion Questions

1. **Should this be a separate binary?**
   - Currently a standalone tool; could be a library called from the collector
   - Pro: Simpler deployment
   - Con: Tighter coupling, language constraints

2. **How to handle schema changes?**
   - Current: Add new numbered SQL files
   - Question: How to ALTER existing tables? Currently no ALTER support

3. **Testing strategy?**
   - Current: Unit tests for parsing, no integration tests
   - Question: Should there be tests against real ClickHouse?

4. **Multi-tenancy support?**
   - Current: Single database via `${DATABASE}` macro
   - Question: How to support per-tenant schemas?

5. **Schema versioning for production?**
   - Current: No version tracking
   - Question: Should production deployments have stricter migration control?

---

## Decision Points

### Design Decisions Made

1. **No version tracking**: Simplicity over auditability
2. **Macro preprocessing**: Flexibility without SQL templating in Go
3. **Exponential backoff**: Resilience for container startup ordering
4. **Full TLS support**: Enterprise-ready from day one

### Future Considerations

1. **Schema drift detection**: Could add validation that existing tables match expected schema
2. **ALTER support**: Could add migration files for schema changes
3. **Multi-region**: Could add support for replicated ClickHouse clusters
4. **Backup integration**: Could integrate with ClickHouse backup tools

---

## References

### Source Files

- [`packages/otel-collector/cmd/migrate/main.go`](file:///home/rektide/src/future-fuze/.test-agent/hyperdx/packages/otel-collector/cmd/migrate/main.go) - Main migration tool
- [`packages/otel-collector/cmd/migrate/main_test.go`](file:///home/rektide/src/future-fuze/.test-agent/hyperdx/packages/otel-collector/cmd/migrate/main_test.go) - Unit tests
- [`packages/otel-collector/go.mod`](file:///home/rektide/src/future-fuze/.test-agent/hyperdx/packages/otel-collector/go.mod) - Dependencies
- [`docker/otel-collector/schema/seed/`](file:///home/rektide/src/future-fuze/.test-agent/hyperdx/docker/otel-collector/schema/seed/) - SQL schema files

### External Resources

- [ClickHouse Go Driver](https://github.com/ClickHouse/clickhouse-go) - Official Go driver
- [Goose Migrations](https://github.com/pressly/goose) - Migration framework
- [HyperDX GitHub](https://github.com/hyperdxio/hyperdx) - Main repository
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/) - OpenTelemetry Protocol

### Related HyperDX Documentation

- `agent_docs/architecture.md` - HyperDX architecture patterns
- `CLAUDE.md` - Development guide
- `docker/otel-collector/Dockerfile` - Container build process
