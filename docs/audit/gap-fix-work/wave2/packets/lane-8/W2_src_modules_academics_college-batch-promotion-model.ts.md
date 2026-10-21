# Work packet (wave 2): edit src/modules/academics/college-batch-promotion-model.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md, docs/audit/gap2/lane-9/college-admin-batch-promotion.md, docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-2-029-031  [P2] GAP  facet F06  effort M
- Legacy: BatchPromotionDTO.java:9-18 optional targetSemester and newAcademicYear; null promotes +1.
- vNext now: college-batch-promotion-model.ts:86-96 requires action PROMOTE, expectedTargetTerm, version, learner count, yearStart confirmation.
- Fix: Require preview-first UX and map intentional non-null confirmation policy.

## G2-2-029-062  [P2] GAP  facet F12  effort M
- Legacy: BatchServiceImpl.java:249-267 upper bound durationYears*2.
- vNext now: college-batch-promotion-model.ts:30-65 uses durationTerms and registered terms.
- Fix: Verify semester/duration mapping for trimester institutions and 2-semester old programs.

## G2-2-029-063  [P2] GAP  facet F12  effort M
- Legacy: BatchServiceImpl.java:276-285 auto suggests academic-year; rejects noncanonical year.
- vNext now: college-batch-promotion-model.ts:54-65 requires currentYearStart or override, page :99-105 selects yearStart.
- Fix: Match academic-year rollover policy and default; don't silently accept malformed stored year.

## G2-2-029-087  [P2] GAP  facet F18  effort S
- Legacy: BatchServiceImpl.java:245-247 step-only error includes old/new semester details.
- vNext now: college-batch-promotion-model.ts:21-27 codes and :86-96 expected target validation.
- Fix: Render full next-valid-semester help instead of enum code.

## G2-14-031-026  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:207-225 preview dry-run and 159-175 POST promotion
- vNext now: src/modules/academics/college-batch-promotion-model.ts:86-105 explicit confirmed execute
- Fix: Present detailed dry-run and confirmation as old flow

## G2-14-031-038  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:159-175 allows target semester override
- vNext now: src/modules/academics/college-batch-promotion-model.ts:45-65 target current+1 or graduate
- Fix: Explicitly document unsupported semester skipping

## G2-14-031-045  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:183-185 'Batch promoted to semester N'
- vNext now: src/modules/academics/college-batch-promotion-model.ts:39-65 returns PROMOTE/GRADUATE action
- Fix: Match exact old success toast and preview action label

## G2-9-002-027  [P2] GAP  facet F06  effort M
- Legacy: Input maxLength 7; valid consecutive YYYY-YY (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:514-532`)
- vNext now: Zod regex/consecutive check and min/max number; no maxLength on input (`src/modules/academics/college-batch-promotion-model.ts:8-20`)
- Fix: Set maxLength 7 and field-level error.

## G2-9-002-052  [P2] GAP  facet F12  effort M
- Legacy: Program max semester equals durationYears×2 (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:183-193`)
- vNext now: durationTerms field sets max (`src/modules/academics/college-batch-promotion-model.ts:47-80`)
- Fix: Verify legacy conversion to term count.

## G2-9-028-061  [P2] GAP  facet F20  effort S
- Legacy: Consecutive YYYY-YY validation modulo century `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:16-20,507-513`
- vNext now: Parser accepts YYYY-YY but visible input is numeric start-year `src/modules/academics/college-batch-promotion-model.ts:5-17` `src/app/(authenticated)/admin/batch-promotion/page.tsx:71-74`
- Fix: Keep canonical formatted year input

## G2-9-028-063  [P2] GAP  facet F22  effort M
- Legacy: Old DTO targetSemester integer, newAcademicYear string max7 `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BatchPromotionDTO.java:8-18`
- vNext now: New UUID cohort/program, version, counts, integer year and confirm `src/modules/academics/college-batch-promotion-model.ts:85-106`
- Fix: Document field/model conversion and client validation

## G2-9-022-061  [P2] GAP  facet F20  effort S
- Legacy: Consecutive YYYY-YY validation modulo century `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:16-20,507-513`
- vNext now: Parser accepts YYYY-YY but visible input is numeric start-year `src/modules/academics/college-batch-promotion-model.ts:5-17` `src/app/(authenticated)/admin/batch-promotion/page.tsx:71-74`
- Fix: Keep canonical formatted year input

## G2-9-022-063  [P2] GAP  facet F22  effort M
- Legacy: Old DTO targetSemester integer, newAcademicYear string max7 `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BatchPromotionDTO.java:8-18`
- vNext now: New UUID cohort/program, version, counts, integer year and confirm `src/modules/academics/college-batch-promotion-model.ts:85-106`
- Fix: Document field/model conversion and client validation
