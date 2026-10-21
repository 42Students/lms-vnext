# Work packet: edit src/modules/placements/college-drive-applications-service.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-17/placement-job-service.md, docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md, docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md

## G2-10-011-045  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:445-514 — GET /api/v1/admin/jobs/{jobId}/applications, 0-based page+size max100, status/source/academic filters and user names.
- vNext now: src/modules/placements/college-application-stage-service.ts:18-31; src/modules/placements/college-drive-applications-service.ts:25-111 — Server services directly query scoped UUID applications and normalized pipeline; no legacy response shape.
- Fix: Create exact field mapping/status projection, especially actor names, for page parity.

## G2-14-011-014  [P1] GAP  facet F05  effort M
- Legacy: Default ordering score DESC appliedAt DESC `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:709-739` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:839-889`
- vNext now: College list sorted name asc and TPO submitted newest/oldest `src/modules/placements/college-drive-applications-service.ts:99-103` `src/modules/placements/tpo-applicant-pipeline-service.ts:158-163`
- Fix: Add score sort with stable date tie break

## G2-14-011-058  [P1] GAP  facet F14  effort M
- Legacy: Legacy CSV columns include applicationId jobId jobTitle companyName learnerId names email status screening score partialScore appliedAt source notes reason `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1484-1508`
- vNext now: New college CSV columns Student name Email College Roll number Role option Source Pipeline stage Application status Screening status Submitted at Age days `src/modules/placements/college-drive-applications-service.ts:114-129`
- Fix: Offer backward compatible CSV template with all legacy columns

## G2-17-012-010  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:70-76 — Applications sorted screening score DESC then appliedAt DESC.
- vNext now: src/modules/placements/college-drive-applications-service.ts:100-113 — College roster ordered applicant name ASC then id.
- Fix: Offer legacy score/date sort on admin applicant view.

## G2-17-012-014  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:78-103 — Paginated job applicant status/score/source/date/program/class/department/batch/search/skills filters.
- vNext now: src/modules/placements/college-drive-applications-service.ts:25-101 — College roster filters source/stage/screening; no equivalent skills/score combination shown.
- Fix: Implement missing scoped score/date/cohort/skills filters.

## G2-17-012-017  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:864-886 — Screening score null last via COALESCE(score,-1), then appliedAt DESC.
- vNext now: src/modules/placements/college-drive-applications-service.ts:100-103 — Sort by applicant name ASC, id ASC.
- Fix: Restore score/date default with null-last and stable tie-break.

## G2-2-016-150  [P1] GAP  facet F19  effort L
- Legacy: Legacy filtered application CSV delivers full service result `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:706-738`
- vNext now: New export stops at first 1000, no incremental pagination `src/modules/placements/college-drive-applications-service.ts:99-110`
- Fix: Implement streamed CSV over all matching rows and error report on cap

## G2-9-010-047  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:445-516` — GET /api/v1/admin/jobs/{jobId}/applications accepts page,size,status,source,dept,program,batch
- vNext now: `src/modules/placements/college-drive-applications-service.ts:25-111` — Direct server query by college, stage/screening/other filters with fixed25
- Fix: Map legacy query defaults, sort and mode to vNext scoped query

## G2-9-010-079  [P1] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:551-574` — Whole-result fetch processes 100 rows/page for export/select all
- vNext now: `src/modules/placements/college-drive-applications-service.ts:99-111` — SQL count + page25, select-all bounded 3000, CSV bounded1000
- Fix: Document hard caps; enable safe bulk subset beyond CSV cap and show truncation

## G2-9-010-086  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-40` — JobApplication unique learner+job, LocalDateTime, status field and entity version
- vNext now: `src/modules/placements/college-drive-applications-service.ts:41-70` — placementApplications UUID IDs, channel/status/submittedAt and joins through memberships
- Fix: Map legacy job application fields and uniqueness to new schema/migrations

## G2-9-014-050  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:785-795` — GET /api/v1/admin/jobs/{jobId}/applications?collegeId&page=0&size=20&applicationStatus=ASSESSMENT by default.
- vNext now: `src/modules/placements/college-drive-applications-service.ts:23-34` — Direct SQL college scope; GET shortlist sets screening=SHORTLISTED, status=SUBMITTED; different set.
- Fix: Map legacy assessment pipeline default onto vNext stage query.

## G2-8-014-015  [P2] GAP  facet F07  effort M
- Legacy: DTO getDisplayName returns empty string if learnerName null (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:26-29`)
- vNext now: New can include user displayName null; DataTable fallback separately (`src/modules/placements/college-drive-applications-service.ts:41-53`)
- Fix: Use '-' or clear Unnamed applicant fallback consistently with old blank state

## G2-8-014-016  [P2] GAP  facet F07  effort M
- Legacy: Cache conversion tolerates learner or job null (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:77-91`)
- vNext now: New SQL joins users, membership and role; missing linked rows omitted (`src/modules/placements/college-drive-applications-service.ts:57-69`)
- Fix: Decide how orphaned historical rows appear in TPO search/read-only mode

## G2-8-014-017  [P3] GAP  facet F08  effort M
- Legacy: DTO emits no toast; controller returns Applications retrieved (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:79-80`)
- vNext now: New service returns items/total/pages not legacy success message (`src/modules/placements/college-drive-applications-service.ts:99-110`)
- Fix: Keep API envelope for old integrations only
