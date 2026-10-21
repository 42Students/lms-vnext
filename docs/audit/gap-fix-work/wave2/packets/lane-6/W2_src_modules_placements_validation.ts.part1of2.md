# Work packet (wave 2): edit src/modules/placements/validation.ts (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md, docs/audit/gap2/lane-1/l19-u021-apply-to-job-request.md, docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md, docs/audit/gap2/lane-14/u010-job-application-source-validator.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-14/u015-job-lifecycle-status.md

## G2-12-022-015  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/ResultsEntryModal.jsx:120-139 — waitlist ranks follow marking sequence with # display
- vNext now: src/modules/placements/validation.ts:1032-1038,1068-1088 — positive integer rank max 100000 for HOLD; no automatic order in schema
- Fix: Offer order-based ranking and display rank where decisions are made

## G2-19-021-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ApplyToJobRequest.java:14-16 — field resumeUrl (camelCase) and no label in DTO
- vNext now: src/modules/placements/validation.ts:661-671 — roleOptionId/channel/externalConfirmation keys
- Fix: Create client copy/field mapping for resume

## G2-19-021-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:439-441 — body nonempty URL wins over legacy query param
- vNext now: src/modules/placements/validation.ts:659-672 — strict schema forbids resumeUrl entirely
- Fix: Provide secure deliberate alternative before removing historic path

## G2-19-021-011  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ApplyToJobRequest.java:15-16 — regex ^(https?://.*)?$ permits http/https or empty
- vNext now: src/modules/placements/validation.ts:659-672 — strict input has no URL
- Fix: Either validated owned-storage receipt or fully removed field with migration

## G2-19-021-018  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:404-405 — requestBody optional, query param legacy fallback
- vNext now: src/modules/placements/validation.ts:659-672 — strict schema but empty JSON {} passes
- Fix: Verify empty body versus {} API behavior and no legacy fallback

## G2-19-021-032  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ApplyToJobRequest.java:15-16 — @Pattern annotation server response when bad URL
- vNext now: src/modules/placements/validation.ts:659-672 — strict rejects unknown resumeUrl
- Fix: Provide field-level error for new permitted resume token or explain removal

## G2-19-021-040  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ApplyToJobRequest.java:13-17 — one nullable string resumeUrl
- vNext now: src/modules/placements/validation.ts:659-672 — strict roleOptionId/channel/externalConfirmation
- Fix: Publish complete DTO mapping and migration notes

## G2-14-023-012  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:32-38 — CreateRequest optional jobId, applicationId, payload, reason.
- vNext now: src/modules/placements/validation.ts:1277-1311 — strict discriminated union required applicationId/other fields.
- Fix: Map legacy optional payload variants and reject with precise errors.

## G2-14-023-015  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:34-35,46-47 — typed jobId/applicationId optional, checked if supplied.
- vNext now: src/modules/placements/validation.ts:1282-1309 — applicationId UUID mandatory for three job-bound kinds.
- Fix: Align cross-application target validation and optionality.

## G2-14-010-026  [P2] GAP  facet F12  effort S
- Legacy: Lowercase internal with spaces becomes INTERNAL `docs/legacy-source/backend/src/test/java/com/_42students/lms/util/JobApplicationSourceValidatorRegressionTest.java:20-23`
- vNext now: Lowercase noncanonical string rejected `src/modules/placements/validation.ts:654-672`
- Fix: Normalize case and spaces for import

## G2-14-010-027  [P2] GAP  facet F12  effort S
- Legacy: Lowercase external with tabs/newlines becomes EXTERNAL `docs/legacy-source/backend/src/test/java/com/_42students/lms/util/JobApplicationSourceValidatorRegressionTest.java:25-28`
- vNext now: Noncanonical source rejected `src/modules/placements/validation.ts:654-672`
- Fix: Normalize tabs/newlines before validation in imports

## G2-14-010-028  [P2] GAP  facet F13  effort M
- Legacy: Null and invalid input return a value without throwing `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:32-47`
- vNext now: Invalid enum input fails request parsing `src/modules/placements/validation.ts:659-672`
- Fix: Offer migration-compatible fallback but preserve strict user API

## G2-14-010-037  [P2] GAP  facet F20  effort S
- Legacy: Locale.ENGLISH prevents machine default locale ambiguity `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:37-43`
- vNext now: Strict enum has no normalization `src/modules/placements/validation.ts:654-672`
- Fix: Use locale-stable uppercasing for imports

