# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-14/l19-u026-module-access-controller.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-14/l19-u026-module-access-controller.md

## G2-19-026-023  [P1] MISSING  facet F10  effort L
- Legacy: GET tree returns EVERY academic node including inherited-only rows (service:85-208)
- vNext now: New detail explicitly states nodes without stored overrides not enumerated (detail:319-328)
- Fix: Implement complete tree read backed by bounded hierarchy joins, separate from persisted-only directory
