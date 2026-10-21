# Work packet: edit src/modules/placements/college-drive-applications-model.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md

## G2-10-015-019  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:112-119,373-415 — First open defaults Assessment tab and page 1, 20 rows.
- vNext now: src/modules/placements/college-drive-applications-model.ts:3-16; src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:105-110 — Defaults stage ALL and 25 rows, even from supposed shortlist context.
- Fix: Route alias redirect to stage ASSESSMENT, use page size20.

## G2-10-015-043  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:445-514 — Legacy GET list filters applicationStatus and hierarchy, size20 default, numeric IDs.
- vNext now: src/modules/placements/college-application-stage-service.ts:18-31; src/modules/placements/college-drive-applications-model.ts:3-17 — New UUID stage projection and fixed25, separate raw status/screening.
- Fix: Map canonical status and status counts per shortlist context.

## G2-10-015-053  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:116-119 — Default ASSESSMENT on shortlist route, user stage choice saved.
- vNext now: src/modules/placements/college-drive-applications-model.ts:3-13 — ALL across integrated application stages.
- Fix: Use scoped four-stage default.

## G2-10-015-083  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-105 — Numeric jobApplication ID, canonical status, score, notes, optimistic version.
- vNext now: src/modules/placements/college-drive-applications-model.ts:3-17; src/modules/placements/college-stage-action-model.ts:24-32 — UUID application + stage row, screening split, no score column.
- Fix: Add field mapping to support legacy view with truthful data.

## G2-2-016-134  [P1] GAP  facet F14  effort L
- Legacy: Legacy export relies on service for full matching rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:706-736`
- vNext now: New export caps at 1000 and marks truncation `src/modules/placements/college-drive-applications-model.ts:15-17`
- Fix: Stream or page complete selected export, with explicit progress and filter-matched rows

## G2-9-014-069  [P1] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:901-914` — Legacy CSV uses current status/source/department/program/batch/search filters.
- vNext now: `src/modules/placements/college-drive-applications-model.ts:17-47` — New export cap1000, no batch filter in query, only screening and source/cohort.
- Fix: Make export respect actual shortlist stage and all filters; provide truncation report.

## G2-10-015-032  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:373-415 — Malformed optional URL filter values normalized to defaults and page limited by readQueryId.
- vNext now: src/modules/placements/college-drive-applications-model.ts:3-13 — Zod rejects invalid status/stage/page with ErrorState.
- Fix: Align fallback/error handling and preserve safe scope.
