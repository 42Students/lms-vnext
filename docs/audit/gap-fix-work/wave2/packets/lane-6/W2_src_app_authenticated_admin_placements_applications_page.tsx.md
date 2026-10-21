# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/applications/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u014-job-application-search-controller.md, docs/audit/gap2/lane-8/l11-u030-superadmin-job-applications.md

## G2-12-014-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:19-24`
- vNext now: `src/app/(authenticated)/admin/placements/applications/page.tsx:6-15`
- Fix: Legacy /api/v2/job-applications/search and /stats are org-wide search endpoints; vNext offers Super Admin Applications listing as server page, not same API route.

## G2-12-014-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-81`
- vNext now: `src/app/(authenticated)/admin/placements/applications/page.tsx:11-15`
- Fix: Legacy controller is headless JSON used by search UI; vNext page renders human-facing scoped table with export and filters.

## G2-12-014-042  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:73-77`
- vNext now: `src/app/(authenticated)/admin/placements/applications/page.tsx:11-15`
- Fix: Legacy no organization returns explicit 403, vNext no selected college triggers selected-college guard and scoped page error UI.

## G2-12-014-051  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-115`
- vNext now: `src/app/(authenticated)/admin/placements/applications/page.tsx:11-15`
- Fix: Legacy raw JSON search has no accessible field labels; vNext page includes labeled search and filters, document UI consumer keyboard behavior separately.

## G2-11-030-001  [P2] GAP  facet F01  effort M
- Legacy: 58-63 /superadmin/jobs/{jobId}/applications supports college-scoped and shortlistedMode
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:23-39 uses /admin/placements/jobs/{UUID}/applications, separate platform-wide index src/app/(authenticated)/admin/placements/applications/page.tsx:7-16
- Fix: Restore legacy deep link and shortlisted flag mapping.

## G2-12-014-010  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:80-80`
- vNext now: `src/app/(authenticated)/admin/placements/applications/page.tsx:11-14`
- Fix: Legacy success message Applications retrieved and response status success absent from vNext structured read page.

## G2-12-014-030  [P3] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:106-114`
- vNext now: `src/app/(authenticated)/admin/placements/applications/page.tsx:11-15`
- Fix: Cache maintenance refresh was direct POST, no confirmation in controller; vNext only Applications UI refresh/navigation.

## G2-12-014-054  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:98-104`
- vNext now: `src/app/(authenticated)/admin/placements/applications/page.tsx:11-15`
- Fix: Legacy Organization context required. / Stats retrieved have no parallel text in vNext page.

## G2-12-014-055  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:114-114`
- vNext now: `src/app/(authenticated)/admin/placements/applications/page.tsx:11-15`
- Fix: Legacy Cache refreshed not shown anywhere in vNext, intentional if no cache.
