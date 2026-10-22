# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-004-054 [P1] GAP facet F08
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: Autoapproved shows Approved. The placement cell sets the dates and opens it to students. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:279`
- Expected fix: Return and render autoapproved outcome correctly

## G2-11-004-064 [P1] GAP facet F10
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: POST `/plan-drive` with `form`, 201 response containing per-college `jobId` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:47`
- Expected fix: Map request approval/jobId receipts and error statuses

## G2-11-004-077 [P1] MISSING facet F12
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: Uploaded JD only PDF/Word <=5MB `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363`
- Expected fix: Enforce MIME/size on signed storage integration

## G2-11-004-086 [P1] MISSING facet F14
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: Legacy preview displays job description link to students `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:429`
- Expected fix: Show safe signed document link in preview

## G2-11-004-094 [P1] GAP facet F16
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: Preview remains alongside even before validation `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:424`
- Expected fix: Make preview continuously live

## G2-11-004-096 [P1] GAP facet F17
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: On validation error scrolls to first field `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:254`
- Expected fix: Scroll/focus first failing form control

## G2-11-004-121 [P1] GAP facet F23
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: Live right-card preview from first render `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:425`
- Expected fix: Return always-on preview

## G2-11-009-047 [P1] GAP facet F11
- Files: src/app/(authenticated)/tpo/drive-day/page.tsx
- Legacy: Legacy TPO view not overridden by learner capability. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:15`
- Expected fix: Route by selected role explicitly.

## G2-11-009-049 [P1] GAP facet F12
- Files: src/modules/placements/tpo-live-drive-day-model.ts
- Legacy: Legacy includes all today's ON_CAMPUS PUBLISHED rounds irrespective of start time. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- Expected fix: Include future same-day rounds.

## G2-11-009-050 [P1] GAP facet F12
- Files: src/modules/placements/tpo-live-drive-day-model.ts
- Legacy: Legacy includes rounds already ended earlier today. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- Expected fix: Retain completed earlier-in-day round entry.

## G2-11-009-051 [P1] GAP facet F12
- Files: src/modules/placements/tpo-live-drive-day-model.ts
- Legacy: Legacy includes rounds with missing duration. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- Expected fix: Do not gate daily access on duration completeness.

## G2-11-010-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx
- Legacy: Query tab=overview aliases to about; unrecognized defaults based on lifecycle. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:49`
- Expected fix: Preserve lifecycle default About for request/draft, Applicants otherwise.

## G2-11-010-019 [P1] GAP facet F03
- Files: src/modules/placements/tpo-drive-next-step-model.ts
- Legacy: After deadline with applicants, main button Share N applicants with company. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:278`
- Expected fix: Match condition/count or document intended new share policy.

## G2-11-010-022 [P1] MISSING facet F03
- Files: src/modules/placements/tpo-drive-next-step-model.ts
- Legacy: Recorded-outside without applicants main Add students who took part. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:281`
- Expected fix: Add recordedOutside primary CTA with correct section.

## G2-12-020-005 [P1] MISSING facet F03
- Files: src/db/schema/placement-company-identities.ts, src/db/schema/placements.ts
- Legacy: Legacy verifiedBy42 boolean indicates domain individually verified `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- Expected fix: Persist domain-level verification state independently of company verification.

## G2-12-020-009 [P1] MISSING facet F04
- Files: src/db/schema/placement-company-identities.ts
- Legacy: Old verifiedBy42 false default `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- Expected fix: Add per-domain verifiedBy42/verifiedAt with default false.

## G2-12-020-020 [P1] MISSING facet F06
- Files: src/db/schema/placement-company-identities.ts, src/db/schema/placements.ts
- Legacy: Old verifiedBy42 false by default, only verified action should set true `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- Expected fix: Require explicit domain verification workflow and display badge.

## G2-12-020-037 [P1] MISSING facet F13
- Files: src/db/schema/placement-company-identities.ts, src/db/schema/placements.ts
- Legacy: Legacy null verifiedBy42 impossible (nullable=false) default false `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- Expected fix: Backfill false for legacy unverified company domains.

## G2-12-020-051 [P1] GAP facet F22
- Files: src/db/schema/placement-company-identities.ts
- Legacy: Legacy company_domain fields id,company_id,domain,verified_by_42,added_by_user_id,added_by_user_type,added_by_college_id,created_at `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:24-48`
- Expected fix: Register missing verification and provenance columns; map types/scope.

## G2-12-020-052 [P1] GAP facet F22
- Files: src/db/schema/placement-company-identities.ts, src/modules/placements/company-curation-domain-model.ts
- Legacy: Legacy domain unique intent case-insensitive registrable name `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-16` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:128-138`
- Expected fix: Normalize before persistence and backfill duplicates.

## G2-12-020-054 [P1] GAP facet F23
- Files: src/db/schema/placement-company-identities.ts, src/modules/placements/tpo-company-domain-service.ts
- Legacy: Old verifiedBy42 per domain and actor/college provenance for ownership trust `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-44`
- Expected fix: Close verification/provenance/aggregation integrity before parity signoff.

## G2-12-003-055 [P1] GAP facet F12
- Files: src/db/schema/courses.ts
- Legacy: Learner visibility from active AND enabled, combined in per-course switch and bulk `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94,600-602`
- Expected fix: Specify how hidden but nonarchived course persists

## G2-12-003-084 [P1] GAP facet F22
- Files: src/db/schema/courses.ts
- Legacy: Legacy course table id int, contents JSON MetaData, deptId int, active/enabled, slug, version `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:17-57`
- Expected fix: Map removed JSON fields/slug/version and state

## G2-18-016-005 [P1] GAP facet F04
- Files: src/db/schema/quizzes.ts
- Legacy: QuizAttempt.java:18-32 int quizId/learnerId/attemptNumber, status SUBMITTED, long score/maxScore, LocalDateTime submittedAt
- Expected fix: Document compatibility map for IDs, score width, status and timezone; no direct numeric ID migration assumed

## G2-18-016-035 [P1] GAP facet F22
- Files: src/db/schema/quizzes.ts
- Legacy: BaseModel.java:23-37 gives int ID, created_at, updated_at, is_deleted
- Expected fix: Record intentional immutable attempt history and remove soft-delete assumptions from downstream reads

## Lane 9 verification disposition (2026-10-22)

- DEFERRED — G2-11-004-054: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-004-064: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-004-077: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-004-086: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-004-094: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-004-096: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-004-121: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-009-047: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-009-049: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-009-050: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-009-051: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-010-002: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-010-019: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-010-022: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-12-020-005: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-12-020-009: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-12-020-020: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-12-020-037: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-12-020-051: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-12-020-052: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-12-020-054: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-12-003-055: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-12-003-084: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-18-016-005: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-18-016-035: implementation and regression checks not independently completed; no parity claim.
