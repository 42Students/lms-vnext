# Work packet (wave 2): edit src/db/schema/placements.ts (part 5 of 6)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u013-admin-job-service.md, docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md, docs/audit/gap2/lane-6/base-model.md, docs/audit/gap2/lane-6/job-preferences.md, docs/audit/gap2/lane-8/admin-job-service.md, docs/audit/gap2/lane-8/job-application-status-history.md

## G2-5-013-084  [P2] GAP  facet F22  effort L
- Legacy: Legacy Job integer ID, job slug, org and college FK, importantDates JSON, @Version (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:20-99`)
- vNext now: vNext placementJobs UUID, season/company relation, timestamptz deadline (`src/db/schema/placements.ts:462-515`)
- Fix: Document migration field mapping, indexes and uniqueness constraints

## G2-5-015-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy changedBy nullable Integer `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:31-32`
- vNext now: VNext actorUserId UUID NOT NULL `src/db/schema/placements.ts:1075-1079`
- Fix: Map nullable system actors safely; avoid inventing human authors.

## G2-5-015-023  [P2] GAP  facet F10  effort M
- Legacy: Single query excludes isDeleted TRUE or includes null `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-13`
- vNext now: VNext has no isDeleted column/filter on history `src/db/schema/placements.ts:1064-1110`
- Fix: Exclude deleted legacy history during migration; specify append-only policy.

## G2-5-015-040  [P2] GAP  facet F19  effort M
- Legacy: Legacy migration index (application_id,new_status) `docs/legacy-source/backend/src/main/resources/db/migration/V109__job_application_scale_indexes.sql:24-26`
- vNext now: VNext index applicationId,createdAt only `src/db/schema/placements.ts:1089-1093`
- Fix: Profile and add `(application_id,to_status,created_at)` index for filtered reports.

## G2-5-015-045  [P2] GAP  facet F22  effort M
- Legacy: Legacy BaseModel int PK, created/updated time, nullable soft delete `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37`
- vNext now: VNext UUID PK, createdAt, no updatedAt/isDeleted `src/db/schema/placements.ts:1064-1087`
- Fix: Define migration mappings and excluded deleted events.

## G2-6-021-038  [P2] GAP  facet F22  effort L
- Legacy: MappedSuperclass inherited int id, LocalDateTime created/updated, nullable boolean is_deleted (BaseModel.java:17-38).
- vNext now: VNext per-table uuid, timestamptz, archivedAt/status, varies by domain (organizations.ts:5-13; departments.ts:12-31; placements.ts:973-1020).
- Fix: Create central mapping inventory for all legacy entities and avoid assuming one uniform vNext deleted column.

## G2-6-019-034  [P2] GAP  facet F12  effort M
- Legacy: Legacy job prefs fields unconstrained free text (JobPreferences.java:22-39).
- vNext now: vNext constrained arrays/enums and separate structured preferred employment/work mode (profile-validation.ts:510-518; placements.ts:303-331).
- Fix: Preserve legacy values with explicit mapping of no preference and remote.

## G2-8-012-007  [P2] GAP  facet F04  effort L
- Legacy: Legacy Job has companyName/companyLogo, org and college, targeting and eligibility flags (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:433-531`)
- vNext now: VNext uses canonical placementCompanies/relationships/job policy/roles (`src/modules/placements/job-service.ts:40-84; src/db/schema/placements.ts:23-154`)
- Fix: Document field-to-field read model and maintain company display from canonical source

