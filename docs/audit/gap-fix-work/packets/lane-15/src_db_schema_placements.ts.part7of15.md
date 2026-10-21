# Work packet: edit src/db/schema/placements.ts (part 7 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/job-round-repository.md, docs/audit/gap2/lane-15/recruiter.md, docs/audit/gap2/lane-15/u002-student-placement-lookup.md, docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md, docs/audit/gap2/lane-16/u015-job-eligibility.md, docs/audit/gap2/lane-16/u031-placements-end-to-end.md

## G2-15-014-068  [P1] GAP  facet F22  effort M
- Legacy: Added_by_hr_user_id BIGINT nullable recruiter actor. (`docs/legacy-source/backend/src/main/resources/db/migration/V179__job_round_added_by_hr.sql:1-3`)
- vNext now: New mandatory createdByUserId UUID, no legacy nullable HR actor distinction. (`src/db/schema/placements.ts:1259-1263`)
- Fix: Backfill actual creator where known and safe legacy service actor fallback.

## G2-15-016-012  [P1] GAP  facet F04  effort L
- Legacy: Legacy industryCompanyId replaced with companyId numeric. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:53-59`)
- vNext now: New companyId UUID required. (`src/db/schema/placements.ts:164-168`)
- Fix: Map company numeric ID, fail if no resolved company rather than invent.

## G2-15-016-034  [P1] GAP  facet F10  effort L
- Legacy: Each college access grant status/validUntil/capabilities and actor. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:33-75`)
- vNext now: New relationship-scoped grants, verificationStatus and validUntil. (`src/db/schema/placements.ts:206-252`)
- Fix: Map old college/org grant and capabilities into company relationship target.

## G2-15-016-040  [P1] GAP  facet F11  effort M
- Legacy: Access valid until null or future. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:80-84`)
- vNext now: Null validUntil fails closed for new grants. (`src/db/schema/placements.ts:233-234`)
- Fix: Do not migrate null legacy unlimited grants to missing-expiry deny without policy.

## G2-15-016-043  [P1] GAP  facet F12  effort M
- Legacy: Old indefinite grant null expiry allowed. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:80-84`)
- vNext now: New null expiry fails closed. (`src/db/schema/placements.ts:233-234`)
- Fix: Backfill explicit expiration policy and show grant expiry management.

## G2-15-016-067  [P1] GAP  facet F22  effort L
- Legacy: SuspendedAt/reason/tokenVersion/lastLogin/creator type/version. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:61-84`)
- vNext now: New profile does not directly store these fields. (`src/db/schema/placements.ts:158-204`)
- Fix: Map suspensions to platform/auth audit; preserve reason and session revocation contract.

## G2-15-016-068  [P1] GAP  facet F22  effort L
- Legacy: Grant recruiterId/collegeId and optional indefinite validUntil. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:33-84`)
- vNext now: New relationship grant + required effective validity. (`src/db/schema/placements.ts:206-240`)
- Fix: Map legacy college grants to company relationship+time range.

## G2-15-002-079  [P1] GAP  facet F22  effort L
- Legacy: Legacy learner search IDs integer learnerId and job application IDs; application-view stage, rejectionReason, nextInterview DTO (`StudentPlacementLookup.js:88-103,184-200`; `LearnerApplicationWithInterviewsDTO.java:21-28,40-54,145-193`).
- vNext now: UUID membershipId/placementApplications/job/offer; status and submittedAt in persisted application; no rejectionReason projection (`college-placement-student-lookup-service.ts:14-20,46-70`; `placements.ts:973-1018`).
- Fix: Define one-to-one legacy learner/application stage mapping, reason/interview joins and stable identity policy.

## G2-15-002-081  [P1] GAP  facet F22  effort M
- Legacy: Legacy summary rows conceptually one per placement application, with next interview DTO (`AdminJobServiceImpl.java:1889-1899`; `LearnerApplicationWithInterviewsDTO.java:21-28`).
- vNext now: Left joins placementOffers and placementJoiningOutcomes can multiply rows per application (`college-placement-student-lookup-service.ts:47-67`); app uniqueness by role+membership (`placements.ts:1026-1042`).
- Fix: Aggregate offers per application deterministically and avoid misleading duplicate history entries.

