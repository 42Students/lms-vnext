# Work packet: edit src/components/tpo/tpo-audit-grid.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md

## G2-11-006-003  [P1] GAP  facet F01  effort M
- Legacy: Context links go to /tpo/drives/:id, /tpo/recruiters/:id, /tpo/students?student=:id. `docs/legacy-source/frontend/src/pages/tpo/audit.js:17`
- vNext now: Entity href model and /tpo/placements/jobs/:id fallback. `src/components/tpo/tpo-audit-grid.tsx:86`
- Fix: Map legacy contexts to working vNext deep links and verify 404/tenant handling.