## G2-8-012-052  [P2] GAP  facet F22  effort L
- Legacy: Legacy Job and JobApplication keys ints, organization/college + various JSON targeting (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:433-578,1217-1245`)
- vNext now: VNext UUID job/application, normalized companies, seasons, role/policy/rounds (`src/db/schema/placements.ts:23-154; src/modules/placements/validation.ts:260-388`)
- Fix: Document IDs/fields/filters and import compatibility (migration explicitly not required)

## G2-8-019-010  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:28-29 changed_at LocalDateTime not null
- vNext now: src/db/schema/placements.ts:1083-1087 createdAt timestamptz defaultNow
- Fix: Import original transition time instead of migration write time.

## G2-8-019-012  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:34-35 rejection_reason VARCHAR500
- vNext now: src/db/schema/placements.ts:1080 reason unbounded text
- Fix: Align max length and retention of rejection reason.

## G2-8-019-015  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-17 excludes isDeleted records
- vNext now: src/db/schema/placements.ts:1064-1111 no soft-delete history flag
- Fix: Decide immutable audit strategy; exclude imported deleted records.

## G2-8-019-016  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-33 null ID/blank newStatus skipped
- vNext now: src/db/schema/placements.ts:1068-1074 not-null FK/status constraints
- Fix: Map invalid event producer input to controlled no-op or validation error.

## G2-8-019-017  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:34-36 same old/new ignoring case is no-op
- vNext now: src/db/schema/placements.ts:1105-1108 permitted transition checks only
- Fix: Guard against unchanged duplicate transition writes in producers.

## G2-8-019-033  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:44-46 reason max500 with trim check
- vNext now: src/db/schema/placements.ts:1080 text no max
- Fix: Define safe max and exact validation wording.

## G2-8-019-052  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V40__job_application_status_history.sql:6-17 application_id INT with ON DELETE CASCADE
- vNext now: src/db/schema/placements.ts:1068-1072 UUID FK ON DELETE RESTRICT
- Fix: Choose durable audit retention on application deletion and preserve FK.

## G2-8-019-055  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:28-29 changed_at LocalDateTime
- vNext now: src/db/schema/placements.ts:1083-1087 createdAt tz, defaultNow
- Fix: Retain original time on imported row.

## G2-8-019-057  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:34-35 rejection_reason VARCHAR500
- vNext now: src/db/schema/placements.ts:1080 reason text no limit
- Fix: Define safe maximum and field mapping.

## G2-8-019-058  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-17 soft deleted events hidden
- vNext now: src/db/schema/placements.ts:1064-1111 no isDeleted flag
- Fix: Document audit immutability; filter historic deleted during import.

## G2-8-015-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy JobRound JPA table job_round (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:15-21`)
- vNext now: VNext table placement_job_rounds with UUID job/round IDs (`src/db/schema/placements.ts:1222-1231`)
- Fix: Document route/ID map, old round IDs not directly reusable

## G2-8-015-007  [P2] GAP  facet F04  effort M
- Legacy: Legacy id Long generated identity (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:23-25`)
- vNext now: UUID generated random (`src/db/schema/placements.ts:1225`)
- Fix: Legacy-to-new link resolver if migration ever used

## G2-8-015-015  [P2] GAP  facet F04  effort M
- Legacy: TestLink optional String (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:60-61`)
- vNext now: VNext renamed testUrl (`src/db/schema/placements.ts:1243`)
- Fix: Map testLink→testUrl in read/write and imports

## G2-8-015-017  [P2] GAP  facet F04  effort M
- Legacy: ResultsDue nullable LocalDateTime (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:66-67`)
- vNext now: VNext resultsDueAt timestamptz, date>=scheduledAt (`src/db/schema/placements.ts:1247-1249,1314-1318`)
- Fix: Convert timezone and keep due-after-round invariant

## G2-8-015-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy no explicit timezone for scheduledDate (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:44-46`)
- vNext now: VNext timezone required when scheduledAt set (`src/db/schema/placements.ts:1310-1313`)
- Fix: Derive timezone from college and show visible field if needed

## G2-8-015-039  [P2] GAP  facet F18  effort M
- Legacy: Legacy name default unrestricted input (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:37-38`)
- vNext now: VNext text name nullable? notNull, schemas add length cap (`src/db/schema/placements.ts:1233; src/modules/placements/validation.ts:742-819`)
- Fix: Map exact max length/trim validation strings

## G2-8-015-044  [P2] GAP  facet F22  effort M
- Legacy: Legacy table job_round, int jobId, local date timestamps (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:17-79`)
- vNext now: VNext placement_job_rounds, UUID IDs, timestamptz+timezone and actor (`src/db/schema/placements.ts:1222-1274`)
- Fix: Provide mapping for field names and historical time interpretation