## G2-15-002-082  [P1] GAP  facet F22  effort M
- Legacy: Legacy status enum set includes APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW, WAITLISTED, OFFERED, HIRED, REJECTED, WITHDRAWN (`StudentPlacementLookup.js:13-23`).
- vNext now: placementApplications status defaults `SUBMITTED`, separately offer/joining statuses (`placements.ts:993-1009`; `college-placement-student-lookup-service.ts:47-53`).
- Fix: Implement stage crosswalk and time/event source of truth without conflating application, offer and joining.

## G2-16-014-008  [P1] GAP  facet F05  effort L
- Legacy: JobOfferRepository.java:25-26 RELEASED and respondBy < current timestamp.
- vNext now: placements.ts:1533-1563 ISSUED and expiresAt.
- Fix: Map statuses and run scheduled expiry strict cutoff.

## G2-16-014-022  [P1] GAP  facet F12  effort L
- Legacy: JobOfferRepository.java:25-26 RELEASED vs SELECTED/PENDING_VERIFICATION status excluded.
- vNext now: placements.ts:1615-1617 only ISSUED/ACCEPTED/DECLINED/WITHDRAWN/EXPIRED.
- Fix: Preserve verification stage as separate lifecycle before issued.

## G2-16-014-023  [P1] GAP  facet F12  effort M
- Legacy: JobOfferRepository.java:29-31 external acceptance waits 48h when acceptedDisputableUntil set.
- vNext now: placements.ts:1552-1555 retains timestamp; no clear background consumer.
- Fix: Do not trigger accepted-offer cascade before dispute window ends.

## G2-16-015-008  [P1] MISSING  facet F04  effort M
- Legacy: JobEligibility.java:26-34 minCgpa/minPctThroughout and level-specific percentages including PG.
- vNext now: placements.ts:839-856 has CGPA and school/diploma/undergrad/throughout but no PG-only min.
- Fix: Add PG minimum percentage when learner has PG evidence, leave otherwise unrestricted.

## G2-16-015-020  [P1] GAP  facet F11  effort L
- Legacy: JobEligibility.java:42 gender never exported to companies.
- vNext now: placements.ts:818-919 no gender persisted in eligibility policy.
- Fix: If retained, isolate diversity restriction from recruiter-visible output and exports.

## G2-16-031-093  [P1] GAP  facet F22  effort L
- Legacy: TpoDriveController.java:65-102 legacy Job entity has numeric id and status REQUEST/SENT_BACK/REJECTED workflow.
- vNext now: placements.ts:462-618 new placement_jobs UUID id and status DRAFT/PUBLISHED/CLOSED/CANCELLED/ARCHIVED; request statuses separate.
- Fix: Create explicit legacy-id-map and mapping table for recruiter request provenance, job lifecycle and imports.

## G2-16-031-094  [P1] GAP  facet F22  effort L
- Legacy: TpoCompanyController.java:47-105 company identity can be resolved by name/domain and linked to selected college.
- vNext now: placements.ts:23-158 split global placement_companies and college-scoped placement_company_relationships with unique active keys.
- Fix: Migrate canonical global company, alias, verified domain and college relationship separately; avoid duplicate merges.

## G2-16-031-095  [P1] GAP  facet F22  effort L
- Legacy: ApplyGate.java:93-110 uses legacy placement_registration and pre-invite historical application choice.
- vNext now: placements.ts:973-1109 uses placement_applications and history; learner-job-service.ts:176-187 uses placement_batch_registrations.
- Fix: Map grandfathered registration markers and historical application dates before enabling self-apply gate.

## G2-18-011-006  [P1] GAP  facet F03  effort M
- Legacy: Legacy status label `Not shortlisted`, `Not cleared: Interview` etc from stage map (`JobServiceImpl.java:899-933`).
- vNext now: New application statuses SUBMITTED/WITHDRAWN and role-based reports; old status label not directly represented on application row (`placements.ts:973-1019`).
- Fix: Derive precise stage label from screening/round history in learner view.

## G2-18-011-011  [P1] GAP  facet F04  effort L
- Legacy: Legacy status `APPLIED`, `SHORTLISTED`, `ASSESSMENT`, `INTERVIEW`, `WAITLISTED`, `OFFERED`, `HIRED`, `REJECTED`, `WITHDRAWN` (`JobServiceImpl.java:907-933,1168-1200`).
- vNext now: New application status only SUBMITTED/WITHDRAWN; separate offers and round/screening (`placements.ts:993-1059,1114-1170,1522-1671`).
- Fix: Build exact old stage status crosswalk; do not confuse APPLICATION status with OFFER status.
