# Work packet: edit src/modules/placements/validation.ts (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md, docs/audit/gap2/lane-1/l19-u021-apply-to-job-request.md, docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md, docs/audit/gap2/lane-10/superadmin-sections-job-form.md, docs/audit/gap2/lane-14/u010-job-application-source-validator.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md

## G2-12-022-017  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:30-39 — StageRequest fields applicationId, outcome, waitlistRank, score Double, reasonCategory, comment, source
- vNext now: src/modules/placements/validation.ts:1025-1066 — application UUID/outcome, scorePercent integer, candidateMessage + internalComment; no supplied source
- Fix: Document DTO mapping, migrate score precision and source semantics

## G2-19-021-001  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ApplyToJobRequest.java:7-16 — ApplyToJobRequest body has only optional resumeUrl
- vNext now: src/modules/placements/validation.ts:659-672 — input has roleOptionId/channel/externalConfirmation, no resumeUrl
- Fix: Resolve resume selection/snapshot requirement and no silent loss

## G2-19-021-007  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ApplyToJobRequest.java:14-16 — null resume uses profile resume
- vNext now: src/modules/placements/validation.ts:659-671 — no resume field; role option auto default
- Fix: Explicitly resolve verified profile resume and persist snapshot for application

## G2-19-021-012  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:401-420 — additional HTTPS, max2048, allowed storage root, user-ownership check
- vNext now: src/modules/placements/validation.ts:659-672 — no resume field validation
- Fix: Retain secure resume verification on any future resume attachment path

## G2-14-023-013  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:29-30,43-45 — seven uppercase legacy names accepted exactly.
- vNext now: src/modules/placements/validation.ts:1282-1309 and src/modules/placements/tpo-general-request-model.ts:17-30 — different enum set split by schema.
- Fix: Accept/translate legacy request names and explain changed flows.

## G2-10-030-061  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:702-709 — college-custom jobType including placed-counting.
- vNext now: src/modules/placements/validation.ts:93-96 — employment type enum FULL_TIME/INTERNSHIP/CONTRACT.
- Fix: Persist source jobType and placed-count flag separately.

## G2-14-010-007  [P1] GAP  facet F04  effort M
- Legacy: Unknown and empty input converted EXTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:32-47`
- vNext now: Input enum rejects unknown and mode determines omitted channel `src/modules/placements/validation.ts:659-672` `src/modules/placements/application-service.ts:408-452`
- Fix: Define explicit historical-value normalization adapter

## G2-14-010-009  [P1] GAP  facet F06  effort M
- Legacy: validateAndNormalize accepts null and arbitrary string `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:27-35`
- vNext now: Strict Zod enum accepts absent or exact uppercase only `src/modules/placements/validation.ts:659-672`
- Fix: Normalize legacy import sources before strict API schema

## G2-14-010-010  [P1] GAP  facet F06  effort S
- Legacy: Trims whitespace and folds case with Locale.ENGLISH `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:33-43`
- vNext now: Raw case-sensitive enum check `src/modules/placements/validation.ts:654-672`
- Fix: Trim and uppercase only at import boundary

## G2-14-010-012  [P1] GAP  facet F07  effort M
- Legacy: Invalid value silently falls back EXTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:40-47`
- vNext now: Malformed value rejects at schema parse `src/modules/placements/validation.ts:659-672`
- Fix: Separate strict interactive validation from migration fallback behavior

## G2-14-010-013  [P1] GAP  facet F07  effort S
- Legacy: isValidSource returns false for null or whitespace `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:55-59`
- vNext now: Optional field can pass Zod but HYBRID throws CHANNEL_REQUIRED `src/modules/placements/validation.ts:664-666` `src/modules/placements/application-service.ts:430-435`
- Fix: Differentiate allowed-source predicate and omitted channel handling

## G2-14-010-024  [P1] GAP  facet F12  effort S
- Legacy: Whitespace-only defaults EXTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:33-35` `docs/legacy-source/backend/src/test/java/com/_42students/lms/util/JobApplicationSourceValidatorRegressionTest.java:35-38`
- vNext now: Whitespace-only invalid Zod enum `src/modules/placements/validation.ts:659-672`
- Fix: Map blank legacy values to EXTERNAL during migration

## G2-14-010-025  [P1] GAP  facet F12  effort M
- Legacy: Unknown PARTNER defaults EXTERNAL `docs/legacy-source/backend/src/test/java/com/_42students/lms/util/JobApplicationSourceValidatorRegressionTest.java:40-43`
- vNext now: Unknown channel is rejected `src/modules/placements/validation.ts:659-672`
- Fix: Explicitly classify unsupported historic channel strings

## G2-14-010-046  [P1] GAP  facet F23  effort M
- Legacy: Legacy fallback silently coerces unknown channel `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:40-47`
- vNext now: New strict validation rejects unknown `src/modules/placements/validation.ts:659-672`
- Fix: Label strict live rejection intentional; build migration-only legacy adapter

## G2-14-011-020  [P1] GAP  facet F06  effort M
- Legacy: Company ID optional, linked record must exist and belong to organization `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:114-140`
- vNext now: New companyRelationshipId mandatory and active `src/modules/placements/validation.ts:285-295` `src/modules/placements/job-service.ts:150-164`
- Fix: Handle legacy unlinked or org-wide jobs during migration

## G2-14-011-021  [P1] GAP  facet F06  effort L
- Legacy: Default visibility INTERNAL_ONLY; HYBRID and EXTERNAL_ONLY generate slug `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:311-347`
- vNext now: New applicationMode INTERNAL/HYBRID/EXTERNAL_ONLY and URL requirement `src/modules/placements/validation.ts:269-273` `src/modules/placements/validation.ts:337-346`
- Fix: Crosswalk public slug/external site link and modes

## G2-14-015-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy REQUEST and SENT_BACK are recruiter request lifecycle states `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:10-13`
- vNext now: New job status enum has no REQUEST or SENT_BACK `src/modules/placements/validation.ts:262-269`
- Fix: Map recruiter request workflow into separate typed request statuses and navigation

## G2-15-015-017  [P1] GAP  facet F06  effort S
- Legacy: type allowed INCLUDE/EXCLUDE and reason trimmed >=3. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:384-389`)
- vNext now: New Zod decision enum and trimmed reason min1 max1000. (`src/modules/placements/validation.ts:630-637`)
- Fix: Require at least three characters on override form/API, preserve 1000 upper guard.

## G2-19-021-048  [P1] GAP  facet F22  effort L
- Legacy: Old DTO single nullable String with Java Pattern, service 2048/HTTPS/host constraints. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ApplyToJobRequest.java:13-17` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:401-412`
- vNext now: vNext strict Zod excludes it entirely. `src/modules/placements/validation.ts:659-672`
- Fix: Version schema around secure owned storage reference, not arbitrary URL.

## G2-2-016-013  [P1] GAP  facet F06  effort L
- Legacy: Create validates visibilityType INTERNAL_ONLY/HYBRID/EXTERNAL_ONLY (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:479-489`)
- vNext now: VNext createPlacementJobInputSchema and applicationMode/url policy (`src/modules/placements/validation.ts:260-388`)
- Fix: Map old visibility modes to vNext job applicationMode/public link semantics
