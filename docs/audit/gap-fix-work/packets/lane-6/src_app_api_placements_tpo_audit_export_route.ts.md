# Work packet: edit src/app/api/placements/tpo/audit/export/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md

## G2-11-006-055  [P1] GAP  facet F14  effort M
- Legacy: Range up to 5000 and warns if total > rows loaded; advises narrowing dates. `docs/legacy-source/frontend/src/pages/tpo/audit.js:111`
- vNext now: CSV loops max 20 pages x100=2000 and exposes X-Export-Truncated header, not UI warning. `src/app/api/placements/tpo/audit/export/route.ts:16`
- Fix: Show on-screen truncation warning or stream full bounded export.

## G2-11-006-070  [P1] GAP  facet F19  effort M
- Legacy: Date-range export can include 5000 rows. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:74`
- vNext now: New CSV capped at 2000 even when total more. `src/app/api/placements/tpo/audit/export/route.ts:16`
- Fix: Support complete range or explicit truncation workflow.
