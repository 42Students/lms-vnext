# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-022-033 [P1] GAP facet F10
- Files: src/modules/placements/result-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:120-132 — two-step APPLIED → SHORTLISTED → next stage; currentRoundId updated
- Expected fix: Validate learner-facing stage transition parity for pass/hold/fail/absent

## G2-12-022-053 [P1] GAP facet F20
- Files: src/modules/placements/tpo-round-apply-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-77 — lock round to serialize duplicate apply
- Expected fix: Evaluate concurrent two-officer bulk apply and refresh stale preview, preserve no duplicate alerts

## G2-18-014-033 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: src/modules/operations/outbound-delivery-queue.ts:22-24 — gated insertion, draft outbox; legacy direct repository writes active.
- Expected fix: Complete runtime activation and pending sender verification.

## G2-10-016-043 [P1] GAP facet F10
- Files: src/modules/placements/tpo-operations-service.ts, src/modules/placements/admin-drive-directory-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:135-165 — GET /api/v1/admin/jobs/search server-filtered status/search, postedDate desc, page size20.
- Expected fix: Query/filter at DB for scale with requested stable sort.

## G2-10-017-023 [P1] GAP facet F05
- Files: src/modules/placements/tpo-operations-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:104-126 — Active drive cards limited to latest 60 server sorted postedDate DESC; activeTotal separately fetched.
- Expected fix: Order active jobs by postedDate desc before card slicing.

## G2-11-004-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/hr/drives/new/page.tsx
- Legacy: Legacy source request missing/error rendered distinct Result `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:114`
- Expected fix: Restore request-not-found state and back link

## G2-11-012-093 [P1] GAP facet F20
- Files: src/modules/placements/tpo-drive-lifecycle-list-service.ts
- Legacy: Failed counts fetch keeps previous valid counts. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:146`
- Expected fix: Cache verified counts with stale marker.

## G2-11-010-033 [P1] MISSING facet F06
- Files: src/components/placements/tpo-drive-lifecycle-controls.tsx
- Legacy: Decline reasons fixed four choices. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:40`
- Expected fix: Expose four legacy decline choices for REQUEST with reason picker.

## G2-13-012-003 [P1] GAP facet F02
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:34-65` executes cache-check -> DNS MX/A/AAAA -> cache/return; no page sections
- Expected fix: Retain order and lookup semantics at shared service; page layout N/A to service-only unit

## G2-13-014-003 [P1] GAP facet F01
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:83-104` GET /stats totalApplications, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:106-114` POST /refresh
- Expected fix: Define org-wide totalApplications endpoint or equivalent report and retire refresh intentionally

## G2-13-014-013 [P1] GAP facet F05
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:107-116` performs substring contains over one concatenated name/title/company/status string
- Expected fix: Add company name and legacy application-status text search to org-wide search compatibility surface

## G2-14-005-033 [P1] GAP facet F05
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: Legacy browse defaults All tab and not-open in separate collapsed section; vNext all roles count includes not-open in pagination, collapsed by current page — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:663-690,870-905`
- Expected fix: Page only open roles, show all not-open in distinct group counted independently

## G2-14-019-033 [P1] GAP facet F10
- Files: src/modules/placements/tpo-interview-slot-service.ts
- Legacy: Legacy schedule creates new Interview, serializes application and learner locks `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:171-256`
- Expected fix: Map legacy direct interview create to slot booking without duplicate records

## G2-14-019-043 [P1] GAP facet F12
- Files: src/modules/placements/tpo-interview-slot-service.ts, src/modules/placements/hr-interview-slot-service.ts
- Legacy: Legacy duration-aware overlaps between candidate, application, interviewer `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:306-328`
- Expected fix: Enforce all three scopes with real interval checks

## G2-15-015-023 [P1] GAP facet F07
- Files: src/modules/placements/eligibility-service.ts
- Legacy: Override always takes precedence, including INCLUDE over missing academic evidence. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108`)
- Expected fix: Show denial reason and distinguish hard policy constraints from overrideable grades.

## G2-15-014-033 [P1] GAP facet F10
- Files: src/modules/placements/tpo-round-apply-service.ts
- Legacy: Bulk apply computes next non-TALK stage and completes round only when no pending result. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-145`)
- Expected fix: Resolve lifecycle: old marks complete AFTER apply, new demands complete BEFORE apply.

## G2-16-013-043 [P1] GAP facet F23
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: JobSearchDTO.java:54-65 eight-source searchable concatenation.
- Expected fix: Reconcile missing eight-field search, targeting, synonym and ranking behaviors in full fix list.

## G2-17-014-023 [P1] GAP facet F10
- Files: src/modules/placements/eligibility-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-108 — Any override replaces all academic rules.
- Expected fix: Preserve intended include/exclude precedence except documented hard security gates.

## G2-17-002-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/semester-courses/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:327-335 leads immediately with editable mapping two-card UI.
- Expected fix: Make editable curriculum mapping the primary superadmin view rather than hidden disclosure.

## G2-2-014-023 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LC:108-137 each courseService.updateCourse independently, partial failures
- Expected fix: Implement actual course status updates atomically per course; not a lesson visibility substitute.

## G2-3-019-003 [P1] GAP facet F02
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:519-543`, `658-678`
- Expected fix: Legacy saved view pools original saved jobs with current jobs, separates closed/deadline-passed saved rows under Expired. VNext saved bookmark service removes nonpublished or out-of-feed jobs, so Expired section cannot show lost items. Add authorized limited historic bookmark projection.

## G2-12-010-023 [P1] GAP facet F11
- Files: src/modules/placements/learner-placement-event-delivery.ts
- Legacy: Legacy recipient uses learner classId and college template context `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:89-91`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:126-134`
- Expected fix: Clarify shared-organization job notifications across college boundaries.

## G2-13-021-013 [P1] GAP facet F05
- Files: src/modules/placements/screening-service.ts
- Legacy: Legacy all screening results by job ordered overallScore DESC. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ApplicationScreeningRepository.java:23-26`
- Expected fix: Restore sortable screening score view.

## G2-13-021-033 [P1] GAP facet F12
- Files: src/modules/placements/screening-service.ts
- Legacy: Legacy excludes unavailable dimensions instead of counting as zero. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:81-102`
- Expected fix: Restore inclusion/exclusion algorithm and provenance.

## G2-13-031-073 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/placements/analytics/page.tsx
- Legacy: Legacy optional avg shortlist hours. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-498`
- Expected fix: Wire same metric or document intentional retirement.
