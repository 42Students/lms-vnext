# Work packet (wave 2): edit src/modules/placements/super-admin-drive-pipeline-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-019  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:241-255 — Pipeline snapshot stage order Applied, Shortlisted, Assessment, Interview, Offered, Hired.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:13-29; src/modules/placements/super-admin-drive-pipeline-model.ts:4-27 — Stage grid draws same six, plus rejected/waitlisted in footer.
- Fix: Keep same order and remove visual percent/extra status clutter for clone.
