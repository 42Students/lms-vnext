# Work packet: edit src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-8/l11-u030-superadmin-job-applications.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md

## G2-10-011-059  [P1] MISSING  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1529-1542 — Refresh error differentiates stale list warning ('Couldn't refresh applications') and first-failure error ('Failed to load data') with Retry.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:35-45; src/components/placements/college-application-pipeline-controls.tsx:64-79 — Invalid-filter ErrorState and mutation error; no scoped stale-list warning/Retry.
- Fix: Render stale-data warning and in-place Retry without dropping last valid rows.

## G2-10-011-078  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:90-95,319-325,590-610 — Uses AbortController and scope keys to prevent old-college network responses replacing new-college state.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:27-45; src/components/placements/college-application-pipeline-controls.tsx:47-79 — Server context re-evaluation per request; client detail fetch doesn't explicitly abort on scope change.
- Fix: Guard stale detail and mutation responses on selected-college switch; close stale dialogs.

## G2-10-015-002  [P1] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/shortlisted.js:40-47 — Dedicated `/superadmin/jobs/:jobId/shortlisted` route, accessible from Manage Shortlisted.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:110-112 — Only `/admin/placements/jobs/:jobId/applications`, with query.stage integrated.
- Fix: Make alias/route entry for shortlist deep links with Assessment default.

## G2-10-015-019  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:112-119,373-415 — First open defaults Assessment tab and page 1, 20 rows.
- vNext now: src/modules/placements/college-drive-applications-model.ts:3-16; src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:105-110 — Defaults stage ALL and 25 rows, even from supposed shortlist context.
- Fix: Route alias redirect to stage ASSESSMENT, use page size20.

## G2-10-015-036  [P1] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1529-1542 — Inline stale refresh warning and Retry preserves old data.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:35-45 — ErrorState only invalid filter, no stale-data retry.
- Fix: Add Retry while preserving last successful result.

## G2-10-015-055  [P1] MISSING  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1529-1542 — Refresh failure keeps prior rows and offers Retry.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:35-45 — No stale list cache nor retry.
- Fix: Add last-known-good state and retry.

## G2-10-015-080  [P1] MISSING  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:58-63,112-128 — Shared JobApplications shortlistMode true controls admin filter/bulk branches.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:42-110 — No shortlistMode prop in vNext; only generic stage tab set.
- Fix: Add shortlist view model distinct from full pipeline.

## G2-11-030-011  [P1] GAP  facet F05  effort L
- Legacy: 112-128 nine status tabs, default ALL or ASSESSMENT shortlisted; select-all matching cap3000
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:114-117 ten stage tabs incl HIRED, normalized statuses SUBMITTED/WITHDRAWN
- Fix: Map old APPLIED/ASSESSMENT/INTERVIEW/OFFERED state tabs and counts.

## G2-11-030-027  [P1] GAP  facet F10  effort L
- Legacy: 1130-1250 bulk status and partial failure preview targeted 3000
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-132 uses pipeline controls with distinct application stages
- Fix: Restore bulk transitions with per-row skipped reasons and safe select-all.

## G2-11-030-031  [P1] GAP  facet F12  effort M
- Legacy: 112 valid old statuses ALL/APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/WAITLISTED/REJECTED/OFFERED/WITHDRAWN
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:114-117 includes HIRED and status source SUBMITTED/WITHDRAWN
- Fix: Maintain legacy displayed stage names and mappings for canonical states.

## G2-11-030-036  [P1] GAP  facet F14  effort M
- Legacy: 28 exportAdminJobApplicationsCsv and 551-580 full job application pagination loop
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:110-115 CSV caps DRIVE_APPLICATION_EXPORT_CAP with truncation note
- Fix: Make explicit cap/partial export behavior; provide full job export if authorized.

## G2-11-030-038  [P1] GAP  facet F15  effort L
- Legacy: 929-937 interview cancel/no-show/completed transitions feed candidate notification
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-132 pipeline actions not same interview lifecycle panel
- Fix: Maintain notifications for interview changes/cancellation and status cascades.

## G2-15-026-006  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:509-573 notes edit action per application
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-134 application table columns/stage links, no inline notes control
- Fix: Add internal notes preview/edit action with authorized update, version token

## G2-15-026-018  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:509-548 internalNotes accepts string or null and numeric optimistic version
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-134 no inline notes form
- Fix: Build notes form with max length policy and current revision

## G2-15-026-045  [P1] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:757-791 applications/export CSV optional jobId and org-wide, filename applications-export.csv
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:113-114 college-scoped export under /api/college/placements/jobs/{jobId}/applications/export
- Fix: Restore authorized org-wide CSV with jobId optional or document no-global export security decision

## G2-15-026-046  [P1] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:823-842 resume-preview URL endpoint for application
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-134 list links omit preview
- Fix: Provide signed, tenant-scoped resume preview grant and preview action

## G2-10-011-031  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:583-589 — Invalid numeric jobId results in toast 'Invalid job ID'.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:33-45 — UUID service/query errors; only invalid filters has friendly ErrorState.
- Fix: Handle malformed job IDs with explicit recovery message and back action.

## G2-11-030-017  [P2] GAP  facet F07  effort M
- Legacy: 583-684 failed fetch 'Failed to load job and applications. Please try again.' preserving last good same-scope data
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:38-48 directly awaits pipeline service, no in-page stale-data retry
- Fix: Restore stale list banner and query-preserving Retry.

## G2-11-030-021  [P2] GAP  facet F08  effort S
- Legacy: 661-663 load failure fallback 'Failed to load job and applications. Please try again.'
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:40-47 Invalid filters recovery copy differs
- Fix: Render original error copy for backend outage, separate malformed query.

## G2-15-026-022  [P2] MISSING  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:532-541 malformed notes string/version 400
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-134 no notes form
- Fix: Validate notes JSON types and version explicitly with inline and API error
