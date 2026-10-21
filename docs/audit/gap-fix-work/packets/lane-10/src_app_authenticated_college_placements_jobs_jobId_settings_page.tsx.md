# Work packet: edit src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-002  [P1] MISSING  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:5-10` — Workspace tabs Overview, Applications, Schedule, Settings; Settings is active.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:38-40` — Only an Overview button appears at top of settings; no four-tab strip.
- Fix: Render shared four-tab DriveSubNav in exact order, with Settings active.

## G2-9-013-005  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:72-75` — Missing college assignment shows Admin not assigned to a college warning.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:20-23` — Missing college-admin membership redirects to /dashboard.
- Fix: Render scoped missing-college recovery instead of generic redirect when appropriate.

## G2-9-013-014  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:628-663` — Company AutoComplete offers existing companies and tooltip, with info alert for unmatched company.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:40-80` — Settings draft editor does not expose company selector or unmatched-company hint.
- Fix: Add scoped company relationship display/edit flow and unmatched-company guidance.

## G2-9-013-017  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:236-258` — Prefills jobTitle, companyName, jobDescription, responsibilities, type, location, ctcRange, visibility and assessment fields.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:43-66` — Only title, description, employment/work mode, locations, salary bounds, application mode and deadline are prefilled.
- Fix: Map all legacy drive metadata to editing UI or explicitly mark migrated fields read-only.

## G2-9-013-026  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:634-658` — Company Name required; existing-company autocomplete with clear companyId for free-typing.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:40-67` — Company name not in draft settings form.
- Fix: Expose company selector and unlinked free-text state.

## G2-9-013-044  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:588-616` — Prefill error disables form; save failure has Drive changes were not saved banner; hierarchy warning independent.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:24-33` — Server load error aborts route; draft toast failure only, no local prefill/hierarchy banners.
- Fix: Separate lookup failures and block stale/partial edits.

## G2-9-013-054  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:718-750` — GET /api/v1/admin/jobs/{id}?collegeId, GET hiring metrics; PUT /api/v1/admin/jobs/{id}; POST /status with {isActive}.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:24-66` — Server getCollegeDriveOverview/getPlacementJob and PATCH job plus PUT eligibility; status POST action CLOSE.
- Fix: Document payload translation per field, preserve legacy status semantics where safe.

## G2-9-013-060  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/ModuleGroupGuard.jsx:27-75` — ModuleGroupGuard denies when placements feature explicitly off; shows specific explanatory Result.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:20-23` — Only college admin membership check in route; no equivalent explanatory module-off state.
- Fix: Render Placements is turned off for this college and superadmin recovery hint.

## G2-9-013-069  [P1] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:83-111` — First-load skeleton; failed fetch PanelError Retry; same-drive failed refresh preserves old content.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:24-33` — Server load via Promise.all; any rejection aborts page render.
- Fix: Use partial error boundaries and preserve prior record on refresh.

## G2-9-013-073  [P1] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:41-51` — Request Promise.allSettled isolates job failure from hiring metrics failure.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:24-33` — Promise.all combines overview and job load; failure of either prevents rest.
- Fix: Decouple nonessential request dependencies and recover inline.

## G2-9-013-093  [P1] MISSING  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:643-658` — Free-typed company resets companyId if no exact case-insensitive match.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:42-67` — No company selector; relationship cannot be re-established in settings.
- Fix: Add exact-name safe link reset and scoped ID lookup.

## G2-9-013-045  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:43-64` — Load error Drive details could not be loaded; metric error Applicant impact could not be verified.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:24-33` — Errors thrown by server reads; no two independently recoverable messages.
- Fix: Show independent exact error states with Retry.

## G2-9-013-049  [P2] MISSING  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:653-670` — Unmatched company alert This doesn't match an existing company with Companies directory recommendation.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:38-86` — No company advisory alert.
- Fix: Add exact nonmatching-company informational message.
