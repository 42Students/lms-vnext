# Work packet (wave 2): edit src/modules/placements/super-admin-drive-pipeline-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-072  [P2] MISSING  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:75-88 — Needs-attention endpoint returns college-wide capped summary; client filters selected job.
- vNext now: src/modules/placements/super-admin-drive-pipeline-service.ts:15-38 — Direct aggregate status SQL, no cached attention projection.
- Fix: Introduce bounded and indexed attention query with separate fetch lifecycle.
