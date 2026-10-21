# Work packet (wave 2): edit src/modules/placements/validation.ts (part 2 of 2)

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l13-u030-interview-feedback-form.md, docs/audit/gap2/lane-8/admin-job-service.md, docs/audit/gap2/lane-8/job-round.md, docs/audit/gap2/lane-8/l12-u012-mail-domain-resolver.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md, docs/audit/gap2/lane-8/tpo-season-controller.md

## G2-13-030-040  [P2] GAP  facet F18  effort M
- Legacy: Exact texts 'Rating (1–5)', 'Recommendation', 'Comments', 'Submit feedback', 'Cancel' `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:124-193`
- vNext now: New result terms PASS/FAIL/HOLD/ABSENT `src/modules/placements/validation.ts:1011-1018`
- Fix: Use exact legacy feedback vocabulary for role-specific form.

## G2-8-012-016  [P2] GAP  facet F06  effort M
- Legacy: Application deadline derived from importantDates label and rejects past (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:528-544,2145-2182`)
- vNext now: VNext explicit applicationDeadline schema and publish readiness checks (`src/modules/placements/validation.ts:313-388; src/modules/placements/tpo-drive-lifecycle-model.ts:50-58`)
- Fix: Map all important_dates labels and deadline precedence, preserve timezone IST and explicit errors

## G2-8-012-043  [P2] GAP  facet F18  effort M
- Legacy: Legacy targeting errors name class/program/batch/department ID (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2026-2137`)
- vNext now: VNext validation currently uses Zod error codes and domain errors (`src/modules/placements/validation.ts:557-630`)
- Fix: Translate to exact entity-specific messages without exposing unauthorized IDs

## G2-8-012-047  [P2] GAP  facet F20  effort S
- Legacy: Legacy application status normalizes case before comparing (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1227-1239`)
- vNext now: VNext status enum strict uppercase at Zod boundary (`src/modules/placements/validation.ts:687-742`)
- Fix: Normalize old mixed-case bookmarks/imports before strict enum

## G2-8-012-052  [P2] GAP  facet F22  effort L
- Legacy: Legacy Job and JobApplication keys ints, organization/college + various JSON targeting (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:433-578,1217-1245`)
- vNext now: VNext UUID job/application, normalized companies, seasons, role/policy/rounds (`src/db/schema/placements.ts:23-154; src/modules/placements/validation.ts:260-388`)
- Fix: Document IDs/fields/filters and import compatibility (migration explicitly not required)

## G2-8-015-039  [P2] GAP  facet F18  effort M
- Legacy: Legacy name default unrestricted input (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:37-38`)
- vNext now: VNext text name nullable? notNull, schemas add length cap (`src/db/schema/placements.ts:1233; src/modules/placements/validation.ts:742-819`)
- Fix: Map exact max length/trim validation strings

## G2-12-012-006  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:78-107 checkEmail trims and lowercases; checkDomain accepts typed domain, @domain and URL
- vNext now: src/modules/placements/validation.ts:15-30 accepts plain domain only; src/modules/placements/public-join/domain-model.ts:19-24 email only
- Fix: Normalize websites, leading @, email domains and typed subdomains before validation consistently

## G2-12-012-016  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:91-92 normalizes trailing dot and domain case
- vNext now: src/modules/placements/validation.ts:15-30 trims/lowercases and strips 'www.' only; trailing dot rejected
- Fix: Normalize trailing dot in safe canonicalization or explicitly preserve legacy acceptance

## G2-15-026-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:75-100 jobType, location, CTC range, dates, importantDates JSON
- vNext now: src/modules/placements/validation.ts:293-312 structured employmentType/workMode/openings/CTC/deadline
- Fix: Map legacy CTC range, responsibilities and important dates to structured fields/formatted output

## G2-8-022-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy name String not nullable, no JPA length constraint (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:40-41).
- vNext now: New name text NOT NULL, Zod trim length 2..160 (src/db/schema/placements.ts:383-384; src/modules/placements/validation.ts:219-223).
- Fix: Enforce clear length errors; check existing one-character/long season names.

## G2-14-010-019  [P3] GAP  facet F10  effort S
- Legacy: Separate isValidSource boolean helper `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:49-60`
- vNext now: Typed schema can safelyParse but no equivalent predicate exported `src/modules/placements/validation.ts:659-672`
- Fix: Add predicate wrapper if importer needs it

## G2-13-019-037  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:29-37`
- vNext now: `src/modules/placements/validation.ts:291-295`
- Fix: Job title/Company name exact legacy validation wording changed; restore UI copy where required.
