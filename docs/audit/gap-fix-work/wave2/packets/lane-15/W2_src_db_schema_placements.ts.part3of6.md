# Work packet (wave 2): edit src/db/schema/placements.ts (part 3 of 6)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md, docs/audit/gap2/lane-16/u015-job-eligibility.md, docs/audit/gap2/lane-17/job-eligibility-override-repository.md, docs/audit/gap2/lane-17/public-job-response-dto.md, docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-2/admin-job-controller.md

## G2-16-014-038  [P2] GAP  facet F22  effort L
- Legacy: JobOffer.java:38-118 CTC LPA, joining/status, version/time fields.
- vNext now: placements.ts:1532-1595 INR integer, pay breakdown and audit actor columns.
- Fix: Verify CTC conversion, null joins, lifecycle timelines.

## G2-16-014-039  [P2] GAP  facet F22  effort M
- Legacy: JobOfferRepository.java:25-31 two due predicates need indexed columns.
- vNext now: placements.ts:1533-1555 has statuses and deadline fields.
- Fix: Add partial due indexes and test query plan.

## G2-16-015-007  [P2] GAP  facet F04  effort L
- Legacy: JobEligibility.java:19-25 integer program IDs, passing years and long batch IDs.
- vNext now: placements.ts:826-862 UUID program/cohort/section arrays + integer passing years.
- Fix: Document integer→UUID mapping for programs and legacy batch-to-cohort; avoid silently dropping cohort targeting.

## G2-16-015-037  [P2] GAP  facet F22  effort L
- Legacy: JobEligibility.java:9-12 persisted JSON plus target columns.
- vNext now: placements.ts:818-919 normalized placement_job_eligibility_policies with arrays and basis points.
- Fix: Document migration schema correspondence and data preservation before cutover.

## G2-17-014-008  [P2] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobEligibilityOverride.java:27-45 — jobId int, learnerId int, type string, reason, createdBy nullable, createdAt LocalDateTime.
- vNext now: src/db/schema/placements.ts:921-965 — UUID job/membership, decision enum, nonnull creator and revokedAt.
- Fix: Map IDs, audit creator and timestamp to normalized history.

## G2-17-014-045  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobEligibilityOverride.java:40-45 — createdBy nullable and createdAt naive LocalDateTime.
- vNext now: src/db/schema/placements.ts:921-953 — createdByUserId nonnull and timestamptz createdAt.
- Fix: Backfill creator to service actor or sentinel carefully; convert IST if known.

## G2-17-021-009  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:28-29 — PostedDate and applicationDeadline are LocalDateTime, no TZ.
- vNext now: src/db/schema/placements.ts:818-921 — Modern placement date fields use timestamp-with-time-zone.
- Fix: Render in IST/local time without shifting calendar day.

## G2-17-021-037  [P2] GAP  facet F22  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:19-32 — DTO maps Job integer ID, slug, logo, type, text and date fields.
- vNext now: src/db/schema/placements.ts:818-921 — placementJobs UUID and normalized eligibility policy.
- Fix: Create stable legacy int/slug→UUID mapping if public deep links survive.

## G2-18-011-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy shortlist/waitlist sentences include round name, `d MMM`, em dash and by-date text (`JobServiceImpl.java:913-937`).
- vNext now: New application table lacks stageLabel, uses screening/round tables separate (`placements.ts:973-1065,1114-1170,1222-1353`).
- Fix: Compose same learner-readable round/date string from joined round/screening state.

## G2-18-011-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy withdrawn placed elsewhere displayed `Withdrawn: placed elsewhere` (`JobServiceImpl.java:909-912`).
- vNext now: New application.status withdrawn without stored withdrawalReason in main row (`placements.ts:992-1019`).
- Fix: Retrieve audited withdrawal reason from history/metadata and use exact UI copy.

## G2-18-011-038  [P2] GAP  facet F10  effort L
- Legacy: Legacy status mutation offer response and cascade in one service (`JobServiceImpl.java:1168-1325`).
- vNext now: New offer decision separate UI/service and normalized Offers table (`learner-placement-offers.tsx:25-59`; `placements.ts:1522-1671`).
- Fix: Build action-to-table side effect matrix including withdrawn/declined offers.

## G2-18-011-046  [P2] GAP  facet F12  effort M
- Legacy: Legacy WITHDRAWN soft-deletes application (`JobServiceImpl.java:992-1005,1033-1050`).
- vNext now: New WITHDRAWN persists record with withdrawnAt and status check (`placements.ts:993-1059`).
- Fix: Migrate withdrawn rows and support own history without resurrecting terminal stage.

