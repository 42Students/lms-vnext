# Work packet: edit src/components/placements/super-admin-drive-pipeline.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-020  [P1] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:16-20,81-88 — Attention grouped by type and sorted in category declaration; candidate links mapped to APPLIED/INTERVIEW/OFFERED status.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:13-29 — No needs-attention grouping or deep-linked filters on overview.
- Fix: Keep specified category sequence and status deep-link mapping.

## G2-10-012-033  [P1] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:225-232 — Metrics partial failure shows Warning Alert 'Could not load pipeline metrics', description=API error.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:5-29 — Pipeline has no own error status rendering.
- Fix: Render metrics warning inside Pipeline section and keep other content.

## G2-10-012-048  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:241-255 — Pipeline is current-status snapshot: no cumulative claims and no drop-off percentages.
- vNext now: src/modules/placements/super-admin-drive-pipeline-model.ts:23-27; src/components/placements/super-admin-drive-pipeline.tsx:13-29 — hiringFunnel computes percentPrevious from current bucket counts and displays as prior-stage ratio.
- Fix: Suppress percent previous when stages are snapshots; only show supported cumulative metrics.

## G2-10-012-053  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:226-233 — Pipeline error remains in card and states 'Could not load pipeline metrics'.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/components/placements/super-admin-drive-pipeline.tsx:5-29 — No local error fallback; pipeline service error aborts before render.
- Fix: Catch only pipeline promise; preserve hero and actions.

## G2-10-012-084  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:235-255 — Comment explicitly forbids treating snapshot stage counts as cumulative funnel.
- vNext now: src/components/placements/super-admin-drive-pipeline.tsx:15-24; src/modules/placements/super-admin-drive-pipeline-model.ts:26-27 — Displays percentPrevious based on snapshots, potentially nonsensical when earlier bucket is 0.
- Fix: Remove or fix misleading percentage metrics before production.
