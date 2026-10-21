# Verification packet (P0, do FIRST): 3 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-17-030-052 [P0] GAP facet F19
- Files: src/modules/placements/tpo-operations-service.ts
- Legacy: Legacy active request cap60, all count size1, attention sample category cap; DrivesLanding.js:98-118,441-453
- Expected fix: Introduce DB-aggregated counts, bounded active cards and query-specific attention samples to prevent 10k+ learner fanout.

## G2-19-026-016 [P0] GAP facet F07
- Files: (none, new feature)
- Legacy: Unknown module `Unknown module: X`; placements lower-level conflict gives exact cell warning (service:502-507)
- Expected fix: Resolve explicit product decision for placements lower levels; do not silently invert old access governance

## G2-5-012-063 [P0] GAP facet F11
- Files: src/components/placements/placement-calendar-workspace.tsx
- Legacy: Legacy page shows followup edit controls without separate deployment flag (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:151-171`)
- Expected fix: Unblock edits only when migration is truly live; warn and surface remediation on gate fail
