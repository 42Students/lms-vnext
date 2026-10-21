# Work packet: edit src/modules/admin-ui/super-admin-placement-applications-service.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u014-job-application-search-controller.md, docs/audit/gap2/lane-8/l11-u030-superadmin-job-applications.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md

## G2-12-014-035  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:64-78`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-29`
- Fix: Legacy Super Admin with scoped JWT forcibly uses organizationId claim, Global Super Admin can supply organizationId; vNext restricts to selected college and organization from verified request context.

## G2-12-014-065  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:77-90`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:12-29`
- Fix: Legacy organizationId denormalization from job/application vs vNext organization derived via colleges and college membership; mismatch for moved/reassigned jobs must be audited.

## G2-12-014-068  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-104`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-67`
- Fix: Legacy per-organization search/stats cannot be substituted by selected-college list without breaking cross-college organization-wide workflows.

## G2-11-030-026  [P1] GAP  facet F10  effort L
- Legacy: 21-33 calls getAdminJobApplications, getInterviewsForApplication, rescreen, offer-letter and notes endpoints
- vNext now: src/modules/admin-ui/super-admin-placement-applications-service.ts:11-70 index read uses normalized placements, N+:42-46 pipeline service
- Fix: Map all legacy mutation/read closures including interview actions, notes and offers.

## G2-11-030-049  [P1] GAP  facet F22  effort L
- Legacy: 49-55 old numeric job/application IDs and old status/action histories
- vNext now: src/modules/admin-ui/super-admin-placement-applications-service.ts:13-27 normalized UUID job/application/stages, status SUBMITTED/withdrawn and stage coalesce
- Fix: Define enum/foreign-key mapping, historical status and screening equivalence.

## G2-15-026-010  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-46 applicationStatus/appliedAt/statusUpdatedAt/statusUpdatedBy
- vNext now: src/modules/admin-ui/super-admin-placement-applications-service.ts:13-21 and 59-66 status/stage plus submitted date formatted IST
- Fix: Expose status-change timestamp and actor in applicant details; preserve pipeline stage semantics

## G2-15-026-011  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:88-133 notes, rejectionReason, offerLetterUrl, screeningScore, isPartialScore, version
- vNext now: src/modules/admin-ui/super-admin-placement-applications-service.ts:13-21,61-69 list only status/eligibility/stage, omits notes/score
- Fix: Show scored/review and rejection/offer details with authorized masking, mark partial scores

## G2-15-026-015  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:931-975 org-wide application list with bounded pagination
- vNext now: src/modules/admin-ui/super-admin-placement-applications-service.ts:10-69 requires selected college, sorted submittedAt ASC/id
- Fix: Add safe global/org application listing with right tenant scope, compare default sort descending legacy service

## G2-15-026-038  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30 status APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW, OFFERED, REJECTED, HIRED
- vNext now: src/modules/placements/tpo-bulk-application-stage-service.ts:19-23 TEST/INTERVIEW and src/modules/placements/screening-service.ts:129-145 screening SHORTLISTED/REJECTED; src/modules/admin-ui/super-admin-placement-applications-service.ts:14-17 submission and independent stage
- Fix: Publish clear mapping between legacy single lifecycle and vNext independent screening/stage/offer transitions

## G2-12-014-024  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:97-99`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-11`
- Fix: Legacy /stats no context 403 Organization context required.; vNext no dedicated stats route to retain exact error.

## G2-12-014-025  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:109-112`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-11`
- Fix: Legacy POST /refresh unauthenticated returns 401 Authentication required; vNext no cache endpoint.

## G2-12-014-028  [P2] MISSING  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:113-114`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:10-67`
- Fix: Legacy Cache refreshed success after Super Admin refresh; vNext live DB needs no refresh confirmation, document non-equivalent endpoint.

## G2-12-014-026  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:80-80`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:61-67`
- Fix: Legacy 200 success Applications retrieved envelope; vNext SSR list displays results without message.

## G2-12-014-027  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:103-104`
- vNext now: `src/modules/admin-ui/super-admin-placement-applications-service.ts:61-67`
- Fix: Legacy 200 Stats retrieved envelope; vNext total shown in page control, no result notification.
