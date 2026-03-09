# Rework Ideas

This file captures non-blocking improvement ideas discovered during refactors.

Confidence scale: `0.0` (low confidence) to `1.0` (high confidence).

## Backlog

- **Standardize apply output labels** (`confidence: 0.85`)
  - Today messages vary in casing and structure.
  - A small output-label helper would make tests less brittle and logs easier to scan.

- **Separate CLI option parsing from runtime option normalization** (`confidence: 0.9`)
  - [`/internal/options.ts`](/internal/options.ts) is close already, but can become a strict boundary layer.
  - This will improve reuse if apply logic is consumed programmatically later.

- **Introduce one module for config-source resolution policy** (`confidence: 0.8`)
  - Current logic is distributed across per-config apply modules.
  - A shared resolver can reduce repeated root-vs-recursive branching.

- **Add focused unit tests for conflict message rendering** (`confidence: 0.75`)
  - Conflict behavior is central and now shared.
  - Snapshotting message format can prevent accidental UX regressions.

- **Tighten domain grouping under `internal/`** (`confidence: 0.7`)
  - Example grouping: `internal/conflict/`, `internal/project/`, `internal/io/`, `internal/config-source/`.
  - Should happen after active refactors to avoid churn.

- **Add optional collection conflict strategy flag** (`confidence: 0.65`)
  - Candidate flag: `--conflict-collection merge|overwrite` (default `merge`).
  - This could be useful if users want arrays replaced instead of additive merged.

- **Emit machine-readable verbose logs** (`confidence: 0.72`)
  - Keep current human logs, and optionally add `--verbose-format json` later.
  - This can support tooling that audits exact config drift and applied changes.
