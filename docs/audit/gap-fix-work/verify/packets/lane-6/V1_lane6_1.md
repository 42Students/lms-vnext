# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-021-003 [P1] GAP facet F02
- Files: src/modules/placements/application-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:377-405 — learner submits with resume URL; server chooses profile fallback
- Expected fix: Surface secure resume attachment selection or snapshot

## G2-19-021-023 [P1] GAP facet F12
- Files: src/modules/placements/application-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:377-388 — visibility target and job/deadline, not eligibility grade gate in intro
- Expected fix: Document more restrictive eligibility and user-visible reason categories

## G2-14-023-013 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts, src/modules/placements/tpo-general-request-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:29-30,43-45 — seven uppercase legacy names accepted exactly.
- Expected fix: Accept/translate legacy request names and explain changed flows.

## G2-10-004-053 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/companies/page.tsx, src/modules/placements/admin-company-directory-service.ts
- Legacy: Legacy curator sees global master regardless selected college, while college tab restricted `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:8-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65`
- Expected fix: Restore genuine global curated list independent of selected college, or clearly require clearing scope before selecting global tab

## G2-10-009-113 [P1] GAP facet F21
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicInboundEmailController.java:28-33` public webhook accepts inbound signed secret, calls service.receive
- Expected fix: Preserve catch-all inbound messages (non-recruiter/failed replies) and provider validation

## G2-10-010-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/superadmin/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:9-10` intended old-bookmark/hardcoded-router compatibility
- Expected fix: Retain old landing intent and document path translation

## G2-10-011-023 [P1] GAP facet F05
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1374-1442 — Action menu offers next valid transition per current application state.
- Expected fix: Match legacy admin transition choices or explicitly document policy changes.

## G2-10-015-043 [P1] GAP facet F10
- Files: src/modules/placements/college-application-stage-service.ts, src/modules/placements/college-drive-applications-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:445-514 — Legacy GET list filters applicationStatus and hierarchy, size20 default, numeric IDs.
- Expected fix: Map canonical status and status counts per shortlist context.

## G2-10-030-013 [P1] GAP facet F04
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:702-709 — Job Type from college Settings choices, including placed-count labels.
- Expected fix: Wire configurable job types and placed-counting policy.

## G2-18-023-023 [P1] GAP facet F10
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Single eligibility uses EligibilityService.evaluate, apply-check uses ApplyGate.check with same rule check; LearnerEligibilityController.java:59-77; ApplyGate.java:31-82
- Expected fix: Centralize read & write gate, verify write service applies registration/held-offer/finished batch consistently.

## G2-11-008-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx
- Legacy: Operator screen and restricted learner field-mode share legacy page. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:22`
- Expected fix: Route by active workspace, not mere mixed role; preserve full operator surface.

## G2-11-011-023 [P1] GAP facet F03
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Package name e.g. Digital,Ninja, Add another package. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:627`
- Expected fix: Expose named role options and packages.

## G2-11-011-043 [P1] MISSING facet F06
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Company is required, message Add the company. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:585`
- Expected fix: Restore required Company picker state for supported lifecycle.

## G2-11-013-043 [P1] GAP facet F10
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Create drive submits company, job, eligibility and initial rounds. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:17`
- Expected fix: Implement resumable atomic-equivalent create with full reporting.

## G2-14-010-013 [P1] GAP facet F07
- Files: src/modules/placements/validation.ts, src/modules/placements/application-service.ts
- Legacy: isValidSource returns false for null or whitespace `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:55-59`
- Expected fix: Differentiate allowed-source predicate and omitted channel handling

## G2-14-010-023 [P1] GAP facet F12
- Files: src/modules/placements/application-service.ts
- Legacy: Null source defaults EXTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:32-35` `docs/legacy-source/backend/src/test/java/com/_42students/lms/util/JobApplicationSourceValidatorRegressionTest.java:30-33`
- Expected fix: Protect historical null-source import from silently switching channel

## G2-14-011-043 [P1] GAP facet F10
- Files: src/modules/placements/college-application-stage-service.ts, src/modules/placements/tpo-bulk-application-stage-service.ts
- Legacy: Legacy rejection/leaving interview stage cancels active interviews `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:163-187` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1245-1247`
- Expected fix: Implement associated interview cancellations and notifications

## G2-14-011-063 [P1] GAP facet F15
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy status notifications do not require caller notifyByEmail `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:2013-2024`
- Expected fix: Document intentional delivery difference and plan parity

## G2-14-011-073 [P1] GAP facet F20
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy company is pessimistically locked against concurrent deletion `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:114-140`
- Expected fix: Move relationship lock inside create transaction

## G2-16-024-003 [P1] GAP facet F02
- Files: src/modules/placements/admin-company-directory-service.ts
- Legacy: CompanyCurationService.java:35-65 global curated company list not per-college rows.
- Expected fix: Provide true global company identity list independent of existing college relationships.

## G2-16-025-023 [P1] GAP facet F08
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:281-285 last company response triggers TPO bell `answered your change requests`.
- Expected fix: On last institutional request settled, update drive changes-made and notify TPO priority queue.

## G2-17-004-013 [P1] GAP facet F06
- Files: src/modules/projects/learner-project-tab-href-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-14 intentionally retains open tab form/modal by keying on projectId+account only.
- Expected fix: Test/safeguard unsaved edit modal on tab switching; avoid clearing transient state without dirty-change prompt.

## G2-18-011-053 [P1] GAP facet F13
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy withdrawn early reapply sets status APPLIED, reruns screening (`JobServiceImpl.java:580-637`).
- Expected fix: Queue fresh screening or reset stale prior result after restore.

## G2-18-001-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx
- Legacy: `?ref=course` disambiguates numeric course ID against faculty mapping ID. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:92-98`, `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:7-20`
- Expected fix: Recognize old `ref=course` links at compatibility route and resolve within active faculty membership.

## G2-19-011-003 [P1] GAP facet F01
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy scheduling invoked automatically, no actor login `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:33-47`
- Expected fix: Do not substitute actor-driven close for system scheduled action.
