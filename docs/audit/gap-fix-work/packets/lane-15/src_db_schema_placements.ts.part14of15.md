# Work packet: edit src/db/schema/placements.ts (part 14 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-companies.md, docs/audit/gap2/lane-9/college-admin-jobs-all.md, docs/audit/gap2/lane-9/college-admin-jobs-settings.md, docs/audit/gap2/lane-9/l13-u025-recruiter-pending-invite-controller.md, docs/audit/gap2/lane-9/l17-u023-learner-offer-controller.md, docs/audit/gap2/lane-9/l18-u013-job-search-cache.md

## G2-9-004-085  [P1] GAP  facet F22  effort M
- Legacy: Deleted flag on company record (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:267-284`)
- vNext now: Global and college relationship each ACTIVE/ARCHIVED (`src/db/schema/placements.ts:25-120`)
- Fix: Create deterministic status mapping and restore semantics.

## G2-9-015-100  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:24-102` — Legacy job has jobTitle, companyName, jobType, location text, ctcRange, postedDate, applicationDeadline.
- vNext now: `src/db/schema/placements.ts:462-517` — VNext placementJobs title/companyRelationshipId/employmentType/locations/salary ints and publishedAt.
- Fix: Map legacy field semantics in exported DTO before UI cloning.

## G2-9-015-101  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:115-145` — Legacy isActive and isDraft Boolean, with organizationId, collegeId.
- vNext now: `src/db/schema/placements.ts:512-560` — Status enum DRAFT/PUBLISHED/CLOSED/ARCHIVED/CANCELLED and college UUID.
- Fix: Map status booleans and deleted records across list filters.

## G2-9-013-021  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:26-90` — job_type free text and ctc_range string e.g. 6-10 LPA.
- vNext now: `src/db/schema/placements.ts:493-511` — employmentType enum and numeric salary bounds, no equivalent college-selectable job type.
- Fix: Define mapping for dynamic job types/countsAsPlaced and legacy CTC display.

## G2-9-013-063  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:528-543` — Legacy application deadline derived from importantDates entry and blocks after deadline.
- vNext now: `src/db/schema/placements.ts:511-517` — Dedicated timestamptz applicationDeadline; no derived list write in draft editor.
- Fix: Preserve deadline/milestone synchronization and backfill mapping.

## G2-9-013-097  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:26-95` — MySQL job table stores 100-char title, 100-char company, text description/responsibilities, job_type and ctc_range.
- vNext now: `src/db/schema/placements.ts:462-511` — Postgres placement_jobs has unbounded text title/description, employer relationship, employmentType, salary integer bounds.
- Fix: Produce explicit field-by-field mapping and validate old max/meaning where parity needed.

## G2-9-013-098  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:97-168` — job important_dates JSON, four target hierarchy FKs, is_active and is_draft booleans.
- vNext now: `src/db/schema/placements.ts:481-526` — legacyPostingDetails JSONB, status varchar and separate eligibility-program/cohort policy.
- Fix: Store/recover milestone and target hierarchy semantics; translate legacy booleans.

## G2-9-013-099  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:169-190` — candidate_preferences JSON with soft advisory fields and validator.
- vNext now: `src/db/schema/placements.ts:481-501` — legacyPostingDetails JSONB contains candidatePreferences/customEligibilityRules; page editor does not expose it.
- Fix: Ensure read/write plumbing for supplemental preferences, plus schema constraint/validator.

## G2-9-013-100  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:26-45` — Legacy numeric integer job id and linked companyId; version via base model and JPA optimistic lock.
- vNext now: `src/db/schema/placements.ts:462-468` — New UUID job and relationship IDs, updatedAt but no explicit job version column.
- Fix: Specify optimistic-write token and retry on conflicting edits.

## G2-13-025-002  [P1] MISSING  facet F01  effort M
- Legacy: RecruiterService has three pending APIs `docs/legacy-source/frontend/src/api/Services/RecruiterService.js:37-40`
- vNext now: Acceptance contract has no post-login consent UI `src/modules/placements/tpo-recruiter-invite-acceptance.ts:9-15`; NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Add pending invitation panel to authenticated recruiter app.

## G2-13-025-006  [P1] MISSING  facet F03  effort S
- Legacy: Two one-click actions Accept and Decline for each college `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:25-29`
- vNext now: No pending-specific controls NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Add per-college Accept/Decline buttons.

## G2-13-025-012  [P1] GAP  facet F05  effort L
- Legacy: Old one row per recruiter and college `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:295-300`
- vNext now: New unique ACTIVE grant is recruiter+company relationship `src/db/schema/placements.ts:255-260`
- Fix: Enforce at most one live pending/active grant per recruiter+college.

## G2-13-025-023  [P1] MISSING  facet F10  effort M
- Legacy: Decline ->REVOKED, revokedAt, reason 'Declined by the recruiter' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:324-330`
- vNext now: New REVOKED DB fields exist but no recruiter decline `src/db/schema/placements.ts:226-243,289-292`
- Fix: Write status/revokedAt/revokeReason and actor id.

## G2-13-025-044  [P1] GAP  facet F22  effort S
- Legacy: Decline writes revokedAt without explicit revokedBy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:324-331`
- vNext now: REVOKED lifecycle requires revokedByUserId `src/db/schema/placements.ts:289-292`
- Fix: Set recruiter as revoker and retain exact reason.

## G2-17-023-009  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:31-67 integer offer id, applicationId, kind, roleOptionName, CTC LPA, letterUrl
- vNext now: src/db/schema/placements.ts:1523-1556 UUID offer, applicationId, annual CTC INR, offerLetterUrl
- Fix: Map every legacy offer field and LPA-to-INR conversion explicitly.

## G2-17-023-010  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:69-87 SELECTED/RELEASED/ACCEPTED/DECLINED/... with acceptanceChannel, dispute, joining, cascade
- vNext now: src/db/schema/placements.ts:1533-1556,1615-1617 ISSUED/ACCEPTED/DECLINED/WITHDRAWN/EXPIRED
- Fix: Document SELECTED -> staging, RELEASED -> ISSUED, joining moved to joining_outcomes.

## G2-17-023-038  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:180-187 offer responds via job application's status transition
- vNext now: src/db/schema/placements.ts:987-1058 separate app submitted/withdrawn state and src/db/schema/placements.ts:1523-1617 offer state
- Fix: Map old OFFERED/HIRED app status to vNext application+screening and accepted offer projections.

## G2-17-023-059  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:24-40,69-87 MySQL job_offer auto-id int and offer state
- vNext now: src/db/schema/placements.ts:1523-1617 PG UUID placement_offers and check statuses
- Fix: Maintain field mapping ledger and rule-authorized state transitions.

## G2-17-023-061  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:78-87 joiningStatus, cascadeId, accepted dispute columns
- vNext now: src/db/schema/placements.ts:1552-1556,1883-1935 cascade/dispute on offer, joining in separate table
- Fix: Preserve joining and dispute projection across new tables and history.

## G2-18-013-054  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchDTO.java:20-38 one Job DTO with int department/program reference IDs
- vNext now: src/db/schema/placements.ts:481-550 Postgres placementJobs plus roleOptions, relationships and cohorts
- Fix: Field-map legacy Job entity to job+role+company tables and scoped IDs.
