# Work packet (wave 3): edit src/components/placements/super-admin-drive-pipeline.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-012  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:148-178 — Needs attention pale-yellow Alert with WarningOutlined and grouped categories, per-group count tags.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/components/placements/super-admin-drive-pipeline.tsx:5-29 — No per-drive warning banner; normal metrics always shown.
- Fix: Add selected-job attention banner with grouped counts and deep links.

## G2-10-012-014  [P1] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:16-20,81-88 — Attention categories No action in a week, Marked Interview, nothing scheduled, Offered, no offer letter attached; Closing soon/Low conversion so far.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/components/placements/super-admin-drive-pipeline.tsx:24-27 — No attention categories or application-level jump links.
- Fix: Compute and render four categories for this drive including applied candidate references.
