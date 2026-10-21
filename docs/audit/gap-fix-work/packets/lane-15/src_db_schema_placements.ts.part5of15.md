# Work packet: edit src/db/schema/placements.ts (part 5 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u015-job-lifecycle-status.md, docs/audit/gap2/lane-14/u016-recruiter-college-access.md, docs/audit/gap2/lane-14/u019-interview.md

## G2-14-015-029  [P1] GAP  facet F12  effort M
- Legacy: Legacy INACTIVE only CLOSED CANCELLED, draft-like remain isActive=true but isDraft=true `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-22` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:52-55`
- vNext now: New DRAFT/PUBLISHED/CLOSED/CANCELLED/ARCHIVED with timestamps `src/db/schema/placements.ts:613-618`
- Fix: Compute legacy active flag separately from visible flag

## G2-14-015-046  [P1] GAP  facet F20  effort M
- Legacy: Legacy inactive state flag mapping independent of isDraft `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-22` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:52-55`
- vNext now: New closedAt nonnull guarantees closed/cancelled but archive separate `src/db/schema/placements.ts:613-618`
- Fix: Validate historical isDraft/isActive migration for closed/cancelled jobs

## G2-14-015-048  [P1] GAP  facet F22  effort M
- Legacy: Legacy Job.lifecycleStatus varchar string with default PUBLISHED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:282-291`
- vNext now: New placement_jobs.status varchar24 default DRAFT `src/db/schema/placements.ts:513-518`
- Fix: Backfill and document mapping of legacy default and missing records

## G2-14-015-050  [P1] GAP  facet F22  effort M
- Legacy: Legacy isDraft and isActive legacy compatibility columns `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:119-125`
- vNext now: New status plus publishedAt closedAt archivedAt, no boolean flags `src/db/schema/placements.ts:513-533`
- Fix: Record explicit generated legacy flags in migration or API adapter

## G2-14-016-004  [P1] GAP  facet F02  effort L
- Legacy: One legacy row per recruiter+college, capabilities join table `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:19-28` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:70-73`
- vNext now: New grant row references recruiter+company relationship, capabilities array `src/db/schema/placements.ts:206-253`
- Fix: Crosswalk relationship to college and enforce one per intended pair

## G2-14-016-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy grant has recruiterId collegeId organizationId nullable and granted actor type `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:33-56`
- vNext now: New grant has recruiterUserId, companyRelationshipId, grantedByUserId but no grantedByUserType `src/db/schema/placements.ts:206-253`
- Fix: Map legacy numeric IDs and source actor type into audit or relation

## G2-14-016-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy revokeReason length500 persisted `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:67-68`
- vNext now: New revokeReason text column exists but TPO revoke input has no reason field `src/db/schema/placements.ts:239-243` `src/modules/placements/tpo-recruiter-grant-write-model.ts:15-20`
- Fix: Add optional reason max500 to revoke action and audit

## G2-14-016-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy capabilities eager collection separate table `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:70-73`
- vNext now: New text array capabilities default DRIVES `src/db/schema/placements.ts:233-238`
- Fix: Map capability rows preserving all known categories without granting extras

## G2-14-016-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy grant capabilities any set of up to64 char values `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:70-73`
- vNext now: New capability CHECK limited DRIVES,APPLICANT_EXPORT,INTERVIEWS,MESSAGES `src/db/schema/placements.ts:280-283`
- Fix: Map unknown legacy capabilities to reviewed entitlement list, never silently grant

## G2-14-016-037  [P1] GAP  facet F11  effort L
- Legacy: Legacy org relation optional column, may be null `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:39-40`
- vNext now: New mandatory company relationship binds college and company `src/db/schema/placements.ts:215-219`
- Fix: Migrate grants missing company relationship without broadening access

## G2-14-016-062  [P1] GAP  facet F22  effort L
- Legacy: Legacy grant row int recruiterId collegeId orgId and version Long `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:33-78`
- vNext now: New UUID recruiter user + relationship, no explicit org column/version `src/db/schema/placements.ts:206-253`
- Fix: Provide historical ID, org and version migration map

## G2-14-016-063  [P1] GAP  facet F22  effort M
- Legacy: Legacy separate capability collection table `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:70-73`
- vNext now: New text array with CHECK specific set `src/db/schema/placements.ts:233-238` `src/db/schema/placements.ts:280-283`
- Fix: Migrate capabilities and verify complete code mapping

## G2-14-016-064  [P1] GAP  facet F22  effort M
- Legacy: Legacy null validUntil represents indefinite allowed `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:45-47` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:80-85`
- vNext now: New nullable but effective auth disallows null `src/db/schema/placements.ts:233-234` `src/modules/placements/recruiter-grant-expiry-policy.ts:22-37`
- Fix: Backfill cutoff dates or explicit grandfather treatment

## G2-14-016-065  [P1] GAP  facet F22  effort M
- Legacy: Legacy status/revoke metadata actor type/reason and version `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:49-78`
- vNext now: New status/revokedBy/time/reason plus verificationStatus, updatedAt `src/db/schema/placements.ts:220-253`
- Fix: Map role provenance and verification state carefully

## G2-14-019-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy interview belongs directly to Job JobApplication Learner `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:33-47`
- vNext now: New round belongs job; candidate slot optionally links application `src/db/schema/placements.ts:1222-1231` `src/db/schema/placement-round-candidate-slots.ts:7-12`
- Fix: Define canonical interview entity projection joining slot round application and learner

## G2-14-019-003  [P1] GAP  facet F02  effort L
- Legacy: Legacy one Interview row houses scheduling status feedback and reschedule `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-171`
- vNext now: New normalized round, candidate slot, HR slot and requests `src/db/schema/placements.ts:1222-1351` `src/db/schema/placement-round-candidate-slots.ts:7-35`
- Fix: Build complete join-backed detail for interview workbench

## G2-14-019-007  [P1] GAP  facet F03  effort L
- Legacy: Legacy feedback rating comments recommendation are admin-only `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:95-113` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:147-158`
- vNext now: New round results and screening separated from slots `src/db/schema/placements.ts:1354-1493`
- Fix: Provide private feedback panel without leaking to learner DTO

## G2-14-019-008  [P1] GAP  facet F04  effort L
- Legacy: Legacy Interview has organizationId,jobId,applicationId,learnerId integer FKs `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:33-47`
- vNext now: New slot references UUID job,round,application; learner via application membership `src/db/schema/placement-round-candidate-slots.ts:7-12` `src/db/schema/placements.ts:973-1018`
- Fix: Map all four legacy IDs and verify college crosslinks

## G2-14-019-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy interviewStatus SCHEDULED CONFIRMED RESCHEDULE_REQUESTED COMPLETED CANCELLED NO_SHOW `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:52-53`
- vNext now: New round PENDING SCHEDULED COMPLETED CANCELLED, slot AVAILABLE BOOKED CANCELLED `src/db/schema/placements.ts:1250-1258` `src/db/schema/placement-round-candidate-slots.ts:16-17`
- Fix: Map all six statuses including NO_SHOW and reschedule requested

## G2-14-019-037  [P1] GAP  facet F10  effort L
- Legacy: Legacy cancel/complete/confirm and feedback on single interview row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:52-53` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:108-158`
- vNext now: New separate slot, round results and applicant stages `src/db/schema/placements.ts:1222-1493`
- Fix: Write complete multi-table transaction crosswalk for transitions
