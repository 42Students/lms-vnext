# Work packet (wave 2): edit src/modules/placements/college-drive-applications-model.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md, docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md

## G2-10-011-019  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2020 — Super Admin uses 10-row client pagination with size options 10/25/50/100; all job apps fetched first.
- vNext now: src/modules/placements/college-drive-applications-model.ts:12-17; src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:128-131 — Server pagination fixed at 25; no page-size control.
- Fix: Restore legacy 10-per-page default and page-size chooser where safe; keep server paging for scale.

## G2-10-015-021  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:373-415 — Preserves status/q/source/dept/program/batch/page/size across refresh/back/deep links.
- vNext now: src/modules/placements/college-drive-applications-model.ts:19-43 — Uses stage/q/source/departmentId/programId/cohortId/page, no size.
- Fix: Support old query aliases and size, prevent filter loss.

## G2-10-015-024  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2020 — 20/page, options 10,20,50,100, client restores chosen size.
- vNext now: src/modules/placements/college-drive-applications-model.ts:12-17; src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:128-131 — Hardcoded 25/page with no size changer.
- Fix: Expose page size choices, reset page on switch.

## G2-10-015-078  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:382-415 — URL hydrate/reset state and selectedRows when filter changes.
- vNext now: src/modules/placements/college-drive-applications-model.ts:19-27 — Server params parsed; selection client state may survive form navigation.
- Fix: Key selection on filter and scope to prevent carryover.

## G2-2-016-077  [P2] GAP  facet F05  effort M
- Legacy: Legacy applicant list clamps page lower0 and size to max100, default20 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:472-483`
- vNext now: New applicant paging is 1-based fixed25, page max1000 `src/modules/placements/college-drive-applications-model.ts:12-17`
- Fix: Align default 20, page-size selector and pagination or document revised contract

## G2-2-016-125  [P2] GAP  facet F12  effort M
- Legacy: Legacy applications page default20, negative page coerced 0, max size 100 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:441-443,472-473`
- vNext now: New page 1-based max1000 fixed25 `src/modules/placements/college-drive-applications-model.ts:12-17`
- Fix: Match defaults and page-size control or give explicit documented changed contract

## G2-9-010-020  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:119-119` — PageSize defaults 20 and allows 10/20/50/100
- vNext now: `src/modules/placements/college-drive-applications-model.ts:12-17` — Fixed page size 25, max page1000
- Fix: Restore selectable page sizes and default 20 or document approved change

## G2-9-010-082  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:141-159` — Query state preserved across status/search/page edits and invalid ID handled explicitly
- vNext now: `src/modules/placements/college-drive-applications-model.ts:19-27` — Query parser silently excludes unknown keys and invalid UUID values trigger ErrorState
- Fix: Display invalid filter details and clarify ignored unknown query keys

## G2-9-014-025  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:116-117` — Page size 20 default; allowed 10/20/50/100.
- vNext now: `src/modules/placements/college-drive-applications-model.ts:17-20` — 25 fixed; no size parameter or chooser.
- Fix: Restore 20 default and four size options.
