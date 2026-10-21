# Work packet: edit src/modules/placements/tpo-applicant-pipeline-service.ts

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-application-search-cache.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md

## G2-13-014-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:20-37` cache is org-partitioned service supporting searchWithinOrganization/countWithinOrganization and refresh
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:13-31` job-scoped TPO pipeline service querying DB live; no reusable org-wide cache
- Fix: Provide organization-scoped application search adapter if legacy global job search is still needed

## G2-13-014-003  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:83-104` GET /stats totalApplications, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:106-114` POST /refresh
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:71-94` has per-job stage counts and no explicit cache refresh
- Fix: Define org-wide totalApplications endpoint or equivalent report and retire refresh intentionally

## G2-13-014-008  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:14-21` id, learnerId, learnerName, jobId, jobTitle, companyName, applicationStatus, organizationId
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:95-146` returns application UUID, student,role,email,roll,screening,flags etc; no organizationId/companyName per row
- Fix: Create field-level DTO translation for org-wide search including company name/job title and application status

## G2-13-014-009  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:77-90` orgId taken from application.organizationId else job.organizationId
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:26-30` resolves job collegeId from TPO membership, not org fallback
- Fix: Specify organization→college→job mapping and null/fallback semantics for old imported applications

## G2-13-014-011  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:81-90` app.applicationStatus includes APPLIED,SHORTLISTED,etc from `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:129` status SUBMITTED/WITHDRAWN; screening status separately; `src/modules/placements/tpo-applicant-pipeline-model.ts:23-27` derives effective stage
- Fix: Provide explicit state mapping including legacy OFFERED/HIRED/ASSESSMENT/INTERVIEW statuses from other stage tables

## G2-13-014-013  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:107-116` performs substring contains over one concatenated name/title/company/status string
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:64-67` SQL ILIKE on displayName, role option, roll, email,phone and roster; no company or status text
- Fix: Add company name and legacy application-status text search to org-wide search compatibility surface

## G2-13-014-015  [P1] GAP  facet F05  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:101-121` scoped to all applications in one organization regardless of job
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:59-60` restricts to job.id, collegeId; UI route job-specific
- Fix: Add authorized org-wide discovery/report; do not force users to search each job manually

## G2-13-014-016  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:119-121` totalApplications counts all org non-deleted applications
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:71-94` totals for selected job and query/filter; not org size
- Fix: Implement org-wide count with same deletion and status inclusion semantics

## G2-13-014-026  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:49-71` loads Jpa findAllByIsDeletedFalse; Java maps DTO and partitions by org
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:31-190` SQL joins job, membership, users, role options and screenings, DB-filtered
- Fix: Document missing legacy application inclusion and build org-wide read if intended

## G2-13-014-028  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationRepository.java:111-113` eager FETCH learner+job, excludes isDeleted false
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:95-158` innerJoin membership/job/role; no soft-delete column on `src/db/schema/placements.ts:973-1019`
- Fix: Map old is_deleted and withdrawn semantics to vNext application state and import filters

## G2-13-014-030  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:64-79` scoped superadmin JWT org overrides query; global superadmin may supply organizationId; others derive auth org
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:14-30` requires TPO college membership and job in that college
- Fix: Implement global/scoped superadmin org-search permission explicitly, preserving org-parameter anti-escape logic

## G2-13-014-032  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:78` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:100` requireAccessOrganization(principal,orgId) before read/count
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:15-30` requires placements.manage and same-college job; org boundary not queried directly
- Fix: Preserve organization tenancy for cross-college jobs and reporting while retaining TPO role guard

## G2-13-014-034  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:65-70` groups DTOs by application.orgId / job fallback; null org excluded
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:26-30` gates by job college not org; `src/modules/placements/tpo-applicant-pipeline-service.ts:79-85` membership collegeId matching
- Fix: Specify whether null-org legacy data is excluded and how vNext migrated users map to organizations

## G2-13-014-035  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:101-116` filter string from learnerName jobTitle companyName applicationStatus
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:64-67` student/role/roll/email/phone/roster search with status separate
- Fix: Add company and status term search in correct role-scoped report, preserve newly added roster fields

## G2-13-014-057  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30` legacy lifecycle APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/REJECTED/HIRED
- vNext now: `src/db/schema/placements.ts:1048-1059` vNext application status check SUBMITTED/WITHDRAWN; `src/modules/placements/tpo-applicant-pipeline-service.ts:68-77` screening derived stages
- Fix: Map all legacy business states to round/screening/offer entities for search results and counts

## G2-14-011-010  [P1] GAP  facet F04  effort L
- Legacy: Application shows source appliedAt notes rejection resume and score `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-127`
- vNext now: New channel submittedAt eligibility and normalized screening/offer history `src/db/schema/placements.ts:973-1114` `src/modules/placements/tpo-applicant-pipeline-service.ts:127-163`
- Fix: Build complete legacy-compatible application projection

## G2-14-011-014  [P1] GAP  facet F05  effort M
- Legacy: Default ordering score DESC appliedAt DESC `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:709-739` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:839-889`
- vNext now: College list sorted name asc and TPO submitted newest/oldest `src/modules/placements/college-drive-applications-service.ts:99-103` `src/modules/placements/tpo-applicant-pipeline-service.ts:158-163`
- Fix: Add score sort with stable date tie break

## G2-14-011-047  [P1] GAP  facet F11  effort M
- Legacy: Legacy deleted job still permits application reads through includeDeleted `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:225-231` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:762-789`
- vNext now: New TPO pipeline excludes archived drives `src/modules/placements/tpo-applicant-pipeline-service.ts:26-30`
- Fix: Permit authorized historical archive report reads

## G2-13-014-020  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:73-76` exact 403 'Organization context required for job application search.'
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:15-30` AuthorizationError placements.manage / PLACEMENT_JOB_NOT_FOUND
- Fix: Map scoped organization error to documented replacement code/copy; do not leak tenant existence

## G2-13-014-022  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:109-111` refresh unauthenticated 401 'Authentication required'
- vNext now: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:22-23` routes non-TPO to /dashboard; backend `src/modules/placements/tpo-applicant-pipeline-service.ts:15-17` throws AuthorizationError
- Fix: Ensure API 401 vs 403 role feedback preserved for automated clients