## G2-14-011-019  [P2] GAP  facet F06  effort M
- Legacy: Create defaults screeningVersion v1 and prevents client ID/version overwrite `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:239-267`
- vNext now: New Zod typed create generates ID and primary role `src/modules/placements/job-service.ts:150-270` `src/modules/placements/validation.ts:285-348`
- Fix: Document screening-version mapping and forbid client ID overrides

## G2-14-011-024  [P2] GAP  facet F06  effort M
- Legacy: Deadline derived from importantDates Application deadline label `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:269-283` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:649-689`
- vNext now: New standalone applicationDeadline used to publish `src/modules/placements/validation.ts:307-309` `src/modules/placements/job-service.ts:466-469`
- Fix: Map importantDates deadlines and preserve other milestone labels

## G2-14-011-025  [P2] GAP  facet F06  effort M
- Legacy: Assessment URL HTTP(S) max 2048; assessment deadline future and after application `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:285-309`
- vNext now: New legacyPostingDetails and typed deadline order rule `src/modules/placements/validation.ts:283-348`
- Fix: Restore max URL and exact past assessment deadline validation

## G2-14-011-068  [P2] GAP  facet F18  effort S
- Legacy: Legacy visibility type INTERNAL_ONLY HYBRID EXTERNAL_ONLY `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:315-323`
- vNext now: New applicationMode INTERNAL HYBRID EXTERNAL_ONLY `src/modules/placements/validation.ts:269-273`
- Fix: Display correct legacy wording while distinguishing concepts

## G2-14-015-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy visible request statuses SENT_BACK and REJECTED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:11-13`
- vNext now: New status badges use distinct request/workflow models not job enum `src/modules/placements/validation.ts:262-269`
- Fix: Restore explicit request tabs/chips for all legacy statuses

## G2-14-015-039  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact label REQUEST `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:10-10`
- vNext now: New job status list does not contain REQUEST `src/modules/placements/validation.ts:262-269`
- Fix: Match request wording in request-specific UI

## G2-14-015-040  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact label SENT_BACK `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:11-11`
- vNext now: New status list excludes SENT_BACK `src/modules/placements/validation.ts:262-269`
- Fix: Surface sent-back state in recruiter request UI

## G2-14-015-041  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact label REJECTED for request `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:12-12`
- vNext now: New job status list excludes REJECTED `src/modules/placements/validation.ts:262-269`
- Fix: Differentiate rejected request from rejected applicant

## G2-15-015-041  [P2] GAP  facet F12  effort S
- Legacy: Stored decision reason trimmed not blank. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:384-389`)
- vNext now: New trim min1 and max1000. (`src/modules/placements/validation.ts:630-637`)
- Fix: Align legacy reason min3.

## G2-15-015-052  [P2] GAP  facet F18  effort S
- Legacy: Exact Choose include or exclude, A reason is required. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:385-386`)
- vNext now: New generic Zod enum/min1 message. (`src/modules/placements/validation.ts:630-637`)
- Fix: Match old validation copy exactly.

## G2-2-016-016  [P2] GAP  facet F06  effort M
- Legacy: Application deadline derived from importantDates label and rejects past (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:528-544,2145-2182`)
- vNext now: VNext explicit applicationDeadline schema and publish readiness checks (`src/modules/placements/validation.ts:313-388; src/modules/placements/tpo-drive-lifecycle-model.ts:50-58`)
- Fix: Map all important_dates labels and deadline precedence, preserve timezone IST and explicit errors

## G2-2-016-043  [P2] GAP  facet F18  effort M
- Legacy: Legacy targeting errors name class/program/batch/department ID (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2026-2137`)
- vNext now: VNext validation currently uses Zod error codes and domain errors (`src/modules/placements/validation.ts:557-630`)
- Fix: Translate to exact entity-specific messages without exposing unauthorized IDs

