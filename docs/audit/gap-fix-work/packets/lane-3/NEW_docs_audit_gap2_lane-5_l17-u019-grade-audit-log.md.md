# Work packet: NEW / MISSING items from docs/audit/gap2/lane-5/l17-u019-grade-audit-log.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/l17-u019-grade-audit-log.md

## G2-17-019-046  [P1] MISSING  facet F23  effort M
- Legacy: Legacy grade history table operational and written best-effort. `docs/planning/db06-history-audit-grade-parity-and-attendance-decision-2026-10-11.md:261-273`
- vNext now: vNext DB045 remains unverified source-only and writers emit no immutable grade events. `docs/planning/db06-history-audit-grade-parity-and-attendance-decision-2026-10-11.md:261-273`
- Fix: Do not mark parity DONE without PG replay and producer cutover.
