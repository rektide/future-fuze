# Rework Ideas

This file captures non-blocking improvement ideas discovered during refactors.

Confidence scale: `0.0` (low confidence) to `1.0` (high confidence).

## Backlog

- **Add focused unit tests for conflict message rendering** (`confidence: 0.75`)
  - Conflict behavior is central and now shared.
  - Snapshotting message format can prevent accidental UX regressions.

- **Tighten domain grouping under `internal/`** (`confidence: 0.7`)
  - We now have `internal/apply/`; continue by grouping more modules by domain.
  - Example grouping: `internal/conflict/`, `internal/project/`, `internal/io/`, `internal/options/`.
  - Should happen after active refactors to avoid churn.

- **Add optional collection conflict strategy flag** (`confidence: 0.65`)
  - Candidate flag: `--conflict-collection merge|overwrite` (default `merge`).
  - This could be useful if users want arrays replaced instead of additive merged.

- **Emit machine-readable verbose logs** (`confidence: 0.72`)
  - Keep current human logs, and optionally add `--verbose-format json` later.
  - This can support tooling that audits exact config drift and applied changes.

- **Unify `.ts` vs `.mts` config apply module strategy** (`confidence: 0.68`)
  - `apply` modules now use both `.ts` and `.mts` depending on local package metadata constraints.
  - Pick one intentional rule and document it to avoid future churn.