## G2-2-016-047  [P2] GAP  facet F20  effort S
- Legacy: Legacy application status normalizes case before comparing (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1227-1239`)
- vNext now: VNext status enum strict uppercase at Zod boundary (`src/modules/placements/validation.ts:687-742`)
- Fix: Normalize old mixed-case bookmarks/imports before strict enum

## G2-2-016-052  [P2] GAP  facet F22  effort L
- Legacy: Legacy Job and JobApplication keys ints, organization/college + various JSON targeting (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:433-578,1217-1245`)
- vNext now: VNext UUID job/application, normalized companies, seasons, role/policy/rounds (`src/db/schema/placements.ts:23-154; src/modules/placements/validation.ts:260-388`)
- Fix: Document IDs/fields/filters and import compatibility (migration explicitly not required)

## G2-2-016-069  [P2] GAP  facet F04  effort L
- Legacy: Old CTC is free-text ctcRange, importantDates JSON controls applicationDeadline `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:83-99`
- vNext now: New job uses minimum/maximum INR and explicit applicationDeadline `src/modules/placements/validation.ts:299-310`
- Fix: Preserve displayed CTC text where not representable as structured band and derived deadline label

## G2-2-016-081  [P2] GAP  facet F06  effort M
- Legacy: Legacy title min3/max100 and company name min2/max100; logo max500 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:30-39`
- vNext now: New job title min3/max100 but company is relationship UUID `src/modules/placements/validation.ts:285-295`
- Fix: Preserve title validation and show canonical company choice with exact 2-100 name bounds

## G2-2-016-082  [P2] GAP  facet F06  effort M
- Legacy: Old description and responsibilities max5000, location max200, job type max50 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:50-79`
- vNext now: New description max15000 and locations list max20 of 120; employment enum `src/modules/placements/validation.ts:293-299`
- Fix: Enforce approved per-field limits or record intentional broadened form contract

## G2-2-016-145  [P2] GAP  facet F18  effort M
- Legacy: Legacy create validation `Failed to create job: ...` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:223-232`
- vNext now: New Zod issues include `Hybrid and external-only jobs require an application URL` `src/modules/placements/validation.ts:313-347`
- Fix: Map validation copy field-by-field, including server scope failures

## G2-13-019-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:29-37`
- vNext now: `src/modules/placements/validation.ts:285-295`
- Fix: Old title/company validation strings and length checks differ from selected company relationship form.

## G2-13-019-012  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:50-52`
- vNext now: `src/modules/placements/validation.ts:293-295`
- Fix: Legacy jobDescription max5000, vNext max15000 and defaults empty.

## G2-13-019-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:74-84`
- vNext now: `src/modules/placements/validation.ts:296-301`
- Fix: Arbitrary job type max50 and raw CTC format become enums/structured INR, rejecting some old values.

## G2-13-019-018  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:221-247`
- vNext now: `src/modules/placements/validation.ts:269-309`
- Fix: Legacy visibilityType INTERNAL_ONLY/HYBRID/EXTERNAL_ONLY and jobSlug external links map imperfectly to applicationMode/URL.

## G2-13-019-033  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:70-84`
- vNext now: `src/modules/placements/validation.ts:285-309`
- Fix: Old textarea/freeform single location/CTC vs vNext multiselect and structured inputs; compare form layout live.

## G2-13-020-042  [P2] GAP  facet F18  effort M
- Legacy: Legacy validation names 'Company name', 'Industry', 'Description' `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:33-52`
- vNext now: New list labels 'Companies','Filter','Company' and generic Zod errors `src/app/(authenticated)/college/companies/page.tsx:45-54`; `src/modules/placements/validation.ts:32-41`
- Fix: Use exact old validation/copy on shared fields.

## G2-13-020-046  [P2] GAP  facet F21  effort M
- Legacy: Legacy website domain canonicalization delegated to CompanyDomainService `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:200-223`
- vNext now: New Zod lowercases/strips www for primaryDomain `src/modules/placements/validation.ts:15-29`
- Fix: Implement registrable-domain validation with public suffix and MX/verified policy as applicable.

## G2-13-030-005  [P2] GAP  facet F03  effort M
- Legacy: Rating uses 5-star AntD Rate `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:124-136`
- vNext now: New result input scorePercent 0..100 `src/modules/placements/validation.ts:1025-1043`
- Fix: Use 5-star visual input and documented percent conversion.

## G2-13-030-039  [P2] MISSING  facet F17  effort M
- Legacy: Rate and Select in labelled AntD Form.Item `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:124-150`
- vNext now: New result schema no feedback-specific accessible UI `src/modules/placements/validation.ts:1011-1065`
- Fix: Keyboard star selection, error live regions, focus on first invalid.
