# Work packet: edit src/components/placements/tpo-calendar-followup-actions.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-095  [P1] GAP  facet F20  effort M
- Legacy: Legacy move/done serialized through followUpBusyRef, rejecting overlapping writes (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:151-166`)
- vNext now: vNext per-form busy state and DB conditional update, no cross-form busy ref (`src/components/placements/tpo-calendar-followup-actions.tsx:146-195`)
- Fix: Protect simultaneous move/done on same id with shared lock and server idempotency
