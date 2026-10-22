# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-016-027 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy deleteJob soft-deletes and notifies affected applicants after commit (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:998-1079`)
- Expected fix: Preserve learner notification and application safety on any destructive action

## G2-2-016-067 [P1] GAP facet F03
- Files: src/modules/placements/job-service.ts
- Legacy: Before Delete job returns application/learner/open interview impact `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:1019-1048`
- Expected fix: Show an impact breakdown before archive and reconcile interview and learner impacts

## G2-2-016-074 [P1] GAP facet F05
- Files: src/modules/placements/job-service.ts
- Legacy: GET /search defaults page0, size20, status all, sort postedDate descending `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:135-164`
- Expected fix: Implement paged server search 20/page with posted-date-desc default, status and sort controls

## G2-2-016-084 [P1] GAP facet F06
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy update PUT may modify existing active job subject to version `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:236-284`
- Expected fix: Restore authorized published-drive edit workflow under explicit safe field rules

## G2-2-016-087 [P1] GAP facet F06
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: Legacy bulk application status takes applicationIds,newStatus, optional assessmentUrl/saveAssessmentUrlToJob/rejectionReason `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:516-589`
- Expected fix: Expose assessment-link and job-default preference when moving to ASSESSMENT

## G2-2-016-095 [P1] GAP facet F07
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Status mutation catches optimistic lock as 409 `This record was modified by someone else. Please refresh and try again.` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:687-697`
- Expected fix: Provide explicit 409 stale status handling and reload action when version changed

## G2-2-016-104 [P1] GAP facet F09
- Files: src/modules/placements/job-service.ts
- Legacy: Delete impact preview is a pre-confirmation GET `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:1019-1047`
- Expected fix: Require impact preview before confirm and forbid deleting without acknowledged impact

## G2-2-016-106 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy exposes GET all (unbounded) plus GET search (paged) separately `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:110-165`
- Expected fix: Add paged API with explicit sort/search and secure admin scope

## G2-2-016-108 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: PUT update uses ID, college, Job body; has clean 409 JPA version conflicts `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:236-286`
- Expected fix: Provide published-edit endpoint and optimistic version token for allowed fields

## G2-2-016-111 [P1] GAP facet F10
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: PUT single applicant status calls updateApplicationStatus including notification and audit `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-704`
- Expected fix: Verify every legacy status branch, emails and cross-drive offer cascade, not only stage row

## G2-2-016-137 [P1] GAP facet F15
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy application status transition may trigger assessment and rejection notice via service `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-679`
- Expected fix: Compare recipient, channel (email vs in-app), template, timing and retry for each status

## G2-2-016-149 [P1] GAP facet F19
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy GET all unbounded and GET search paginated 20 default `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:110-165`
- Expected fix: Use server page/sort for large historical job lists and keep past archives selectable

## G2-2-016-156 [P1] GAP facet F21
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy status mutation triggers downstream service notifications and audits `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:516-603,637-704`
- Expected fix: Match email adapter and ensure post-commit delivery to avoid duplicate/ghost sends

## G2-2-016-159 [P1] GAP facet F22
- Files: src/modules/placements/validation.ts
- Legacy: Legacy visibility_type, job_slug and assessment_url persisted `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:225-246`
- Expected fix: Map public slug and external-only visibility to safe URLs while retaining old deep-links

## G2-2-016-166 [P1] GAP facet F23
- Files: src/app/(authenticated)/college/placements/retention/page.tsx
- Legacy: Old retention accepts olderThanDays param (default365) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:951-969`
- Expected fix: Make threshold configurable and page complete history instead of fixed 180

## G2-2-020-005 [P1] GAP facet F01
- Files: src/modules/projects/admin-submission-review-service.ts
- Legacy: AdminProjectController.java:427-469 PUT delivery/review for admin
- Expected fix: Add admin approve/request-changes/lock actions with feedback and token.

## G2-2-020-038 [P1] GAP facet F10
- Files: src/modules/projects/admin-submission-review-service.ts
- Legacy: AdminProjectController.java:427-469 delivery review approve/reject/lock with feedback
- Expected fix: Implement complete admin delivery review states and durable feedback.

## G2-2-020-046 [P1] GAP facet F12
- Files: src/modules/projects/admin-submission-review-service.ts
- Legacy: AdminProjectController.java:427-458 review delivery transitions Accept/Reject/Lock
- Expected fix: Implement review decision state machine, feedback, optimistic tokens.

## G2-2-021-004 [P1] GAP facet F01
- Files: src/app/api/projects/templates/[templateId]/assignments/route.ts
- Legacy: AdminProjectTemplateController.java:145-171 GET/PUT /{id}/colleges for set with expected IDs
- Expected fix: Expose atomic bulk assignment replace with expected set CAS.

## G2-2-021-020 [P1] GAP facet F06
- Files: src/app/api/projects/templates/[templateId]/assignments/route.ts
- Legacy: AdminProjectTemplateController.java:154-168 PUT `{collegeIds,expectedCollegeIds}`
- Expected fix: Add bulk desired set + optimistic expected set; reject concurrent assignment edits.

## G2-2-021-034 [P1] GAP facet F10
- Files: src/app/api/projects/templates/[templateId]/assignments/route.ts
- Legacy: AdminProjectTemplateController.java:154-168 bulk assignment expected set CAS
- Expected fix: Atomic replace with expected assigned set to prevent lost concurrent edits.

## G2-2-021-062 [P1] GAP facet F20
- Files: src/app/api/projects/templates/[templateId]/assignments/route.ts
- Legacy: AdminProjectTemplateController.java:161-168 expectedCollegeIds optimistic assignment set
- Expected fix: Implement CAS for assignment set and meaningful conflict report.

## G2-15-030-041 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: L:30-37 legacy six-stage funnel derived by backend
- Expected fix: Document stage semantic change and reconcile historical results.

## G2-19-022-076 [P1] GAP facet F10
- Files: src/app/api/placements/tpo/messages/threads/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:325-329 POST send recruiter message
- Expected fix: Separate open thread from actual send body/notification persistence

## G2-19-022-089 [P1] GAP facet F10
- Files: src/app/api/placements/tpo/settings/job-types/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:410-411 PUT save job-types collection
- Expected fix: Check bulk edit/reorder/disabled state equivalent

## Lane 9 verification disposition (2026-10-22)

- DEFERRED — G2-2-016-027: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-067: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-074: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-084: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-087: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-095: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-104: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-106: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-108: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-111: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-137: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-149: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-156: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-159: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-016-166: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-020-005: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-020-038: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-020-046: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-021-004: Not independently verified against all cited behavior; implementation and regression check remain open.
- OK — G2-2-021-020: Target source contains the specified validation or expected-set CAS contract.
- OK — G2-2-021-034: Target source contains the specified validation or expected-set CAS contract.
- OK — G2-2-021-062: Target source contains the specified validation or expected-set CAS contract.
- DEFERRED — G2-15-030-041: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-19-022-076: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-19-022-089: Not independently verified against all cited behavior; implementation and regression check remain open.
