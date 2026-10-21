# Work packet: edit src/modules/placements/tpo-drive-header-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-021  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:197-200 — Open · Expired indicator depends on active, not-draft, applicationDeadline < now.
- vNext now: src/modules/placements/tpo-drive-header-model.ts:8-17; src/components/placements/placement-drive-workspace.tsx:395-401 — PUBLISHED mapped 'Published', no deadline-expired variation in header badge.
- Fix: Project Open · Expired precisely when deadline has passed but drive stays active.

## G2-10-012-047  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:196-200 — Distinct Draft, Open, Open · Expired, Closed statuses from isDraft, isActive, applicationDeadline.
- vNext now: src/modules/placements/tpo-drive-header-model.ts:8-17,27-35 — Maps DRAFT/PUBLISHED/CLOSED/CANCELLED; published may remain past deadline but label always Published.
- Fix: Add projection to mirror active/open/expired source status logic.