## G2-15-026-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:31-55 jobTitle, companyName, companyLogo, description, recordedOutside
- vNext now: src/db/schema/placements.ts:23-112 company registry + relationship and placementJobs; src/modules/placements/job-service.ts:95-126 join company/season
- Fix: Display old job title/company/logo and recorded-outside flag via split entities

## G2-8-022-052  [P2] GAP  facet F19  effort M
- Legacy: Legacy list uses repository collegeId startDate DESC query (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:23-25).
- vNext now: New uses collegeId index and sort ASC startDate, createdAt (src/modules/placements/season-service.ts:38-50; src/db/schema/placements.ts:431-437).
- Fix: Use descending startDate and stable tie order; benchmark query under 1000 archived seasons.

## G2-9-004-086  [P2] GAP  facet F22  effort M
- Legacy: Legacy verifiedBy42 bool, domains list (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:274-282`)
- vNext now: verifiedAt timestamp/verifiedByUserId + primaryDomain (`src/db/schema/placements.ts:29-40`)
- Fix: Restore domain alias list and verification label mapping.

## G2-9-015-102  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:99-115` — Legacy importantDates JSON carries fallback application deadline.
- vNext now: `src/db/schema/placements.ts:481-517` — vNext JSONB legacyPostingDetails separate, stored deadline column.
- Fix: Retain fallback parsing for legacy civil-date migration.

## G2-9-016-098  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:253-279` — Legacy job uses postedDate and linked status, college ID integer.
- vNext now: `src/db/schema/placements.ts:462-562` — vNext job UUID/collegeId, createdAt,publishedAt/status and relationship.
- Fix: Define postedDate->publishedAt mapping and all/active counts.

## G2-9-016-101  [P2] GAP  facet F22  effort M
- Legacy: `src/db/schema/placements.ts:493-526` — Legacy deadline derived from JSON importantDates where label application deadline.
- vNext now: `src/db/schema/placements.ts:480-526` — vNext persisted applicationDeadline timestamptz and JSONB legacyPostingDetails optional.
- Fix: Maintain dates synchronization and timezone conversion.

## G2-9-013-101  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:998-1047` — Legacy soft-delete via jobRepository.softDeleteById with applications retained.
- vNext now: `src/db/schema/placements.ts:514-536` — vNext archivedAt + status ARCHIVED; index college/status and season/status.
- Fix: Map deleted versus archived in reports, list filters and exports.

## G2-13-025-009  [P2] MISSING  facet F04  effort S
- Legacy: POST decline returns {ok:true} `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:28-29`
- vNext now: No decline response exists NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Return explicit success only after committed decline.

## G2-13-025-014  [P2] MISSING  facet F06  effort S
- Legacy: Decline has only collegeId, no reason input `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:28-29`
- vNext now: No equivalent decline input schema NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Do not require recruiter-entered reason.

## G2-13-025-031  [P2] MISSING  facet F13  effort S
- Legacy: Missing/stale pending action raises Not found `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:303-305`
- vNext now: No pending load/retry/error UX NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Implement loading skeleton, 401, transient retry and stale resolution state.

## G2-13-025-034  [P2] MISSING  facet F15  effort S
- Legacy: Decline only changes grant; no mail/bell on decline `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:324-331`
- vNext now: No decline service NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Audit decline without inventing outbound email/bell.

## G2-13-025-037  [P2] MISSING  facet F17  effort S
- Legacy: Two distinct POST buttons to chosen college `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:25-29`
- vNext now: No accessible pending controls NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Use buttons with explicit 'Accept/Decline invitation to [college]' labels.

## G2-17-023-060  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:102-118 released/responded at LocalDateTime, optimistic version
- vNext now: src/db/schema/placements.ts:1574-1599 respondedAt timezone timestamp and version unique application
- Fix: Confirm Asia/Kolkata conversions and transition compare-and-set semantics.

## G2-18-013-056  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchCache.java:134-135 memory partition ignores rows with null orgId
- vNext now: src/db/schema/placements.ts:481-550 college mandatory job scope
- Fix: Verify legacy orphan job visibility vs new non-null college FK.