## G2-18-011-068  [P2] GAP  facet F21  effort L
- Legacy: Legacy eventPublisher ApplicationStatusChangedEvent and screeningService, NotificationDispatcher (`JobServiceImpl.java:622-636,726-819,1608-1649`).
- vNext now: New activityEvents, learner placement delivery and normalized screening DB (`application-service.ts:10-13,856-870`; `placements.ts:1114-1170`).
- Fix: Build event/topic routing matrix, ensure exactly-once post-commit observer behavior.

## G2-2-016-007  [P2] GAP  facet F04  effort L
- Legacy: Legacy Job has companyName/companyLogo, org and college, targeting and eligibility flags (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:433-531`)
- vNext now: VNext uses canonical placementCompanies/relationships/job policy/roles (`src/modules/placements/job-service.ts:40-84; src/db/schema/placements.ts:23-154`)
- Fix: Document field-to-field read model and maintain company display from canonical source

## G2-2-016-052  [P2] GAP  facet F22  effort L
- Legacy: Legacy Job and JobApplication keys ints, organization/college + various JSON targeting (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:433-578,1217-1245`)
- vNext now: VNext UUID job/application, normalized companies, seasons, role/policy/rounds (`src/db/schema/placements.ts:23-154; src/modules/placements/validation.ts:260-388`)
- Fix: Document IDs/fields/filters and import compatibility (migration explicitly not required)

## G2-2-016-157  [P2] GAP  facet F22  effort L
- Legacy: Legacy job table integer identity, active/draft flags, org and optional college plus version `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:20-32,119-133,269-275`
- vNext now: New placement_jobs UUID college+season+company relationship and status enum `src/db/schema/placements.ts:462-480`
- Fix: Document field-by-field ID, ownership, status and version mapping

## G2-2-016-158  [P2] GAP  facet F22  effort L
- Legacy: Legacy job_application stores integer app, string stage, version and status timestamps `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:13-40,127-133`
- vNext now: New applications UUID + membership/role option and separate status history `src/db/schema/placements.ts:973-989,1064-1080`
- Fix: Preserve migrated historical statuses, source and version semantics in new columns

## G2-19-022-137  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:385-446 season, college settings, preferences, job types
- vNext now: src/db/schema/placements.ts:374-461 placementSeasons plus src/db/schema/tpo-collaboration.ts:235-429 college settings/user prefs/saved views
- Fix: Produce field-level migration matrix for legacy settings, blocked dates, notification defaults, job types

## G2-20-011-007  [P2] GAP  facet F04  effort S
- Legacy: oldStatus, newStatus, changedAt, nullable changedBy and rejectionReason500 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:19-35`
- vNext now: fromStatus24,toStatus24,actorUserId required, reason unbounded, cascadeId optional `src/db/schema/placements.ts:1064-1087`
- Fix: Map status/actor/reason fields explicitly and adopt bounds or documented new schema

## G2-20-011-023  [P2] GAP  facet F12  effort S
- Legacy: changedBy may be NULL for system events `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:31-32`
- vNext now: actorUserId NOT NULL `src/db/schema/placements.ts:1075-1079`
- Fix: Use service/system identity for automated transitions or nullable audited actor with reason

## G2-20-011-031  [P2] GAP  facet F18  effort S
- Legacy: System fallback APPLIED for null application status `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:68-71`
- vNext now: New first status SUBMITTED, no APPLIED status in history table `src/db/schema/placements.ts:1097-1108`
- Fix: Document APPLIED→SUBMITTED and display migration-compatible status label

## G2-20-011-033  [P2] GAP  facet F20  effort S
- Legacy: Legacy case-insensitive old/new duplicate filter `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:34-36`
- vNext now: New strict enum/case constraints `src/db/schema/placements.ts:1097-1108`
- Fix: Normalize status and implement idempotency for retrying same request

## G2-20-011-036  [P2] GAP  facet F22  effort M
- Legacy: JPA entity BaseModel soft-delete, status varchar50, nullable actor, rejection500 [E:13-35,Q:12-17]
- vNext now: Postgres history UUID PK/FK, status varchar24, required actor, reason text, cascadeId/index `src/db/schema/placements.ts:1064-1110`
- Fix: Document schema field/constraint/index mapping for all historical states

## G2-20-012-009  [P2] GAP  facet F04  effort S
- Legacy: Legacy successful application status APPLIED `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:82-85`
- vNext now: New placement history allows SUBMITTED as first status `src/db/schema/placements.ts:1097-1108`
- Fix: Map legacy APPLIED to SUBMITTED in UI/copy and history

## G2-20-012-025  [P2] GAP  facet F12  effort S
- Legacy: After applying status APPLIED and source INTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:82-85`
- vNext now: New history transition constraint starts SUBMITTED, placement channel model `src/db/schema/placements.ts:1097-1108`
- Fix: Map state machine and initial status labels

