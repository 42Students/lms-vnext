# Work packet: edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-application-search-cache.md

## G2-13-014-002  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-80` GET /api/v2/job-applications/search (query/limit/organizationId)
- vNext now: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:21-46` route /tpo/placements/jobs/[jobId]/applicants-pipeline, job-specific page only
- Fix: Trace all old `/api/v2/job-applications/search` consumers; add compatible scoped API or approved replacement

## G2-13-014-061  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-114` search/stats/refresh three API operations absent in vNext pipeline model
- vNext now: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:21-135` page-specific query and exports; no old /api/v2 search
- Fix: Offer compatibility API or retire with verified frontend caller replacement and route inventory

## G2-13-014-021  [P2] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:97-98` stats exact 403 'Organization context required.'
- vNext now: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:26-45` invalid filter screen; no stats route
- Fix: Expose scoped stats error contract or formally deprecate endpoint with migration instructions

## G2-13-014-022  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:109-111` refresh unauthenticated 401 'Authentication required'
- vNext now: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:22-23` routes non-TPO to /dashboard; backend `src/modules/placements/tpo-applicant-pipeline-service.ts:15-17` throws AuthorizationError
- Fix: Ensure API 401 vs 403 role feedback preserved for automated clients

## G2-13-014-024  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:80` exact 'Applications retrieved', `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:103` 'Stats retrieved', `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:114` 'Cache refreshed'
- vNext now: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:106-107` status 'matching applications · Page...' and no API status strings
- Fix: Document response message change and compatibility facade as needed
