# Work packet: edit src/modules/placements/college-drive-overview-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-overview.md

## G2-9-011-015  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:195-205` — Job title, company name, normalized job type, isDraft/isActive and deadline-derived status
- vNext now: `src/modules/placements/college-drive-overview-service.ts:19-24` — DTO title, companyName, status, employmentType, workMode, openings, deadline
- Fix: Render legacy status semantics plus distinct new Mode/Openings on secondary row

## G2-9-011-064  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:244-259` — Legacy hiring-metrics status counts sourced from JobApplication rows
- vNext now: `src/modules/placements/college-drive-overview-service.ts:37-63` — New independently counted membership-scoped applications, screenings and offers, selected unavailable
- Fix: Reconcile source semantics; compare withdrawn and external records before signoff

## G2-9-011-027  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:141-142` — Failed job fetch shows inline Ant error Alert
- vNext now: `src/modules/placements/college-drive-overview-service.ts:35-36` — Service throws PLACEMENT_JOB_NOT_FOUND to route error boundary
- Fix: Provide in-page not-found alert and safe Back to drives link
