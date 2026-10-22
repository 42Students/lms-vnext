# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-005-087 [P1] GAP facet F22
- Files: src/app/(authenticated)/learn/my-placements/jobs/page.tsx, src/modules/placements/learner-job-service.ts
- Legacy: Legacy one job listing object with free-form ctcRange/location/jobType; vNext normalized job + roleOption, company and application join — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:132-151,220-245`
- Expected fix: Provide typed translation of all legacy card fields per role and group legacy job cards

## G2-14-005-089 [P1] GAP facet F22
- Files: src/modules/placements/learner-job-service.ts, src/components/placements/learner-placement-jobs.tsx
- Legacy: Legacy applicationStage from job.applicationStatus; vNext placementApplications.status plus eligibility, different enum semantics — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:418-431`
- Expected fix: Map statuses to legacy application-stage chip vocabulary

## G2-14-002-076 [P1] MISSING facet F15
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy OTP reset clears login/verifyOTP prefixes, no new OTP send; vNext no admin reset — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:173-200`
- Expected fix: Reset limiter state only, send no OTP automatically

## G2-14-010-007 [P1] GAP facet F04
- Files: src/modules/placements/validation.ts, src/modules/placements/application-service.ts
- Legacy: Unknown and empty input converted EXTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:32-47`
- Expected fix: Define explicit historical-value normalization adapter

## G2-14-010-009 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: validateAndNormalize accepts null and arbitrary string `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:27-35`
- Expected fix: Normalize legacy import sources before strict API schema

## G2-14-010-010 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: Trims whitespace and folds case with Locale.ENGLISH `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:33-43`
- Expected fix: Trim and uppercase only at import boundary

## G2-14-010-012 [P1] GAP facet F07
- Files: src/modules/placements/validation.ts
- Legacy: Invalid value silently falls back EXTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:40-47`
- Expected fix: Separate strict interactive validation from migration fallback behavior

## G2-14-010-024 [P1] GAP facet F12
- Files: src/modules/placements/validation.ts
- Legacy: Whitespace-only defaults EXTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:33-35` `docs/legacy-source/backend/src/test/java/com/_42students/lms/util/JobApplicationSourceValidatorRegressionTest.java:35-38`
- Expected fix: Map blank legacy values to EXTERNAL during migration

## G2-14-010-025 [P1] GAP facet F12
- Files: src/modules/placements/validation.ts
- Legacy: Unknown PARTNER defaults EXTERNAL `docs/legacy-source/backend/src/test/java/com/_42students/lms/util/JobApplicationSourceValidatorRegressionTest.java:40-43`
- Expected fix: Explicitly classify unsupported historic channel strings

## G2-14-010-046 [P1] GAP facet F23
- Files: src/modules/placements/validation.ts
- Legacy: Legacy fallback silently coerces unknown channel `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:40-47`
- Expected fix: Label strict live rejection intentional; build migration-only legacy adapter

## G2-14-011-002 [P1] GAP facet F01
- Files: src/modules/placements/job-service.ts
- Legacy: Organization-scoped getJobById allows linked colleges in organization `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:219-231`
- Expected fix: Implement legitimate super-admin org scope through acting college

## G2-14-011-011 [P1] GAP facet F04
- Files: src/modules/placements/job-service.ts
- Legacy: Job entity uses optimistic version `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:269-276`
- Expected fix: Use CAS token on draft updates

## G2-14-011-020 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts, src/modules/placements/job-service.ts
- Legacy: Company ID optional, linked record must exist and belong to organization `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:114-140`
- Expected fix: Handle legacy unlinked or org-wide jobs during migration

## G2-14-011-021 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: Default visibility INTERNAL_ONLY; HYBRID and EXTERNAL_ONLY generate slug `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:311-347`
- Expected fix: Crosswalk public slug/external site link and modes

## G2-14-011-026 [P1] GAP facet F06
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy can redraft or activate from explicit incoming booleans `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:558-578`
- Expected fix: Provide deliberate published edit/re-draft workflow or mark unsupported

## G2-14-011-038 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy org-scoped GET derives organization from authenticated context `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:465-475`
- Expected fix: Introduce explicit acting-org read rather than user supplied org

## G2-14-011-040 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy company link revalidated and locked when changed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:114-140` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:591-598`
- Expected fix: Revalidate changed company relationship under lock

## G2-14-011-041 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy activate/deactivate and soft delete `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:604-638`
- Expected fix: Define transitions mapping and audit behavior

## G2-14-011-042 [P1] GAP facet F10
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy application status mutation writes history and publishes status event `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1258-1273`
- Expected fix: Preserve reporting history and event consumers

## G2-14-011-046 [P1] GAP facet F11
- Files: src/modules/placements/job-service.ts, src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy org access guard applies across all job CRUD `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:465-475` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:582-595`
- Expected fix: Provide super-admin/org-wide role matrix

## G2-14-011-049 [P1] GAP facet F12
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy allowed transitions include HIRED to OFFERED reversal `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:20-113`
- Expected fix: Map hire correction reversal and audit

## G2-14-011-052 [P1] GAP facet F12
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy HIRED blocked if learner already HIRED elsewhere `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1191-1203`
- Expected fix: Enforce global single-hire invariant

## G2-14-011-061 [P1] GAP facet F15
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy status notice sent asynchronously after transaction commit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:2004-2024`
- Expected fix: Preserve email/SMS template mapping and after-commit semantics

## G2-14-011-062 [P1] GAP facet F15
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy interview cancellation sends specific notice after commit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:142-160` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:180-187`
- Expected fix: Emit interview cancellation event and learner message

## G2-14-011-074 [P1] GAP facet F20
- Files: src/modules/placements/college-application-stage-service.ts, src/modules/placements/tpo-bulk-application-stage-service.ts
- Legacy: Legacy status updates lock job and other applications in consistent order `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1169-1186` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1290-1327`
- Expected fix: Document and test global lock ordering including interview/offers


## Fast verification triage — chat-4
- OK (direct source inspection): G2-14-010-007, G2-14-010-009, G2-14-010-010, G2-14-010-012, G2-14-010-024, G2-14-010-025, G2-14-010-046, G2-14-011-049.
- DEFERRED (not validated or fixed; needs deeper parity review): G2-14-005-087, G2-14-005-089, G2-14-002-076, G2-14-011-002, G2-14-011-011, G2-14-011-020, G2-14-011-021, G2-14-011-026, G2-14-011-038, G2-14-011-040, G2-14-011-041, G2-14-011-042, G2-14-011-046, G2-14-011-052, G2-14-011-061, G2-14-011-062, G2-14-011-074.
- This is a triage disposition, not an assertion of feature parity. Deferred facets remain open for implementation and independent comparison.
