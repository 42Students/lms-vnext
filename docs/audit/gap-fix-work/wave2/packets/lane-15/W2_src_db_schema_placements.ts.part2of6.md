# Work packet (wave 2): edit src/db/schema/placements.ts (part 2 of 6)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-offer.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-14/u015-job-lifecycle-status.md, docs/audit/gap2/lane-14/u016-recruiter-college-access.md, docs/audit/gap2/lane-14/u019-interview.md, docs/audit/gap2/lane-14/u020-college-company.md

## G2-13-015-060  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:16` latest offer uses createdAt DESC; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:25` expire selects status RELEASED
- vNext now: `src/db/schema/placements.ts:1534` ISSUED and expiresAt, `src/modules/placements/tpo-drive-offer-register-model.ts:59` sort by issuedAt DESC
- Fix: Align legacy ordering to createdAt vs issuedAt and release-to-expire mapping

## G2-14-011-009  [P2] GAP  facet F04  effort M
- Legacy: Job has title company description free-text location and CTC range `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:31-99`
- vNext now: New title description location array and numeric INR minimum/maximum `src/db/schema/placements.ts:462-510`
- Fix: Make field by field display adapter including unstructured CTC text

## G2-14-015-007  [P2] GAP  facet F04  effort S
- Legacy: Legacy stored field lifecycleStatus String `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:282-291`
- vNext now: New stored job.status varchar24 `src/db/schema/placements.ts:513-518`
- Fix: Document field alias lifecycleStatus to status in compatibility projection

## G2-14-015-009  [P2] GAP  facet F05  effort M
- Legacy: Legacy map groups draft-like and inactive states for filters `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-22`
- vNext now: New database index collegeId,status and status list enum `src/db/schema/placements.ts:549-568`
- Fix: Crosswalk tabs and filtering for SENT_BACK/REQUEST/REJECTED

## G2-14-016-010  [P2] GAP  facet F04  effort S
- Legacy: Legacy revokedByUserType stored `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:58-68`
- vNext now: New revokedByUserId + revokedAt; actor role not direct column `src/db/schema/placements.ts:223-243`
- Fix: Preserve revoker role in activity metadata or schema history

## G2-14-016-031  [P2] GAP  facet F10  effort M
- Legacy: Legacy grant same recruiter+college can be reactivated after revoke `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:19-21`
- vNext now: New GRANT inserts separate row when prior ACTIVE absent; revoked history remains `src/modules/placements/tpo-recruiter-grant-write-service.ts:84-107` `src/db/schema/placements.ts:255-260`
- Fix: Define historical reactivation or new-row provenance

## G2-14-019-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy user-visible round description mandatory on create `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:81-82` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:259-267`
- vNext now: New round name and whatToBring, slot panel and room `src/db/schema/placements.ts:1231-1245` `src/db/schema/placement-round-candidate-slots.ts:14-15`
- Fix: Map roundDescription to contextual round instructions shown to candidates

## G2-14-019-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy location holds meeting link or physical venue `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:69-74`
- vNext now: New round mode venue meetingUrl plus slot room/meetingLocation `src/db/schema/placements.ts:1234-1241` `src/db/schema/placement-round-candidate-slots.ts:14-15`
- Fix: Show room vs meeting URL by mode with original fallback

## G2-14-019-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy interviewType values SCREENING TECHNICAL recruiter MANAGERIAL FINAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-50` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:53-57`
- vNext now: New job round kind INTERVIEW, free name and sequence; no type enum `src/db/schema/placements.ts:1231-1233` `src/db/schema/placements.ts:1293-1296`
- Fix: Preserve interviewType as typed annotation or name crosswalk

## G2-14-019-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy feedbackRecommend deprecated boolean, replaced by action `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:137-152`
- vNext now: New results/status models use structured stage decisions `src/db/schema/placements.ts:1354-1493`
- Fix: Map historical boolean to explicit recommendation action when known

## G2-14-019-056  [P2] GAP  facet F18  effort M
- Legacy: Legacy labels Scheduled Confirmed Reschedule requested Completed Cancelled No show `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:52-53`
- vNext now: New slot labels Available Booked Cancelled, round labels Pending Scheduled Completed Cancelled `src/db/schema/placement-round-candidate-slots.ts:29-35` `src/db/schema/placements.ts:1301-1304`
- Fix: Add mapping to original candidate-facing status wording

