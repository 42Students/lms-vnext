# Work packet: edit src/app/api/placements/college/jobs/[jobId]/archive/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-055  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:900-916` — DELETE /api/v1/admin/jobs/{id}?collegeId and GET hiring metrics for impact.
- vNext now: `src/app/api/placements/college/jobs/[jobId]/archive/route.ts:7-21` — GET+POST /api/placements/college/jobs/{id}/archive with confirmed:true.
- Fix: Explicitly mark legacy soft delete translated to archive; verify downstream consumer behavior.
