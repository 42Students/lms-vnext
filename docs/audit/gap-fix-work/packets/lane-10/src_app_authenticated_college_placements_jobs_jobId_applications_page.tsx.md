# Work packet: edit src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-applications.md

## G2-9-010-004  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/applications.js:21-32` — Absent college shows Admin not assigned to a college warning and contact guidance
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:23-25` — Absent membership redirects /dashboard; no explanation
- Fix: Show explicit legacy no-college warning in college scope

## G2-9-010-005  [P1] MISSING  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1547-1615` — Job summary card, pipeline status counts, assessment URL alert, Applications title precede filters
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:47-50` — Applications header and filter form shown; legacy job/header metrics and assessment link omitted
- Fix: Restore job summary/status counters and assessment-link banner above registry

## G2-9-010-023  [P1] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:463-482` — Changing Department resets Program and Batch
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:78-100` — Independent HTML selects, no client dependent reset
- Fix: Clear descendant selects when parent changes; bound options to parent

## G2-9-010-054  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/ModuleGroupGuard.jsx:27-74` — ModuleGroupGuard blocks bookmarked page when placements off, with exact disabled reason
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:23-35` — Route checks membership and placement service permissions; no friendly module-off page
- Fix: Render Placements is turned off for this college with recovery hint for disabled module

## G2-9-010-061  [P1] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1529-1542` — Refreshing applications indicator and recoverable list warning with Retry
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:26-35` — Invalid search ErrorState clear filters, thrown fetch errors reach route boundary
- Fix: Add independent list fetch error, Retry and stale scoped results handling

## G2-9-010-080  [P1] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:619-655` — Loads job and applications independently, retains job header if list fails
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:32-35` — Promise.all for pipeline and filter options, failure prevents whole page
- Fix: Use allSettled and per-section fallback so filter fetch failure does not hide register

## G2-9-010-033  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:585-590` — Invalid legacy integer job ID toast Invalid job ID
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:23-34` — UUID/service parse error yields route error rather than this toast
- Fix: Show matching in-page invalid-drive message and back link