## G2-14-019-057  [P2] GAP  facet F18  effort S
- Legacy: Legacy interviewMode ONLINE OFFLINE `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:69-70`
- vNext now: New ON_CAMPUS VIRTUAL `src/db/schema/placements.ts:1297-1300`
- Fix: Map ONLINE to VIRTUAL and OFFLINE to ON_CAMPUS

## G2-14-019-058  [P2] GAP  facet F18  effort S
- Legacy: Legacy interviewType technical/managerial/final `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-50`
- vNext now: New round kind generic INTERVIEW plus name `src/db/schema/placements.ts:1231-1233`
- Fix: Preserve sub-type labels in round titles

## G2-14-020-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy ownerFacultyId stored for college relation `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:47-48`
- vNext now: New ownerMembershipId UUID `src/db/schema/placements.ts:96-99`
- Fix: Resolve owner faculty membership and fallback labels on import

## G2-14-020-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy joinCreatedAt and opens/joins persisted counters `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:68-75`
- vNext now: New relation no join counters `src/db/schema/placements.ts:78-116`
- Fix: Preserve invite funnel metrics as append-only events/counters

## G2-14-020-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy links tracked opens/joins default zero `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:70-75`
- vNext now: New relationship no such defaults `src/db/schema/placements.ts:78-116`
- Fix: Backfill counters and event retention

## G2-14-020-032  [P2] GAP  facet F10  effort M
- Legacy: Legacy soft delete uses isDeleted boolean `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:57-58`
- vNext now: New status ARCHIVED with archivedAt timestamp `src/db/schema/placements.ts:87-90` `src/db/schema/placements.ts:137-144`
- Fix: Map deleted true to archived with tombstone reason

## G2-14-020-039  [P2] GAP  facet F12  effort M
- Legacy: Legacy double-join does not increment counter `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:200-206`
- vNext now: New no equivalent counters `src/db/schema/placements.ts:78-116`
- Fix: Implement idempotent joins and precise metrics

## G2-14-020-050  [P2] GAP  facet F18  effort S
- Legacy: Legacy field trusted and join opens/joins counters `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:60-75`
- vNext now: New isTrusted field, no link metrics `src/db/schema/placements.ts:90-90`
- Fix: Use same trusted/opens/joins labels in company engagement view

## G2-14-020-053  [P2] GAP  facet F19  effort M
- Legacy: Legacy preview increments link opens on every request `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:126-135`
- vNext now: New no join preview `src/db/schema/placements.ts:78-116`
- Fix: Ensure rate limits and dedup to protect counters

## G2-14-020-061  [P2] GAP  facet F22  effort M
- Legacy: Legacy deleted boolean `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:57-58`
- vNext now: New status ACTIVE ARCHIVED and archivedAt check `src/db/schema/placements.ts:87-90` `src/db/schema/placements.ts:137-144`
- Fix: Map historical soft-deletes and restores

## G2-15-015-018  [P2] GAP  facet F06  effort S
- Legacy: Reason column non-null but no JPA length constraint. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobEligibilityOverride.java:37-38`)
- vNext now: New reason text, DB trims length>0. (`src/db/schema/placements.ts:935-967`)
- Fix: Align min3 at server/DB or document intentional one-char allowance.

## G2-15-015-060  [P2] GAP  facet F21  effort M
- Legacy: Legacy Java/JPA MySQL table job_eligibility_override. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobEligibilityOverride.java:15-21`)
- vNext now: New Postgres/Drizzle placement_eligibility_overrides. (`src/db/schema/placements.ts:921-969`)
- Fix: Align writer/readers to one canonical schema/decision values.

## G2-15-015-064  [P2] GAP  facet F22  effort S
- Legacy: Old reason only non-null, min3 in service. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobEligibilityOverride.java:33-38`)
- vNext now: New DB reason nonblank, min1 in schema. (`src/db/schema/placements.ts:961-967`)
- Fix: Enforce exact >=3 on migrated/new writes.

## G2-15-014-012  [P2] GAP  facet F04  effort M
- Legacy: venue, meetingUrl, whatToBring, platform, testLink, durationMinutes, resultsDue. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:48-68`)
- vNext now: New venue/meetingUrl/whatToBring/platform/testUrl/durationMinutes/resultsDueAt plus assessmentDueAt. (`src/db/schema/placements.ts:1239-1248`)
- Fix: Map legacy testLink to new testUrl and resultsDue to resultsDueAt explicitly.

