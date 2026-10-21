# Work packet: edit src/app/(authenticated)/college/placements/drives/page.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-all.md

## G2-9-015-003  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/all.js:27-36` — No college -> Admin not assigned to a college + contact administrator warning.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:20-25` — No membership redirects /dashboard, no warning.
- Fix: Use legacy contextual unassigned-college warning.

## G2-9-015-006  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:877-903` — Create/Edit form opens 800px modal in same list route.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:54-57` — No create/edit modal; Edit is link to settings.
- Fix: Restore create/edit in-modal workflow or match modal entry point.

## G2-9-015-007  [P1] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:670-718` — Jobs header/title, inline company scope/select, search/status, Create Job.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:54-108` — Header with Operations workspace link, filter grid with advanced disclosure, no Create Job.
- Fix: Recreate header/action/toolbar order, add Create Job.

## G2-9-015-009  [P1] MISSING  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:765-773` — StudentPlacementLookup panel before drive table, college scoped.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:54-117` — No learner placement lookup in All drives.
- Fix: Restore contextual StudentPlacementLookup before table.

## G2-9-015-013  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:676-699` — Create Job primary PlusOutlined opens form, disabled without selected college.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:55-57` — Only Operations workspace action; Create Job not present.
- Fix: Add Create Job CTA with Plus icon and permission guard.

## G2-9-015-015  [P1] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:710-718` — Status filter All, Draft, Active, Closed; width120.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:63-67` — Status Live, Draft, Closed, Archived, All; Live default.
- Fix: Default All and display Active; handle archive as additional state.

## G2-9-015-023  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:519-525` — Job Type uses college types with getJobTypeTag.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:37-37` — employmentType replaces underscores with spaces, no Tag.
- Fix: Map dynamic job types and badges.

## G2-9-015-047  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:775-788` — Initial fetch failure Failed to load jobs. Please try again. Try Again.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:22-28` — Invalid drive filters only; service errors throw.
- Fix: Render data-fetch error card with retry and exact phrase.

## G2-9-015-056  [P1] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:426-469` — Delete modal shows impacted applications, learners, interviews, preserved records.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:43-51` — No Delete action; archive requires separate route.
- Fix: Integrate archive impact confirmation with affected applicant/interview counts.

## G2-9-015-065  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/all.js:35-43` — AdminGroupShell checks placements module availability and authorization.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:20-28` — Only no membership redirect; permission in service, no module-off inline guidance.
- Fix: Show module-disabled state with owner recovery.

## G2-9-015-073  [P1] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:812-823` — Warning stale rows with Retry action, does not present blank list.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:28-28` — Server list service errors abort, no last-results state.
- Fix: Support stale scoped result while revalidating.

## G2-9-015-076  [P1] MISSING  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:426-460` — Delete UI says affected learners notified and active interviews cancelled.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:44-51` — No delete/notify consequence copy.
- Fix: Place exact grounded archive retention/interview impact disclosure.

## G2-9-015-097  [P1] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:3-24` — Jobs integrates StudentPlacementLookup, JobForm, job status, delete impact, draft list.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:11-13` — List integrates bulk, deadline and lifecycle; lookup/form missing.
- Fix: Reconnect JobForm and StudentPlacementLookup to list.

## G2-9-015-048  [P2] MISSING  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:812-823` — Stale refresh warning Showing the last drives loaded for these filters.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:28-28` — No client stale cached drive list in server component.
- Fix: Preserve last scoped data on failed revalidation.

## G2-9-015-053  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:404-423` — Delete success Job deleted successfully; error Failed to delete job.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:43-51` — No Delete action; archival lifecycle management separate.
- Fix: Use accurate Archive success/error copy with legacy placement.

## G2-9-015-054  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:171-189` — Empty state No drives yet and Create first drive for this college when you're ready.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:114-117` — No drives match these filters in this college.
- Fix: Restore first-run message and creation CTA.