## G2-20-012-039  [P2] GAP  facet F22  effort S
- Legacy: Legacy Job/JobApplication Integer entities, statuses and URL `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:4-5,88-102`
- vNext now: New Drizzle placementApplications UUID, status history and job policy tables `src/db/schema/placements.ts:973-1110`
- Fix: Map active job/application identity and status fields, no migration if empty prod

## G2-3-013-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:19-35`
- vNext now: `src/db/schema/placements.ts:1064-1089`
- Fix: Legacy fields applicationId INT, old/new status varchar50, changedAt local datetime, changedBy nullable INT, rejectionReason varchar500. vNext UUID parent/actor required UUID, from/to varchar24, reason text, occurredAt timestamptz and optional cascadeId. Map all fields/constraints.

## G2-3-013-015  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:40-46`
- vNext now: `src/db/schema/placements.ts:1073-1087`
- Fix: Legacy writer trims statuses, normalizes blank oldStatus to null and caps rejectionReason at 500. VNext status history schema stores text reason without bound; add exact boundary validation.

## G2-3-013-039  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:34-36`
- vNext now: `src/db/schema/placements.ts:1105-1109`, `src/modules/placements/application-service.ts:848-882`
- Fix: Legacy repeated identical status case-insensitively no-op; vNext strict enum/history CHECK prevents duplicate but may surface DB failure for two concurrent writes. Add expected-state compare and typed conflict.

## G2-3-013-045  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-17`
- vNext now: `src/db/schema/placements.ts:1064-1110`
- Fix: Legacy query excludes soft-deleted records; vNext history schema has no deleted flag and always returns rows. If deleted historic rows migrate, filter tombstones during import rather than exposing them.

## G2-3-015-029  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-59`, `75-82`
- vNext now: `src/modules/placements/learner-job-service.ts:132-150`, `src/db/schema/placements.ts:513-619`
- Fix: Legacy active learner-visible job requires active=true,deleted=false,not draft,visibilityType != EXTERNAL_ONLY; vNext PUBLISHED + archivedAt null and related company status, but no external-only visibilityType. Define explicit ATS-only exclusion.

## G2-3-015-040  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:52-73`
- vNext now: `src/modules/placements/college-drive-read-service.ts:77-83`, `src/db/schema/placements.ts:548-559`
- Fix: Legacy sorts IDs before fetching rows to avoid MySQL JSON sort buffer overflow and restores that order; vNext SQL sorts projected joined rows, small paginated slices. Keep indices/limits for JSON-heavy records.

## G2-3-015-044  [P2] MISSING  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:114-120`
- vNext now: `src/db/schema/placements.ts:462-540`
- Fix: Legacy slug existence COUNT includes deleted rows to prevent reuse; vNext UUID PK with no legacy jobSlug uniqueness check. Add compatibility slug reservation map if importing old links.

## G2-3-015-048  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:190-214`
- vNext now: `src/db/schema/placements.ts:548-559`
- Fix: Legacy companyId index/group counts with legacy name fallback; vNext relationship_id index no equivalent name-linked history. Model company legacy alias and scoped usage aggregates.

## G2-12-014-066  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:51-69`
- vNext now: `src/db/schema/placements.ts:1021-1058`
- Fix: Legacy only isDeleted=false records cached, vNext DB application status and lifecycle check no isDeleted column; historic deleted visibility contract differs.

## G2-13-019-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:29-52`
- vNext now: `src/db/schema/placements.ts:474-495`
- Fix: Company name/logo duplicated on legacy job; vNext references normalized company relationship.

## G2-13-019-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:349-356`
- vNext now: `src/db/schema/placements.ts:625-735`
- Fix: RoleOptions JSON replaced by normalized placementJobRoleOptions and eligibility-policy tables.

## G2-13-019-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:70-84`
- vNext now: `src/db/schema/placements.ts:482-505`
- Fix: Responsibilities, string location and CTC range become legacyPostingDetails, locations text[] and min/max INR.

## G2-13-019-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:107-117`
- vNext now: `src/db/schema/placements.ts:522-525`
- Fix: Legacy four target department/program/batch/class FKs replaced by other eligibility scopes.

## G2-13-019-009  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:86-100`
- vNext now: `src/db/schema/placements.ts:482-510`
- Fix: postedDate + importantDates case-insensitive application deadline reconciliation differs from publishedAt/deadline and typed JSON.