## G2-15-014-049  [P2] GAP  facet F14  effort S
- Legacy: testLink optional URL text. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:60-62`)
- vNext now: testUrl stored as text plus new assessmentDueAt. (`src/db/schema/placements.ts:1243-1246`)
- Fix: Preserve external assessment link and URL validation in fields.

## G2-15-014-062  [P2] GAP  facet F20  effort M
- Legacy: Two-phase reorder uses temp 1000+ numbers to avoid unique collisions. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:123-130`)
- vNext now: Unique active sequence enforced in PostgreSQL. (`src/db/schema/placements.ts:1280-1284`)
- Fix: Verify transaction reorder doesn't violate transient uniqueness.

## G2-15-014-063  [P2] GAP  facet F20  effort M
- Legacy: LocalDateTime no timezone. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:44-47`)
- vNext now: Zoned timestamp + timezone required in schedule pair. (`src/db/schema/placements.ts:1235-1238`)
- Fix: Choose source IST policy and preserve exact local wall-time.

## G2-15-016-007  [P2] GAP  facet F03  effort S
- Legacy: Designation label. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:50-51`)
- vNext now: New profile column named title. (`src/db/schema/placements.ts:169-169`)
- Fix: Use Designation visible label while mapping to title.

## G2-15-016-008  [P2] GAP  facet F03  effort M
- Legacy: SuspendedAt/suspensionReason shown by staff. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:61-66`)
- vNext now: Profile only ACTIVE/ARCHIVED, platform SUSPENDED separate. (`src/db/schema/placements.ts:170-202`)
- Fix: Expose old suspended/reason staff state and reinstate semantics.

## G2-15-016-014  [P2] GAP  facet F04  effort M
- Legacy: CreatedBy user/type, JPA @Version Long CAS. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:75-84`)
- vNext now: New createdByUserId UUID, updatedAt timestamp CAS in services. (`src/db/schema/placements.ts:173-188`)
- Fix: Preserve creator actor role and optimistic revision via updatedAt token.

## G2-15-016-023  [P2] MISSING  facet F06  effort M
- Legacy: SuspensionReason max500. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:65-66`)
- vNext now: New profile status without suspension reason. (`src/db/schema/placements.ts:170-202`)
- Fix: Persist/display staff suspension reason if recruiter suspensions supported.

## G2-15-016-039  [P2] GAP  facet F11  effort M
- Legacy: isUsable checks suspendedAt null and !isDeleted. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:86-89`)
- vNext now: Profile only ACTIVE/ARCHIVED; users platform status separate. (`src/db/schema/placements.ts:195-202`)
- Fix: Clarify SUSPENDED vs ARCHIVED mapping and restore eligibility.

## G2-15-016-054  [P2] GAP  facet F18  effort S
- Legacy: Designation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:50-51`)
- vNext now: New field called title. (`src/db/schema/placements.ts:169-169`)
- Fix: Use old visible label Designation where exact clone required.

## G2-16-014-011  [P2] GAP  facet F06  effort L
- Legacy: JobOfferRepository.java:14-16 integer application/offer IDs.
- vNext now: placements.ts:1525-1532 UUID IDs.
- Fix: Document old-ID compatibility if migration needed.

## G2-16-014-030  [P2] GAP  facet F18  effort S
- Legacy: JobOfferRepository.java:25-26 string RELEASED.
- vNext now: placements.ts:1615-1617 ISSUED.
- Fix: Map enums intentionally and label accurately.

## G2-16-014-032  [P2] GAP  facet F19  effort M
- Legacy: JobOfferRepository.java:18-23 joins by app jobId and learnerId.
- vNext now: placements.ts:1607-1609 offer app+status index.
- Fix: Verify application job/learner join indexes.

## G2-16-014-033  [P2] GAP  facet F19  effort M
- Legacy: JobOfferRepository.java:25-31 time-window due scans.
- vNext now: placements.ts:1607-1609 no status/time composite indexes.
- Fix: Add partial status/expiry and dispute-deadline indexes.

## G2-16-014-035  [P2] GAP  facet F20  effort M
- Legacy: JobOfferRepository.java:29-31 strict date < current.
- vNext now: placements.ts:1553-1555 timestamptz, no due scan.
- Fix: Implement strict DB-clock cutoff with idempotent cascade.

## G2-16-014-037  [P2] GAP  facet F22  effort L
- Legacy: JobOfferRepository.java:13 JpaRepository Long PK and Integer application FK.
- vNext now: placements.ts:1522-1532 UUID keys and app-level version.
- Fix: Record historical mapping or approved no-migration choice.
